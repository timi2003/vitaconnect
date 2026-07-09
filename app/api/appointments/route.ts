// app/api/appointments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

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
  const role = (session.user as { role?: string }).role;

  let query = supabase
    .from("Appointment")
    .select(`
      *,
      doctor:User!Appointment_doctorId_fkey (
        id,
        name,
        image,
        doctorProfile:DoctorProfile (specializations, consultationFee, rating)
      ),
      patient:User!Appointment_patientId_fkey (id, name, image)
    `)
    .eq(role === "DOCTOR" ? "doctorId" : "patientId", session.user.id);

  if (upcoming) {
    query = query.gte("scheduledAt", new Date().toISOString());
  }

  const { data: appointments, error } = await query
    .order("scheduledAt", { ascending: true })
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
      .from("User")
      .select(`id, name, doctorProfile:DoctorProfile (consultationFee)`)
      .eq("id", data.doctorId)
      .eq("role", "DOCTOR")
      .single();

    if (doctorError || !doctor) {
      console.error("[appointments POST] doctor lookup failed:", doctorError);
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    // Create appointment
    const now = new Date().toISOString();
    const roomId = `vc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const { data: appointment, error: insertError } = await supabase
      .from("Appointment")
      .insert({
        id: uuidv4(),
        patientId: session.user.id,
        doctorId: data.doctorId,
        scheduledAt: data.scheduledAt,
        duration: data.duration,
        type: data.type,
        reason: data.reason,
        symptoms: data.symptoms,
        notes: data.notes,
        status: "SCHEDULED",
        roomId,
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[appointments POST]", insertError);
      throw insertError;
    }

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error("[appointments/create]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}