"use client";

import { useEffect, useState, useCallback } from "react";
import { TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";

interface HealthMetric {
  id:         string;
  type:       string;
  value:      number;
  value2?:    number | null;
  unit:       string;
  recordedAt: string;
  isAbnormal: boolean;
}

const METRICS = [
  { id: "hr",     apiType: "HEART_RATE",       label: "Heart Rate", unit: "bpm",   color: "#f87171" },
  { id: "bp",     apiType: "BLOOD_PRESSURE",    label: "Systolic BP",unit: "mmHg",  color: "#60a5fa" },
  { id: "o2",     apiType: "OXYGEN_SATURATION", label: "SpO2",       unit: "%",     color: "#2dd4bf" },
  { id: "steps",  apiType: "STEPS",             label: "Steps",      unit: "steps", color: "#fb923c" },
] as const;

type MetricId = typeof METRICS[number]["id"];

const CustomTooltip = ({
  active,
  payload,
}: {
  active?:  boolean;
  payload?: Array<{ value: number }>;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass px-2 py-1 text-xs font-mono text-primary border border-subtle">
      {payload[0].value}
    </div>
  );
};

export function RecentMetrics() {
  const [active, setActive] = useState<MetricId>("hr");

  const [history, setHistory] = useState<Record<MetricId, HealthMetric[]>>(
    () => ({ hr: [], bp: [], o2: [], steps: [] })
  );
  const [loading, setLoading] = useState<Record<MetricId, boolean>>(
    () => ({ hr: true, bp: true, o2: true, steps: true })
  );
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadAll = useCallback(async () => {
    setLoading({ hr: true, bp: true, o2: true, steps: true });

    await Promise.allSettled(
      METRICS.map(async (m) => {
        try {
          const res = await fetch(
            `/api/health-data/sync?type=${m.apiType}&days=7`,
            { cache: "no-store" }
          );
          if (!res.ok) return;
          const { metrics } = (await res.json()) as { metrics: HealthMetric[] };
          const ordered = Array.isArray(metrics) ? [...metrics].reverse() : [];
          setHistory((prev) => ({ ...prev, [m.id]: ordered }));
        } catch {
          // leave empty — card shows "—"
        } finally {
          setLoading((prev) => ({ ...prev, [m.id]: false }));
        }
      })
    );

    setLastUpdated(new Date());
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  function getCardData(id: MetricId) {
    const h      = history[id];
    const latest = h.at(-1) ?? null;
    const oldest = h[0]     ?? null;

    // BP: value = systolic, value2 = diastolic — display as "118/76"
    const current = latest
      ? id === "bp" && latest.value2 != null
        ? `${Math.round(latest.value)}/${Math.round(latest.value2)}`
        : id === "steps"
        ? Math.round(latest.value).toLocaleString()
        : String(Math.round(latest.value * 10) / 10)
      : null;

    let trend: "up" | "down" | "stable" = "stable";
    let change = "0";

    if (latest && oldest && h.length >= 2) {
      const diff = Math.round(latest.value - oldest.value);
      if (Math.abs(diff) >= 1) {
        trend  = diff > 0 ? "up" : "down";
        change = diff > 0 ? `+${diff}` : `−${Math.abs(diff)}`;
      }
    }

    return { latest, current, trend, change };
  }

  const activeMeta = METRICS.find((m) => m.id === active)!;
  const activeHist = history[active];
  const chartData  = activeHist.map((m, i) => ({
    time:  i,
    value: Math.round(m.value * 10) / 10,
  }));

  const anyLoading = Object.values(loading).some(Boolean);

  return (
    <div className="glass p-5 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-display font-bold text-primary">7-Day Trends</h2>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs text-muted font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
              {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            onClick={loadAll}
            disabled={anyLoading}
            className="btn-ghost text-xs py-1 px-2.5 flex items-center gap-1.5"
          >
            <RefreshCw className={cn("w-3 h-3", anyLoading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Metric selector */}
      <div className="grid grid-cols-2 gap-2">
        {METRICS.map((m) => {
          const { current, trend, change } = getCardData(m.id);
          const isLoading = loading[m.id];

          return (
            <button
              key={m.id}
              onClick={() => setActive(m.id)}
              className={cn(
                "p-3 rounded-xl border text-left transition-all duration-200",
                active === m.id
                  ? "border-brand-500/40 bg-brand-500/10"
                  : "border-subtle hover:border-brand-500/25 hover:bg-surface-800/40"
              )}
            >
              {/* Label + trend icon */}
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-display text-muted">{m.label}</span>
                {isLoading ? (
                  <div className="w-3 h-3 rounded-full bg-surface-700/40 animate-pulse" />
                ) : trend === "up" ? (
                  <TrendingUp className="w-3 h-3 text-rose-400" />
                ) : trend === "down" ? (
                  <TrendingDown className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Minus className="w-3 h-3 text-muted" />
                )}
              </div>

              {/* Value */}
              {isLoading ? (
                <div className="h-6 w-14 rounded bg-surface-700/40 animate-pulse mb-1" />
              ) : (
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-display font-bold text-primary">
                    {current ?? "—"}
                  </span>
                  {current != null && (
                    <span className="text-xs font-mono text-muted">{m.unit}</span>
                  )}
                </div>
              )}

              {/* Change */}
              {isLoading ? (
                <div className="h-3 w-20 rounded bg-surface-700/30 animate-pulse mt-1" />
              ) : (
                <span className={cn(
                  "text-xs font-mono",
                  trend === "up"   ? "text-rose-400"    :
                  trend === "down" ? "text-emerald-400" :
                  "text-muted"
                )}>
                  {current != null
                    ? change !== "0" ? `${change} vs last week` : "Stable"
                    : "No data yet"}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-subtle p-4 bg-surface-900/30">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-display font-semibold text-primary">
            {activeMeta.label}
          </span>
          <span className="text-xs font-mono text-muted">
            {loading[active]
              ? "Loading…"
              : chartData.length > 0
              ? `Past ${chartData.length} readings`
              : "No data"}
          </span>
        </div>

        {loading[active] ? (
          <div className="h-[100px] flex items-center justify-center">
            <RefreshCw className="w-4 h-4 text-muted animate-spin" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-[100px] flex items-center justify-center">
            <p className="text-xs text-muted font-display">
              No {activeMeta.label} data — sync from Health Connect
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={100}>
            <LineChart data={chartData}>
              <Line
                type="monotone"
                dataKey="value"
                stroke={activeMeta.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: activeMeta.color }}
              />
              <Tooltip content={<CustomTooltip />} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}