"use client";

import Link from "next/link";
import { WifiOff, RefreshCw, Heart, FileText, Activity } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-surface-950 bg-grid flex items-center justify-center p-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-brand-500/8 blur-3xl" />
      </div>

      <div className="relative glass-strong border border-subtle p-10 max-w-sm w-full text-center rounded-3xl animate-slide-up">
        <div className="w-20 h-20 rounded-3xl bg-surface-800/80 border border-subtle
                        flex items-center justify-center mx-auto mb-6">
          <WifiOff className="w-9 h-9 text-muted" />
        </div>

        <div className="mb-2 flex items-center justify-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-brand-500 flex items-center justify-center">
            <Heart className="w-3 h-3 text-white" fill="white" />
          </div>
          <span className="font-display font-bold text-primary">VitaConnect</span>
        </div>

        <h1 className="text-xl font-display font-bold text-primary mb-2">
          You&apos;re offline
        </h1>
        <p className="text-sm text-secondary mb-8 leading-relaxed">
          No internet connection. Some features are unavailable, but you can still access
          your cached health records and appointments.
        </p>

        {/* Offline features */}
        <div className="space-y-2 mb-8">
          {[
            { icon: FileText, label: "View recent health records", available: true },
            { icon: Activity, label: "See cached metrics",         available: true },
            { icon: Heart,    label: "Book appointments",          available: false },
          ].map(({ icon: Icon, label, available }) => (
            <div key={label} className={`flex items-center gap-3 p-3 rounded-xl border text-left
                              ${available
                                ? "border-accent-green/20 bg-accent-green/5"
                                : "border-subtle bg-surface-800/30 opacity-50"}`}>
              <Icon className={`w-4 h-4 flex-shrink-0 ${available ? "text-accent-green" : "text-muted"}`} />
              <span className={`text-sm font-display ${available ? "text-primary" : "text-muted"}`}>{label}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
          <Link href="/health-data" className="btn-ghost flex-1 text-center">
            Cached Data
          </Link>
        </div>
      </div>
    </div>
  );
}