// app/api/doctors/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const specialty  = searchParams.get("specialty");
  const search     = searchParams.get("search");
  const available  = searchParams.get("available") === "true";
  const minRating  = parseFloat(searchParams.get("minRating") ?? "0");
  const maxFee     = parseFloat(searchParams.get("maxFee") ?? "99999");
  const page       = parseInt(searchParams.get("page") ?? "1", 10);
  const limit      = parseInt(searchParams.get("limit") ?? "20", 10);

  const doctors = await prisma.user.findMany({
    where: {
      role: "DOCTOR",
      isActive: true,
      doctorProfile: {
        ...(specialty ? { specializations: { has: specialty } } : {}),
        ...(available ? { isAvailableNow: true } : {}),
        rating: { gte: minRating },
        consultationFee: { lte: maxFee },
      },
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { doctorProfile: { bio: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    select: {
      id: true, name: true, image: true,
      doctorProfile: {
        select: {
          specializations: true, subSpecializations: true,
          experience: true, consultationFee: true, followUpFee: true,
          rating: true, totalReviews: true, totalConsultations: true,
          isAvailableNow: true, bio: true, languages: true,
          availableFor: true, hospital: true, qualifications: true,
        },
      },
    },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { doctorProfile: { rating: "desc" } },
  });

  const total = await prisma.user.count({
    where: { role: "DOCTOR", isActive: true },
  });

  return NextResponse.json({ doctors, total, page, limit });
}
