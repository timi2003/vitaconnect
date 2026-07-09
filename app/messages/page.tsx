"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Send, Search, Paperclip, Image as ImageIcon,
  Phone, Video, MoreVertical, BadgeCheck, Smile, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Pusher from "pusher-js";

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  sender?: { id: string; name: string; image: string | null };
}

interface Conv {
  id: string;
  otherUser: { id: string; name: string; image: string | null };
  lastMessage: string;
  lastTime: string;
}

interface DoctorResult {
  id: string;
  name: string;
  image: string | null;
  specialty: string;
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?";
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default function MessagesPage() {
  const { data: session } = useSession();
  const myId = session?.user?.id;

  const [conversations, setConversations] = useState<Conv[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pendingRecipient, setPendingRecipient] = useState<DoctorResult | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [doctorResults, setDoctorResults] = useState<DoctorResult[]>([]);
  const [searchingDoctors, setSearchingDoctors] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const pusherRef = useRef<Pusher | null>(null);

  // ── Search doctors to start a new conversation with ────────────────────────
  useEffect(() => {
    if (!search.trim()) {
      setDoctorResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setSearchingDoctors(true);
      try {
        const res = await fetch(`/api/doctors?search=${encodeURIComponent(search.trim())}`);
        if (!res.ok) throw new Error("Doctor search failed");
        const { doctors } = await res.json();
        setDoctorResults(
          (doctors || []).map((d: any) => ({
            id: d.id,
            name: d.name,
            image: d.image ?? null,
            specialty: d.doctorProfile?.specializations?.[0] ?? "Doctor",
          }))
        );
      } catch (err) {
        console.error("[MessagesPage] doctor search failed:", err);
      } finally {
        setSearchingDoctors(false);
      }
    }, 300); // debounce so we don't fire a request on every keystroke

    return () => clearTimeout(timeout);
  }, [search]);

  function startNewConversation(doctor: DoctorResult) {
    setPendingRecipient(doctor);
    setActiveId(null);
    setMessages([]);
    setSearch("");
    setDoctorResults([]);
  }

