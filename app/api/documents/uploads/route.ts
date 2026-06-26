import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DocType } from "@prisma/client";

// ── Pick your storage provider ─────────────────────────────────────────────
// OPTION A: Vercel Blob
// import { put } from "@vercel/blob";

// OPTION B: Cloudflare R2
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});
// ──────────────────────────────────────────────────────────────────────────

const ALLOWED_MIMES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

function inferDocType(mime: string, name: string): DocType {
  const n = name.toLowerCase();
  if (mime.startsWith("image/"))                                  return DocType.IMAGING;
  if (n.includes("prescription"))                                 return DocType.PRESCRIPTION;
  if (n.includes("discharge"))                                    return DocType.DISCHARGE_SUMMARY;
  if (n.includes("vaccination") || n.includes("vaccine"))         return DocType.VACCINATION;
  if (n.includes("insurance"))                                    return DocType.INSURANCE;
  if (n.includes("lab") || n.includes("report"))                  return DocType.LAB_REPORT;
  if (n.includes("referral"))                                     return DocType.REFERRAL;
  if (n.includes("consent"))                                      return DocType.CONSENT;
  return DocType.OTHER;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "File exceeds 20 MB limit" }, { status: 413 });
    }
    if (!ALLOWED_MIMES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only PDF, JPG, PNG, WEBP, or GIF files are allowed" },
        { status: 415 }
      );
    }

    const bytes     = Buffer.from(await file.arrayBuffer());
    const safeName  = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const storagePath = `${session.user.id}/${Date.now()}-${safeName}`;

    // ── OPTION A: Vercel Blob ──────────────────────────────────────────────
    // const blob = await put(storagePath, bytes, {
    //   access: "public",           // or "private" — public gives a direct CDN URL
    //   contentType: file.type,
    // });
    // const fileUrl = blob.url;
    // ──────────────────────────────────────────────────────────────────────

    // ── OPTION B: Cloudflare R2 ───────────────────────────────────────────
    await r2.send(
      new PutObjectCommand({
        Bucket:      process.env.R2_BUCKET_NAME!,
        Key:         storagePath,
        Body:        bytes,
        ContentType: file.type,
      })
    );

    // Generate a presigned GET URL valid for 7 days
    // (re-signed on every GET /api/documents so links stay fresh)
    const { getSignedUrl: sign } = await import("@aws-sdk/s3-request-presigner");
    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    const fileUrl = await sign(
      r2,
      new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key:    storagePath,
      }),
      { expiresIn: 60 * 60 * 24 * 7 } // 7 days
    );
    // ──────────────────────────────────────────────────────────────────────

    const titleOverride = (formData.get("title") as string | null)?.trim();
    const typeOverride  = formData.get("type") as DocType | null;
    const tagsRaw       = formData.get("tags") as string | null;
    const tags          = tagsRaw
      ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    const doc = await prisma.medicalDocument.create({
      data: {
        userId:       session.user.id,
        title:        titleOverride || file.name.replace(/\.[^.]+$/, ""),
        type:         typeOverride ?? inferDocType(file.type, file.name),
        fileUrl,
        fileSize:     file.size,
        mimeType:     file.type,
        tags,
        uploadedById: session.user.id,
        date:         new Date(),
        // Store raw path so GET route can re-sign it
        description:  storagePath,
      },
    });

    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (err) {
    console.error("[documents/upload POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}