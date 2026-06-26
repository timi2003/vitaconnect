import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DocType } from "@prisma/client";

// ── OPTION B: R2 re-signing ───────────────────────────────────────────────
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

async function freshUrl(storagePath: string): Promise<string> {
  return getSignedUrl(
    r2,
    new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key:    storagePath,
    }),
    { expiresIn: 60 * 60 * 2 } // 2-hour URL served to the browser
  );
}
// ─────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") as DocType | null;

  const documents = await prisma.medicalDocument.findMany({
    where: {
      userId: session.user.id,
      ...(type ? { type } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // Re-sign every URL so browser links are always fresh
  // description field stores the raw R2 key (set during upload)
  const refreshed = await Promise.allSettled(
    documents.map(async (doc) => {
      if (!doc.description) return doc;
      try {
        const url = await freshUrl(doc.description);
        return { ...doc, fileUrl: url };
      } catch {
        return doc; // return stale URL rather than crashing
      }
    })
  );

  const result = refreshed.map((r) =>
    r.status === "fulfilled" ? r.value : null
  ).filter(Boolean);

  return NextResponse.json({ documents: result });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const doc = await prisma.medicalDocument.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Delete from R2 first
  if (doc.description) {
    try {
      const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
      await r2.send(
        new DeleteObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME!,
          Key:    doc.description,
        })
      );
    } catch (err) {
      console.error("[documents DELETE] R2 removal failed:", err);
      // Still delete DB row — orphaned object is better than stuck UI
    }
  }

  await prisma.medicalDocument.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}