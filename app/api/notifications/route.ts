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

  let query = supabase
    .from("notifications")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (unreadOnly) {
    query = query.eq("is_read", false);
  }

  const { data: notifications, error } = await query;

  if (error) {
    console.error("[notifications GET]", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }

  // Get unread count
  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("*", { count: 'exact', head: true })
    .eq("user_id", session.user.id)
    .eq("is_read", false);

  return NextResponse.json({ 
    notifications: notifications || [], 
    unreadCount: unreadCount || 0 
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ids, markAll } = await req.json();
  const supabase = createServerSupabaseClient();

  if (markAll) {
    const { error } = await supabase
      .from("notifications")
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq("user_id", session.user.id)
      .eq("is_read", false);

    if (error) {
      return NextResponse.json({ error: "Failed to mark all as read" }, { status: 500 });
    }
  } 
  else if (ids?.length) {
    const { error } = await supabase
      .from("notifications")
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq("user_id", session.user.id)
      .in("id", ids);

    if (error) {
      return NextResponse.json({ error: "Failed to mark notifications as read" }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}