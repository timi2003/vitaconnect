"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import Link from "next/link";
import {
  Calendar, Video, Clock, Plus, ChevronRight, XCircle,
  CheckCircle2, AlertCircle, Mic, MessageSquare, Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = ["Upcoming", "Past", "Cancelled"] as const;
type Tab = (typeof TABS)[number];

const TYPE_ICONS: Record<string, React.ElementType> = {
  VIDEO: Video, AUDIO: Mic, CHAT: MessageSquare,
};

const STATUS_CONFIG: Record<string, { label: string; badge: string; icon: React.ElementType }> = {
  CONFIRMED:  { label: "Confirmed",  badge: "badge-success", icon: CheckCircle2 },
  SCHEDULED:  { label: "Scheduled",  badge: "badge-info",    icon: Calendar },
  COMPLETED:  { label: "Completed",  badge: "badge-teal",    icon: CheckCircle2 },
  CANCELLED:  { label: "Cancelled",  badge: "badge-danger",  icon: XCircle },
  IN_PROGRESS:{ label: "Live",       badge: "badge-warning", icon: AlertCircle },
};

type Appointment = {
  id: string;
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  type: string;
  status: string;
  avatar: string;
  avatarBg: string;
  reason: string;
  duration: number;
  fee: number;
};

export default function AppointmentsPage() {
  const [tab, setTab] = useState<Tab>("Upcoming");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAppointments() {
      try {
        const res = await fetch("/api/appointments?upcoming=true");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        
        // Transform DB data to match UI expectations
        const transformed = data.appointments.map((apt: any) => {
          const scheduled = new Date(apt.scheduledAt);
          const doctor = apt.doctor;
          const isToday = scheduled.toDateString() === new Date().toDateString();
          
          return {
            id: apt.id,
            doctor: doctor?.name || "Unknown Doctor",
            specialty: doctor?.doctorProfile?.specializations?.[0] || "General",
            date: isToday ? "Today" : scheduled.toLocaleDateString("en-US", { 
              month: "short", 
              day: "numeric" 
            }),
            time: scheduled.toLocaleTimeString("en-US", { 
              hour: "numeric", 
              minute: "2-digit" 
            }),
            type: apt.type,
            status: apt.status,
            avatar: doctor?.name?.split(" ").map((n: string) => n[0]).join("").slice(0,2) || "DR",
            avatarBg: "bg-brand-600/30 text-brand-300", // Simplified - can enhance later
            reason: apt.reason || "Consultation",
            duration: apt.duration,
            fee: doctor?.doctorProfile?.consultationFee || 0,
          };
        });
        
        setAppointments(transformed);
      } catch (error) {
        console.error("Failed to fetch appointments:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAppointments();
  }, []);

  const filtered = appointments.filter((a) => {
    if (tab === "Upcoming")  return ["CONFIRMED","SCHEDULED","IN_PROGRESS"].includes(a.status);
    if (tab === "Past")      return a.status === "COMPLETED";
    if (tab === "Cancelled") return a.status === "CANCELLED";
    return true;
  });

  return (
    <DashboardLayout>
      <div className="page-enter space-y-6 pb-24 lg:pb-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-display font-bold text-primary">Appointments</h1>
            <p className="text-sm text-muted mt-0.5">Manage your consultations</p>
          </div>
          <Link href="/appointments/new" className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Book Appointment
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-900/60 border border-subtle w-fit">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={cn(
                "px-5 py-2 rounded-lg text-sm font-display font-medium transition-all duration-200",
                tab === t
                  ? "bg-brand-500 text-white shadow-glow-sm"
                  : "text-muted hover:text-secondary"
              )}>
              {t}
              <span className={cn(
                "ml-2 text-xs font-mono px-1.5 py-0.5 rounded-full",
                tab === t ? "bg-white/20" : "bg-surface-700"
              )}>
                {appointments.filter((a) => {
                  if (t === "Upcoming")  return ["CONFIRMED","SCHEDULED","IN_PROGRESS"].includes(a.status);
                  if (t === "Past")      return a.status === "COMPLETED";
                  if (t === "Cancelled") return a.status === "CANCELLED";
                  return true;
                }).length}
              </span>
            </button>
          ))}
        </div>

        {/* List */}
        <div className="space-y-3">
          {loading ? (
            <div className="glass border border-subtle p-12 text-center">
              <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted">Loading appointments...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="glass border border-subtle p-12 text-center">
              <Calendar className="w-12 h-12 text-muted mx-auto mb-4 opacity-50" />
              <p className="font-display font-semibold text-secondary">No {tab.toLowerCase()} appointments</p>
              <p className="text-sm text-muted mt-1">
                {tab === "Upcoming" && "Book a consultation to get started"}
              </p>
              {tab === "Upcoming" && (
                <Link href="/appointments/new" className="btn-primary inline-flex mt-4 text-sm">
                  Book Now
                </Link>
              )}
            </div>
          ) : (
            filtered.map((apt) => {
              const TypeIcon   = TYPE_ICONS[apt.type] ?? Video;
              const statusConf = STATUS_CONFIG[apt.status];
              const isToday    = apt.date === "Today";
              const isLive     = apt.status === "IN_PROGRESS";

              return (
                <div key={apt.id}
                  className={cn(
                    "glass border transition-all duration-200 hover:shadow-card-hover",
                    isToday  ? "border-brand-500/30 bg-brand-500/5" : "border-subtle",
                    isLive   ? "border-accent-green/30 animate-pulse-slow" : ""
                  )}>
                  <div className="p-5 flex items-start gap-4">
                    {/* Avatar */}
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0",
                      "border border-white/10 font-display font-bold text-sm",
                      apt.avatarBg
                    )}>
                      {apt.avatar}
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <p className="font-display font-bold text-primary text-sm">{apt.doctor}</p>
                          <p className="text-xs text-muted">{apt.specialty}</p>
                        </div>
                        <span className={cn("badge text-xs py-0.5", statusConf.badge)}>
                          {statusConf.label}
                        </span>
                      </div>

                      <p className="text-xs text-secondary mt-2 line-clamp-1 italic">
                        &ldquo;{apt.reason}&rdquo;
                      </p>

                      <div className="flex items-center gap-4 mt-3 flex-wrap">
                        <span className="flex items-center gap-1.5 text-xs text-muted">
                          <Calendar className="w-3 h-3" />
                          {apt.date}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-muted">
                          <Clock className="w-3 h-3" />
                          {apt.time} · {apt.duration} min
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-muted">
                          <TypeIcon className="w-3 h-3" />
                          {apt.type.charAt(0) + apt.type.slice(1).toLowerCase()}
                        </span>
                        <span className="text-xs font-mono text-muted">${apt.fee}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      {(apt.status === "CONFIRMED" || apt.status === "IN_PROGRESS") && (
                        <Link href={`/video?room=${apt.id}`}
                          className="btn-primary text-xs py-2 px-3 flex items-center gap-1.5">
                          <Video className="w-3.5 h-3.5" />
                          {isLive ? "Join Live" : "Join"}
                        </Link>
                      )}
                      <Link href={`/appointments/${apt.id}`}
                        className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1">
                        Details <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}