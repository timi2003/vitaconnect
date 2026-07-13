"use client";

import { useEffect, useState } from "react";
import { WifiOff, Wifi, RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOffline } from "@/hooks/useOffline";

export function OfflineBanner() {
  const { isOnline, queueLength, isFlushing, flushQueue } = useOffline();
  const [dismissed, setDismissed] = useState(false);
  const [visible,   setVisible]   = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setVisible(true);
      setDismissed(false);
    } else {
      // Keep banner briefly when reconnecting to show sync status
      if (visible) {
        const t = setTimeout(() => setVisible(false), 4000);
        return () => clearTimeout(t);
      }
    }
  }, [isOnline, visible]);

  if (!visible || dismissed) return null;

  return (
    <div className={cn(
      "fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md mx-auto px-4",
      "animate-slide-up"
    )}>
      <div className={cn(
        "glass-strong border rounded-2xl px-4 py-3 flex items-center gap-3 shadow-card",
        isOnline
          ? "border-accent-green/30 bg-emerald-500/10"
          : "border-amber-500/30 bg-amber-500/10"
      )}>
        {/* Icon */}
        <div className={cn(
          "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0",
          isOnline ? "bg-accent-green/20" : "bg-amber-500/20"
        )}>
          {isOnline
            ? <Wifi  className="w-4 h-4 text-accent-green" />
            : <WifiOff className="w-4 h-4 text-amber-400" />}
        </div>

        {/* Message */}
        <div className="flex-1 min-w-0">
          {isOnline ? (
            <>
              <p className="text-sm font-display font-semibold text-accent-green">
                Back online
              </p>
              <p className="text-xs text-secondary">
                {isFlushing
                  ? `Syncing ${queueLength} queued item${queueLength !== 1 ? "s" : ""}…`
                  : queueLength > 0
                  ? `${queueLength} item${queueLength !== 1 ? "s" : ""} ready to sync`
                  : "All data synced"}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-display font-semibold text-amber-300">
                You&apos;re offline
              </p>
              <p className="text-xs text-secondary">
                {queueLength > 0
                  ? `${queueLength} item${queueLength !== 1 ? "s" : ""} queued — will sync when reconnected`
                  : "Viewing cached data. Some features unavailable."}
              </p>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isOnline && queueLength > 0 && !isFlushing && (
            <button
              onClick={() => flushQueue()}
              className="p-1.5 rounded-lg hover:bg-surface-700 text-accent-green transition-colors"
              title="Sync now"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
          {isFlushing && (
            <RefreshCw className="w-3.5 h-3.5 text-accent-green animate-spin" />
          )}
          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 rounded-lg hover:bg-surface-700 text-muted transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}