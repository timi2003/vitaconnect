"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, Calendar, Users, MessageSquare,
  FileText, TestTube2, Video, Bell, Search, Menu, X,
  ChevronRight, Heart, LogOut, Zap, Star, Clock,
  Stethoscope, ClipboardList, UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    section: "Overview",
    items: [
      { href: "/doctor-portal",               icon: LayoutDashboard, label: "Dashboard",        badge: null },
      { href: "/doctor-portal/appointments",  icon: Calendar,        label: "Appointments",     badge: null },
      { href: "/doctor-portal/schedule",      icon: Clock,           label: "My Schedule",      badge: null },
    ],
  },
  {
    section: "Patients",
    items: [
      { href: "/doctor-portal/patients",      icon: Users,           label: "My Patients",      badge: null },
      { href: "/doctor-portal/consultations", icon: Stethoscope,     label: "Consultations",    badge: null },
      { href: "/doctor-portal/video",         icon: Video,           label: "Video Sessions",   badge: null },
      { href: "/doctor-portal/messages",      icon: MessageSquare,   label: "Messages",         badge: null },
    ],
  },
  {
    section: "Clinical",
    items: [
      { href: "/doctor-portal/prescriptions", icon: ClipboardList,   label: "Prescriptions",    badge: null },
      { href: "/doctor-portal/lab-orders",    icon: TestTube2,       label: "Lab Orders",       badge: null },
      { href: "/doctor-portal/records",       icon: FileText,        label: "Medical Records",  badge: null },
    ],
  },
  {
    section: "Account",
    items: [
      { href: "/doctor-portal/reviews",       icon: Star,            label: "Reviews",          badge: null },
      { href: "/doctor-portal/profile",       icon: UserCog,         label: "Profile & Settings", badge: null },
    ],
  },
];

