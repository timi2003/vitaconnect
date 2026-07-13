"use client";

import { useState, useEffect } from "react";
import { DoctorDashboardLayout } from "@/components/layout/DoctorDasboardLayout";
import {
  Users, Calendar, Star, Clock,
  Video, Pill, TestTube2, TrendingUp, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from "recharts";

// ── Types ─────────────────────────────────────────────────────────────────────
type Appointment = {
  id:          string;
  scheduledAt: string;
  type:        string;
  status:      string;
  reason:      string | null;
  patient: {
    name:  string | null;
    image: string | null;
  };
};

type PendingAction = {
  label:  string;
  type:   string;
  urgent: boolean;
};

type ConsultPoint = { day: string; count: number };

type DashboardData = {
  todayCount:        number;
  pendingReviews:    number;
  monthCount:        number;
  avgRating:         number;
  todayAppointments: Appointment[];
  weeklyData:        ConsultPoint[];
  weeklyTotal:       number;
  pendingActions:    PendingAction[];
};

// Initials from a name
function initials(name: string | null): string {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

// Cycling avatar colours so each patient card looks distinct
const AVATAR_STYLES = [
  "bg-brand-600/30 text-brand-300",
  "bg-violet-600/30 text-violet-300",
  "bg-teal-600/30 text-teal-300",
  "bg-amber-600/30 text-amber-300",
  "bg-rose-600/30 text-rose-300",
];

const COLOR_MAP: Record<string, { icon: string; bg: string; border: string }> = {
  brand:  { icon: "text-brand-400",  bg: "bg-brand-500/10",  border: "border-brand-500/20"  },
  amber:  { icon: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/20"  },
  teal:   { icon: "text-teal-400",   bg: "bg-teal-500/10",   border: "border-teal-500/20"   },
  purple: { icon: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
};

export default function DoctorPortalPage() {
  const [isAvailable,    setIsAvailable]    = useState(false);
  const [toggling,       setToggling]       = useState(false);
  const [doctorName,     setDoctorName]     = useState("Doctor");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [dashboard,      setDashboard]      = useState<DashboardData | null>(null);
  const [loadingDash,    setLoadingDash]    = useState(true);

  // ── Fetch profile (name + availability) ───────────────────────────────────
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data?.user) return;
        setIsAvailable(data.user.doctorProfile?.isAvailableNow ?? false);
        setDoctorName(data.user.name ?? "Doctor");
      })
      .catch(() => null)
      .finally(() => setLoadingProfile(false));
  }, []);

  // ── Fetch dashboard stats ──────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/doctors/dashboard")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setDashboard(data); })
      .catch(() => null)
      .finally(() => setLoadingDash(false));
  }, []);

  // ── Toggle availability ────────────────────────────────────────────────────
  async function handleToggleAvailability() {
    setToggling(true);
    const next = !isAvailable;
    try {
      const res = await fetch("/api/doctors/availability/toggle", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ isAvailableNow: next }),
      });
      if (res.ok) setIsAvailable(next);
    } catch { /* silent */ } finally {
      setToggling(false);
    }
  }

  const greeting = loadingProfile
    ? "Welcome back"
    : `Welcome back, Dr. ${doctorName.split(" ")[0]}`;

  const STATS = [
    { label: "Today's Patients", value: dashboard?.todayCount?.toString()     ?? "—", icon: Users,    color: "brand",  trend: null },
    { label: "Pending Reviews",  value: dashboard?.pendingReviews?.toString() ?? "—", icon: Clock,    color: "amber",  trend: null },
    { label: "This Month",       value: dashboard?.monthCount?.toString()      ?? "—", icon: Calendar, color: "teal",   trend: null },
    { label: "Avg Rating",       value: dashboard?.avgRating?.toFixed(1)       ?? "—", icon: Star,     color: "purple", trend: null },
  ];

  return (
    <DoctorDashboardLayout>
      <div className="page-enter space-y-6 pb-24 lg:pb-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-display font-bold text-primary">{greeting}</h1>
            <p className="text-sm text-muted mt-0.5">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long", year: "numeric", month: "long", day: "numeric",
              })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-display text-secondary">Available for calls</span>
            <label className={cn(
              "relative inline-flex cursor-pointer",
              toggling && "opacity-60 pointer-events-none",
            )}>
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={handleToggleAvailability}
                className="sr-only peer"
              />
              <div className={cn(
                "w-11 h-6 rounded-full transition-colors duration-200",
                "after:content-[''] after:absolute after:top-0.5 after:left-0.5",
                "after:w-5 after:h-5 after:rounded-full after:bg-white",
                "after:transition-transform after:duration-200",
                isAvailable ? "bg-teal-500 after:translate-x-5" : "bg-surface-700",
              )} />
            </label>
            {isAvailable && (
              <span className="badge badge-success text-xs animate-pulse">Live</span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {STATS.map((s) => {
            const c = COLOR_MAP[s.color];
            return (
              <div key={s.label} className={cn("metric-card p-4 border", c.bg, c.border)}>
                <div className="flex items-center justify-between mb-3">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border", c.bg, c.border)}>
                    {loadingDash
                      ? <Loader2 className="w-4 h-4 text-muted animate-spin" />
                      : <s.icon className={cn("w-4 h-4", c.icon)} />}
                  </div>
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

            {loadingDash ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
              </div>
            ) : !dashboard?.todayAppointments?.length ? (
              <p className="text-sm text-muted py-8 text-center">No appointments scheduled for today.</p>
            ) : (
              <div className="space-y-2.5">
                {dashboard.todayAppointments.map((p, i) => (
                  <div key={p.id} className={cn(
                    "flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200",
                    i === 0
                      ? "border-brand-500/30 bg-brand-500/5"
                      : "border-subtle hover:border-brand-500/20",
                  )}>
                    <div className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                      "font-display font-bold text-xs border border-white/10",
                      AVATAR_STYLES[i % AVATAR_STYLES.length],
                    )}>
                      {initials(p.patient.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-display font-semibold text-primary">
                        {p.patient.name ?? "Unknown Patient"}
                      </p>
                      <p className="text-xs text-muted truncate">{p.reason ?? "No reason provided"}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs font-mono text-muted">
                        {new Date(p.scheduledAt).toLocaleTimeString("en-US", {
                          hour: "numeric", minute: "2-digit",
                        })}
                      </span>
                      <span className={cn(
                        "badge text-xs py-0.5",
                        p.status === "CONFIRMED" ? "badge-success" : "badge-info",
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
            )}
          </div>

          {/* Weekly chart */}
          <div className="glass border border-subtle p-5 space-y-4">
            <h2 className="text-sm font-display font-bold text-primary flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-400" />
              Weekly Consultations
            </h2>

            {loadingDash ? (
              <div className="flex items-center justify-center h-[140px]">
                <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={140}>
                  <AreaChart data={dashboard?.weeklyData ?? []}>
                    <defs>
                      <linearGradient id="cGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#0a8ce8" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0a8ce8" stopOpacity={0}   />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" tick={{ fill: "#4d6fa8", fontSize: 10 }}
                      tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{
                      background: "#0d1f3d", border: "1px solid rgba(10,140,232,0.2)",
                      borderRadius: "8px", color: "#e6f4ff", fontSize: "12px",
                    }} />
                    <Area type="monotone" dataKey="count" stroke="#0a8ce8" strokeWidth={2}
                      fill="url(#cGrad)" dot={false} activeDot={{ r: 4, fill: "#0a8ce8" }} />
                  </AreaChart>
                </ResponsiveContainer>
                <div className="flex justify-between text-xs">
                  <span className="text-muted">Total this week</span>
                  <span className="font-mono font-bold text-primary">
                    {dashboard?.weeklyTotal ?? 0} consultations
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Write Prescription", icon: Pill,      href: "/doctor-portal/prescriptions/new", color: "violet" },
            { label: "Order Lab Tests",    icon: TestTube2,  href: "/doctor-portal/lab-orders/new",    color: "teal"   },
            { label: "Patient Records",    icon: Users,      href: "/doctor-portal/patients",           color: "brand"  },
            { label: "My Availability",    icon: Calendar,   href: "/doctor-portal/schedule",           color: "amber"  },
          ].map((a) => (
            <a key={a.label} href={a.href} className={cn(
              "glass border border-subtle p-4 rounded-2xl text-center",
              "hover:border-brand-500/30 hover:bg-brand-500/5 transition-all duration-200 cursor-pointer",
            )}>
              <a.icon className={cn(
                "w-6 h-6 mx-auto mb-2",
                a.color === "violet" ? "text-violet-400"
                : a.color === "teal"  ? "text-teal-400"
                : a.color === "brand" ? "text-brand-400"
                : "text-amber-400",
              )} />
              <p className="text-xs font-display font-semibold text-secondary">{a.label}</p>
            </a>
          ))}
        </div>

        {/* Pending actions */}
        <div className="glass border border-amber-500/25 bg-amber-500/5 p-5 space-y-3">
          <h2 className="text-sm font-display font-bold text-primary">Pending Actions</h2>

          {loadingDash ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
            </div>
          ) : !dashboard?.pendingActions?.length ? (
            <p className="text-sm text-muted py-4 text-center">No pending actions. You&apos;re all caught up!</p>
          ) : (
            dashboard.pendingActions.map((a) => (
              <div key={a.label}
                className="flex items-center gap-3 p-3 rounded-xl border border-subtle bg-surface-900/30">
                <div className={cn(
                  "w-2 h-2 rounded-full flex-shrink-0",
                  a.urgent ? "bg-accent-coral animate-pulse" : "bg-accent-amber",
                )} />
                <p className="text-sm text-secondary flex-1">{a.label}</p>
                <button className="btn-ghost text-xs py-1 px-3">
                  {a.urgent ? "Urgent" : "Review"}
                </button>
              </div>
            ))
          )}
        </div>

      </div>
    </DoctorDashboardLayout>
  );
}