  // ── Load conversation list ────────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    if (!myId) return;
    try {
      const res = await fetch("/api/messages");
      if (!res.ok) throw new Error("Failed to load conversations");
      const { conversations: raw } = await res.json();

      const transformed: Conv[] = (raw || []).map((c: any) => {
        const other = (c.participants || []).find((p: any) => p.userId !== myId)?.user;
        const lastMsg = (c.messages || [])[0];
        return {
          id: c.id,
          otherUser: other ?? { id: "", name: "Unknown", image: null },
          lastMessage: lastMsg?.content ?? "No messages yet",
          lastTime: lastMsg?.createdAt ? formatTime(lastMsg.createdAt) : "",
        };
      });

      setConversations(transformed);
      if (!activeId && transformed.length > 0) setActiveId(transformed[0].id);
    } catch (err) {
      console.error("[MessagesPage] load conversations failed:", err);
    } finally {
      setLoadingConvs(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myId]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // ── Load messages for the active conversation ─────────────────────────────
  useEffect(() => {
    if (!activeId) return;
    setLoadingMsgs(true);
    fetch(`/api/messages?conversationId=${activeId}`)
      .then((res) => res.json())
      .then((data) => setMessages(data.messages || []))
      .catch((err) => console.error("[MessagesPage] load messages failed:", err))
      .finally(() => setLoadingMsgs(false));
  }, [activeId]);

  // ── Subscribe to real-time updates for the active conversation ────────────
  useEffect(() => {
    if (!activeId) return;

    if (!pusherRef.current) {
      pusherRef.current = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? "us2",
      });
    }

    const channel = pusherRef.current.subscribe(`conversation-${activeId}`);
    channel.bind("new-message", (incoming: Message) => {
      setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]));
      loadConversations();
    });

    return () => {
      channel.unbind("new-message");
      pusherRef.current?.unsubscribe(`conversation-${activeId}`);
    };
  }, [activeId, loadConversations]);

  useEffect(() => {
    return () => { pusherRef.current?.disconnect(); };
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function handleSend() {
    if (!draft.trim() || sending) return;
    if (!activeId && !pendingRecipient) return;

    const content = draft.trim();
    setDraft("");
    setSending(true);
    try {
      const body = activeId
        ? { conversationId: activeId, content }
        : { recipientId: pendingRecipient!.id, content };

      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to send message");
      const { message } = await res.json();

      if (!activeId) {
        // First message of a brand-new conversation — now it actually exists
        setActiveId(message.conversationId);
        setPendingRecipient(null);
      }

      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
      loadConversations();
    } catch (err) {
      console.error("[MessagesPage] send failed:", err);
      setDraft(content);
    } finally {
      setSending(false);
    }
  }

  const activeConv = conversations.find((c) => c.id === activeId) ?? null;
  const headerUser = activeConv?.otherUser ?? pendingRecipient ?? null;
  const filtered = conversations.filter((c) =>
    c.otherUser.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="page-enter h-[calc(100vh-8rem)] flex gap-0 rounded-2xl overflow-hidden border border-subtle glass">

        {/* ── Sidebar ── */}
        <div className="w-80 flex-shrink-0 border-r border-subtle flex flex-col hidden sm:flex">
          <div className="p-4 border-b border-subtle">
            <h2 className="font-display font-bold text-primary mb-3">Messages</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
              <input className="input pl-9 py-2 text-sm h-9"
                placeholder="Search conversations or doctors…"
                value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            {search.trim() && (
              <div className="mt-2 border border-subtle rounded-xl overflow-hidden">
                {searchingDoctors && (
                  <div className="flex justify-center py-3">
                    <Loader2 className="w-4 h-4 animate-spin text-muted" />
                  </div>
                )}
                {!searchingDoctors && doctorResults.length === 0 && (
                  <p className="text-xs text-muted text-center py-3">No doctors found.</p>
                )}
                {!searchingDoctors && doctorResults.map((d) => (
                  <button key={d.id} onClick={() => startNewConversation(d)}
                    className="w-full flex items-center gap-2.5 p-2.5 text-left hover:bg-surface-800/40 transition-colors">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-xs flex-shrink-0 bg-brand-600/30 text-brand-300">
                      {initials(d.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-display font-semibold text-primary truncate">{d.name}</p>
                      <p className="text-xs text-muted truncate">{d.specialty}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-subtle">
            {loadingConvs && (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted" />
              </div>
            )}
            {!loadingConvs && filtered.length === 0 && (
              <p className="text-xs text-muted text-center py-8">No conversations yet.</p>
            )}
            {filtered.map((c) => (
              <button key={c.id} onClick={() => setActiveId(c.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-4 text-left transition-all duration-200",
                  activeId === c.id
                    ? "bg-brand-500/10 border-r-2 border-r-brand-500"
                    : "hover:bg-surface-800/40"
                )}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-sm flex-shrink-0 bg-brand-600/30 text-brand-300">
                  {initials(c.otherUser.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-display font-semibold text-primary truncate">{c.otherUser.name}</p>
                    <span className="text-xs text-muted font-mono flex-shrink-0 ml-2">{c.lastTime}</span>
                  </div>
                  <p className="text-xs text-muted truncate">{c.lastMessage}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Chat area ── */}
        <div className="flex-1 flex flex-col min-w-0">
          {!activeConv && !pendingRecipient ? (
            <div className="flex-1 flex items-center justify-center text-muted text-sm">
              {loadingConvs ? <Loader2 className="w-5 h-5 animate-spin" /> : "Select a conversation or search for a doctor"}
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-subtle flex-shrink-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-display font-bold text-xs flex-shrink-0 bg-brand-600/30 text-brand-300">
                  {initials(headerUser!.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-display font-bold text-primary">{headerUser!.name}</p>
                    <BadgeCheck className="w-3.5 h-3.5 text-brand-400" />
                  </div>
                  {pendingRecipient && (
                    <p className="text-xs text-muted">New conversation</p>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button className="p-2 rounded-xl hover:bg-surface-800 text-muted hover:text-secondary transition-colors">
                    <Phone className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-xl hover:bg-surface-800 text-muted hover:text-secondary transition-colors">
                    <Video className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-xl hover:bg-surface-800 text-muted hover:text-secondary transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {pendingRecipient && messages.length === 0 && (
                  <p className="text-xs text-muted text-center py-8">
                    Say hello to {pendingRecipient.name} to start the conversation.
                  </p>
                )}
                {loadingMsgs && (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-muted" />
                  </div>
                )}
                {!loadingMsgs && messages.map((msg) => {
                  const isMe = msg.senderId === myId;
                  return (
                    <div key={msg.id}
                      className={cn("flex gap-2 max-w-[80%]", isMe ? "ml-auto flex-row-reverse" : "")}>
                      {!isMe && (
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center font-display font-bold text-xs flex-shrink-0 mt-auto bg-brand-600/30 text-brand-300">
                          {initials(headerUser!.name)}
                        </div>
                      )}
                      <div>
                        <div className={cn(
                          "px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                          isMe
                            ? "bg-brand-500 text-white rounded-tr-sm"
                            : "bg-surface-800/80 text-secondary border border-subtle rounded-tl-sm"
                        )}>
                          {msg.content}
                        </div>
                        <p className={cn("text-xs text-muted mt-1 font-mono", isMe ? "text-right" : "")}>
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>

              {/* Input */}
              <div className="px-5 py-4 border-t border-subtle flex-shrink-0">
                <div className="flex items-center gap-2">
                  <button className="p-2 text-muted hover:text-secondary rounded-xl hover:bg-surface-800 transition-colors">
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-muted hover:text-secondary rounded-xl hover:bg-surface-800 transition-colors">
                    <ImageIcon className="w-4 h-4" />
                  </button>
                  <input
                    className="input flex-1 py-2.5 text-sm"
                    placeholder={pendingRecipient ? `Message ${pendingRecipient.name}…` : "Type a message…"}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  />
                  <button className="p-2 text-muted hover:text-secondary rounded-xl hover:bg-surface-800 transition-colors">
                    <Smile className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={!draft.trim() || sending}
                    className={cn(
                      "p-2.5 rounded-xl transition-all duration-200",
                      draft.trim() && !sending
                        ? "bg-brand-500 text-white hover:bg-brand-400 shadow-glow-sm"
                        : "bg-surface-800 text-muted cursor-not-allowed"
                    )}>
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}