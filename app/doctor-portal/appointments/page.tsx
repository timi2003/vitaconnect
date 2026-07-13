"use client";

import { useState, useEffect } from "react";
import { DoctorDashboardLayout } from "@/components/layout/DoctorDasboardLayout";
import Link from "next/link";
import {
  Calendar, Video, Clock, Plus, ChevronRight,
  Search, Filter, CheckCircle2, XCircle, Mic,
  MessageSquare, User, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  avatar: string;
  date: string;
  time: string;
  isToday: boolean;
  type: string;
  status: string;
  reason: string;
  duration: number;
  roomId: string | null;
}

const TYPE_ICONS: Record<string, React.ElementType> = { VIDEO: Video, AUDIO: Mic, CHAT: MessageSquare };
const STATUS_BADGE: Record<string, string> = {
  CONFIRMED:"badge-success", SCHEDULED:"badge-info",
  COMPLETED:"badge-teal",    CANCELLED:"badge-danger", IN_PROGRESS:"badge-warning",
  NO_SHOW:"badge-danger",    RESCHEDULED:"badge-info",
};
const AVATAR_COLORS = [
  "bg-brand-600/30 text-brand-300", "bg-violet-600/30 text-violet-300",
  "bg-teal-600/30 text-teal-300", "bg-amber-600/30 text-amber-300",
  "bg-rose-600/30 text-rose-300", "bg-indigo-600/30 text-indigo-300",
  "bg-emerald-600/30 text-emerald-300",
];
const TABS = ["All","Today","Upcoming","Completed","Cancelled"] as const;
type Tab = typeof TABS[number];

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?";
}

function avatarBg(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatDateLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function DoctorAppointmentsPage() {
  const [tab, setTab] = useState<Tab>("Today");
  const [search, setSearch] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/appointments");
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          console.error("[DoctorAppointmentsPage] fetch failed:", res.status, body);
          return;
        }
        const { appointments: raw } = await res.json();

        const transformed: Appointment[] = (raw || []).map((a: any) => {
          const scheduled = new Date(a.scheduledAt);
          return {
            id: a.id,
            patientId: a.patient?.id ?? a.patientId,
            patientName: a.patient?.name ?? "Unknown patient",
            avatar: initials(a.patient?.name ?? "?"),
            date: formatDateLabel(a.scheduledAt),
            time: scheduled.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
            isToday: formatDateLabel(a.scheduledAt) === "Today",
            type: a.type,
            status: a.status,
            reason: a.reason || "No reason provided",
            duration: a.duration,
            roomId: a.roomId ?? null,
          };
        });

        setAppointments(transformed);
      } catch (err) {
        console.error("[DoctorAppointmentsPage] load failed:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = appointments.filter((a) => {
    const matchSearch = search === "" ||
      a.patientName.toLowerCase().includes(search.toLowerCase()) ||
      a.reason.toLowerCase().includes(search.toLowerCase());
    const matchTab =
      tab === "All"       ? true :
      tab === "Today"     ? a.isToday :
      tab === "Upcoming"  ? ["SCHEDULED","CONFIRMED"].includes(a.status) && !a.isToday :
      tab === "Completed" ? a.status === "COMPLETED" :
      tab === "Cancelled" ? a.status === "CANCELLED" : true;
    return matchSearch && matchTab;
  });

  return (
    <DoctorDashboardLayout>
      <div className="page-enter space-y-6 pb-24 lg:pb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-display font-bold text-primary">Appointments</h1>
            <p className="text-sm text-muted mt-0.5">Manage your consultations</p>
          </div>
          <Link href="/doctor-portal/availability"
            className="btn-primary text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> Set Availability
          </Link>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input className="input pl-10 text-sm" placeholder="Search patients or reasons…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-900/60 border border-subtle w-fit overflow-x-auto">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-display font-semibold transition-all duration-200 whitespace-nowrap",
                tab === t ? "bg-brand-500 text-white" : "text-muted hover:text-secondary"
              )}>
              {t}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="space-y-2.5">
          {loading ? (
            <div className="glass border border-subtle p-12 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-brand-400 mx-auto" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="glass border border-subtle p-12 text-center">
              <Calendar className="w-10 h-10 text-muted mx-auto mb-3 opacity-40" />
              <p className="text-secondary font-display">No appointments found</p>
            </div>
          ) : filtered.map((apt) => {
            const TypeIcon = TYPE_ICONS[apt.type] ?? Video;
            return (
              <div key={apt.id} className={cn(
                "glass border transition-all duration-200 hover:shadow-card-hover",
                apt.isToday && apt.status === "CONFIRMED"
                  ? "border-teal-500/30 bg-teal-500/5"
                  : "border-subtle"
              )}>
                <div className="flex items-center gap-4 p-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                    "font-display font-bold text-xs border border-white/10", avatarBg(apt.patientId)
                  )}>{apt.avatar}</div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-display font-bold text-primary">{apt.patientName}</p>
                    <p className="text-xs text-muted italic truncate">{apt.reason}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-muted">
                        <Calendar className="w-3 h-3" />{apt.date}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted">
                        <Clock className="w-3 h-3" />{apt.time} · {apt.duration}m
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted">
                        <TypeIcon className="w-3 h-3" />{apt.type}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={cn("badge text-xs py-0.5", STATUS_BADGE[apt.status] ?? "badge-info")}>
                      {apt.status.toLowerCase()}
                    </span>
                    {(apt.status === "CONFIRMED" || apt.status === "SCHEDULED") && (
                      <Link href={`/video?room=${apt.roomId ?? apt.id}`}
                        className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5">
                        <Video className="w-3 h-3" /> Start
                      </Link>
                    )}
                    {apt.status === "COMPLETED" && (
                      <Link href={`/doctor-portal/patients/${apt.patientId}`}
                        className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1">
                        Notes <ChevronRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DoctorDashboardLayout>
  );
}