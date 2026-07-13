// app/api/doctor/patients/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ((session.user as { role?: string }).role !== "DOCTOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = createServerSupabaseClient();

  // Every appointment this doctor has ever had, most recent first —
  // this is the real source of "who is my patient" and their visit history.
  const { data: appts, error: apptErr } = await supabase
    .from("Appointment")
    .select("patientId, scheduledAt, status")
    .eq("doctorId", session.user.id)
    .order("scheduledAt", { ascending: false });

  if (apptErr) {
    console.error("[doctor/patients GET] appointment lookup failed:", apptErr);
    return NextResponse.json({ error: "Failed to fetch patients" }, { status: 500 });
  }

  if (!appts || appts.length === 0) {
    return NextResponse.json({ patients: [] });
  }

  // Compute last (past) and next (future) visit per patient from the real records
  const now = Date.now();
  const visitInfo = new Map<string, { lastVisit: string | null; nextVisit: string | null }>();

  for (const a of appts) {
    const entry = visitInfo.get(a.patientId) ?? { lastVisit: null, nextVisit: null };
    const time = new Date(a.scheduledAt).getTime();

    if (time <= now && !entry.lastVisit) {
      entry.lastVisit = a.scheduledAt; // list is already newest-first
    }
    if (time > now && ["SCHEDULED", "CONFIRMED"].includes(a.status)) {
      if (!entry.nextVisit || time < new Date(entry.nextVisit).getTime()) {
        entry.nextVisit = a.scheduledAt;
      }
    }
    visitInfo.set(a.patientId, entry);
  }

  const patientIds = Array.from(visitInfo.keys());

  const { data: users, error: userErr } = await supabase
    .from("User")
    .select("id, name, image, dateOfBirth, gender, chronicConditions")
    .in("id", patientIds);

  if (userErr) {
    console.error("[doctors/patients GET] user lookup failed:", userErr);
    return NextResponse.json({ error: "Failed to fetch patients" }, { status: 500 });
  }

  // Real latest vitals per patient, from the actual health_metrics table
  const { data: metrics, error: metricsErr } = await supabase
    .from("HealthMetrics")
    .select("user_id, type, value, value2, unit, recorded_at, is_abnormal")
    .in("user_id", patientIds)
    .order("recorded_at", { ascending: false });

  if (metricsErr) {
    // Non-fatal — patients still show without vitals rather than failing the whole list
    console.error("[doctors/patients GET] metrics lookup failed (non-fatal):", metricsErr);
  }

  const latestMetricsByPatient = new Map<string, any[]>();
  for (const m of metrics || []) {
    const seenTypes = latestMetricsByPatient.get(m.user_id) ?? [];
    if (!seenTypes.some((existing) => existing.type === m.type)) {
      seenTypes.push({
        type: m.type,
        value: m.value,
        value2: m.value2,
        unit: m.unit,
        recordedAt: m.recorded_at,
        isAbnormal: m.is_abnormal,
      });
      latestMetricsByPatient.set(m.user_id, seenTypes);
    }
  }

  const patients = (users || []).map((u) => {
    const info = visitInfo.get(u.id)!;
    const latestMetrics = latestMetricsByPatient.get(u.id) ?? [];
    return {
      id: u.id,
      name: u.name,
      image: u.image,
      dateOfBirth: u.dateOfBirth,
      gender: u.gender,
      conditions: u.chronicConditions || [],
      lastVisit: info.lastVisit,
      nextVisit: info.nextVisit,
      latestMetrics,
      hasAbnormalReading: latestMetrics.some((m) => m.isAbnormal),
    };
  });

  return NextResponse.json({ patients });
}