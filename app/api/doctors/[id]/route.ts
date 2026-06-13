// app/api/doctors/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: params.id, role: "DOCTOR", isActive: true },
    select: {
      id: true, name: true, image: true,
      doctorProfile: {
        select: {
          specializations:    true,
          subSpecializations: true,
          experience:         true,
          consultationFee:    true,
          followUpFee:        true,
          rating:             true,
          totalReviews:       true,
          totalConsultations: true,
          bio:                true,
          languages:          true,
          availableFor:       true,
          hospital:           true,
          qualifications:     true,
          isAvailableNow:     true,
          availabilitySlots: {
            where: { isAvailable: true },
            select: {
              dayOfWeek:    true,
              startTime:    true,
              endTime:      true,
              slotDuration: true,
              specificDate: true,
            },
          },
        },
      },
    },
  });

  if (!user || !user.doctorProfile) {
    return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
  }

  const { availabilitySlots, ...profileRest } = user.doctorProfile;

  return NextResponse.json({
    doctor: { id: user.id, name: user.name, image: user.image, doctorProfile: profileRest },
    slots: availabilitySlots,
  });
}