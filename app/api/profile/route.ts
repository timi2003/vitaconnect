// app/api/user/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import { z } from "zod";

const ProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "NON_BINARY", "PREFER_NOT_TO_SAY"]).optional(),
  bloodType: z
    .enum([
      "A_POSITIVE", "A_NEGATIVE", "B_POSITIVE", "B_NEGATIVE",
      "AB_POSITIVE", "AB_NEGATIVE", "O_POSITIVE", "O_NEGATIVE", "UNKNOWN",
    ])
    .optional(),
  height: z.coerce.number().positive().optional(),
  weight: z.coerce.number().positive().optional(),
  allergies: z.string().optional(),
  chronicConditions: z.string().optional(),
  emergencyName: z.string().optional(),
  emergencyPhone: z.string().optional(),
  emergencyRel: z.string().optional(),
  // Doctor-specific (only applied when role === "DOCTOR")
  licenseNumber: z.string().optional(),
  npiNumber: z.string().optional(),
  experience: z.coerce.number().int().nonnegative().optional(),
  hospital: z.string().optional(),
  department: z.string().optional(),
  bio: z.string().optional(),
  consultationFee: z.coerce.number().nonnegative().optional(),
  followUpFee: z.coerce.number().nonnegative().optional(),
  specializations: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  qualifications: z
    .array(z.object({ degree: z.string(), institution: z.string(), year: z.string() }))
    .optional(),
});

// Table/column names match the real schema: PascalCase tables, camelCase columns
// (aliased with snake_case keys on the left purely so the JSON response shape is
// unchanged for the frontend — adjust the aliases if your frontend expects camelCase)
const USER_SELECT = `
  id, name, email, image, phone, role, isVerified, dateOfBirth, gender,
  bloodType, height, weight, allergies, chronicConditions, emergencyContact,
  timezone, locale, createdAt,
  patient_profile:PatientProfile (
    insuranceProvider, insurancePolicyNo, insuranceGroupNo, preferredLanguage
  ),
  doctor_profile:DoctorProfile (
    licenseNumber, npiNumber, experience, hospital, department, bio,
    specializations, languages, qualifications, consultationFee, followUpFee,
    rating, totalReviews, isAvailableNow
  )
`;

// ── Resolve User ID from Session ─────────────────────────────────────────────
async function resolveUserId(session: { user?: { id?: string; email?: string | null } }): Promise<string | null> {
  const supabase = createServerSupabaseClient();
  const sid = session.user?.id;

  if (sid) {
    // Try by ID first
    const { data } = await supabase
      .from("User")
      .select("id")
      .eq("id", sid)
      .maybeSingle();
    if (data) return data.id;

    // Try by provider account ID
    const { data: account } = await supabase
      .from("Account")
      .select("userId")
      .eq("providerAccountId", sid)
      .maybeSingle();
    if (account) return account.userId;
  }

  // Last resort: by email
  const email = session.user?.email;
  if (email) {
    const { data } = await supabase
      .from("User")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (data) return data.id;
  }

  return null;
}

// ── GET /api/user/profile ─────────────────────────────────────────────────────
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = await resolveUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const supabase = createServerSupabaseClient();

  const { data: user, error } = await supabase
    .from("User")
    .select(USER_SELECT)
    .eq("id", userId)
    .single();

  if (error || !user) {
    console.error("[api/profile GET]", error);
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user });
}

// ── PUT /api/user/profile ─────────────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = await resolveUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const data = ProfileSchema.parse(body);

    const supabase = createServerSupabaseClient();

    const updateData: any = { updatedAt: new Date().toISOString() };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.bloodType !== undefined) updateData.bloodType = data.bloodType;
    if (data.height !== undefined) updateData.height = data.height;
    if (data.weight !== undefined) updateData.weight = data.weight;

    if (data.dateOfBirth !== undefined) {
      updateData.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth).toISOString() : null;
    }

    if (data.allergies !== undefined) {
      updateData.allergies = data.allergies.split(",").map((s) => s.trim()).filter(Boolean);
    }
    if (data.chronicConditions !== undefined) {
      updateData.chronicConditions = data.chronicConditions.split(",").map((s) => s.trim()).filter(Boolean);
    }

    // Emergency contact merge
    if (data.emergencyName || data.emergencyPhone || data.emergencyRel) {
      const { data: existing } = await supabase
        .from("User")
        .select("emergencyContact")
        .eq("id", userId)
        .maybeSingle();

      const prev = existing?.emergencyContact || {};

      updateData.emergencyContact = {
        name: data.emergencyName || prev.name || "",
        phone: data.emergencyPhone || prev.phone || "",
        relationship: data.emergencyRel || prev.relationship || "",
      };
    }

    const { data: userRow } = await supabase
      .from("User")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    const { error } = await supabase
      .from("User")
      .update(updateData)
      .eq("id", userId);

    if (error) throw error;

    // Doctor-specific fields go to DoctorProfile, not User
    if (userRow?.role === "DOCTOR") {
      const doctorUpdate: any = {};

      if (data.licenseNumber !== undefined) doctorUpdate.licenseNumber = data.licenseNumber;
      if (data.npiNumber !== undefined) doctorUpdate.npiNumber = data.npiNumber;
      if (data.experience !== undefined) doctorUpdate.experience = data.experience;
      if (data.hospital !== undefined) doctorUpdate.hospital = data.hospital;
      if (data.department !== undefined) doctorUpdate.department = data.department;
      if (data.bio !== undefined) doctorUpdate.bio = data.bio;
      if (data.consultationFee !== undefined) doctorUpdate.consultationFee = data.consultationFee;
      if (data.followUpFee !== undefined) doctorUpdate.followUpFee = data.followUpFee;
      if (data.specializations !== undefined) doctorUpdate.specializations = data.specializations;
      if (data.languages !== undefined) doctorUpdate.languages = data.languages;
      if (data.qualifications !== undefined) doctorUpdate.qualifications = data.qualifications;

      if (Object.keys(doctorUpdate).length > 0) {
        doctorUpdate.updatedAt = new Date().toISOString();
        const { error: doctorErr } = await supabase
          .from("DoctorProfile")
          .update(doctorUpdate)
          .eq("userId", userId);
        if (doctorErr) throw new Error(`DoctorProfile update failed: ${doctorErr.message}`);
      }
    }

    // Audit log — only include columns AuditLog actually has (id, userId, action, resource, createdAt)
    await supabase.from("AuditLog").insert({
      id: crypto.randomUUID(),
      userId,
      action: "UPDATE_PROFILE",
      resource: "user",
      createdAt: new Date().toISOString(),
    });

    // Return the fresh combined record (User + whichever profile) after all updates
    const { data: finalUser, error: finalErr } = await supabase
      .from("User")
      .select(USER_SELECT)
      .eq("id", userId)
      .single();

    if (finalErr) throw finalErr;

    return NextResponse.json({ user: finalUser });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error("[api/profile PUT]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}