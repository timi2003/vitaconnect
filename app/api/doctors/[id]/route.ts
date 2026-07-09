// app/api/doctors/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();

  const { data: user, error } = await supabase
    .from("User")
    .select(`
      id,
      name,
      image,
      doctorProfile:DoctorProfile (
        specializations,
        subSpecializations,
        experience,
        consultationFee,
        followUpFee,
        rating,
        totalReviews,
        totalConsultations,
        bio,
        languages,
        availableFor,
        hospital,
        department,
        qualifications,
        isAvailableNow
      )
    `)
    .eq("id", params.id)
    .eq("role", "DOCTOR")
    .eq("isActive", true)
    .single();

  if (error || !user || !(user as any).doctorProfile) {
    console.error("[api/doctors/[id] GET]", error);
    return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
  }

  return NextResponse.json({
    doctor: {
      id: user.id,
      name: user.name,
      image: user.image,
      doctorProfile: (user as any).doctorProfile,
    },
    // TODO: re-add availability slots once the real table/column names are confirmed
    slots: [],
  });
}