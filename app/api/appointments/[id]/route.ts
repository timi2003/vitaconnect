// app/api/appointments/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import { z } from "zod";

const UpdateSchema = z.object({
  status:        z.enum(["CONFIRMED","CANCELLED","RESCHEDULED","COMPLETED","NO_SHOW"]).optional(),
  cancelReason:  z.string().optional(),
  doctorNotes:   z.string().optional(),
  diagnosis:     z.string().optional(),
  scheduledAt:   z.string().datetime().optional(),
  followUpDate:  z.string().datetime().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();

  const { data: apt, error } = await supabase
    .from("appointments")
    .select(`
      *,
      doctor:users!doctor_id (
        id, 
        name, 
        image, 
        doctor_profile(specializations, consultation_fee)
      ),
      patient:users!patient_id (id, name, image),
      prescriptions(*, medications(*)),
      lab_orders(*, tests(*)),
      video_session(*),
      payment(*)
    `)
    .eq("id", params.id)
    .single();

  if (error || !apt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Auth check
  if (apt.patient_id !== session.user.id && apt.doctor_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ appointment: apt });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();

  // Check ownership
  const { data: apt } = await supabase
    .from("appointments")
    .select("patient_id, doctor_id, scheduled_at")
    .eq("id", params.id)
    .single();

  if (!apt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (apt.patient_id !== session.user.id && apt.doctor_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = UpdateSchema.parse(body);

    const updatePayload: any = { ...data };

    if (data.scheduledAt) updatePayload.scheduled_at = data.scheduledAt;
    if (data.followUpDate) updatePayload.follow_up_date = data.followUpDate;
    if (data.status === "CANCELLED") {
      updatePayload.cancelled_by = session.user.id;
    }

    const { data: updated, error } = await supabase
      .from("appointments")
      .update(updatePayload)
      .eq("id", params.id)
      .select()
      .single();

    if (error) throw error;

    // Optional: Create notification for cancellation
    if (data.status === "CANCELLED") {
      const notifyId = session.user.id === apt.patient_id ? apt.doctor_id : apt.patient_id;
      await supabase.from("notifications").insert({
        user_id: notifyId,
        type: "APPOINTMENT_CANCELLED",
        title: "Appointment Cancelled",
        message: `An appointment has been cancelled.`,
        data: { appointment_id: params.id, reason: data.cancelReason },
      });
    }

    return NextResponse.json({ appointment: updated });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error("[appointments PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();

  const { data: apt } = await supabase
    .from("appointments")
    .select("patient_id")
    .eq("id", params.id)
    .single();

  if (!apt || apt.patient_id !== session.user.id) {
    return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });
  }

  const { error } = await supabase
    .from("appointments")
    .update({
      status: "CANCELLED",
      cancelled_by: session.user.id,
    })
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}