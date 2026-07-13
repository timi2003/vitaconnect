// app/api/documents/uploads/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";

// NOTE: assumes a private Supabase Storage bucket named "medical-documents"
// exists (Dashboard → Storage → New bucket, leave "Public" off since these
// are medical documents — access is via signed URLs instead).
const BUCKET = "medical-documents";

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

const ALLOWED_MIMES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

function inferDocType(mime: string, name: string): DocType {
  const n = name.toLowerCase();
  if (mime.startsWith("image/")) return "IMAGING";
  if (n.includes("prescription")) return "PRESCRIPTION";
  if (n.includes("discharge")) return "DISCHARGE_SUMMARY";
  if (n.includes("vaccination") || n.includes("vaccine")) return "VACCINATION";
  if (n.includes("insurance")) return "INSURANCE";
  if (n.includes("lab") || n.includes("report")) return "LAB_REPORT";
  if (n.includes("referral")) return "REFERRAL";
  if (n.includes("consent")) return "CONSENT";
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

    const bytes = Buffer.from(await file.arrayBuffer());
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const storagePath = `${session.user.id}/${Date.now()}-${safeName}`;

    const supabase = createServerSupabaseClient();

    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, bytes, { contentType: file.type, upsert: false });

    if (uploadErr) {
      console.error("[documents/uploads POST] storage upload failed:", uploadErr);
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }

    const { data: signed, error: signErr } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, 60 * 60 * 24 * 7); // 7 days

    if (signErr || !signed) {
      console.error("[documents/uploads POST] signing failed:", signErr);
      await supabase.storage.from(BUCKET).remove([storagePath]);
      return NextResponse.json({ error: "Failed to generate file URL" }, { status: 500 });
    }

    const titleOverride = (formData.get("title") as string | null)?.trim();
    const typeOverride = formData.get("type") as DocType | null;
    const tagsRaw = formData.get("tags") as string | null;
    const tags = tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [];

    const now = new Date().toISOString();

    const { data: doc, error } = await supabase
      .from("MedicalDocument")
      .insert({
        id: uuidv4(),
        userId: session.user.id,
        uploadedById: session.user.id,
        title: titleOverride || file.name.replace(/\.[^.]+$/, ""),
        type: typeOverride ?? inferDocType(file.type, file.name),
        fileUrl: signed.signedUrl,
        fileSize: file.size,
        mimeType: file.type,
        tags,
        date: now,
        description: storagePath, // Supabase Storage path, stored here for future re-signing/deletion
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single();

    if (error) {
      console.error("[documents/uploads POST] DB insert failed:", error);
      // Clean up the orphaned storage object since the DB row failed
      await supabase.storage.from(BUCKET).remove([storagePath]);
      return NextResponse.json({ error: "Failed to save document" }, { status: 500 });
    }

    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (err) {
    console.error("[documents/uploads POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}