"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Calendar, Activity, Users, FileText,
  MessageSquare, Settings, Bell, Search, Menu, X,
  ChevronRight, Heart, Pill, TestTube2, Video, LogOut,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard",      icon: LayoutDashboard, label: "Dashboard",      badge: null },
  { href: "/appointments",   icon: Calendar,        label: "Appointments",   badge: "2" },
  { href: "/health-data",    icon: Activity,        label: "Health Data",    badge: null },
  { href: "/doctors",        icon: Users,           label: "Find Doctors",   badge: null },
  { href: "/messages",       icon: MessageSquare,   label: "Messages",       badge: "5" },
  { href: "/prescriptions",  icon: Pill,            label: "Prescriptions",  badge: null },
  { href: "/lab-results",    icon: TestTube2,       label: "Lab Results",    badge: "1" },
  { href: "/video",          icon: Video,           label: "Video Consult",  badge: null },
  { href: "/records",        icon: FileText,        label: "Medical Records",badge: null },
  { href: "/profile",        icon: Settings,        label: "Settings",       badge: null },
];

interface Props { children: React.ReactNode }

export function DashboardLayout({ children }: Props) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const Sidebar = () => (
    <aside className={cn(
      "fixed inset-y-0 left-0 z-50 w-72 flex flex-col",
      "glass-strong border-r border-subtle",
      "transition-transform duration-300 lg:translate-x-0 safe-top",
      sidebarOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-subtle">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center
                          shadow-glow-sm flex-shrink-0">
            <Heart className="w-4 h-4 text-white" fill="white" />
          </div>
          <div>
            <span className="font-display font-bold text-lg text-primary">VitaConnect</span>
            <span className="block text-xs text-muted font-mono">Telehealth Platform</span>
          </div>
        </Link>
        <button
          className="lg:hidden text-secondary hover:text-primary"
          onClick={() => setSidebarOpen(false)}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* User card */}
      <div className="mx-4 mt-4 p-3 rounded-xl bg-surface-800/50 border border-subtle flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-600/30 border border-brand-500/30
                        flex items-center justify-center flex-shrink-0">
          <span className="text-brand-400 font-display font-bold text-sm">AJ</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-display font-semibold text-primary truncate">Alex Johnson</p>
          <p className="text-xs text-muted truncate">Patient #HC-4829</p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted flex-shrink-0 ml-auto" />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        <p className="px-4 text-xs font-mono font-bold text-muted uppercase tracking-widest mb-2">
          Main Menu
        </p>
        {NAV_ITEMS.slice(0, 5).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setSidebarOpen(false)}
            className={cn("nav-item", pathname === item.href && "active")}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <span className="w-5 h-5 rounded-full bg-brand-500 text-white text-xs
                               flex items-center justify-center font-mono font-bold">
                {item.badge}
              </span>
            )}
          </Link>
        ))}

        <p className="px-4 text-xs font-mono font-bold text-muted uppercase tracking-widest mb-2 mt-4">
          Medical
        </p>
        {NAV_ITEMS.slice(5).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setSidebarOpen(false)}
            className={cn("nav-item", pathname === item.href && "active")}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <span className="w-5 h-5 rounded-full bg-accent-coral text-white text-xs
                               flex items-center justify-center font-mono font-bold">
                {item.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-subtle space-y-2">
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                        bg-accent-teal/8 border border-teal-500/20">
          <Zap className="w-4 h-4 text-accent-teal" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-display font-semibold text-accent-teal">Health Connect</p>
            <p className="text-xs text-muted truncate">Android synced</p>
          </div>
          <span className="pulse-dot text-accent-green w-2 h-2" />
        </div>
        <button className="nav-item w-full text-accent-coral hover:bg-accent-coral/10">
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-surface-950 bg-grid">
      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar />

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-subtle safe-top"
                style={{ background: "rgba(10,15,30,0.85)", backdropFilter: "blur(16px)" }}>
          <div className="flex items-center gap-3 px-4 lg:px-8 h-16">
            <button
              className="lg:hidden text-secondary hover:text-primary"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Search */}
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                className="input pl-10 h-9 text-sm py-0"
                placeholder="Search doctors, records, symptoms…"
              />
            </div>

            <div className="ml-auto flex items-center gap-2">
              <button className="relative p-2 rounded-xl hover:bg-surface-800/60 text-secondary
                                 hover:text-primary transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent-coral" />
              </button>
              <div className="w-8 h-8 rounded-xl bg-brand-600/30 border border-brand-500/30
                              flex items-center justify-center cursor-pointer">
                <span className="text-brand-400 font-display font-bold text-xs">AJ</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="px-4 lg:px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
