// app/api/messages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Pusher from "pusher";
import { z } from "zod";

const pusher = new Pusher({
  appId:   process.env.PUSHER_APP_ID!,
  key:     process.env.PUSHER_KEY!,
  secret:  process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER ?? "us2",
  useTLS:  true,
});

const SendSchema = z.object({
  conversationId: z.string().optional(),
  recipientId:    z.string().optional(),
  content:        z.string().min(1).max(4000),
  type:           z.enum(["TEXT","IMAGE","FILE","AUDIO"]).default("TEXT"),
  attachments:    z.array(z.object({
    url:  z.string().url(),
    name: z.string(),
    size: z.number(),
    type: z.string(),
  })).optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get("conversationId");

  if (conversationId) {
    // Verify user is a participant
    const participant = await prisma.conversationParticipant.findFirst({
      where: { conversationId, userId: session.user.id },
    });
    if (!participant) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const messages = await prisma.message.findMany({
      where: { conversationId, isDeleted: false },
      include: { sender: { select: { id: true, name: true, image: true } } },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    // Mark as read
    await prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId: session.user.id } },
      data: { lastReadAt: new Date() },
    });

    return NextResponse.json({ messages });
  }

  // Return conversations list
  const convs = await prisma.conversation.findMany({
    where: {
      participants: { some: { userId: session.user.id } },
      isActive: true,
    },
    include: {
      participants: {
        include: { },
        where: { userId: { not: session.user.id } },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ conversations: convs });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = SendSchema.parse(body);

    let conversationId = data.conversationId;

    // Auto-create conversation if recipientId given
    if (!conversationId && data.recipientId) {
      // Look for existing DM
      const existing = await prisma.conversation.findFirst({
        where: {
          type: "DIRECT",
          participants: {
            every: {
              userId: { in: [session.user.id, data.recipientId] },
            },
          },
        },
        include: { participants: true },
      });

      if (existing && existing.participants.length === 2) {
        conversationId = existing.id;
      } else {
        const conv = await prisma.conversation.create({
          data: {
            type: "DIRECT",
            participants: {
              createMany: {
                data: [
                  { userId: session.user.id },
                  { userId: data.recipientId },
                ],
              },
            },
          },
        });
        conversationId = conv.id;
      }
    }

    if (!conversationId) {
      return NextResponse.json({ error: "conversationId or recipientId required" }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId:    session.user.id,
        content:     data.content,
        type:        data.type,
        attachments: data.attachments as never,
      },
      include: {
        sender: { select: { id: true, name: true, image: true } },
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Push real-time event to conversation channel
    await pusher.trigger(
      `conversation-${conversationId}`,
      "new-message",
      {
        id:        message.id,
        content:   message.content,
        senderId:  message.senderId,
        senderName:message.sender.name,
        createdAt: message.createdAt,
        type:      message.type,
      }
    );

    // Push notification to recipient
    const participants = await prisma.conversationParticipant.findMany({
      where: { conversationId, userId: { not: session.user.id } },
    });

    for (const p of participants) {
      await pusher.trigger(`private-notifications`, "new-notification", {
        type: "NEW_MESSAGE",
        message: `New message from ${session.user.name}`,
      });

      await prisma.notification.create({
        data: {
          userId:  p.userId,
          type:    "NEW_MESSAGE",
          title:   `Message from ${session.user.name}`,
          message: data.content.slice(0, 100),
          data: { conversationId, messageId: message.id },
        },
      });
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
