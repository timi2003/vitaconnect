// app/api/documents/uploads/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// ── DocType defined locally — no external import needed ──────────────────────
type DocType =
  | "PRESCRIPTION"
  | "LAB_REPORT"
  | "IMAGING"
  | "DISCHARGE_SUMMARY"
  | "REFERRAL"
  | "VACCINATION"
  | "INSURANCE"
  | "CONSENT"
  | "OTHER";

// ── R2 client ────────────────────────────────────────────────────────────────
const r2 = new S3Client({
  region:   "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const ALLOWED_MIMES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

function inferDocType(mime: string, name: string): DocType {
  const n = name.toLowerCase();
  if (mime.startsWith("image/"))                            return "IMAGING";
  if (n.includes("prescription"))                           return "PRESCRIPTION";
  if (n.includes("discharge"))                              return "DISCHARGE_SUMMARY";
  if (n.includes("vaccination") || n.includes("vaccine"))  return "VACCINATION";
  if (n.includes("insurance"))                              return "INSURANCE";
  if (n.includes("lab") || n.includes("report"))           return "LAB_REPORT";
  if (n.includes("referral"))                               return "REFERRAL";
  if (n.includes("consent"))                                return "CONSENT";
  return "OTHER";
}

// ── POST /api/documents/uploads ───────────────────────────────────────────────
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

    const bytes      = Buffer.from(await file.arrayBuffer());
    const safeName   = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const storagePath = `${session.user.id}/${Date.now()}-${safeName}`;

    // Upload to R2
    await r2.send(new PutObjectCommand({
      Bucket:      process.env.R2_BUCKET_NAME!,
      Key:         storagePath,
      Body:        bytes,
      ContentType: file.type,
    }));

    // Presigned URL valid for 7 days
    const fileUrl = await getSignedUrl(
      r2,
      new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key:    storagePath,
      }),
      { expiresIn: 60 * 60 * 24 * 7 }
    );

    const titleOverride = (formData.get("title") as string | null)?.trim();
    const typeOverride  = formData.get("type") as DocType | null;
    const tagsRaw       = formData.get("tags") as string | null;
    const tags          = tagsRaw
      ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    const supabase = createServerSupabaseClient();

    const { data: doc, error } = await supabase
      .from("medical_documents")
      .insert({
        user_id:        session.user.id,
        title:          titleOverride || file.name.replace(/\.[^.]+$/, ""),
        type:           typeOverride ?? inferDocType(file.type, file.name),
        file_url:       fileUrl,
        file_size:      file.size,
        mime_type:      file.type,
        tags,
        uploaded_by_id: session.user.id,
        date:           new Date().toISOString(),
        description:    storagePath,  // R2 key stored here for future re-signing
      })
      .select()
      .single();

    if (error) {
      console.error("[documents/uploads POST]", error);
      return NextResponse.json({ error: "Failed to save document" }, { status: 500 });
    }

    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (err) {
    console.error("[documents/uploads POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}