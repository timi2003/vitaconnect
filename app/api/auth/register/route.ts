// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const RegisterSchema = z.object({
  name:        z.string().min(2).max(100),
  email:       z.string().email(),
  password:    z.string().min(8).max(72),
  phone:       z.string().optional(),
  role:        z.enum(["PATIENT", "DOCTOR"]).default("PATIENT"),
  dateOfBirth: z.string().optional(),
  gender:      z.enum(["MALE","FEMALE","NON_BINARY","PREFER_NOT_TO_SAY",""])
                 .optional().transform((v) => v || undefined),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = RegisterSchema.parse(body);

    // Check duplicate
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        name:        data.name,
        email:       data.email,
        passwordHash,
        phone:       data.phone,
        role:        data.role,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        gender:      data.gender as never,
      },
      select: { id: true, email: true, name: true, role: true },
    });

    // === FIXED: Create Account record for NextAuth Credentials ===
    await prisma.account.create({
      data: {
        userId:            user.id,
        type:              "credentials",
        provider:          "credentials",
        providerAccountId: user.email,           // usually email for credentials
        access_token:      null,
        refresh_token:     null,
      },
    });

    // Create role-specific profile
    if (data.role === "PATIENT") {
      await prisma.patientProfile.create({ data: { userId: user.id } });
    } else if (data.role === "DOCTOR") {
      await prisma.doctorProfile.create({ 
        data: { 
          userId: user.id,
          licenseNumber: `LIC-${Date.now()}`,
          specializations: [],
          consultationFee: 50,
          isAvailableNow: true,
        } 
      });
    }

    // Welcome notification
    await prisma.notification.create({
      data: {
        userId:  user.id,
        type:    "SYSTEM",
        title:   "Welcome to VitaConnect!",
        message: "Your account is ready. Book your first consultation or connect your health devices.",
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error("[auth/register]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}