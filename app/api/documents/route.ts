// app/api/documents/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";

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

// ── GET /api/documents ────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") as DocType | null;

  const supabase = createServerSupabaseClient();

  let query = supabase
    .from("MedicalDocument")
    .select("*")
    .eq("userId", session.user.id)
    .order("createdAt", { ascending: false })
    .limit(100);

  if (type) query = query.eq("type", type);

  const { data: documents, error } = await query;

  if (error) {
    console.error("[documents GET]", error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }

  // Re-sign Supabase Storage URLs so they never expire on the client.
  // "description" holds the storage path (see uploads route) — note this
  // overloads a field meant for user-facing notes about the document.
  const refreshed = await Promise.allSettled(
    (documents || []).map(async (doc: any) => {
      if (!doc.description) return doc;
      try {
        const { data: signed, error: signErr } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(doc.description, 60 * 60 * 2); // 2 hours
        if (signErr || !signed) return doc;
        return { ...doc, fileUrl: signed.signedUrl };
      } catch {
        return doc; // fall back to the stored URL
      }
    })
  );

  const result = refreshed
    .map((r) => (r.status === "fulfilled" ? r.value : null))
    .filter(Boolean);

  return NextResponse.json({ documents: result });
}

// ── DELETE /api/documents?id=xxx ─────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const supabase = createServerSupabaseClient();

  const { data: doc, error: fetchError } = await supabase
    .from("MedicalDocument")
    .select("description")
    .eq("id", id)
    .eq("userId", session.user.id)
    .single();

  if (fetchError || !doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (doc.description) {
    const { error: removeErr } = await supabase.storage.from(BUCKET).remove([doc.description]);
    if (removeErr) {
      console.error("[documents DELETE] storage removal failed (non-fatal):", removeErr);
    }
  }

  const { error: deleteError } = await supabase
    .from("MedicalDocument")
    .delete()
    .eq("id", id);

  if (deleteError) {
    console.error("[documents DELETE]", deleteError);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}