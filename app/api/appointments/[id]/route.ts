// app/api/appointments/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

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
    .from("Appointment")
    .select(`
      *,
      doctor:User!Appointment_doctorId_fkey (
        id,
        name,
        image,
        doctorProfile:DoctorProfile (specializations, consultationFee)
      ),
      patient:User!Appointment_patientId_fkey (id, name, image)
    `)
    // TODO: re-add once confirmed: prescriptions(*, medications(*)),
    // labOrders(*, tests(*)), videoSession(*), payment(*)
    .eq("id", params.id)
    .single();

  if (error || !apt) {
    console.error("[appointments/[id] GET]", error);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Auth check
  if (apt.patientId !== session.user.id && apt.doctorId !== session.user.id) {
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
    .from("Appointment")
    .select("patientId, doctorId, scheduledAt")
    .eq("id", params.id)
    .single();

  if (!apt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (apt.patientId !== session.user.id && apt.doctorId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = UpdateSchema.parse(body);

    const updatePayload: any = {
      updatedAt: new Date().toISOString(),
    };

    if (data.status) updatePayload.status = data.status;
    if (data.cancelReason) updatePayload.cancelReason = data.cancelReason;
    if (data.doctorNotes) updatePayload.doctorNotes = data.doctorNotes;
    if (data.diagnosis) updatePayload.diagnosis = data.diagnosis;
    if (data.scheduledAt) updatePayload.scheduledAt = data.scheduledAt;
    if (data.followUpDate) updatePayload.followUpDate = data.followUpDate;
    if (data.status === "CANCELLED") {
      updatePayload.cancelledBy = session.user.id;
    }

    const { data: updated, error } = await supabase
      .from("Appointment")
      .update(updatePayload)
      .eq("id", params.id)
      .select()
      .single();

    if (error) throw error;

    // Notify the other party on cancellation
    if (data.status === "CANCELLED") {
      const notifyId = session.user.id === apt.patientId ? apt.doctorId : apt.patientId;
      const { error: notifErr } = await supabase.from("Notification").insert({
        id: uuidv4(),
        userId: notifyId,
        type: "APPOINTMENT_CANCELLED",
        title: "Appointment Cancelled",
        message: data.cancelReason
          ? `An appointment has been cancelled: ${data.cancelReason}`
          : "An appointment has been cancelled.",
        isRead: false,
        createdAt: new Date().toISOString(),
      });
      if (notifErr) {
        // Non-fatal — don't let a notification failure undo an already-saved cancellation
        console.error("[appointments/[id] PATCH] notification failed (non-fatal):", notifErr);
      }
    }

    return NextResponse.json({ appointment: updated });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error("[appointments/[id] PATCH]", err);
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
    .from("Appointment")
    .select("patientId")
    .eq("id", params.id)
    .single();

  if (!apt || apt.patientId !== session.user.id) {
    return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });
  }

  const { error } = await supabase
    .from("Appointment")
    .update({
      status: "CANCELLED",
      cancelledBy: session.user.id,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", params.id);

  if (error) {
    console.error("[appointments/[id] DELETE]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}