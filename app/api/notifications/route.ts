// app/api/notifications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get("unread") === "true";

  const supabase = createServerSupabaseClient();

  // ── Use the exact column names from your Prisma/Supabase schema ───────────
  // Prisma generates camelCase columns: userId, isRead, readAt, createdAt
  let query = supabase
    .from("Notification")          // capital N — matches Prisma model name
    .select("id, type, title, message, isRead, readAt, createdAt, data, channel")
    .eq("userId", session.user.id) // camelCase FK
    .order("createdAt", { ascending: false })
    .limit(50);

  if (unreadOnly) {
    query = query.eq("isRead", false);
  }

  const { data: notifications, error } = await query;

  if (error) {
    console.error("[notifications GET]", error.message, error.details);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }

  // Unread count as a separate cheap query
  const { count: unreadCount } = await supabase
    .from("Notification")
    .select("id", { count: "exact", head: true })
    .eq("userId", session.user.id)
    .eq("isRead", false);

  return NextResponse.json({
    notifications: notifications ?? [],
    unreadCount:   unreadCount  ?? 0,
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { ids?: string[]; markAll?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { ids, markAll } = body;
  const supabase = createServerSupabaseClient();
  const now = new Date().toISOString();

  if (markAll) {
    const { error } = await supabase
      .from("Notification")
      .update({ isRead: true, readAt: now })
      .eq("userId", session.user.id)
      .eq("isRead", false);

    if (error) {
      console.error("[notifications PATCH markAll]", error.message);
      return NextResponse.json({ error: "Failed to mark all as read" }, { status: 500 });
    }
  } else if (ids?.length) {
    const { error } = await supabase
      .from("Notification")
      .update({ isRead: true, readAt: now })
      .eq("userId", session.user.id)  // ownership check — never trust client ids alone
      .in("id", ids);

    if (error) {
      console.error("[notifications PATCH ids]", error.message);
      return NextResponse.json({ error: "Failed to mark notifications as read" }, { status: 500 });
    }
  } else {
    return NextResponse.json({ error: "Provide ids or markAll: true" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}