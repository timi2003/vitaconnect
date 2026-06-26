import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ProfileSchema = z.object({
  name:              z.string().min(2).max(100).optional(),
  phone:             z.string().optional(),
  dateOfBirth:       z.string().optional(),
  gender:            z.enum(["MALE", "FEMALE", "NON_BINARY", "PREFER_NOT_TO_SAY"]).optional(),
  bloodType:         z
    .enum([
      "A_POSITIVE", "A_NEGATIVE", "B_POSITIVE", "B_NEGATIVE",
      "AB_POSITIVE", "AB_NEGATIVE", "O_POSITIVE", "O_NEGATIVE", "UNKNOWN",
    ])
    .optional(),
  height:            z.coerce.number().positive().optional(),
  weight:            z.coerce.number().positive().optional(),
  allergies:         z.string().optional(),
  chronicConditions: z.string().optional(),
  emergencyName:     z.string().optional(),
  emergencyPhone:    z.string().optional(),
  emergencyRel:      z.string().optional(),
});

// ─── Shared select ────────────────────────────────────────────────────────────
// Keep this in one place so GET and PUT always return the same shape.
const USER_SELECT = {
  id:                true,
  name:              true,
  email:             true,
  image:             true,         // populated by OAuth providers
  phone:             true,
  role:              true,
  isVerified:        true,
  dateOfBirth:       true,
  gender:            true,
  bloodType:         true,
  height:            true,
  weight:            true,
  allergies:         true,
  chronicConditions: true,
  emergencyContact:  true,
  timezone:          true,
  locale:            true,
  createdAt:         true,
  // Include the role-specific profile so the UI can show insurance info etc.
  patientProfile: {
    select: {
      insuranceProvider: true,
      insurancePolicyNo: true,
      insuranceGroupNo:  true,
      preferredLanguage: true,
    },
  },
  doctorProfile: {
    select: {
      licenseNumber:     true,
      specializations:   true,
      consultationFee:   true,
      rating:            true,
      totalReviews:      true,
      isAvailableNow:    true,
      hospital:          true,
      department:        true,
    },
  },
} as const;

// ─── GET /api/user/profile ────────────────────────────────────────────────────
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: USER_SELECT,
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user });
}

// ─── PUT /api/user/profile ────────────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = ProfileSchema.parse(body);

    // Build update payload — only include fields that were actually sent
    const userUpdate: Record<string, unknown> = {};

    if (data.name        !== undefined) userUpdate.name        = data.name;
    if (data.phone       !== undefined) userUpdate.phone       = data.phone;
    if (data.gender      !== undefined) userUpdate.gender      = data.gender;
    if (data.bloodType   !== undefined) userUpdate.bloodType   = data.bloodType;
    if (data.height      !== undefined) userUpdate.height      = data.height;
    if (data.weight      !== undefined) userUpdate.weight      = data.weight;

    if (data.dateOfBirth !== undefined) {
      userUpdate.dateOfBirth = data.dateOfBirth
        ? new Date(data.dateOfBirth)
        : null;
    }

    // Comma-separated strings → trimmed String[] (matches Prisma schema)
    if (data.allergies !== undefined) {
      userUpdate.allergies = data.allergies
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (data.chronicConditions !== undefined) {
      userUpdate.chronicConditions = data.chronicConditions
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    // Emergency contact → JSON column
    if (
      data.emergencyName  !== undefined ||
      data.emergencyPhone !== undefined ||
      data.emergencyRel   !== undefined
    ) {
      // Merge with existing value so a partial update doesn't wipe other fields
      const existing = await prisma.user.findUnique({
        where:  { id: session.user.id },
        select: { emergencyContact: true },
      });
      const prev = (existing?.emergencyContact ?? {}) as Record<string, string>;

      userUpdate.emergencyContact = {
        name:         data.emergencyName  ?? prev.name         ?? "",
        phone:        data.emergencyPhone ?? prev.phone        ?? "",
        relationship: data.emergencyRel   ?? prev.relationship ?? "",
      };
    }

    const updated = await prisma.user.update({
      where:  { id: session.user.id },
      data:   userUpdate,
      select: USER_SELECT,
    });

    // Audit trail
    await prisma.auditLog.create({
      data: {
        userId:     session.user.id,
        action:     "UPDATE_PROFILE",
        resource:   "user",
        resourceId: session.user.id,
        details:    { fields: Object.keys(userUpdate) },
      },
    });

    return NextResponse.json({ user: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error("[api/user/profile PUT]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}