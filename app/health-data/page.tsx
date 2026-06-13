"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useHealthConnect } from "@/hooks/useHealthConnect";
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Heart, Activity, Droplets, Wind, Thermometer,
  Moon, Scale, Footprints, RefreshCw, Download, Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";

const METRIC_TABS = [
  { id: "HEART_RATE",        label: "Heart Rate",   icon: Heart,       color: "#f87171", unit: "bpm"      },
  { id: "BLOOD_PRESSURE",    label: "Blood Press.", icon: Activity,    color: "#60a5fa", unit: "mmHg"     },
  { id: "BLOOD_GLUCOSE",     label: "Glucose",      icon: Droplets,    color: "#fbbf24", unit: "mg/dL"    },
  { id: "OXYGEN_SATURATION", label: "SpO2",         icon: Wind,        color: "#2dd4bf", unit: "%"        },
  { id: "BODY_TEMPERATURE",  label: "Temperature",  icon: Thermometer, color: "#a78bfa", unit: "°C"       },
  { id: "SLEEP_DURATION",    label: "Sleep",        icon: Moon,        color: "#818cf8", unit: "min"      },
  { id: "WEIGHT",            label: "Weight",       icon: Scale,       color: "#4ade80", unit: "kg"       },
  { id: "STEPS",             label: "Steps",        icon: Footprints,  color: "#fb923c", unit: "steps"    },
];

const RANGE_OPTIONS = [
  { label: "7 Days",  days: 7  },
  { label: "30 Days", days: 30 },
  { label: "90 Days", days: 90 },
];

