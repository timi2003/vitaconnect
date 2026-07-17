"use client";

import { useEffect, useState } from "react";
import {
  Heart, Wind, Brain,
  Activity, Moon, Scale, Flame, RefreshCw,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface HealthMetric {
  id: string;
  type: string;
  value: number;
  value2?: number | null;
  unit: string;
  recordedAt: string;
  isAbnormal: boolean;
}

interface MetricState {
  loading: boolean;
  metric: HealthMetric | null;
}

// ── Metric definitions ────────────────────────────────────────────────────────
// Order: Heart Rate, O2, Calories, Weight, Steps, Stress Level, Sleep
const METRIC_DEFS = [
  {
    id: "hr",
    apiType: "HEART_RATE",
    label: "Heart Rate",
    unit: "bpm",
    icon: Heart,
    gradient: "from-rose-500/20 to-orange-500/10",
    border: "border-rose-500/20",
    iconColor: "text-rose-400",
    progressColor: "bg-rose-400",
    range: "60–100",
    calcProgress: (v: number) => Math.min(100, Math.max(0, ((v - 60) / 40) * 100)),
    formatValue: (v: number) => String(Math.round(v)),
    formatTrend: (m: HealthMetric) => (m.isAbnormal ? "⚠ Check" : "Normal"),
  },
  {
    id: "o2",
    apiType: "OXYGEN_SATURATION",
    label: "Oxygen Sat.",
    unit: "%",
    icon: Wind,
    gradient: "from-teal-500/20 to-cyan-500/10",
    border: "border-teal-500/20",
    iconColor: "text-teal-400",
    progressColor: "bg-teal-400",
    range: "95–100",
    calcProgress: (v: number) => Math.min(100, Math.max(0, ((v - 90) / 10) * 100)),
    formatValue: (v: number) => String(Math.round(v)),
    formatTrend: (m: HealthMetric) => (m.isAbnormal ? "⚠ Low" : "Normal"),
  },
  {
    id: "calories",
    apiType: "CALORIES_BURNED",
    label: "Active Calories",
    unit: "kcal",
    icon: Flame,
    gradient: "from-orange-500/20 to-red-500/10",
    border: "border-orange-500/20",
    iconColor: "text-orange-400",
    progressColor: "bg-orange-400",
    range: "Goal: 500 kcal",
    calcProgress: (v: number) => Math.min(100, (v / 500) * 100),
    formatValue: (v: number) => Math.round(v).toLocaleString(),
    formatTrend: (m: HealthMetric) => {
      const pct = Math.round((m.value / 500) * 100);
      if (pct >= 100) return "Goal met!";
      if (pct >= 50)  return `${pct}% goal`;
      return "Keep going";
    },
  },
  {
    id: "weight",
    apiType: "WEIGHT",
    label: "Weight",
    unit: "kg",
    icon: Scale,
    gradient: "from-emerald-500/20 to-green-500/10",
    border: "border-emerald-500/20",
    iconColor: "text-emerald-400",
    progressColor: "bg-emerald-400",
    range: "Tracked",
    calcProgress: (_v: number) => 60,
    formatValue: (v: number) => v.toFixed(1),
    formatTrend: (_m: HealthMetric) => "Logged",
  },
  {
    id: "steps",
    apiType: "STEPS",
    label: "Steps Today",
    unit: "steps",
    icon: Activity,
    gradient: "from-violet-500/20 to-purple-500/10",
    border: "border-violet-500/20",
    iconColor: "text-violet-400",
    progressColor: "bg-violet-400",
    range: "Goal: 10,000",
    calcProgress: (v: number) => Math.min(100, (v / 10_000) * 100),
    formatValue: (v: number) => Math.round(v).toLocaleString(),
    formatTrend: (m: HealthMetric) => {
      const pct = Math.round((m.value / 10_000) * 100);
      return `${pct}% goal`;
    },
  },
  // ── Last two ──────────────────────────────────────────────────────────────
  {
    id: "stress",
    apiType: "STRESS_LEVEL",
    label: "Stress Level",
    unit: "",
    icon: Brain,
    gradient: "from-blue-500/20 to-cyan-500/10",
    border: "border-blue-500/20",
    iconColor: "text-blue-400",
    progressColor: "bg-blue-400",
    range: "0–100",
    calcProgress: (v: number) => Math.min(100, Math.max(0, v)),
    formatValue: (v: number) => String(Math.round(v)),
    formatTrend: (m: HealthMetric) => {
      if (m.isAbnormal)  return "⚠ High";
      if (m.value >= 60) return "Moderate";
      if (m.value >= 30) return "Mild";
      return "Relaxed";
    },
  },
  {
    id: "sleep",
    apiType: "SLEEP_DURATION",
    label: "Last Sleep",
    unit: "",
    icon: Moon,
    gradient: "from-indigo-500/20 to-blue-500/10",
    border: "border-indigo-500/20",
    iconColor: "text-indigo-400",
    progressColor: "bg-indigo-400",
    range: "7–9h",
    calcProgress: (v: number) => Math.min(100, Math.max(0, (v / 540) * 100)),
    formatValue: (v: number) => {
      const h = Math.floor(v / 60);
      const m = Math.round(v % 60);
      return m > 0 ? `${h}h ${m}m` : `${h}h`;
    },
    formatTrend: (m: HealthMetric) => {
      const hours = m.value / 60;
      if (hours >= 7 && hours <= 9) return "Good";
      if (hours < 6) return "⚠ Short";
      return "Fair";
    },
  },
] as const;

// ── Fetch helpers ──────────────────────────────────────────────────────────────

async function fetchLatestMetric(apiType: string): Promise<HealthMetric | null> {
  try {
    const res = await fetch(
      `/api/health-data/sync?type=${apiType}&days=7`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const { metrics } = (await res.json()) as { metrics: HealthMetric[] };
    return metrics?.[0] ?? null;
  } catch {
    return null;
  }
}

async function fetchProfileWeight(): Promise<HealthMetric | null> {
  try {
    const res = await fetch("/api/profile", { cache: "no-store" });
    if (!res.ok) return null;
    const { user } = (await res.json()) as {
      user: { weight: number | null };
    };
    if (user?.weight == null) return null;
    return {
      id: "profile-weight",
      type: "WEIGHT",
      value: user.weight,
      value2: null,
      unit: "kg",
      recordedAt: new Date().toISOString(),
      isAbnormal: false,
    };
  } catch {
    return null;
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function HealthOverview() {
  const [states, setStates] = useState<Record<string, MetricState>>(
    () =>
      Object.fromEntries(
        METRIC_DEFS.map((d) => [d.id, { loading: true, metric: null }])
      )
  );

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadAll = async () => {
    setStates((prev) =>
      Object.fromEntries(
        Object.keys(prev).map((k) => [k, { loading: true, metric: prev[k].metric }])
      )
    );

    await Promise.allSettled(
      METRIC_DEFS.map(async (def) => {
        let metric = await fetchLatestMetric(def.apiType);

        if (def.id === "weight" && !metric) {
          metric = await fetchProfileWeight();
        }

        setStates((prev) => ({
          ...prev,
          [def.id]: { loading: false, metric },
        }));
      })
    );

    setLastUpdated(new Date());
  };

  useEffect(() => {
    loadAll();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const anyLoading = Object.values(states).some((s) => s.loading);

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-display font-bold text-primary">
          Live Health Metrics
        </h2>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-muted font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
              Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            onClick={loadAll}
            disabled={anyLoading}
            className="btn-ghost text-xs py-1 px-2.5 flex items-center gap-1.5"
            aria-label="Refresh metrics"
          >
            <RefreshCw className={`w-3 h-3 ${anyLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
        {METRIC_DEFS.map((def) => {
          const { loading, metric } = states[def.id];
          const Icon = def.icon;

          const displayValue = metric
            ? "formatValue" in def
              ? (def.formatValue as (v: number, m?: HealthMetric) => string)(metric.value, metric)
              : String(metric.value)
            : null;

          const trend = metric ? def.formatTrend(metric) : null;
          const progress = metric ? def.calcProgress(metric.value) : 0;
          const isAbnormal = metric?.isAbnormal ?? false;

          return (
            <div
              key={def.id}
              className={`metric-card p-4 bg-gradient-to-br ${def.gradient}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-8 h-8 rounded-lg bg-surface-900/60 flex items-center justify-center border ${def.border}`}
                >
                  <Icon className={`w-4 h-4 ${def.iconColor}`} />
                </div>

                {loading ? (
                  <span className="h-5 w-14 rounded-full bg-surface-700/50 animate-pulse" />
                ) : trend ? (
                  <span
                    className={`badge text-xs py-0.5 ${
                      isAbnormal ? "badge-error" : "badge-success"
                    }`}
                  >
                    {trend}
                  </span>
                ) : (
                  <span className="badge badge-ghost text-xs py-0.5 text-muted">
                    No data
                  </span>
                )}
              </div>

              <div className="mb-3">
                {loading ? (
                  <>
                    <div className="h-7 w-20 rounded bg-surface-700/50 animate-pulse mb-1" />
                    <div className="h-3 w-16 rounded bg-surface-700/30 animate-pulse" />
                  </>
                ) : (
                  <>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-display font-bold text-primary leading-none">
                        {displayValue ?? "—"}
                      </span>
                      {metric && def.unit && (
                        <span className="text-xs text-muted font-mono">{def.unit}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted font-display mt-0.5">{def.label}</p>
                  </>
                )}
              </div>

              <div className="progress-bar">
                {!loading && metric && (
                  <div
                    className={`progress-fill ${def.progressColor}`}
                    style={{ width: `${progress}%` }}
                  />
                )}
              </div>
              <p className="text-xs text-muted font-mono mt-1">{def.range}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}