// app/api/reviews/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";
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
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = CreateSchema.parse(body);

    const supabase = createServerSupabaseClient();

    // Verify appointment
    const { data: apt } = await supabase
      .from("appointments")
      .select("patient_id, doctor_id, status")
      .eq("id", data.appointmentId)
      .single();

    if (!apt) return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    if (apt.patient_id !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (apt.status !== "COMPLETED") return NextResponse.json({ error: "Can only review completed appointments" }, { status: 400 });

    // Check if already reviewed
    const { data: existing } = await supabase
      .from("reviews")
      .select("id")
      .eq("appointment_id", data.appointmentId)
      .single();

    if (existing) return NextResponse.json({ error: "Already reviewed" }, { status: 409 });

    // Create review
    const { data: review, error: reviewError } = await supabase
      .from("reviews")
      .insert({
        patient_id:     session.user.id,
        doctor_id:      apt.doctor_id,
        appointment_id: data.appointmentId,
        rating:         data.rating,
        comment:        data.comment,
        tags:           data.tags,
        is_anonymous:   data.isAnonymous,
      })
      .select()
      .single();

    if (reviewError) throw reviewError;

    // Recalculate doctor's average rating
    const { data: agg } = await supabase
      .from("reviews")
      .select("rating")
      .eq("doctor_id", apt.doctor_id);

    if (agg && agg.length > 0) {
      const avgRating = agg.reduce((sum, r) => sum + r.rating, 0) / agg.length;
      const totalReviews = agg.length;

      await supabase
        .from("doctor_profiles")
        .update({
          rating: Math.round(avgRating * 10) / 10,
          total_reviews: totalReviews,
        })
        .eq("user_id", apt.doctor_id);
    }

    return NextResponse.json({ review }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error("[reviews POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const doctorId = searchParams.get("doctorId");
  if (!doctorId) return NextResponse.json({ error: "Missing doctorId" }, { status: 400 });

  const supabase = createServerSupabaseClient();

  const { data: reviews } = await supabase
    .from("reviews")
    .select(`
      *,
      patient:users(name, image)
    `)
    .eq("doctor_id", doctorId)
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: agg } = await supabase
    .from("reviews")
    .select("rating")
    .eq("doctor_id", doctorId);

  const averageRating = agg && agg.length > 0 
    ? agg.reduce((sum, r) => sum + r.rating, 0) / agg.length 
    : 0;

  return NextResponse.json({
    reviews: (reviews || []).map((r: any) => ({
      ...r,
      patientName: r.is_anonymous ? "Anonymous" : r.patient?.name,
      patient: undefined,
    })),
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews: agg?.length || 0,
  });
}