// Generate mock sparkline data
function mockData(days: number, base: number, variance: number) {
  return Array.from({ length: days }, (_, i) => ({
    day: i + 1,
    value: Math.round((base + (Math.random() - 0.5) * variance * 2) * 10) / 10,
    date: new Date(Date.now() - (days - i) * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }));
}

const DATA_GENERATORS: Record<string, (days: number) => ReturnType<typeof mockData>> = {
  HEART_RATE:        (d) => mockData(d, 72, 8),
  BLOOD_PRESSURE:    (d) => mockData(d, 118, 6),
  BLOOD_GLUCOSE:     (d) => mockData(d, 95, 12),
  OXYGEN_SATURATION: (d) => mockData(d, 97.5, 1.5),
  BODY_TEMPERATURE:  (d) => mockData(d, 36.7, 0.4),
  SLEEP_DURATION:    (d) => mockData(d, 420, 60),
  WEIGHT:            (d) => mockData(d, 73.2, 0.8),
  STEPS:             (d) => mockData(d, 7800, 3000),
};

const CustomTooltip = ({
  active, payload, label, unit,
}: {
  active?: boolean;
  payload?: Array<{ value: number; color: string }>;
  label?: string;
  unit?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong px-3 py-2 border border-subtle text-xs">
      <p className="text-muted mb-0.5 font-mono">{label}</p>
      <p className="font-display font-bold text-primary">
        {payload[0].value} <span className="text-muted font-normal">{unit}</span>
      </p>
    </div>
  );
};

export default function HealthDataPage() {
  const hc = useHealthConnect();
  const [activeMetric, setActiveMetric] = useState("HEART_RATE");
  const [range, setRange] = useState(7);
  const [chartType, setChartType] = useState<"line" | "area">("area");

  const tab = METRIC_TABS.find((t) => t.id === activeMetric)!;
  const data = DATA_GENERATORS[activeMetric]?.(range) ?? [];

  const latest  = data[data.length - 1]?.value ?? 0;
  const avg     = Math.round((data.reduce((s, d) => s + d.value, 0) / data.length) * 10) / 10;
  const maxVal  = Math.max(...data.map((d) => d.value));
  const minVal  = Math.min(...data.map((d) => d.value));

  return (
    <DashboardLayout>
      <div className="page-enter space-y-6 pb-24 lg:pb-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-display font-bold text-primary">Health Data</h1>
            <p className="text-sm text-muted mt-0.5">
              Synced from Health Connect • {hc.lastSyncAt?.toLocaleString() ?? "Not synced yet"}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => hc.syncToServer()}
              disabled={hc.isSyncing}
              className="btn-ghost text-sm py-2 px-4 flex items-center gap-2"
            >
              <RefreshCw className={cn("w-4 h-4", hc.isSyncing && "animate-spin")} />
              {hc.isSyncing ? "Syncing…" : "Sync Now"}
            </button>
            <button className="btn-ghost text-sm py-2 px-4 flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Metric tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {METRIC_TABS.map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveMetric(m.id)}
              className={cn(
                "flex-shrink-0 flex items-center gap-2 px-3.5 py-2.5 rounded-xl border",
                "text-sm font-display font-medium transition-all duration-200",
                activeMetric === m.id
                  ? "border-brand-500/40 bg-brand-500/12 text-brand-300"
                  : "border-subtle text-muted hover:border-brand-500/25 hover:text-secondary"
              )}
            >
              <m.icon className="w-3.5 h-3.5" style={{ color: activeMetric === m.id ? m.color : undefined }} />
              {m.label}
            </button>
          ))}
        </div>

        {/* Stats row */}
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
            </div>

            <div className="flex items-center gap-2">
              {/* Range */}
              <div className="flex rounded-xl border border-subtle overflow-hidden">
                {RANGE_OPTIONS.map((r) => (
                  <button key={r.days} onClick={() => setRange(r.days)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-display font-medium transition-colors",
                      range === r.days
                        ? "bg-brand-500/20 text-brand-300"
                        : "text-muted hover:text-secondary"
                    )}>
                    {r.label}
                  </button>
                ))}
              </div>

              {/* Chart type */}
              <div className="flex rounded-xl border border-subtle overflow-hidden">
                {(["area", "line"] as const).map((t) => (
                  <button key={t} onClick={() => setChartType(t)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-display font-medium transition-colors capitalize",
                      chartType === t
                        ? "bg-brand-500/20 text-brand-300"
                        : "text-muted hover:text-secondary"
                    )}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={240}>
            {chartType === "area" ? (
              <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="metricGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={tab.color} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={tab.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,140,232,0.06)" />
                <XAxis dataKey="date" tick={{ fill: "#4d6fa8", fontSize: 10 }} tickLine={false} axisLine={false}
                       interval={Math.floor(data.length / 6)} />
                <YAxis tick={{ fill: "#4d6fa8", fontSize: 10 }} tickLine={false} axisLine={false} width={40} />
                <Tooltip content={<CustomTooltip unit={tab.unit} />} />
                <Area type="monotone" dataKey="value" stroke={tab.color} strokeWidth={2}
                      fill="url(#metricGrad)" dot={false}
                      activeDot={{ r: 4, fill: tab.color, strokeWidth: 0 }} />
              </AreaChart>
            ) : (
              <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,140,232,0.06)" />
                <XAxis dataKey="date" tick={{ fill: "#4d6fa8", fontSize: 10 }} tickLine={false} axisLine={false}
                       interval={Math.floor(data.length / 6)} />
                <YAxis tick={{ fill: "#4d6fa8", fontSize: 10 }} tickLine={false} axisLine={false} width={40} />
                <Tooltip content={<CustomTooltip unit={tab.unit} />} />
                <Line type="monotone" dataKey="value" stroke={tab.color} strokeWidth={2.5}
                      dot={false} activeDot={{ r: 4, fill: tab.color, strokeWidth: 0 }} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Recent readings table */}
        <div className="glass border border-subtle overflow-hidden">
          <div className="px-5 py-4 border-b border-subtle flex items-center justify-between">
            <h2 className="text-sm font-display font-bold text-primary">Recent Readings</h2>
            <button className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5">
              <Filter className="w-3 h-3" /> Filter
            </button>
          </div>
          <div className="divide-y divide-subtle">
            {data.slice(-8).reverse().map((d, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-surface-800/30 transition-colors">
                <div className="flex items-center gap-3">
                  <tab.icon className="w-4 h-4 flex-shrink-0" style={{ color: tab.color }} />
                  <span className="text-sm font-display text-secondary">{tab.label}</span>
                </div>
                <span className="text-sm font-mono font-bold text-primary">
                  {d.value} <span className="text-muted font-normal">{tab.unit}</span>
                </span>
                <span className="text-xs text-muted font-mono">{d.date}</span>
                <span className="badge badge-success text-xs py-0.5">Normal</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