type DoctorSnippet = {
  name:           string;
  email:          string;
  image:          string | null;
  specializations: string[];
  rating:         number;
  isAvailableNow: boolean;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface Props { children: React.ReactNode }

export function DoctorDashboardLayout({ children }: Props) {
  const pathname                    = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [doctor, setDoctor]           = useState<DoctorSnippet | null>(null);
  const [available, setAvailable]     = useState(false);
  const [togglingAvail, setTogglingAvail] = useState(false);

  // ── Fetch doctor profile ──────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data?.user) return;
        const { user } = data;
        setDoctor({
          name:            user.name            ?? "Doctor",
          email:           user.email           ?? "",
          image:           user.image           ?? null,
          specializations: user.doctorProfile?.specializations ?? [],
          rating:          user.doctorProfile?.rating          ?? 0,
          isAvailableNow:  user.doctorProfile?.isAvailableNow  ?? false,
        });
        setAvailable(user.doctorProfile?.isAvailableNow ?? false);
      })
      .catch(() => null);
  }, []);

  // ── Toggle availability ───────────────────────────────────────────────────
  async function toggleAvailability() {
    setTogglingAvail(true);
    try {
      const res = await fetch("/api/doctor/availability/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailableNow: !available }),
      });
      if (res.ok) setAvailable((prev) => !prev);
    } catch {
      // silently fail — UI stays at current value
    } finally {
      setTogglingAvail(false);
    }
  }

  const initials      = doctor ? getInitials(doctor.name) : "…";
  const primarySpec   = doctor?.specializations?.[0] ?? "General Practice";
  const ratingDisplay = doctor?.rating ? doctor.rating.toFixed(1) : "—";

  const Sidebar = () => (
    <aside className={cn(
      "fixed inset-y-0 left-0 z-50 w-72 flex flex-col",
      "glass-strong border-r border-subtle",
      "transition-transform duration-300 lg:translate-x-0 safe-top",
      sidebarOpen ? "translate-x-0" : "-translate-x-full",
    )}>

      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-subtle">
        <Link href="/doctor-portal" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-500 flex items-center justify-center
                          shadow-glow-sm flex-shrink-0">
            <Heart className="w-4 h-4 text-white" fill="white" />
          </div>
          <div>
            <span className="font-display font-bold text-lg text-primary">VitaConnect</span>
            <span className="block text-xs text-teal-400 font-mono">Doctor Portal</span>
          </div>
        </Link>
        <button className="lg:hidden text-secondary hover:text-primary"
          onClick={() => setSidebarOpen(false)}>
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Doctor card */}
      <div className="mx-4 mt-4 p-3 rounded-xl bg-surface-800/50 border border-subtle">
        <div className="flex items-center gap-3">
          {doctor?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={doctor.image} alt={doctor.name}
              className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-teal-600/30 border border-teal-500/30
                            flex items-center justify-center flex-shrink-0">
              <span className="text-teal-400 font-display font-bold text-sm">{initials}</span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-display font-semibold text-primary truncate">
              {doctor ? `Dr. ${doctor.name}` : "Loading…"}
            </p>
            <p className="text-xs text-muted truncate">{primarySpec}</p>
          </div>
          <Link href="/doctor-portal/profile">
            <ChevronRight className="w-4 h-4 text-muted flex-shrink-0" />
          </Link>
        </div>

        {/* Rating + availability row */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-subtle">
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            <span className="text-xs font-mono font-bold text-primary">{ratingDisplay}</span>
          </div>

          {/* Availability toggle */}
          <button
            onClick={toggleAvailability}
            disabled={togglingAvail}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-display font-semibold",
              "border transition-all duration-200",
              available
                ? "bg-teal-500/12 border-teal-500/30 text-teal-400 hover:bg-teal-500/20"
                : "bg-surface-700/50 border-subtle text-muted hover:border-brand-500/25",
              togglingAvail && "opacity-60 cursor-wait",
            )}
          >
            <span className={cn(
              "w-1.5 h-1.5 rounded-full",
              available ? "bg-teal-400 animate-pulse" : "bg-surface-500",
            )} />
            {available ? "Available" : "Offline"}
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-4">
        {NAV_ITEMS.map((section) => (
          <div key={section.section}>
            <p className="px-4 text-xs font-mono font-bold text-muted uppercase tracking-widest mb-1">
              {section.section}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                // Active if exact match OR sub-path (but not just the portal root for children)
                const isActive = item.href === "/doctor-portal"
                  ? pathname === "/doctor-portal"
                  : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn("nav-item", isActive && "active")}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="w-5 h-5 rounded-full bg-teal-500 text-white text-xs
                                       flex items-center justify-center font-mono font-bold">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-subtle space-y-2">
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                        bg-teal-500/8 border border-teal-500/20">
          <Zap className="w-4 h-4 text-teal-400" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-display font-semibold text-teal-400">VitaConnect Pro</p>
            <p className="text-xs text-muted truncate">Doctor subscription active</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          className="nav-item w-full text-accent-coral hover:bg-accent-coral/10"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-surface-950 bg-grid">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar />

      <div className="lg:pl-72">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-subtle safe-top"
          style={{ background: "rgba(10,15,30,0.85)", backdropFilter: "blur(16px)" }}>
          <div className="flex items-center gap-3 px-4 lg:px-8 h-16">
            <button className="lg:hidden text-secondary hover:text-primary"
              onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>

            {/* Search */}
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input className="input pl-10 h-9 text-sm py-0"
                placeholder="Search patients, appointments, records…" />
            </div>

            <div className="ml-auto flex items-center gap-3">
              {/* Quick availability pill in topbar */}
              <button
                onClick={toggleAvailability}
                disabled={togglingAvail}
                className={cn(
                  "hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs",
                  "font-display font-semibold border transition-all duration-200",
                  available
                    ? "bg-teal-500/12 border-teal-500/30 text-teal-400 hover:bg-teal-500/20"
                    : "bg-surface-800/60 border-subtle text-muted hover:border-teal-500/25",
                  togglingAvail && "opacity-60 cursor-wait",
                )}
              >
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  available ? "bg-teal-400 animate-pulse" : "bg-surface-500",
                )} />
                {available ? "Available now" : "Set available"}
              </button>

              {/* Notifications */}
              <button className="relative p-2 rounded-xl hover:bg-surface-800/60 text-secondary
                                 hover:text-primary transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent-coral" />
              </button>

              {/* Avatar */}
              <Link href="/doctor-portal/profile">
                {doctor?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={doctor.image} alt={doctor.name}
                    className="w-8 h-8 rounded-xl object-cover cursor-pointer" />
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-teal-600/30 border border-teal-500/30
                                  flex items-center justify-center cursor-pointer">
                    <span className="text-teal-400 font-display font-bold text-xs">{initials}</span>
                  </div>
                )}
              </Link>
            </div>
          </div>
        </header>

        <main className="px-4 lg:px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}