// app/api/doctor/availability/toggle/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import { z } from "zod";

const Schema = z.object({
  isAvailableNow: z.boolean(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if ((session.user as { role?: string }).role !== "DOCTOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { isAvailableNow } = Schema.parse(await req.json());

    const supabase = createServerSupabaseClient();

    const { data: updated, error } = await supabase
      .from("DoctorProfile")
      .update({ isAvailableNow, updatedAt: new Date().toISOString() })
      .eq("userId", session.user.id)
      .select("isAvailableNow")
      .single();

    if (error) {
      console.error("[api/doctor/availability/toggle]", error);
      return NextResponse.json({ error: "Failed to update availability" }, { status: 500 });
    }

    return NextResponse.json({ isAvailableNow: updated.isAvailableNow });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error("[api/doctor/availability/toggle]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}