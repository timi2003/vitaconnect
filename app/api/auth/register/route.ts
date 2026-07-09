// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createServerSupabaseClient } from "@/lib/supabase";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

const RegisterSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  phone: z.string().optional(),
  role: z.enum(["PATIENT", "DOCTOR"]).default("PATIENT"),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "NON_BINARY", "PREFER_NOT_TO_SAY", ""]).optional(),
});

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  let createdUserId: string | null = null;

  try {
    const body = await req.json();
    const data = RegisterSchema.parse(body);

    // Duplicate email check — maybeSingle so "not found" isn't treated as an error
    const { data: existing, error: existingErr } = await supabase
      .from("User")
      .select("id")
      .eq("email", data.email)
      .maybeSingle();

    if (existingErr) {
      console.error("[auth/register] duplicate check failed:", existingErr);
      return NextResponse.json({ error: "Failed to validate email" }, { status: 500 });
    }
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const newUserId = uuidv4();
    const now = new Date().toISOString();

    // Create User
    const { data: newUser, error: userError } = await supabase
      .from("User")
      .insert({
        id: newUserId,
        name: data.name,
        email: data.email,
        passwordHash,
        phone: data.phone ?? null,
        role: data.role,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString() : null,
        gender: data.gender || null,
        allergies: [],
        chronicConditions: [],
        timezone: "UTC",
        locale: "en",
        isVerified: true,
        createdAt: now,
        updatedAt: now,
      })
      .select("id, email, name, role")
      .single();

    if (userError || !newUser) {
      console.error("[auth/register] User creation error:", userError);
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }

    createdUserId = newUser.id; // enables rollback below if anything after this fails

    // Create Account for NextAuth
    const { error: accountErr } = await supabase.from("Account").insert({
      id: uuidv4(),
      userId: newUser.id,
      type: "credentials",
      provider: "credentials",
      providerAccountId: newUser.email,
    });
    if (accountErr) throw new Error(`Account insert failed: ${accountErr.message}`);

    // Create Role-specific Profile
    if (data.role === "PATIENT") {
      const { error: profileErr } = await supabase.from("PatientProfile").insert({
        id: uuidv4(),
        userId: newUser.id,
        preferredLanguage: "en",
        createdAt: now,
        updatedAt: now,
      });
      if (profileErr) throw new Error(`PatientProfile insert failed: ${profileErr.message}`);
    } else if (data.role === "DOCTOR") {
      const { error: profileErr } = await supabase.from("DoctorProfile").insert({
        id: uuidv4(),
        userId: newUser.id,
        licenseNumber: `LIC-PENDING-${Date.now()}`,
        specializations: [],
        consultationFee: 0,
        isAvailableNow: false,
        createdAt: now,
        updatedAt: now,
      });
      if (profileErr) throw new Error(`DoctorProfile insert failed: ${profileErr.message}`);
    }

    // Welcome Notification (non-fatal — log but don't roll back the whole account for this)
    const { error: notifErr } = await supabase.from("Notification").insert({
      id: uuidv4(),
      userId: newUser.id,
      type: "SYSTEM",
      title: "Welcome to VitaConnect!",
      message: "Your account is ready. Book your first consultation or connect your health devices.",
      createdAt: now,
      updatedAt: now,
    });
    if (notifErr) {
      console.error("[auth/register] Notification insert failed (non-fatal):", notifErr);
    }

    console.log(`✅ ${data.role} registered successfully: ${data.email}`);

    return NextResponse.json(
      { user: { id: newUser.id, email: data.email, name: data.name, role: data.role } },
      { status: 201 }
    );
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }

    console.error("[auth/register]", err);

    // Roll back the orphaned User row so the email isn't stuck "half-registered"
    if (createdUserId) {
      await supabase.from("User").delete().eq("id", createdUserId);
      console.error(`[auth/register] rolled back User ${createdUserId} after failure`);
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}