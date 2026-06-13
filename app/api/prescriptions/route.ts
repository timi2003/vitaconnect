// app/api/prescriptions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
  patientId:    z.string(),
  appointmentId:z.string().optional(),
  diagnosis:    z.string().optional(),
  notes:        z.string().optional(),
  refillsAllowed: z.number().int().min(0).default(0),
  medications:  z.array(MedSchema).min(1),
  expiryDate:   z.string().datetime().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const prescriptions = await prisma.prescription.findMany({
    where: {
      patientId: session.user.id,
      ...(status ? { status: status as never } : {}),
    },
    include: {
      medications: true,
      patient: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ prescriptions });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "DOCTOR") {
    return NextResponse.json({ error: "Doctor access required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = CreateSchema.parse(body);

    const prescription = await prisma.prescription.create({
      data: {
        patientId:     data.patientId,
        doctorId:      session.user.id,
        appointmentId: data.appointmentId,
        diagnosis:     data.diagnosis,
        notes:         data.notes,
        refillsAllowed:data.refillsAllowed,
        expiryDate:    data.expiryDate ? new Date(data.expiryDate) : undefined,
        medications: { createMany: { data: data.medications } },
      },
      include: { medications: true },
    });

    // Notify patient
    await prisma.notification.create({
      data: {
        userId:  data.patientId,
        type:    "PRESCRIPTION_READY",
        title:   "New Prescription",
        message: `Dr. ${session.user.name} has issued a new prescription.`,
        data: { prescriptionId: prescription.id },
      },
    });

    return NextResponse.json({ prescription }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}