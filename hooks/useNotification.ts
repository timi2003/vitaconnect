// hooks/useNotifications.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useEffect } from "react";
import Pusher from "pusher-js";

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export function useNotifications() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await axios.get<{
        notifications: Notification[];
        unreadCount: number;
      }>("/api/notifications");
      return data;
    },
    staleTime: 30_000,
    refetchInterval: 60_000, // poll every minute as fallback
  });

  // ── Pusher real-time subscription ──────────────────────────────────────
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_PUSHER_KEY) return;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? "us2",
    });

    // Subscribe to user-specific channel (set up server-side)
    const channel = pusher.subscribe("private-notifications");

    channel.bind("new-notification", () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe("private-notifications");
    };
  }, [qc]);

  const markRead = useMutation({
    mutationFn: async (ids: string[]) => {
      await axios.patch("/api/notifications", { ids });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await axios.patch("/api/notifications", { markAll: true });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return {
    notifications: query.data?.notifications ?? [],
    unreadCount:   query.data?.unreadCount ?? 0,
    isLoading:     query.isLoading,
    markRead:      markRead.mutate,
    markAllRead:   markAllRead.mutate,
  };
}