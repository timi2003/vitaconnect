// app/api/appointments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import { z } from "zod";

const CreateSchema = z.object({
  doctorId:    z.string(),
  scheduledAt: z.string().datetime(),
  duration:    z.number().int().min(15).max(120).default(30),
  type:        z.enum(["VIDEO", "AUDIO", "CHAT", "IN_PERSON"]).default("VIDEO"),
  reason:      z.string().optional(),
  symptoms:    z.array(z.string()).default([]),
  notes:       z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();
  const { searchParams } = new URL(req.url);
  const upcoming = searchParams.get("upcoming") === "true";

  let query = supabase
    .from("appointments")
    .select(`
      *,
      doctor:users!doctor_id (
        id, 
        name, 
        image, 
        doctor_profile(specializations, consultation_fee, rating)
      ),
      patient:users!patient_id (id, name, image),
      payment(status, amount)
    `)
    .eq(
      session.user.role === "DOCTOR" ? "doctor_id" : "patient_id", 
      session.user.id
    );

  if (upcoming) {
    query = query.gte("scheduled_at", new Date().toISOString());
  }

  const { data: appointments, error } = await query
    .order("scheduled_at", { ascending: true })
    .limit(50);

  if (error) {
    console.error("[appointments GET]", error);
    return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 });
  }

  return NextResponse.json({ appointments });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = CreateSchema.parse(body);

    const supabase = createServerSupabaseClient();

    // Verify doctor exists
    const { data: doctor, error: doctorError } = await supabase
      .from("users")
      .select(`
        id, 
        name,
        doctor_profile(consultation_fee)
      `)
      .eq("id", data.doctorId)
      .eq("role", "DOCTOR")
      .single();

    if (doctorError || !doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    // Create appointment
    const roomId = `vc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const { data: appointment, error: insertError } = await supabase
      .from("appointments")
      .insert({
        patient_id: session.user.id,
        doctor_id: data.doctorId,
        scheduled_at: data.scheduledAt,
        duration: data.duration,
        type: data.type,
        reason: data.reason,
        symptoms: data.symptoms,
        notes: data.notes,
        status: "SCHEDULED",
        room_id: roomId,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[appointments POST]", insertError);
      throw insertError;
    }

    // Create notifications (optional - you can simplify or remove if not critical)
    // await supabase.from("notifications").insert([...]);

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error("[appointments/create]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}