"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Users, Calendar, Activity, Star, Clock,
  CheckCircle2, Video, Pill, TestTube2, TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from "recharts";

const STATS = [
  { label: "Today's Patients",   value: "8",     icon: Users,    color: "brand",  trend: "+2" },
  { label: "Pending Reviews",    value: "3",     icon: Clock,    color: "amber",  trend: null },
  { label: "This Month",         value: "127",   icon: Calendar, color: "teal",   trend: "+12%" },
  { label: "Avg Rating",         value: "4.9",   icon: Star,     color: "purple", trend: "+0.1" },
];

const TODAY_PATIENTS = [
  { id:"p1", name:"Alex Johnson",    time:"2:30 PM", type:"VIDEO", status:"CONFIRMED", reason:"BP follow-up",        avatar:"AJ", avatarBg:"bg-brand-600/30 text-brand-300" },
  { id:"p2", name:"Maria Santos",    time:"3:30 PM", type:"VIDEO", status:"CONFIRMED", reason:"Diabetes review",     avatar:"MS", avatarBg:"bg-violet-600/30 text-violet-300" },
  { id:"p3", name:"Kwame Mensah",    time:"4:00 PM", type:"AUDIO", status:"SCHEDULED", reason:"Hypertension",        avatar:"KM", avatarBg:"bg-teal-600/30 text-teal-300" },
  { id:"p4", name:"Priya Nair",      time:"4:30 PM", type:"CHAT",  status:"SCHEDULED", reason:"Post-surgery check",  avatar:"PN", avatarBg:"bg-amber-600/30 text-amber-300" },
  { id:"p5", name:"James Okonkwo",   time:"5:00 PM", type:"VIDEO", status:"SCHEDULED", reason:"Annual wellness",     avatar:"JO", avatarBg:"bg-rose-600/30 text-rose-300" },
];

const CONSULT_DATA = [
  { day:"Mon", count:14 }, { day:"Tue", count:18 }, { day:"Wed", count:12 },
  { day:"Thu", count:22 }, { day:"Fri", count:19 }, { day:"Sat", count:8 },
  { day:"Sun", count:5  },
];

const COLOR_MAP: Record<string, { icon: string; badge: string; bg: string; border: string }> = {
  brand:  { icon:"text-brand-400",   badge:"badge-info",    bg:"bg-brand-500/10",  border:"border-brand-500/20"  },
  amber:  { icon:"text-amber-400",   badge:"badge-warning", bg:"bg-amber-500/10",  border:"border-amber-500/20"  },
  teal:   { icon:"text-teal-400",    badge:"badge-teal",    bg:"bg-teal-500/10",   border:"border-teal-500/20"   },
  purple: { icon:"text-violet-400",  badge:"badge-purple",  bg:"bg-violet-500/10", border:"border-violet-500/20" },
};

