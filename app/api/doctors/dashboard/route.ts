// app/api/doctor/dashboard/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ((session.user as { role?: string }).role !== "DOCTOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = createServerSupabaseClient();
  const doctorId = session.user.id;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);

  // ── Run all queries in parallel ───────────────────────────────────────────
  const [
    todayApptRes,
    monthCountRes,
    doctorProfileRes,
    weekApptRes,
    abnormalLabsRes,
    pendingNotesRes,
    expiringRxRes,
  ] = await Promise.all([

    // Today's appointments with patient info
    supabase
      .from("Appointment")
      .select(`
        id, scheduledAt, type, status, reason,
        patient:patientId (
          name, image
        )
      `)
      .eq("doctorId", doctorId)
      .gte("scheduledAt", todayStart.toISOString())
      .lte("scheduledAt", todayEnd.toISOString())
      .not("status", "in", '("CANCELLED","NO_SHOW")')
      .order("scheduledAt", { ascending: true }),

    // This month's completed consultation count
    supabase
      .from("Appointment")
      .select("id", { count: "exact", head: true })
      .eq("doctorId", doctorId)
      .eq("status", "COMPLETED")
      .gte("scheduledAt", monthStart.toISOString()),

    // Doctor profile for rating + pending reviews
    supabase
      .from("DoctorProfile")
      .select("rating, totalReviews")
      .eq("userId", doctorId)
      .single(),

    // This week's appointments per day for the chart
    supabase
      .from("Appointment")
      .select("scheduledAt")
      .eq("doctorId", doctorId)
      .gte("scheduledAt", weekStart.toISOString())
      .not("status", "in", '("CANCELLED","NO_SHOW")'),

    // Abnormal lab results for this doctor's patients (pending review)
    supabase
      .from("LabResult")
      .select(`
        id, testName, reviewedAt,
        user:userId ( name )
      `)
      .is("reviewedBy", null)
      .eq("isAbnormal", true)
      .limit(5),

    // Appointments completed today with no doctorNotes yet
    supabase
      .from("Appointment")
      .select(`
        id,
        patient:patientId ( name )
      `)
      .eq("doctorId", doctorId)
      .eq("status", "COMPLETED")
      .is("doctorNotes", null)
      .gte("scheduledAt", todayStart.toISOString())
      .lte("scheduledAt", todayEnd.toISOString())
      .limit(5),

    // Active prescriptions expiring within 7 days
    supabase
      .from("Prescription")
      .select(`
        id,
        patient:patientId ( name )
      `)
      .eq("doctorId", doctorId)
      .eq("status", "ACTIVE")
      .not("expiryDate", "is", null)
      .lte("expiryDate", new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
      .limit(5),
  ]);

  // ── Build weekly chart data (Mon–Sun labels) ───────────────────────────────
  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayCounts: Record<string, number> = {};

  // Initialise all 7 days to 0 in order
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dayCounts[DAY_LABELS[d.getDay()]] = 0;
  }

  for (const appt of weekApptRes.data ?? []) {
    const label = DAY_LABELS[new Date(appt.scheduledAt).getDay()];
    dayCounts[label] = (dayCounts[label] ?? 0) + 1;
  }

  const weeklyData = Object.entries(dayCounts).map(([day, count]) => ({ day, count }));
  const weeklyTotal = weeklyData.reduce((s, d) => s + d.count, 0);

  // ── Build pending actions list ─────────────────────────────────────────────
  const pendingActions: { label: string; type: string; urgent: boolean }[] = [];

  for (const lab of abnormalLabsRes.data ?? []) {
    const patientName = (lab.user as { name?: string } | null)?.name ?? "a patient";
    pendingActions.push({
      label:  `Review abnormal ${lab.testName} result for ${patientName}`,
      type:   "LAB",
      urgent: true,
    });
  }

  for (const appt of pendingNotesRes.data ?? []) {
    const patientName = (appt.patient as { name?: string } | null)?.name ?? "a patient";
    pendingActions.push({
      label:  `Complete consultation notes for ${patientName}`,
      type:   "NOTES",
      urgent: false,
    });
  }

  for (const rx of expiringRxRes.data ?? []) {
    const patientName = (rx.patient as { name?: string } | null)?.name ?? "a patient";
    pendingActions.push({
      label:  `Prescription expiring soon for ${patientName}`,
      type:   "PRESCRIPTION",
      urgent: false,
    });
  }

  return NextResponse.json({
    todayCount:        todayApptRes.data?.length              ?? 0,
    pendingReviews:    (abnormalLabsRes.data?.length ?? 0),
    monthCount:        monthCountRes.count                    ?? 0,
    avgRating:         doctorProfileRes.data?.rating          ?? 0,
    todayAppointments: todayApptRes.data                      ?? [],
    weeklyData,
    weeklyTotal,
    pendingActions,
  });
}