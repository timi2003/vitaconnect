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
  gender:      z
    .enum(["MALE", "FEMALE", "NON_BINARY", "PREFER_NOT_TO_SAY", ""])
    .optional()
    .transform((v) => v || undefined),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = RegisterSchema.parse(body);

    // Check duplicate before entering the transaction
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    // ── Single transaction: user + account + role profile + notification ──────
    // If any step fails nothing is partially written to the DB.
    const user = await prisma.$transaction(async (tx) => {
      // 1. Core User row — write every field that registration collects so the
      //    profile page can read them back immediately without a second update.
      const newUser = await tx.user.create({
        data: {
          name:        data.name,
          email:       data.email,
          passwordHash,
          phone:       data.phone        ?? null,
          role:        data.role,
          dateOfBirth: data.dateOfBirth  ? new Date(data.dateOfBirth) : null,
          gender:      (data.gender as never) ?? null,
          // Sensible defaults so profile reads are never null for these
          allergies:         [],
          chronicConditions: [],
          timezone:  "UTC",
          locale:    "en",
        },
        select: { id: true, email: true, name: true, role: true },
      });

      // 2. Credentials account record (required by NextAuth)
      await tx.account.create({
        data: {
          userId:            newUser.id,
          type:              "credentials",
          provider:          "credentials",
          providerAccountId: newUser.email,
        },
      });

      // 3. Role-specific profile
      if (data.role === "PATIENT") {
        await tx.patientProfile.create({
          data: {
            userId:           newUser.id,
            preferredLanguage: "en",
          },
        });
      } else if (data.role === "DOCTOR") {
        await tx.doctorProfile.create({
          data: {
            userId:          newUser.id,
            licenseNumber:   `LIC-PENDING-${Date.now()}`,  // doctor fills in real number later
            specializations: [],
            consultationFee: 0,
            isAvailableNow:  false,
          },
        });
      }

      // 4. Welcome notification
      await tx.notification.create({
        data: {
          userId:  newUser.id,
          type:    "SYSTEM",
          title:   "Welcome to VitaConnect!",
          message:
            "Your account is ready. Book your first consultation or connect your health devices.",
        },
      });

      return newUser;
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