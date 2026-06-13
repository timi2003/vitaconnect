// app/api/records/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CreateDocSchema = z.object({
  title:       z.string().min(1).max(200),
  type:        z.enum(["PRESCRIPTION","LAB_REPORT","IMAGING","DISCHARGE_SUMMARY","REFERRAL","VACCINATION","INSURANCE","CONSENT","OTHER"]),
  fileUrl:     z.string().url(),
  fileSize:    z.number().int().positive().optional(),
  mimeType:    z.string().optional(),
  description: z.string().optional(),
  tags:        z.array(z.string()).default([]),
  isShared:    z.boolean().default(false),
  date:        z.string().datetime().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type   = searchParams.get("type");
  const search = searchParams.get("search");

  const docs = await prisma.medicalDocument.findMany({
    where: {
      userId: session.user.id,
      ...(type ? { type: type as never } : {}),
      ...(search ? {
        OR: [
          { title:       { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { tags:        { has: search } },
        ],
      } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ documents: docs });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = CreateDocSchema.parse(body);

    const doc = await prisma.medicalDocument.create({
      data: {
        userId:       session.user.id,
        uploadedById: session.user.id,
        title:        data.title,
        type:         data.type,
        fileUrl:      data.fileUrl,
        fileSize:     data.fileSize,
        mimeType:     data.mimeType,
        description:  data.description,
        tags:         data.tags,
        isShared:     data.isShared,
        date:         data.date ? new Date(data.date) : undefined,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId:     session.user.id,
        action:     "DOCUMENT_UPLOADED",
        resource:   "medical_document",
        resourceId: doc.id,
        details:    { title: data.title, type: data.type },
      },
    });

    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const doc = await prisma.medicalDocument.findUnique({ where: { id } });
  if (!doc || doc.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.medicalDocument.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
