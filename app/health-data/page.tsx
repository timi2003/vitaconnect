"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useHealthConnect } from "@/hooks/useHealthConnect";
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Heart, Activity, Droplets, Wind, Thermometer,
  Moon, Scale, Footprints, RefreshCw, Download,
  Filter, Wifi, WifiOff, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const METRIC_TABS = [
  { id: "HEART_RATE",        label: "Heart Rate",  icon: Heart,       color: "#f87171", unit: "bpm"         },
  { id: "BLOOD_PRESSURE",    label: "Blood Press.",icon: Activity,    color: "#60a5fa", unit: "mmHg"        },
  { id: "BLOOD_GLUCOSE",     label: "Glucose",     icon: Droplets,    color: "#fbbf24", unit: "mg/dL"       },
  { id: "OXYGEN_SATURATION", label: "SpO2",        icon: Wind,        color: "#2dd4bf", unit: "%"           },
  { id: "BODY_TEMPERATURE",  label: "Temperature", icon: Thermometer, color: "#a78bfa", unit: "°C"          },
  { id: "SLEEP_DURATION",    label: "Sleep",       icon: Moon,        color: "#818cf8", unit: "min"         },
  { id: "WEIGHT",            label: "Weight",      icon: Scale,       color: "#4ade80", unit: "kg"          },
  { id: "STEPS",             label: "Steps",       icon: Footprints,  color: "#fb923c", unit: "steps"       },
];

const RANGE_OPTIONS = [
  { label: "7 Days",  days: 7  },
  { label: "30 Days", days: 30 },
  { label: "90 Days", days: 90 },
];

interface MetricRow {
  day:   number;
  value: number;
  date:  string;
}

const CustomTooltip = ({
  active, payload, label, unit,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  unit?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong px-3 py-2 border border-subtle text-xs">
      <p className="text-muted mb-0.5 font-mono">{label}</p>
      <p className="font-display font-bold text-primary">
        {payload[0].value}{" "}
        <span className="text-muted font-normal">{unit}</span>
      </p>
    </div>
  );
};

