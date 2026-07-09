// app/api/patients/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only doctors need to search for patients to message
  if ((session.user as { role?: string }).role !== "DOCTOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");

  const supabase = createServerSupabaseClient();

  let query = supabase
    .from("User")
    .select("id, name, image")
    .eq("role", "PATIENT")
    .eq("isActive", true);

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data: patients, error } = await query.limit(20);

  if (error) {
    console.error("[patients GET]", error);
    return NextResponse.json({ error: "Failed to fetch patients" }, { status: 500 });
  }

  return NextResponse.json({ patients: patients || [] });
}