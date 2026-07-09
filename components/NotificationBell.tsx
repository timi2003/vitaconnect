"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Bell } from "lucide-react";
import Link from "next/link";
import Pusher from "pusher-js";

export function NotificationBell() {
  const { data: session } = useSession();
  const myId = session?.user?.id;
  const [unreadCount, setUnreadCount] = useState(0);
  const pusherRef = useRef<Pusher | null>(null);

  const loadCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?unread=true");
      if (!res.ok) return;
      const data = await res.json();
      setUnreadCount(data.unreadCount ?? 0);
    } catch (err) {
      console.error("[NotificationBell] load failed:", err);
    }
  }, []);

  useEffect(() => { loadCount(); }, [loadCount]);

  useEffect(() => {
    if (!myId) return;
    if (!pusherRef.current) {
      pusherRef.current = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? "us2",
      });
    }
    const channel = pusherRef.current.subscribe(`user-${myId}`);
    channel.bind("new-notification", () => setUnreadCount((c) => c + 1));
    return () => {
      channel.unbind("new-notification");
      pusherRef.current?.unsubscribe(`user-${myId}`);
    };
  }, [myId]);

  return (
    <Link href="/notifications" className="relative p-2 rounded-xl hover:bg-surface-800 transition-colors">
      <Bell className="w-5 h-5 text-secondary" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500
                         text-white text-[10px] font-bold flex items-center justify-center">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}