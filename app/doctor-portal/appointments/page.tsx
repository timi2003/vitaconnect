"use client";

import { useState } from "react";
import { DoctorDashboardLayout } from "@/components/layout/DoctorDasboardLayout";
import Link from "next/link";
import {
  Calendar, Video, Clock, Plus, ChevronRight,
  Search, Filter, CheckCircle2, XCircle, Mic,
  MessageSquare, User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const APPOINTMENTS = [
  { id:"a1", patient:"Alex Johnson",   avatar:"AJ", avatarBg:"bg-brand-600/30 text-brand-300",
    date:"Today",    time:"2:30 PM",  type:"VIDEO", status:"CONFIRMED", reason:"BP follow-up",      duration:30 },
  { id:"a2", patient:"Maria Santos",   avatar:"MS", avatarBg:"bg-violet-600/30 text-violet-300",
    date:"Today",    time:"3:30 PM",  type:"VIDEO", status:"CONFIRMED", reason:"Diabetes review",   duration:30 },
  { id:"a3", patient:"Kwame Mensah",   avatar:"KM", avatarBg:"bg-teal-600/30 text-teal-300",
    date:"Today",    time:"4:00 PM",  type:"AUDIO", status:"SCHEDULED", reason:"Hypertension",      duration:30 },
  { id:"a4", patient:"Priya Nair",     avatar:"PN", avatarBg:"bg-amber-600/30 text-amber-300",
    date:"Today",    time:"4:30 PM",  type:"CHAT",  status:"SCHEDULED", reason:"Post-surgery check",duration:20 },
  { id:"a5", patient:"James Okonkwo",  avatar:"JO", avatarBg:"bg-rose-600/30 text-rose-300",
    date:"Today",    time:"5:00 PM",  type:"VIDEO", status:"SCHEDULED", reason:"Annual wellness",   duration:30 },
  { id:"a6", patient:"Amara Diallo",   avatar:"AD", avatarBg:"bg-indigo-600/30 text-indigo-300",
    date:"Tomorrow", time:"9:00 AM",  type:"VIDEO", status:"SCHEDULED", reason:"Follow-up",         duration:30 },
  { id:"a7", patient:"Tunde Bakare",   avatar:"TB", avatarBg:"bg-emerald-600/30 text-emerald-300",
    date:"Tomorrow", time:"10:30 AM", type:"VIDEO", status:"SCHEDULED", reason:"Blood test review",  duration:30 },
  { id:"a8", patient:"Chioma Eze",     avatar:"CE", avatarBg:"bg-rose-600/30 text-rose-300",
    date:"Jun 10",   time:"11:00 AM", type:"VIDEO", status:"COMPLETED", reason:"Migraine check",    duration:20 },
  { id:"a9", patient:"Lekan Adeyemi",  avatar:"LA", avatarBg:"bg-amber-600/30 text-amber-300",
    date:"Jun 9",    time:"2:00 PM",  type:"AUDIO", status:"COMPLETED", reason:"Routine checkup",   duration:30 },
  { id:"a10",patient:"Fatima Hassan",  avatar:"FH", avatarBg:"bg-violet-600/30 text-violet-300",
    date:"Jun 8",    time:"3:00 PM",  type:"CHAT",  status:"CANCELLED", reason:"Skin rash",         duration:20 },
];

const TYPE_ICONS: Record<string, React.ElementType> = { VIDEO: Video, AUDIO: Mic, CHAT: MessageSquare };
const STATUS_BADGE: Record<string, string> = {
  CONFIRMED:"badge-success", SCHEDULED:"badge-info",
  COMPLETED:"badge-teal",    CANCELLED:"badge-danger", IN_PROGRESS:"badge-warning",
};
const TABS = ["All","Today","Upcoming","Completed","Cancelled"] as const;
type Tab = typeof TABS[number];

export default function DoctorAppointmentsPage() {
  const [tab,    setTab]    = useState<Tab>("Today");
  const [search, setSearch] = useState("");

  const filtered = APPOINTMENTS.filter((a) => {
    const matchSearch = search === "" ||
      a.patient.toLowerCase().includes(search.toLowerCase()) ||
      a.reason.toLowerCase().includes(search.toLowerCase());
    const matchTab =
      tab === "All"       ? true :
      tab === "Today"     ? a.date === "Today" :
      tab === "Upcoming"  ? ["SCHEDULED","CONFIRMED"].includes(a.status) && a.date !== "Today" :
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
          {filtered.length === 0 ? (
            <div className="glass border border-subtle p-12 text-center">
              <Calendar className="w-10 h-10 text-muted mx-auto mb-3 opacity-40" />
              <p className="text-secondary font-display">No appointments found</p>
            </div>
          ) : filtered.map((apt) => {
            const TypeIcon = TYPE_ICONS[apt.type] ?? Video;
            const isToday  = apt.date === "Today";
            return (
              <div key={apt.id} className={cn(
                "glass border transition-all duration-200 hover:shadow-card-hover",
                isToday && apt.status === "CONFIRMED"
                  ? "border-teal-500/30 bg-teal-500/5"
                  : "border-subtle"
              )}>
                <div className="flex items-center gap-4 p-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                    "font-display font-bold text-xs border border-white/10", apt.avatarBg
                  )}>{apt.avatar}</div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-display font-bold text-primary">{apt.patient}</p>
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
                    <span className={cn("badge text-xs py-0.5", STATUS_BADGE[apt.status])}>
                      {apt.status.toLowerCase()}
                    </span>
                    {(apt.status === "CONFIRMED" || apt.status === "SCHEDULED") && (
                      <Link href={`/video?room=${apt.id}`}
                        className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5">
                        <Video className="w-3 h-3" /> Start
                      </Link>
                    )}
                    {apt.status === "COMPLETED" && (
                      <Link href={`/doctor-portal/patients/${apt.id}`}
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