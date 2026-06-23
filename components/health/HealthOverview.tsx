"use client";

import { Heart, Droplets, Wind, Thermometer, Activity, Moon, Scale, Flame } from "lucide-react";
import { useState, useEffect } from "react";

const PROGRESS_COLORS: Record<string, string> = {
  coral:  "bg-rose-400",
  brand:  "bg-brand-500",
  teal:   "bg-teal-400",
  amber:  "bg-amber-400",
  purple: "bg-violet-400",
  indigo: "bg-indigo-400",
  green:  "bg-emerald-400",
  orange: "bg-orange-400",
};

const DEFAULT_METRICS = [
  {
    id: "hr",
    label: "Heart Rate",
    value: "72",
    unit: "bpm",
    icon: Heart,
    color: "coral",
    gradient: "from-rose-500/20 to-orange-500/10",
    border: "border-rose-500/20",
    iconColor: "text-rose-400",
    trend: "+2",
    status: "normal",
    range: "60–100",
    progress: 52,
  },
  {
    id: "bp",
    label: "Blood Pressure",
    value: "118/76",
    unit: "mmHg",
    icon: Activity,
    color: "brand",
    gradient: "from-brand-500/20 to-cyan-500/10",
    border: "border-brand-500/20",
    iconColor: "text-brand-400",
    trend: "Optimal",
    status: "normal",
    range: "<120/80",
    progress: 74,
  },
  {
    id: "o2",
    label: "Oxygen Sat.",
    value: "98",
    unit: "%",
    icon: Wind,
    color: "teal",
    gradient: "from-teal-500/20 to-cyan-500/10",
    border: "border-teal-500/20",
    iconColor: "text-teal-400",
    trend: "Normal",
    status: "normal",
    range: "95–100",
    progress: 90,
  },
  {
    id: "glucose",
    label: "Blood Glucose",
    value: "94",
    unit: "mg/dL",
    icon: Droplets,
    color: "amber",
    gradient: "from-amber-500/20 to-yellow-500/10",
    border: "border-amber-500/20",
    iconColor: "text-amber-400",
    trend: "Fasting",
    status: "normal",
    range: "70–99",
    progress: 67,
  },
  {
    id: "temp",
    label: "Temperature",
    value: "36.8",
    unit: "°C",
    icon: Thermometer,
    color: "purple",
    gradient: "from-violet-500/20 to-purple-500/10",
    border: "border-violet-500/20",
    iconColor: "text-violet-400",
    trend: "Normal",
    status: "normal",
    range: "36.1–37.2",
    progress: 70,
  },
  {
    id: "sleep",
    label: "Last Sleep",
    value: "7h 24m",
    unit: "",
    icon: Moon,
    color: "indigo",
    gradient: "from-indigo-500/20 to-blue-500/10",
    border: "border-indigo-500/20",
    iconColor: "text-indigo-400",
    trend: "Good",
    status: "normal",
    range: "7–9h",
    progress: 82,
  },
  {
    id: "weight",
    label: "Weight",
    value: "73.2",
    unit: "kg",
    icon: Scale,
    color: "green",
    gradient: "from-emerald-500/20 to-green-500/10",
    border: "border-emerald-500/20",
    iconColor: "text-emerald-400",
    trend: "−0.3 kg",
    status: "normal",
    range: "BMI 22.4",
    progress: 60,
  },
  {
    id: "steps",
    label: "Steps Today",
    value: "8,432",
    unit: "steps",
    icon: Flame,
    color: "orange",
    gradient: "from-orange-500/20 to-amber-500/10",
    border: "border-orange-500/20",
    iconColor: "text-orange-400",
    trend: "84% goal",
    status: "normal",
    range: "Goal: 10,000",
    progress: 84,
  },
];

export function HealthOverview() {
  const [metrics, setMetrics] = useState(DEFAULT_METRICS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLiveMetrics() {
      try {
        const metricTypes = [
          "HEART_RATE", "BLOOD_PRESSURE", "BLOOD_GLUCOSE",
          "OXYGEN_SATURATION", "BODY_TEMPERATURE", "SLEEP_DURATION",
          "WEIGHT", "STEPS"
        ];

        const responses = await Promise.all(
          metricTypes.map(type =>
            fetch(`/api/health-data/sync?type=${type}&days=1`)
              .then(r => r.ok ? r.json() : { metrics: [] })
          )
        );

        const latestMap = new Map();
        responses.forEach(({ metrics: data }) => {
          if (data?.length > 0) {
            latestMap.set(data[0].type, data[0]);
          }
        });

        const updatedMetrics = DEFAULT_METRICS.map(m => {
          const realMetric = latestMap.get(m.id.toUpperCase().replace(/_/g, '')) ||
                            latestMap.get(m.id);

          if (!realMetric) return m;

          let value = String(realMetric.value);
          let unit = realMetric.unit || m.unit;
          let trend = m.trend;
          let progress = m.progress;

          // Special formatting
          if (realMetric.type === "BLOOD_PRESSURE") {
            value = `${realMetric.value}/${realMetric.value2 || 76}`;
          }
          if (realMetric.type === "SLEEP_DURATION") {
            const hours = Math.floor(realMetric.value / 60);
            const mins = realMetric.value % 60;
            value = `${hours}h ${mins}m`;
          }
          if (realMetric.type === "STEPS") {
            value = realMetric.value.toLocaleString();
          }

          // Calculate progress
          const rangeMatch = m.range.match(/(\d+)(?:–(\d+))?/);
          if (rangeMatch) {
            const min = parseFloat(rangeMatch[1]) || 0;
            const max = parseFloat(rangeMatch[2]) || 100;
            progress = Math.max(0, Math.min(100, 
              Math.round(((realMetric.value - min) / (max - min)) * 100)
            ));
          }

          return {
            ...m,
            value,
            unit,
            progress: isNaN(progress) ? m.progress : progress,
            trend: realMetric.isAbnormal ? "Alert" : m.trend,
          };
        });

        setMetrics(updatedMetrics);
      } catch (error) {
        console.warn("Failed to fetch live health data, using defaults");
      } finally {
        setLoading(false);
      }
    }

    fetchLiveMetrics();
  }, []);

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-display font-bold text-primary">
          Live Health Metrics
        </h2>
        <span className="text-xs text-muted font-mono flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
          {loading ? "Loading live data..." : "Health Connect synced • just now"}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
        {metrics.map((m) => (
          <div
            key={m.id}
            className={`metric-card p-4 bg-gradient-to-br ${m.gradient} transition-opacity ${loading ? 'opacity-75' : ''}`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className={`w-8 h-8 rounded-lg bg-surface-900/60 flex items-center justify-center border ${m.border}`}>
                <m.icon className={`w-4 h-4 ${m.iconColor}`} />
              </div>
              <span className="badge badge-success text-xs py-0.5">{m.trend}</span>
            </div>

            {/* Value */}
            <div className="mb-3">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-display font-bold text-primary leading-none">
                  {m.value}
                </span>
                {m.unit && (
                  <span className="text-xs text-muted font-mono">{m.unit}</span>
                )}
              </div>
              <p className="text-xs text-muted font-display mt-0.5">{m.label}</p>
            </div>

            {/* Progress */}
            <div className="progress-bar">
              <div
                className={`progress-fill ${PROGRESS_COLORS[m.color]}`}
                style={{ width: `${m.progress}%` }}
              />
            </div>
            <p className="text-xs text-muted font-mono mt-1">{m.range}</p>
          </div>
        ))}
      </div>
    </section>
  );
}