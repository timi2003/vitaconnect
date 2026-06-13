"use client";

import Link from "next/link";
import { Video, Calendar, RefreshCw, AlertCircle, Search, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const ACTIONS = [
  {
    label: "Book Consult",
    icon: Calendar,
    href: "/appointments/new",
    accent: "brand",
    gradient: "from-brand-500/20 to-brand-600/10",
    border: "border-brand-500/25",
    iconColor: "text-brand-400",
  },
  {
    label: "Video Call Now",
    icon: Video,
    href: "/video",
    accent: "teal",
    gradient: "from-teal-500/20 to-teal-600/10",
    border: "border-teal-500/25",
    iconColor: "text-teal-400",
  },
  {
    label: "Find Doctor",
    icon: Search,
    href: "/doctors",
    accent: "purple",
    gradient: "from-violet-500/20 to-purple-600/10",
    border: "border-violet-500/25",
    iconColor: "text-violet-400",
  },
  {
    label: "My Records",
    icon: FileText,
    href: "/records",
    accent: "amber",
    gradient: "from-amber-500/20 to-amber-600/10",
    border: "border-amber-500/25",
    iconColor: "text-amber-400",
  },
  {
    label: "Emergency",
    icon: AlertCircle,
    href: "/emergency",
    accent: "coral",
    gradient: "from-rose-500/20 to-red-600/10",
    border: "border-rose-500/25",
    iconColor: "text-rose-400",
  },
];

interface Props {
  onSync: () => void;
  isSyncing: boolean;
}

export function QuickActions({ onSync, isSyncing }: Props) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
      {ACTIONS.map((a) => (
        <Link
          key={a.href}
          href={a.href}
          className={cn(
            "flex-shrink-0 flex flex-col items-center gap-2 p-3.5 rounded-2xl",
            "glass border transition-all duration-200 hover:scale-105 cursor-pointer",
            `bg-gradient-to-br ${a.gradient} ${a.border}`,
            "w-20 group"
          )}
        >
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            "bg-surface-950/60 border border-white/5 group-hover:border-white/10",
            "transition-all duration-200"
          )}>
            <a.icon className={cn("w-5 h-5", a.iconColor)} />
          </div>
          <span className="text-xs font-display font-semibold text-secondary text-center leading-tight">
            {a.label}
          </span>
        </Link>
      ))}

      {/* Sync button */}
      <button
        onClick={onSync}
        disabled={isSyncing}
        className={cn(
          "flex-shrink-0 flex flex-col items-center gap-2 p-3.5 rounded-2xl",
          "glass border border-emerald-500/25 transition-all duration-200 hover:scale-105",
          "bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 w-20 group"
        )}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center
                        bg-surface-950/60 border border-white/5 group-hover:border-white/10">
          <RefreshCw className={cn("w-5 h-5 text-emerald-400", isSyncing && "animate-spin")} />
        </div>
        <span className="text-xs font-display font-semibold text-secondary text-center leading-tight">
          {isSyncing ? "Syncing…" : "Sync HC"}
        </span>
      </button>
    </div>
  );
}
