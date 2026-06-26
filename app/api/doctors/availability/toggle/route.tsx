// app/api/doctor/availability/toggle/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const Schema = z.object({
  isAvailableNow: z.boolean(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if ((session.user as { role?: string }).role !== "DOCTOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { isAvailableNow } = Schema.parse(await req.json());

    const updated = await prisma.doctorProfile.update({
      where:  { userId: session.user.id },
      data:   { isAvailableNow },
      select: { isAvailableNow: true },
    });

    return NextResponse.json({ isAvailableNow: updated.isAvailableNow });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error("[api/doctor/availability/toggle]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}