export default function HealthDataPage() {
  const hc = useHealthConnect();

  const [activeMetric, setActiveMetric] = useState("HEART_RATE");
  const [range,        setRange]        = useState(7);
  const [chartType,    setChartType]    = useState<"line" | "area">("area");
  const [chartData,    setChartData]    = useState<MetricRow[]>([]);
  const [loadingChart, setLoadingChart] = useState(false);

  const tab = METRIC_TABS.find((t) => t.id === activeMetric)!;

  // ── Fetch real data from server ───────────────────────────────────────────
  const fetchChartData = useCallback(async () => {
    setLoadingChart(true);
    try {
      const res = await fetch(`/api/health-data/sync?type=${activeMetric}&days=${range}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const { metrics } = await res.json();

      if (!metrics || metrics.length === 0) {
        setChartData([]);
        return;
      }

      const rows: MetricRow[] = metrics
        .slice()
        .reverse()
        .map((m: { value: number; recordedAt: string }, i: number) => ({
          day:   i + 1,
          value: Math.round(m.value * 10) / 10,
          date:  new Date(m.recordedAt).toLocaleDateString("en-US", {
            month: "short", day: "numeric",
          }),
        }));

      setChartData(rows);
    } catch {
      setChartData([]);
    } finally {
      setLoadingChart(false);
    }
  }, [activeMetric, range]);

  useEffect(() => { fetchChartData(); }, [fetchChartData]);

  // Refresh chart when a sync completes
  useEffect(() => {
    if (!hc.isSyncing && hc.lastSyncAt) fetchChartData();
  }, [hc.isSyncing, hc.lastSyncAt, fetchChartData]);

  const latest = chartData[chartData.length - 1]?.value ?? 0;
  const avg    = chartData.length
    ? Math.round((chartData.reduce((s, d) => s + d.value, 0) / chartData.length) * 10) / 10
    : 0;
  const maxVal = chartData.length ? Math.max(...chartData.map((d) => d.value)) : 0;
  const minVal = chartData.length ? Math.min(...chartData.map((d) => d.value)) : 0;

  // Live metric from HC if polling
  const liveReading = hc.liveMetrics[activeMetric];

  return (
    <DashboardLayout>
      <div className="page-enter space-y-6 pb-24 lg:pb-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-display font-bold text-primary">Health Data</h1>
            <p className="text-sm text-muted mt-0.5 flex items-center gap-2">
              {hc.isPolling ? (
                <><Wifi className="w-3.5 h-3.5 text-accent-green" /> Live · polling every 60s</>
              ) : hc.lastSyncAt ? (
                <><WifiOff className="w-3.5 h-3.5 text-muted" /> Last sync: {hc.lastSyncAt.toLocaleTimeString()}</>
              ) : (
                "Not synced yet"
              )}
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            {/* Connect HC if not available */}
            {hc.availability === "Available" && hc.grantedPermissions.length === 0 && (
              <button
                onClick={() => hc.requestPermissions()}
                className="btn-primary text-sm py-2 px-4 flex items-center gap-2"
              >
                <Heart className="w-4 h-4" />
                Connect Health Data
              </button>
            )}

            <button
              onClick={() => hc.syncToServer()}
              disabled={hc.isSyncing || !hc.isAvailable}
              className="btn-ghost text-sm py-2 px-4 flex items-center gap-2"
            >
              <RefreshCw className={cn("w-4 h-4", hc.isSyncing && "animate-spin")} />
              {hc.isSyncing ? "Syncing…" : "Sync Now"}
            </button>

            <button
              onClick={fetchChartData}
              className="btn-ghost text-sm py-2 px-4 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* HC not available warning */}
        {hc.availability === "WebOnly" && (
          <div className="glass border border-amber-500/25 bg-amber-500/5 p-4 flex gap-3">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-secondary">
              Health Connect is only available in the Android app.
              Data shown below is from your manual entries and previous syncs.
            </p>
          </div>
        )}

        {/* Live reading banner */}
        {liveReading && (
          <div className="glass border border-accent-green/25 bg-accent-green/5 p-3 flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse flex-shrink-0" />
            <p className="text-sm text-secondary">
              <span className="text-accent-green font-semibold">Live reading: </span>
              {tab.label} —{" "}
              <span className="font-mono font-bold text-primary">
                {liveReading.beatsPerMinute ??
                 liveReading.count ??
                 liveReading.rate ??
                 liveReading.percentage ??
                 (liveReading.level?.value) ??
                 (liveReading.weight?.inKilograms) ??
                 (liveReading.temperature?.inCelsius) ?? "—"}{" "}
                {tab.unit}
              </span>
            </p>
          </div>
        )}

        {/* Metric tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {METRIC_TABS.map((m) => (
            <button key={m.id} onClick={() => setActiveMetric(m.id)}
              className={cn(
                "flex-shrink-0 flex items-center gap-2 px-3.5 py-2.5 rounded-xl border",
                "text-sm font-display font-medium transition-all duration-200",
                activeMetric === m.id
                  ? "border-brand-500/40 bg-brand-500/12 text-brand-300"
                  : "border-subtle text-muted hover:border-brand-500/25 hover:text-secondary"
              )}>
              <m.icon className="w-3.5 h-3.5"
                style={{ color: activeMetric === m.id ? m.color : undefined }} />
              {m.label}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Latest",  value: `${latest} ${tab.unit}` },
            { label: "Average", value: `${avg} ${tab.unit}` },
            { label: "Max",     value: `${maxVal} ${tab.unit}` },
            { label: "Min",     value: `${minVal} ${tab.unit}` },
          ].map((s) => (
            <div key={s.label} className="glass p-4 border border-subtle">
              <p className="text-xs text-muted font-display mb-1">{s.label}</p>
              <p className="text-xl font-display font-bold text-primary">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="glass p-5 border border-subtle">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
            <div className="flex items-center gap-2">
              <tab.icon className="w-4 h-4" style={{ color: tab.color }} />
              <h2 className="text-sm font-display font-bold text-primary">{tab.label} Trend</h2>
              {loadingChart && (
                <RefreshCw className="w-3.5 h-3.5 text-muted animate-spin" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-xl border border-subtle overflow-hidden">
                {RANGE_OPTIONS.map((r) => (
                  <button key={r.days} onClick={() => setRange(r.days)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-display font-medium transition-colors",
                      range === r.days ? "bg-brand-500/20 text-brand-300" : "text-muted hover:text-secondary"
                    )}>
                    {r.label}
                  </button>
                ))}
              </div>
              <div className="flex rounded-xl border border-subtle overflow-hidden">
                {(["area", "line"] as const).map((t) => (
                  <button key={t} onClick={() => setChartType(t)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-display font-medium transition-colors capitalize",
                      chartType === t ? "bg-brand-500/20 text-brand-300" : "text-muted hover:text-secondary"
                    )}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {chartData.length === 0 ? (
            <div className="h-60 flex flex-col items-center justify-center gap-3">
              {loadingChart ? (
                <RefreshCw className="w-8 h-8 text-muted animate-spin" />
              ) : (
                <>
                  <tab.icon className="w-10 h-10 text-muted opacity-40" />
                  <p className="text-sm text-muted font-display">No {tab.label} data yet</p>
                  <p className="text-xs text-muted">
                    {hc.isAvailable
                      ? "Tap Sync Now to import from Health Connect"
                      : "Connect the Android app to sync health data"}
                  </p>
                </>
              )}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              {chartType === "area" ? (
                <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={tab.color} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={tab.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,140,232,0.06)" />
                  <XAxis dataKey="date" tick={{ fill:"#4d6fa8", fontSize:10 }}
                         tickLine={false} axisLine={false}
                         interval={Math.max(0, Math.floor(chartData.length / 6))} />
                  <YAxis tick={{ fill:"#4d6fa8", fontSize:10 }} tickLine={false} axisLine={false} width={40} />
                  <Tooltip content={<CustomTooltip unit={tab.unit} />} />
                  <Area type="monotone" dataKey="value" stroke={tab.color} strokeWidth={2}
                        fill="url(#grad)" dot={false}
                        activeDot={{ r:4, fill:tab.color, strokeWidth:0 }} />
                </AreaChart>
              ) : (
                <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,140,232,0.06)" />
                  <XAxis dataKey="date" tick={{ fill:"#4d6fa8", fontSize:10 }}
                         tickLine={false} axisLine={false}
                         interval={Math.max(0, Math.floor(chartData.length / 6))} />
                  <YAxis tick={{ fill:"#4d6fa8", fontSize:10 }} tickLine={false} axisLine={false} width={40} />
                  <Tooltip content={<CustomTooltip unit={tab.unit} />} />
                  <Line type="monotone" dataKey="value" stroke={tab.color} strokeWidth={2.5}
                        dot={false} activeDot={{ r:4, fill:tab.color, strokeWidth:0 }} />
                </LineChart>
              )}
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent readings */}
        <div className="glass border border-subtle overflow-hidden">
          <div className="px-5 py-4 border-b border-subtle flex items-center justify-between">
            <h2 className="text-sm font-display font-bold text-primary">Recent Readings</h2>
            <button className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5">
              <Filter className="w-3 h-3" /> Filter
            </button>
          </div>
          <div className="divide-y divide-subtle">
            {chartData.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-muted font-display">No readings to display</p>
              </div>
            ) : (
              chartData.slice(-8).reverse().map((d, i) => (
                <div key={i}
                  className="flex items-center justify-between px-5 py-3 hover:bg-surface-800/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <tab.icon className="w-4 h-4 flex-shrink-0" style={{ color: tab.color }} />
                    <span className="text-sm font-display text-secondary">{tab.label}</span>
                  </div>
                  <span className="text-sm font-mono font-bold text-primary">
                    {d.value}{" "}
                    <span className="text-muted font-normal">{tab.unit}</span>
                  </span>
                  <span className="text-xs text-muted font-mono">{d.date}</span>
                  <span className="badge badge-success text-xs py-0.5">Recorded</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}