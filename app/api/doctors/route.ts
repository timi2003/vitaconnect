// app/api/doctors/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();
  const { searchParams } = new URL(req.url);

  const specialty = searchParams.get("specialty");
  const search    = searchParams.get("search");
  const available = searchParams.get("available") === "true";
  const minRating = parseFloat(searchParams.get("minRating") ?? "0");
  const maxFee    = parseFloat(searchParams.get("maxFee") ?? "99999");
  const page      = parseInt(searchParams.get("page") ?? "1", 10);
  const limit     = parseInt(searchParams.get("limit") ?? "20", 10);

  // !inner forces an actual join, so filters below restrict the User rows
  // returned, not just what's nested inside doctorProfile.
  let query = supabase
    .from("User")
    .select(`
      id,
      name,
      image,
      doctorProfile:DoctorProfile!inner (
        specializations,
        subSpecializations,
        experience,
        consultationFee,
        followUpFee,
        rating,
        totalReviews,
        totalConsultations,
        isAvailableNow,
        bio,
        languages,
        availableFor,
        hospital,
        qualifications
      )
    `, { count: "exact" })
    .eq("role", "DOCTOR")
    .eq("isActive", true);

  // Apply filters — reference the embedded resource by its alias, "doctorProfile"
  if (specialty) {
    query = query.contains("doctorProfile.specializations", [specialty]);
  }

  if (available) {
    query = query.eq("doctorProfile.isAvailableNow", true);
  }

  if (minRating > 0) {
    query = query.gte("doctorProfile.rating", minRating);
  }

  if (maxFee < 99999) {
    query = query.lte("doctorProfile.consultationFee", maxFee);
  }

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  // Pagination + Ordering — foreignTable is required to sort by a joined column
  const { data: doctors, error, count } = await query
    .order("rating", { ascending: false, foreignTable: "DoctorProfile" })
    .range((page - 1) * limit, page * limit - 1);

  if (error) {
    console.error("[doctors GET]", error);
    return NextResponse.json({ error: "Failed to fetch doctors" }, { status: 500 });
  }

  return NextResponse.json({
    doctors: doctors || [],
    total: count || 0,
    page,
    limit,
  });
}