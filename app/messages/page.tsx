"use client";

import { useState, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Send, Search, Paperclip, Image as ImageIcon,
  Phone, Video, MoreVertical, Circle, BadgeCheck, Smile,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  sender: "me" | "them";
  content: string;
  time: string;
  read?: boolean;
}

interface Conversation {
  id: string;
  name: string;
  specialty: string;
  avatar: string;
  avatarBg: string;
  online: boolean;
  lastMessage: string;
  lastTime: string;
  unread: number;
  messages: Message[];
}

const CONVERSATIONS: Conversation[] = [
  {
    id: "c1", name: "Dr. Sarah Chen", specialty: "Cardiologist",
    avatar: "SC", avatarBg: "bg-brand-600/30 text-brand-300",
    online: true, lastMessage: "See you at 2:30 PM today!", lastTime: "10:24 AM", unread: 2,
    messages: [
      { id: "m1", sender: "them", content: "Hello Alex! I've reviewed your latest ECG results.", time: "9:15 AM" },
      { id: "m2", sender: "me",   content: "Thank you doctor. I was concerned about the irregular readings.", time: "9:22 AM" },
      { id: "m3", sender: "them", content: "The irregularity is mild. I'd like to discuss your blood pressure logs in today's call.", time: "9:30 AM" },
      { id: "m4", sender: "me",   content: "Sure! I've been tracking it with my smartwatch. Should I share the Health Connect data?", time: "9:35 AM" },
      { id: "m5", sender: "them", content: "Yes please! That would be very helpful. The automatic sync makes it easy to spot trends.", time: "9:40 AM" },
      { id: "m6", sender: "them", content: "See you at 2:30 PM today!", time: "10:24 AM" },
    ],
  },
  {
    id: "c2", name: "Dr. Marcus Williams", specialty: "General Practice",
    avatar: "MW", avatarBg: "bg-violet-600/30 text-violet-300",
    online: false, lastMessage: "Your prescription is ready.", lastTime: "Yesterday", unread: 0,
    messages: [
      { id: "m1", sender: "them", content: "Hi Alex, your prescription for Lisinopril has been issued.", time: "Yesterday 3:00 PM" },
      { id: "m2", sender: "me",   content: "Thank you! Can I pick it up from any pharmacy?", time: "Yesterday 3:15 PM" },
      { id: "m3", sender: "them", content: "Yes, the e-prescription has been sent to your registered pharmacy.", time: "Yesterday 3:20 PM" },
    ],
  },
  {
    id: "c3", name: "Dr. Priya Patel", specialty: "Endocrinologist",
    avatar: "PP", avatarBg: "bg-teal-600/30 text-teal-300",
    online: true, lastMessage: "Keep monitoring your glucose levels.", lastTime: "Jun 3", unread: 1,
    messages: [
      { id: "m1", sender: "them", content: "Your HbA1c is trending in the right direction. Keep up the diet changes.", time: "Jun 3, 11:00 AM" },
      { id: "m2", sender: "them", content: "Keep monitoring your glucose levels before breakfast and after dinner.", time: "Jun 3, 11:05 AM" },
    ],
  },
];

export default function MessagesPage() {
  const [activeConv, setActiveConv] = useState<Conversation>(CONVERSATIONS[0]);
  const [messages, setMessages] = useState<Message[]>(CONVERSATIONS[0].messages);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSelectConv(c: Conversation) {
    setActiveConv(c);
    setMessages(c.messages);
  }

  function handleSend() {
    if (!draft.trim()) return;
    const newMsg: Message = {
      id: Date.now().toString(),
      sender: "me",
      content: draft.trim(),
      time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    };
    setMessages((p) => [...p, newMsg]);
    setDraft("");

    // Simulate reply
    setTimeout(() => {
      setMessages((p) => [
        ...p,
        {
          id: (Date.now() + 1).toString(),
          sender: "them",
          content: "Thanks for your message. I'll get back to you shortly.",
          time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
        },
      ]);
    }, 1500);
  }

  const filtered = CONVERSATIONS.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
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
                placeholder="Search conversations…"
                value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-subtle">
            {filtered.map((c) => (
              <button key={c.id} onClick={() => handleSelectConv(c)}
                className={cn(
                  "w-full flex items-center gap-3 p-4 text-left transition-all duration-200",
                  activeConv.id === c.id
                    ? "bg-brand-500/10 border-r-2 border-r-brand-500"
                    : "hover:bg-surface-800/40"
                )}>
                <div className="relative flex-shrink-0">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-sm",
                    c.avatarBg
                  )}>
                    {c.avatar}
                  </div>
                  {c.online && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full
                                     bg-accent-green border-2 border-surface-900" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-display font-semibold text-primary truncate">{c.name}</p>
                    <span className="text-xs text-muted font-mono flex-shrink-0 ml-2">{c.lastTime}</span>
                  </div>
                  <p className="text-xs text-muted truncate">{c.lastMessage}</p>
                </div>
                {c.unread > 0 && (
                  <span className="w-5 h-5 rounded-full bg-brand-500 text-white text-xs
                                   flex items-center justify-center font-mono font-bold flex-shrink-0">
                    {c.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Chat area ── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat header */}
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-subtle flex-shrink-0">
            <div className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center font-display font-bold text-xs flex-shrink-0",
              activeConv.avatarBg
            )}>
              {activeConv.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-display font-bold text-primary">{activeConv.name}</p>
                <BadgeCheck className="w-3.5 h-3.5 text-brand-400" />
              </div>
              <p className="text-xs text-muted flex items-center gap-1.5">
                {activeConv.online
                  ? <><span className="w-1.5 h-1.5 rounded-full bg-accent-green" /> Online</>
                  : "Offline"}
                {" · "}{activeConv.specialty}
              </p>
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
            {messages.map((msg) => (
              <div key={msg.id}
                className={cn(
                  "flex gap-2 max-w-[80%]",
                  msg.sender === "me" ? "ml-auto flex-row-reverse" : ""
                )}>
                {msg.sender === "them" && (
                  <div className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center font-display font-bold text-xs flex-shrink-0 mt-auto",
                    activeConv.avatarBg
                  )}>
                    {activeConv.avatar}
                  </div>
                )}
                <div>
                  <div className={cn(
                    "px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                    msg.sender === "me"
                      ? "bg-brand-500 text-white rounded-tr-sm"
                      : "bg-surface-800/80 text-secondary border border-subtle rounded-tl-sm"
                  )}>
                    {msg.content}
                  </div>
                  <p className={cn(
                    "text-xs text-muted mt-1 font-mono",
                    msg.sender === "me" ? "text-right" : ""
                  )}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
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
                placeholder="Type a message…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              />
              <button className="p-2 text-muted hover:text-secondary rounded-xl hover:bg-surface-800 transition-colors">
                <Smile className="w-4 h-4" />
              </button>
              <button
                onClick={handleSend}
                disabled={!draft.trim()}
                className={cn(
                  "p-2.5 rounded-xl transition-all duration-200",
                  draft.trim()
                    ? "bg-brand-500 text-white hover:bg-brand-400 shadow-glow-sm"
                    : "bg-surface-800 text-muted cursor-not-allowed"
                )}>
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
