// app/api/appointments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

  const { searchParams } = new URL(req.url);
  const status   = searchParams.get("status");
  const upcoming = searchParams.get("upcoming") === "true";

  const where = {
    ...(session.user.role === "DOCTOR"
      ? { doctorId: session.user.id }
      : { patientId: session.user.id }),
    ...(status ? { status: status as never } : {}),
    ...(upcoming ? { scheduledAt: { gte: new Date() } } : {}),
  };

  const appointments = await prisma.appointment.findMany({
    where,
    orderBy: { scheduledAt: "asc" },
    include: {
      doctor: {
        select: {
          id: true, name: true, image: true,
          doctorProfile: {
            select: { specializations: true, consultationFee: true, rating: true },
          },
        },
      },
      patient: {
        select: { id: true, name: true, image: true },
      },
      payment: { select: { status: true, amount: true } },
    },
    take: 50,
  });

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

    // Verify doctor exists and is available
    const doctor = await prisma.user.findUnique({
      where: { id: data.doctorId, role: "DOCTOR" },
      include: { doctorProfile: true },
    });

    if (!doctor || !doctor.doctorProfile) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    // Check for conflicts
    const scheduledDate = new Date(data.scheduledAt);
    const endDate = new Date(scheduledDate.getTime() + data.duration * 60000);

    const conflict = await prisma.appointment.findFirst({
      where: {
        doctorId: data.doctorId,
        status: { in: ["SCHEDULED", "CONFIRMED", "IN_PROGRESS"] },
        OR: [
          {
            scheduledAt: { gte: scheduledDate, lt: endDate },
          },
          {
            AND: [
              { scheduledAt: { lte: scheduledDate } },
              // approximate end time check
            ],
          },
        ],
      },
    });

    if (conflict) {
      return NextResponse.json(
        { error: "Time slot is not available" },
        { status: 409 }
      );
    }

    // Create appointment + video room
    const roomId = `vc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const appointment = await prisma.appointment.create({
      data: {
        patientId:   session.user.id,
        doctorId:    data.doctorId,
        scheduledAt: scheduledDate,
        duration:    data.duration,
        type:        data.type,
        reason:      data.reason,
        symptoms:    data.symptoms,
        notes:       data.notes,
        status:      "SCHEDULED",
        roomId,
      },
      include: {
        doctor:  { select: { id: true, name: true } },
        patient: { select: { id: true, name: true } },
      },
    });

    // Create notifications for both parties
    await prisma.notification.createMany({
      data: [
        {
          userId: session.user.id,
          type: "APPOINTMENT_CONFIRMED",
          title: "Appointment Scheduled",
          message: `Your appointment with ${doctor.name} is scheduled for ${scheduledDate.toLocaleString()}.`,
          data: { appointmentId: appointment.id },
        },
        {
          userId: data.doctorId,
          type: "APPOINTMENT_CONFIRMED",
          title: "New Appointment",
          message: `New appointment scheduled with ${session.user.name} on ${scheduledDate.toLocaleString()}.`,
          data: { appointmentId: appointment.id },
        },
      ],
    });

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error("[appointments/create]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
