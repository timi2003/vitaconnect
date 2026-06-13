// app/api/reviews/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CreateSchema = z.object({
  appointmentId: z.string(),
  rating:        z.number().int().min(1).max(5),
  comment:       z.string().max(1000).optional(),
  tags:          z.array(z.string()).default([]),
  isAnonymous:   z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = CreateSchema.parse(body);

    // Verify the appointment belongs to the patient and is completed
    const apt = await prisma.appointment.findUnique({
      where: { id: data.appointmentId },
    });

    if (!apt) return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    if (apt.patientId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (apt.status !== "COMPLETED") return NextResponse.json({ error: "Can only review completed appointments" }, { status: 400 });

    // Check if already reviewed
    const existing = await prisma.review.findUnique({
      where: { appointmentId: data.appointmentId },
    });
    if (existing) return NextResponse.json({ error: "Already reviewed" }, { status: 409 });

    const review = await prisma.review.create({
      data: {
        patientId:     session.user.id,
        doctorId:      apt.doctorId,
        appointmentId: data.appointmentId,
        rating:        data.rating,
        comment:       data.comment,
        tags:          data.tags,
        isAnonymous:   data.isAnonymous,
      },
    });

    // Recalculate doctor's average rating
    const agg = await prisma.review.aggregate({
      where: { doctorId: apt.doctorId },
      _avg: { rating: true },
      _count: true,
    });

    await prisma.doctorProfile.update({
      where: { userId: apt.doctorId },
      data: {
        rating:       Math.round((agg._avg.rating ?? 0) * 10) / 10,
        totalReviews: agg._count,
      },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const doctorId = searchParams.get("doctorId");
  if (!doctorId) return NextResponse.json({ error: "Missing doctorId" }, { status: 400 });

  const reviews = await prisma.review.findMany({
    where: { doctorId },
    include: {
      patient: { select: { name: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const agg = await prisma.review.aggregate({
    where: { doctorId },
    _avg:   { rating: true },
    _count: true,
  });

  return NextResponse.json({
    reviews: reviews.map((r) => ({
      ...r,
      patientName: r.isAnonymous ? "Anonymous" : r.patient.name,
      patient:     undefined,
    })),
    averageRating: agg._avg.rating,
    totalReviews:  agg._count,
  });
}
