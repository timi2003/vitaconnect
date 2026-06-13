// app/api/appointments/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apt = await prisma.appointment.findUnique({
    where: { id: params.id },
    include: {
      doctor: {
        select: {
          id: true, name: true, image: true,
          doctorProfile: { select: { specializations: true, consultationFee: true } },
        },
      },
      patient:      { select: { id: true, name: true, image: true } },
      prescriptions:{ include: { medications: true } },
      labOrders:    { include: { tests: true } },
      videoSession: true,
      payment:      true,
    },
  });

  if (!apt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Auth check
  if (apt.patientId !== session.user.id && apt.doctorId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ appointment: apt });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apt = await prisma.appointment.findUnique({ where: { id: params.id } });
  if (!apt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (apt.patientId !== session.user.id && apt.doctorId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = UpdateSchema.parse(body);

    const updated = await prisma.appointment.update({
      where: { id: params.id },
      data: {
        ...data,
        cancelledBy:   data.status === "CANCELLED" ? session.user.id : undefined,
        scheduledAt:   data.scheduledAt ? new Date(data.scheduledAt) : undefined,
        followUpDate:  data.followUpDate ? new Date(data.followUpDate) : undefined,
      },
    });

    // Notify the other party
    const notifyId = session.user.id === apt.patientId ? apt.doctorId : apt.patientId;
    if (data.status === "CANCELLED") {
      await prisma.notification.create({
        data: {
          userId:  notifyId,
          type:    "APPOINTMENT_CANCELLED",
          title:   "Appointment Cancelled",
          message: `An appointment on ${new Date(apt.scheduledAt).toLocaleDateString()} has been cancelled.`,
          data: { appointmentId: apt.id, reason: data.cancelReason },
        },
      });
    }

    // Audit
    await prisma.auditLog.create({
      data: {
        userId:     session.user.id,
        action:     `APPOINTMENT_${data.status ?? "UPDATED"}`,
        resource:   "appointment",
        resourceId: params.id,
        details:    data,
      },
    });

    return NextResponse.json({ appointment: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apt = await prisma.appointment.findUnique({ where: { id: params.id } });
  if (!apt || apt.patientId !== session.user.id) {
    return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });
  }

  // Soft cancel instead of delete
  await prisma.appointment.update({
    where: { id: params.id },
    data: { status: "CANCELLED", cancelledBy: session.user.id },
  });

  return NextResponse.json({ success: true });
}