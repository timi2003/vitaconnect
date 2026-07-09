// app/api/documents/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import { DocType } from "@/types"; // Adjust import based on your types

// ── R2 Re-signing Setup ─────────────────────────────────────────────────────
import { S3Client, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
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
    { expiresIn: 60 * 60 * 2 } // 2 hours
  );
}
// ────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") as DocType | null;

  const supabase = createServerSupabaseClient();

  let query = supabase
    .from("medical_documents")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (type) {
    query = query.eq("type", type);
  }

  const { data: documents, error } = await query;

  if (error) {
    console.error("[documents GET]", error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }

  // Re-sign R2 URLs
  const refreshed = await Promise.allSettled(
    documents.map(async (doc) => {
      if (!doc.file_url || !doc.description) return doc; // description holds R2 key

      try {
        const freshSignedUrl = await freshUrl(doc.description);
        return { ...doc, file_url: freshSignedUrl };
      } catch {
        return doc; // fallback to original URL
      }
    })
  );

  const result = refreshed
    .map((r) => (r.status === "fulfilled" ? r.value : null))
    .filter(Boolean);

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

  const supabase = createServerSupabaseClient();

  // Get document to check ownership and get R2 key
  const { data: doc, error: fetchError } = await supabase
    .from("medical_documents")
    .select("file_url, description")
    .eq("id", id)
    .eq("user_id", session.user.id)
    .single();

  if (fetchError || !doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Delete from R2 first
  if (doc.description) {
    try {
      await r2.send(
        new DeleteObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME!,
          Key:    doc.description,
        })
      );
    } catch (err) {
      console.error("[documents DELETE] R2 removal failed:", err);
      // Continue anyway — better to delete DB record
    }
  }

  // Delete from Supabase
  const { error: deleteError } = await supabase
    .from("medical_documents")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}