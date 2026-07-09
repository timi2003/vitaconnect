// app/api/prescriptions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import { z } from "zod";

const MedSchema = z.object({
  medicationName: z.string(),
  genericName:    z.string().optional(),
  dosage:         z.string(),
  form:           z.string().optional(),
  strength:       z.string().optional(),
  frequency:      z.string(),
  route:          z.string().optional(),
  duration:       z.string(),
  quantity:       z.number().int().positive(),
  instructions:   z.string().optional(),
  isChronic:      z.boolean().default(false),
});

const CreateSchema = z.object({
  patientId:     z.string(),
  appointmentId: z.string().optional(),
  diagnosis:     z.string().optional(),
  notes:         z.string().optional(),
  refillsAllowed: z.number().int().min(0).default(0),
  medications:   z.array(MedSchema).min(1),
  expiryDate:    z.string().datetime().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const supabase = createServerSupabaseClient();

  let query = supabase
    .from("prescriptions")
    .select(`
      *,
      medications(*),
      patient:users(id, name)
    `)
    .eq("patient_id", session.user.id)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data: prescriptions, error } = await query;

  if (error) {
    console.error("[prescriptions GET]", error);
    return NextResponse.json({ error: "Failed to fetch prescriptions" }, { status: 500 });
  }

  return NextResponse.json({ prescriptions: prescriptions || [] });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "DOCTOR") {
    return NextResponse.json({ error: "Doctor access required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = CreateSchema.parse(body);

    const supabase = createServerSupabaseClient();

    // Create prescription
    const { data: prescription, error: presError } = await supabase
      .from("prescriptions")
      .insert({
        patient_id:     data.patientId,
        doctor_id:      session.user.id,
        appointment_id: data.appointmentId,
        diagnosis:      data.diagnosis,
        notes:          data.notes,
        refills_allowed: data.refillsAllowed,
        expiry_date:    data.expiryDate ? new Date(data.expiryDate).toISOString() : null,
      })
      .select()
      .single();

    if (presError || !prescription) {
      throw presError || new Error("Failed to create prescription");
    }

    // Insert medications
    if (data.medications.length > 0) {
      const medsToInsert = data.medications.map(med => ({
        prescription_id: prescription.id,
        ...med,
      }));

      const { error: medsError } = await supabase
        .from("prescription_items")
        .insert(medsToInsert);

      if (medsError) console.error("Failed to insert medications:", medsError);
    }

    // Notify patient
    await supabase.from("notifications").insert({
      user_id:  data.patientId,
      type:     "PRESCRIPTION_READY",
      title:    "New Prescription",
      message:  `Dr. ${session.user.name} has issued a new prescription.`,
      data:     { prescription_id: prescription.id },
    });

    return NextResponse.json({ prescription }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error("[prescriptions POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}