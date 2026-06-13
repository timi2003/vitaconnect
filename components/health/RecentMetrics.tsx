"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";

const METRICS_DATA = [
  {
    id: "hr",
    label: "Heart Rate",
    current: 72,
    unit: "bpm",
    trend: "up",
    change: "+2",
    color: "#f87171",
    data: [68, 72, 69, 74, 71, 75, 72, 70, 73, 72, 74, 72],
  },
  {
    id: "bp",
    label: "Systolic BP",
    current: 118,
    unit: "mmHg",
    trend: "down",
    change: "−3",
    color: "#60a5fa",
    data: [125, 122, 120, 123, 119, 121, 118, 120, 117, 119, 118, 118],
  },
  {
    id: "o2",
    label: "SpO2",
    current: 98,
    unit: "%",
    trend: "stable",
    change: "0",
    color: "#2dd4bf",
    data: [97, 98, 98, 97, 99, 98, 98, 99, 98, 97, 98, 98],
  },
  {
    id: "glucose",
    label: "Glucose",
    current: 94,
    unit: "mg/dL",
    trend: "down",
    change: "−6",
    color: "#fbbf24",
    data: [105, 102, 100, 98, 96, 100, 97, 94, 96, 95, 94, 94],
  },
];

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number }> }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass px-2 py-1 text-xs font-mono text-primary border border-subtle">
      {payload[0].value}
    </div>
  );
};

export function RecentMetrics() {
  const [active, setActive] = useState("hr");
  const selected = METRICS_DATA.find((m) => m.id === active)!;

  const chartData = selected.data.map((v, i) => ({
    time: i,
    value: v,
  }));

  return (
    <div className="glass p-5 space-y-4">
      <h2 className="text-base font-display font-bold text-primary">
        7-Day Trends
      </h2>

      {/* Metric selector */}
      <div className="grid grid-cols-2 gap-2">
        {METRICS_DATA.map((m) => (
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
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-display text-muted">{m.label}</span>
              {m.trend === "up" ? (
                <TrendingUp className="w-3 h-3 text-rose-400" />
              ) : m.trend === "down" ? (
                <TrendingDown className="w-3 h-3 text-emerald-400" />
              ) : (
                <Minus className="w-3 h-3 text-muted" />
              )}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-display font-bold text-primary">{m.current}</span>
              <span className="text-xs font-mono text-muted">{m.unit}</span>
            </div>
            <span className={cn(
              "text-xs font-mono",
              m.trend === "up" ? "text-rose-400" : m.trend === "down" ? "text-emerald-400" : "text-muted"
            )}>
              {m.change} vs last week
            </span>
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-subtle p-4 bg-surface-900/30">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-display font-semibold text-primary">{selected.label}</span>
          <span className="text-xs font-mono text-muted">Past 12 readings</span>
        </div>
        <ResponsiveContainer width="100%" height={100}>
          <LineChart data={chartData}>
            <Line
              type="monotone"
              dataKey="value"
              stroke={selected.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: selected.color }}
            />
            <Tooltip content={<CustomTooltip />} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