export default function DoctorPortalPage() {
  const [isAvailable, setIsAvailable] = useState(true);

  return (
    <DashboardLayout>
      <div className="page-enter space-y-6 pb-24 lg:pb-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-display font-bold text-primary">Doctor Portal</h1>
            <p className="text-sm text-muted mt-0.5">Thursday, June 6, 2026</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-display text-secondary">Available for calls</span>
            <label className="relative inline-flex cursor-pointer">
              <input type="checkbox" checked={isAvailable} onChange={() => setIsAvailable(!isAvailable)} className="sr-only peer" />
              <div className={cn(
                "w-11 h-6 rounded-full transition-colors duration-200",
                "after:content-[''] after:absolute after:top-0.5 after:left-0.5",
                "after:w-5 after:h-5 after:rounded-full after:bg-white",
                "after:transition-transform after:duration-200",
                isAvailable
                  ? "bg-accent-green peer-checked:after:translate-x-5"
                  : "bg-surface-700"
              )} />
            </label>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {STATS.map((s) => {
            const c = COLOR_MAP[s.color];
            return (
              <div key={s.label} className={cn(
                "metric-card p-4 border", c.bg, c.border
              )}>
                <div className="flex items-center justify-between mb-3">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", c.bg, "border", c.border)}>
                    <s.icon className={cn("w-4 h-4", c.icon)} />
                  </div>
                  {s.trend && <span className="badge badge-success text-xs py-0.5">{s.trend}</span>}
                </div>
                <p className="text-2xl font-display font-bold text-primary">{s.value}</p>
                <p className="text-xs text-muted font-display mt-0.5">{s.label}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Today's schedule */}
          <div className="lg:col-span-2 glass border border-subtle p-5 space-y-4">
            <h2 className="text-sm font-display font-bold text-primary">Today&apos;s Schedule</h2>
            <div className="space-y-2.5">
              {TODAY_PATIENTS.map((p, i) => (
                <div key={p.id} className={cn(
                  "flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200",
                  i === 0 ? "border-brand-500/30 bg-brand-500/5" : "border-subtle hover:border-brand-500/20"
                )}>
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                    "font-display font-bold text-xs border border-white/10", p.avatarBg
                  )}>
                    {p.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-display font-semibold text-primary">{p.name}</p>
                    <p className="text-xs text-muted truncate">{p.reason}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-mono text-muted">{p.time}</span>
                    <span className={cn(
                      "badge text-xs py-0.5",
                      p.status === "CONFIRMED" ? "badge-success" : "badge-info"
                    )}>
                      {p.status.toLowerCase()}
                    </span>
                    {i === 0 && (
                      <button className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5">
                        <Video className="w-3 h-3" /> Start
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly chart */}
          <div className="glass border border-subtle p-5 space-y-4">
            <h2 className="text-sm font-display font-bold text-primary flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-400" />
              Weekly Consultations
            </h2>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={CONSULT_DATA}>
                <defs>
                  <linearGradient id="cGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#0a8ce8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0a8ce8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fill:"#4d6fa8", fontSize:10 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background:"#0d1f3d", border:"1px solid rgba(10,140,232,0.2)", borderRadius:"8px", color:"#e6f4ff", fontSize:"12px" }}
                />
                <Area type="monotone" dataKey="count" stroke="#0a8ce8" strokeWidth={2}
                      fill="url(#cGrad)" dot={false} activeDot={{ r:4, fill:"#0a8ce8" }} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex justify-between text-xs">
              <span className="text-muted">Total this week</span>
              <span className="font-mono font-bold text-primary">98 consultations</span>
            </div>
          </div>
        </div>

        {/* Quick actions for doctor */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Write Prescription", icon: Pill,      href: "/doctor-portal/prescriptions/new", color: "violet" },
            { label: "Order Lab Tests",    icon: TestTube2,  href: "/doctor-portal/lab-orders/new",    color: "teal" },
            { label: "Patient Records",    icon: Users,      href: "/doctor-portal/patients",           color: "brand" },
            { label: "My Availability",    icon: Calendar,   href: "/doctor-portal/availability",       color: "amber" },
          ].map((a) => (
            <a key={a.label} href={a.href}
              className={cn(
                "glass border border-subtle p-4 rounded-2xl text-center",
                "hover:border-brand-500/30 hover:bg-brand-500/5 transition-all duration-200 cursor-pointer"
              )}>
              <a.icon className={cn(
                "w-6 h-6 mx-auto mb-2",
                a.color === "violet" ? "text-violet-400"
                : a.color === "teal" ? "text-teal-400"
                : a.color === "brand" ? "text-brand-400"
                : "text-amber-400"
              )} />
              <p className="text-xs font-display font-semibold text-secondary">{a.label}</p>
            </a>
          ))}
        </div>

        {/* Pending actions */}
        <div className="glass border border-amber-500/25 bg-amber-500/5 p-5 space-y-3">
          <h2 className="text-sm font-display font-bold text-primary">Pending Actions</h2>
          {[
            { label: "Review lab results for Alex Johnson",  type: "LAB",          urgent: true  },
            { label: "Complete notes for Maria Santos",      type: "NOTES",        urgent: false },
            { label: "Renew prescription for Kwame Mensah",  type: "PRESCRIPTION", urgent: false },
          ].map((a) => (
            <div key={a.label} className="flex items-center gap-3 p-3 rounded-xl border border-subtle bg-surface-900/30">
              <div className={cn(
                "w-2 h-2 rounded-full flex-shrink-0",
                a.urgent ? "bg-accent-coral animate-pulse" : "bg-accent-amber"
              )} />
              <p className="text-sm text-secondary flex-1">{a.label}</p>
              <button className="btn-ghost text-xs py-1 px-3">
                {a.urgent ? "Urgent" : "Review"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
