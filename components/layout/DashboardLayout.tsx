"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Calendar, Activity, Users, FileText,
  MessageSquare, Settings, Bell, Search, Menu, X,
  ChevronRight, Heart, Pill, TestTube2, Video, LogOut,
  Zap,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard",     icon: LayoutDashboard, label: "Dashboard",       badge: null },
  { href: "/appointments",  icon: Calendar,        label: "Appointments",    badge: "2"  },
  { href: "/health-data",   icon: Activity,        label: "Health Data",     badge: null },
  { href: "/doctors",       icon: Users,           label: "Find Doctors",    badge: null },
  { href: "/messages",      icon: MessageSquare,   label: "Messages",        badge: "5"  },
  { href: "/prescriptions", icon: Pill,            label: "Prescriptions",   badge: null },
  { href: "/lab-results",   icon: TestTube2,       label: "Lab Results",     badge: "1"  },
  { href: "/video",         icon: Video,           label: "Video Consult",   badge: null },
  { href: "/records",       icon: FileText,        label: "Medical Records", badge: null },
  { href: "/profile",       icon: Settings,        label: "Settings",        badge: null },
];

type UserSnippet = {
  name:  string;
  email: string;
  image: string | null;
  role:  string;
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

export function DashboardLayout({ children }: Props) {
  const pathname    = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<UserSnippet | null>(null);

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.user) {
          setUser({
            name:  data.user.name  ?? "User",
            email: data.user.email ?? "",
            image: data.user.image ?? null,
            role:  data.user.role  ?? "PATIENT",
          });
        }
      })
      .catch(() => null);
  }, []);

  const initials    = user ? getInitials(user.name) : "…";
  const displayName = user?.name  ?? "Loading…";
  const displaySub  = user?.email ?? "";

  const UserCard = () => (
    <div className="mx-4 mt-4 p-3 rounded-xl bg-surface-800/50 border border-subtle flex items-center gap-3">
      {user?.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.image}
          alt={user.name}
          className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-10 h-10 rounded-xl bg-brand-600/30 border border-brand-500/30
                        flex items-center justify-center flex-shrink-0">
          <span className="text-brand-400 font-display font-bold text-sm">{initials}</span>
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm font-display font-semibold text-primary truncate">{displayName}</p>
        <p className="text-xs text-muted truncate">{displaySub}</p>
      </div>
      <Link href="/profile">
        <ChevronRight className="w-4 h-4 text-muted flex-shrink-0 ml-auto" />
      </Link>
    </div>
  );

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

      <UserCard />

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
        <button className="nav-item w-full text-accent-coral hover:bg-accent-coral/10" onClick={() => signOut({ callbackUrl: "/auth/login" })}>
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-surface-950 bg-grid">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar />

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

              {/* Top-bar avatar — mirrors sidebar card */}
              <Link href="/profile">
                {user?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.image}
                    alt={user.name}
                    className="w-8 h-8 rounded-xl object-cover cursor-pointer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-brand-600/30 border border-brand-500/30
                                  flex items-center justify-center cursor-pointer">
                    <span className="text-brand-400 font-display font-bold text-xs">{initials}</span>
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