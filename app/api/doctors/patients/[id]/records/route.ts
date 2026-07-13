// app/api/doctor/patients/[id]/records/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ((session.user as { role?: string }).role !== "DOCTOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = createServerSupabaseClient();
  const patientId = params.id;

  // Same authorization pattern as the patient detail endpoint — a doctor can
  // only view records for a patient they've actually had an appointment with.
  const { data: appt } = await supabase
    .from("Appointment")
    .select("id")
    .eq("doctorId", session.user.id)
    .eq("patientId", patientId)
    .limit(1)
    .maybeSingle();

  if (!appt) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  // Only documents the patient has explicitly marked shared, and either
  // shared with everyone treating them (empty sharedWith) or with this
  // doctor specifically.
  const { data: docs, error } = await supabase
    .from("MedicalDocument")
    .select("*")
    .eq("userId", patientId)
    .eq("isShared", true)
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("[doctor/patients/[id]/records GET]", error);
    return NextResponse.json({ error: "Failed to fetch records" }, { status: 500 });
  }

  const visible = (docs || []).filter(
    (d: any) => !d.sharedWith || d.sharedWith.length === 0 || d.sharedWith.includes(session.user.id)
  );

  return NextResponse.json({ documents: visible });
}