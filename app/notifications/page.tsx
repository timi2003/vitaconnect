"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { Bell, Check, CheckCheck, Loader2, MessageSquare, Activity, Calendar, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import Pusher from "pusher-js";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const ICONS: Record<string, any> = {
  MESSAGE: MessageSquare,
  HEALTH_ALERT: AlertTriangle,
  APPOINTMENT: Calendar,
  SYSTEM: Bell,
  VITALS: Activity,
};

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function NotificationsPage() {
  const { data: session } = useSession();
  const myId = session?.user?.id;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const pusherRef = useRef<Pusher | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/notifications${filter === "unread" ? "?unread=true" : ""}`);
      if (!res.ok) throw new Error("Failed to load notifications");
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error("[NotificationsPage] load failed:", err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  // ── Real-time: new notifications appear instantly without a refresh ───────
  useEffect(() => {
    if (!myId) return;
    if (!pusherRef.current) {
      pusherRef.current = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? "us2",
      });
    }
    const channel = pusherRef.current.subscribe(`user-${myId}`);
    channel.bind("new-notification", (n: Notification) => {
      setNotifications((prev) => (prev.some((x) => x.id === n.id) ? prev : [n, ...prev]));
    });
    return () => {
      channel.unbind("new-notification");
      pusherRef.current?.unsubscribe(`user-${myId}`);
    };
  }, [myId]);

  async function markRead(ids: string[]) {
    setNotifications((prev) => prev.map((n) => (ids.includes(n.id) ? { ...n, isRead: true } : n)));
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
    } catch (err) {
      console.error("[NotificationsPage] markRead failed:", err);
    }
  }

  async function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
    } catch (err) {
      console.error("[NotificationsPage] markAllRead failed:", err);
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-2xl mx-auto space-y-4 py-6 px-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-primary">Notifications</h1>
          <p className="text-sm text-muted mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead}
            className="btn-ghost text-xs py-2 px-3 flex items-center gap-1.5">
            <CheckCheck className="w-3.5 h-3.5" /> Mark all read
          </button>
        )}
      </div>

      <div className="flex gap-2">
        {(["all", "unread"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1.5 rounded-xl border text-xs font-display font-medium transition-all",
              filter === f
                ? "border-brand-500/40 bg-brand-500/12 text-brand-300"
                : "border-subtle text-muted hover:border-brand-500/25"
            )}>
            {f === "all" ? "All" : "Unread"}
          </button>
        ))}
      </div>

      <div className="glass border border-subtle rounded-2xl divide-y divide-subtle overflow-hidden">
        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-muted" />
          </div>
        )}
        {!loading && notifications.length === 0 && (
          <p className="text-sm text-muted text-center py-12">No notifications yet.</p>
        )}
        {!loading && notifications.map((n) => {
          const Icon = ICONS[n.type] ?? Bell;
          return (
            <button key={n.id}
              onClick={() => !n.isRead && markRead([n.id])}
              className={cn(
                "w-full flex items-start gap-3 p-4 text-left transition-colors",
                n.isRead ? "opacity-60" : "hover:bg-surface-800/40"
              )}>
              <div className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                n.isRead ? "bg-surface-700 text-muted" : "bg-brand-500/15 text-brand-300"
              )}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-display font-semibold text-primary">{n.title}</p>
                <p className="text-xs text-muted mt-0.5">{n.message}</p>
                <p className="text-xs text-muted font-mono mt-1">{timeAgo(n.createdAt)}</p>
              </div>
              {!n.isRead && (
                <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0 mt-1.5" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}