// app/api/records/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import { z } from "zod";

const CreateDocSchema = z.object({
  title:       z.string().min(1).max(200),
  type:        z.enum(["PRESCRIPTION","LAB_REPORT","IMAGING","DISCHARGE_SUMMARY","REFERRAL","VACCINATION","INSURANCE","CONSENT","OTHER"]),
  fileUrl:     z.string().url(),
  fileSize:    z.number().int().positive().optional(),
  mimeType:    z.string().optional(),
  description: z.string().optional(),
  tags:        z.array(z.string()).default([]),
  isShared:    z.boolean().default(false),
  date:        z.string().datetime().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type   = searchParams.get("type");
  const search = searchParams.get("search");

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

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,tags.cs.{${search}}`);
  }

  const { data: docs, error } = await query;

  if (error) {
    console.error("[records GET]", error);
    return NextResponse.json({ error: "Failed to fetch records" }, { status: 500 });
  }

  return NextResponse.json({ documents: docs || [] });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = CreateDocSchema.parse(body);

    const supabase = createServerSupabaseClient();

    const { data: doc, error } = await supabase
      .from("medical_documents")
      .insert({
        user_id:        session.user.id,
        uploaded_by_id: session.user.id,
        title:          data.title,
        type:           data.type,
        file_url:       data.fileUrl,
        file_size:      data.fileSize,
        mime_type:      data.mimeType,
        description:    data.description,
        tags:           data.tags,
        is_shared:      data.isShared,
        date:           data.date ? new Date(data.date).toISOString() : null,
      })
      .select()
      .single();

    if (error) throw error;

    // Audit log
    await supabase.from("audit_logs").insert({
      user_id:     session.user.id,
      action:      "DOCUMENT_UPLOADED",
      resource:    "medical_document",
      resource_id: doc.id,
      details:     { title: data.title, type: data.type },
    });

    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error("[records POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
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

  const { data: doc } = await supabase
    .from("medical_documents")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!doc || doc.user_id !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("medical_documents")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}