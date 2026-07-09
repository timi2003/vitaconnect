// app/api/messages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import Pusher from "pusher";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER ?? "us2",
  useTLS: true,
});

const SendSchema = z.object({
  conversationId: z.string().optional(),
  recipientId: z.string().optional(),
  content: z.string().min(1).max(4000),
  type: z.enum(["TEXT", "IMAGE", "FILE", "AUDIO"]).default("TEXT"),
  attachments: z
    .array(z.object({ url: z.string().url(), name: z.string(), size: z.number(), type: z.string() }))
    .optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get("conversationId");
  const supabase = createServerSupabaseClient();

  // ── Single conversation: return its messages ──────────────────────────────
  if (conversationId) {
    const { data: participant } = await supabase
      .from("ConversationParticipant")
      .select("id")
      .eq("conversationId", conversationId)
      .eq("userId", session.user.id)
      .maybeSingle();

    if (!participant) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: messages, error } = await supabase
      .from("Message")
      .select(`*, sender:User(id, name, image)`)
      .eq("conversationId", conversationId)
      .eq("isDeleted", false)
      .order("createdAt", { ascending: true })
      .limit(100);

    if (error) {
      console.error("[messages GET]", error);
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
    }

    // Mark as read
    await supabase
      .from("ConversationParticipant")
      .update({ lastReadAt: new Date().toISOString() })
      .eq("conversationId", conversationId)
      .eq("userId", session.user.id);

    return NextResponse.json({ messages: messages || [] });
  }

  // ── No conversationId: return the list of conversations I'm in ────────────
  const { data: myParticipation, error: partErr } = await supabase
    .from("ConversationParticipant")
    .select("conversationId")
    .eq("userId", session.user.id);

  if (partErr) {
    console.error("[messages GET] participant lookup", partErr);
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }

  const conversationIds = (myParticipation || []).map((p) => p.conversationId);
  if (conversationIds.length === 0) {
    return NextResponse.json({ conversations: [] });
  }

  const { data: convs, error } = await supabase
    .from("Conversation")
    .select(`
      id, type, title, isActive, createdAt, updatedAt,
      participants:ConversationParticipant (
        userId,
        lastReadAt,
        user:User (id, name, image)
      ),
      messages:Message (
        id, content, createdAt, senderId,
        sender:User (name)
      )
    `)
    .in("id", conversationIds)
    .eq("isActive", true)
    .order("updatedAt", { ascending: false })
    .order("createdAt", { ascending: false, foreignTable: "messages" })
    .limit(1, { foreignTable: "messages" });

  if (error) {
    console.error("[messages GET] conversations", error);
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }

  return NextResponse.json({ conversations: convs || [] });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = SendSchema.parse(body);
    const supabase = createServerSupabaseClient();
    const now = new Date().toISOString();

    let conversationId = data.conversationId;

    // ── Auto-create/find a DIRECT conversation if only recipientId was given ──
    if (!conversationId && data.recipientId) {
      const { data: mine } = await supabase
        .from("ConversationParticipant")
        .select("conversationId")
        .eq("userId", session.user.id);

      const myConvIds = (mine || []).map((r) => r.conversationId);

      if (myConvIds.length > 0) {
        const { data: shared } = await supabase
          .from("ConversationParticipant")
          .select("conversationId, conversation:Conversation!inner(type)")
          .eq("userId", data.recipientId)
          .eq("conversation.type", "DIRECT")
          .in("conversationId", myConvIds);

        if (shared && shared.length > 0) {
          conversationId = shared[0].conversationId;
        }
      }

      if (!conversationId) {
        const newConvId = uuidv4();
        const { data: newConv, error: convErr } = await supabase
          .from("Conversation")
          .insert({ id: newConvId, type: "DIRECT", isActive: true, createdAt: now, updatedAt: now })
          .select()
          .single();

        if (convErr || !newConv) {
          throw new Error(`Conversation creation failed: ${convErr?.message}`);
        }

        const { error: partErr } = await supabase.from("ConversationParticipant").insert([
          { id: uuidv4(), conversationId: newConv.id, userId: session.user.id, joinedAt: now },
          { id: uuidv4(), conversationId: newConv.id, userId: data.recipientId, joinedAt: now },
        ]);
        if (partErr) throw new Error(`ConversationParticipant creation failed: ${partErr.message}`);

        conversationId = newConv.id;
      }
    }

    if (!conversationId) {
      return NextResponse.json({ error: "conversationId or recipientId required" }, { status: 400 });
    }

    // ── Confirm the sender is actually a participant ──────────────────────
    const { data: participant } = await supabase
      .from("ConversationParticipant")
      .select("id")
      .eq("conversationId", conversationId)
      .eq("userId", session.user.id)
      .maybeSingle();

    if (!participant) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: message, error } = await supabase
      .from("Message")
      .insert({
        id: uuidv4(),
        conversationId,
        senderId: session.user.id,
        content: data.content,
        type: data.type,
        attachments: data.attachments || [],
        createdAt: now,
      })
      .select(`*, sender:User(id, name, image)`)
      .single();

    if (error || !message) throw new Error(`Message insert failed: ${error?.message}`);

    await supabase.from("Conversation").update({ updatedAt: now }).eq("id", conversationId);

    // Real-time push to the conversation itself (for anyone with it open)
    await pusher.trigger(`conversation-${conversationId}`, "new-message", {
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      senderName: message.sender?.name,
      createdAt: message.createdAt,
      type: message.type,
    });

    // ── Notify every other participant, even if they don't have the chat open ──
    // Wrapped separately: a failure here must never make the client think the
    // message itself failed to send, since it's already committed above.
    try {
      const { data: participants } = await supabase
        .from("ConversationParticipant")
        .select("userId")
        .eq("conversationId", conversationId)
        .neq("userId", session.user.id);

      for (const p of participants || []) {
        const { data: notification, error: notifErr } = await supabase
          .from("Notification")
          .insert({
            id: uuidv4(),
            userId: p.userId,
            type: "MESSAGE",
            title: `New message from ${message.sender?.name ?? "someone"}`,
            message: message.content.slice(0, 140),
            isRead: false,
            createdAt: now,
          })
          .select()
          .single();

        if (notifErr) {
          console.error("[messages POST] notification insert failed (non-fatal):", notifErr);
          continue;
        }

        if (notification) {
          await pusher.trigger(`user-${p.userId}`, "new-notification", notification);
        }
      }
    } catch (notifyErr) {
      console.error("[messages POST] notification step failed (non-fatal):", notifyErr);
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error("[messages POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}