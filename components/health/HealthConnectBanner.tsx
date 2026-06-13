"use client";

import { Smartphone, RefreshCw, AlertCircle, ExternalLink, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  availability: "checking" | "Available" | "NotInstalled" | "NotSupported" | "WebOnly";
  onConnect: () => void;
  isSyncing: boolean;
}

export function HealthConnectBanner({ availability, onConnect, isSyncing }: Props) {
  if (availability === "WebOnly") return null;

  const isInstalled = availability === "Available";
  const needsInstall = availability === "NotInstalled";

  return (
    <div className={cn(
      "glass relative overflow-hidden p-4 border",
      isInstalled
        ? "border-brand-500/30 bg-brand-500/5"
        : "border-amber-500/30 bg-amber-500/5"
    )}>
      {/* Glow */}
      <div className={cn(
        "absolute -top-12 -right-12 w-36 h-36 rounded-full blur-3xl opacity-20",
        isInstalled ? "bg-brand-500" : "bg-amber-500"
      )} />

      <div className="relative flex items-start gap-4">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
          isInstalled
            ? "bg-brand-500/20 border border-brand-500/30"
            : "bg-amber-500/20 border border-amber-500/30"
        )}>
          {isInstalled ? (
            <ShieldCheck className="w-5 h-5 text-brand-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-display font-semibold text-sm text-primary">
            {isInstalled
              ? "Connect Health Connect"
              : needsInstall
              ? "Install Health Connect"
              : "Health Connect Not Supported"}
          </p>
          <p className="text-xs text-secondary mt-0.5 leading-relaxed">
            {isInstalled
              ? "Sync your wearables, fitness trackers, and medical devices automatically. Grant permissions to enable real-time health monitoring."
              : needsInstall
              ? "Health Connect is required to sync your health data from wearables and devices. Install it from the Play Store."
              : "Your device doesn't support Health Connect. You can still log metrics manually."}
          </p>

          {/* Data types */}
          {isInstalled && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {["Heart Rate", "Blood Pressure", "Sleep", "Steps", "Glucose", "Oxygen"].map(t => (
                <span key={t} className="badge badge-info text-xs py-0.5">{t}</span>
              ))}
            </div>
          )}
        </div>

        <div className="flex-shrink-0">
          {isInstalled ? (
            <button
              onClick={onConnect}
              disabled={isSyncing}
              className="btn-primary py-2 px-4 text-xs flex items-center gap-2"
            >
              {isSyncing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Smartphone className="w-3.5 h-3.5" />
              )}
              {isSyncing ? "Connecting…" : "Connect"}
            </button>
          ) : needsInstall ? (
            <a
              href="https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost py-2 px-4 text-xs flex items-center gap-2 no-underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Install
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
