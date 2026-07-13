// app/api/prescriptions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import Pusher from "pusher";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER ?? "us2",
  useTLS: true,
});

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
  patientId:      z.string(),
  appointmentId:  z.string().optional(),
  diagnosis:      z.string().optional(),
  notes:          z.string().optional(),
  refillsAllowed: z.number().int().min(0).default(0),
  medications:    z.array(MedSchema).min(1),
  expiryDate:     z.string().datetime().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const supabase = createServerSupabaseClient();

  // No embed for "doctor" here — Prescription.doctorId has no declared
  // relation in the schema, so there's no FK for PostgREST to join on.
  let query = supabase
    .from("Prescription")
    .select(`*, medications:PrescriptionItem (*)`)
    .eq("patientId", session.user.id)
    .order("issueDate", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data: prescriptions, error } = await query;

  if (error) {
    console.error("[prescriptions GET]", error);
    return NextResponse.json({ error: "Failed to fetch prescriptions" }, { status: 500 });
  }

  // Fetch doctor names separately and merge them in — doctorId is nullable
  // and unconstrained, so we filter out nulls before querying.
  const doctorIds = Array.from(
    new Set((prescriptions || []).map((p: any) => p.doctorId).filter(Boolean))
  );

  let doctorsById = new Map<string, { id: string; name: string }>();
  if (doctorIds.length > 0) {
    const { data: doctors, error: doctorErr } = await supabase
      .from("User")
      .select("id, name")
      .in("id", doctorIds);

    if (doctorErr) {
      console.error("[prescriptions GET] doctor lookup failed (non-fatal):", doctorErr);
    } else {
      doctorsById = new Map((doctors || []).map((d: any) => [d.id, d]));
    }
  }

  const withDoctors = (prescriptions || []).map((p: any) => ({
    ...p,
    doctor: p.doctorId ? doctorsById.get(p.doctorId) ?? null : null,
  }));

  return NextResponse.json({ prescriptions: withDoctors });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "DOCTOR") {
    return NextResponse.json({ error: "Doctor access required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = CreateSchema.parse(body);
    const supabase = createServerSupabaseClient();
    const now = new Date().toISOString();

    // Create prescription
    const { data: prescription, error: presError } = await supabase
      .from("Prescription")
      .insert({
        id: uuidv4(),
        patientId: data.patientId,
        doctorId: session.user.id,
        appointmentId: data.appointmentId ?? null,
        status: "ACTIVE",
        diagnosis: data.diagnosis ?? null,
        notes: data.notes ?? null,
        refillsAllowed: data.refillsAllowed,
        refillsUsed: 0,
        expiryDate: data.expiryDate ? new Date(data.expiryDate).toISOString() : null,
        issueDate: now,
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single();

    if (presError || !prescription) {
      throw presError || new Error("Failed to create prescription");
    }

    // Insert medications
    const medsToInsert = data.medications.map((med) => ({
      id: uuidv4(),
      prescriptionId: prescription.id,
      medicationName: med.medicationName,
      genericName: med.genericName ?? null,
      dosage: med.dosage,
      form: med.form ?? null,
      strength: med.strength ?? null,
      frequency: med.frequency,
      route: med.route ?? null,
      duration: med.duration,
      quantity: med.quantity,
      refillQuantity: 0,
      instructions: med.instructions ?? null,
      isChronic: med.isChronic,
      createdAt: now,
    }));

    const { error: medsError } = await supabase
      .from("PrescriptionItem")
      .insert(medsToInsert);

    if (medsError) {
      console.error("[prescriptions POST] medication insert failed:", medsError);
      // Prescription already exists at this point — surface the error but
      // don't silently pretend everything saved.
      return NextResponse.json(
        { error: "Prescription created but medications failed to save", prescription },
        { status: 500 }
      );
    }

    // Notify patient — isolated so a notification failure can't undo an
    // already-saved prescription
    try {
      const { data: notification } = await supabase
        .from("Notification")
        .insert({
          id: uuidv4(),
          userId: data.patientId,
          type: "PRESCRIPTION_READY",
          title: "New Prescription",
          message: `Dr. ${session.user.name ?? "your doctor"} has issued a new prescription.`,
          data: { prescriptionId: prescription.id },
          isRead: false,
          createdAt: now,
        })
        .select()
        .single();

      if (notification) {
        await pusher.trigger(`user-${data.patientId}`, "new-notification", notification);
      }
    } catch (notifyErr) {
      console.error("[prescriptions POST] notification failed (non-fatal):", notifyErr);
    }

    return NextResponse.json({ prescription }, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error("[prescriptions POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}