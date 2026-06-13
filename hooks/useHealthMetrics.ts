// hooks/useHealthMetrics.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export interface HealthMetric {
  id: string;
  type: string;
  value: number;
  value2?: number;
  unit: string;
  recordedAt: string;
  source: string;
  isAbnormal: boolean;
  notes?: string;
}

interface MetricStats {
  latest: number;
  average: number;
  min: number;
  max: number;
  trend: "up" | "down" | "stable";
  changePercent: number;
}

function computeStats(metrics: HealthMetric[]): MetricStats {
  if (!metrics.length) return { latest: 0, average: 0, min: 0, max: 0, trend: "stable", changePercent: 0 };

  const vals    = metrics.map((m) => m.value);
  const latest  = vals[0];
  const average = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
  const min     = Math.min(...vals);
  const max     = Math.max(...vals);

  // Compare first half vs second half for trend
  const half       = Math.ceil(vals.length / 2);
  const recentAvg  = vals.slice(0, half).reduce((a, b) => a + b, 0) / half;
  const olderAvg   = vals.slice(half).reduce((a, b) => a + b, 0) / (vals.length - half);
  const changePct  = olderAvg ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
  const trend: "up" | "down" | "stable" =
    changePct > 2 ? "up" : changePct < -2 ? "down" : "stable";

  return { latest, average, min, max, trend, changePercent: Math.round(changePct * 10) / 10 };
}

export function useHealthMetrics(type?: string, days = 7) {
  return useQuery({
    queryKey: ["health-metrics", type, days],
    queryFn: async () => {
      const params = new URLSearchParams({ days: String(days) });
      if (type) params.set("type", type);
      const { data } = await axios.get<{ metrics: HealthMetric[] }>(
        `/api/health-data/sync?${params}`
      );
      return data.metrics;
    },
    staleTime: 60_000,
    select: (metrics) => ({
      metrics,
      stats: computeStats(metrics),
      abnormals: metrics.filter((m) => m.isAbnormal),
      byType: metrics.reduce<Record<string, HealthMetric[]>>((acc, m) => {
        acc[m.type] = [...(acc[m.type] ?? []), m];
        return acc;
      }, {}),
    }),
  });
}

export function useLatestMetrics() {
  return useQuery({
    queryKey: ["health-metrics-latest"],
    queryFn: async () => {
      const { data } = await axios.get<{ metrics: HealthMetric[] }>(
        "/api/health-data/sync?days=1"
      );
      // Return most recent of each type
      const seen = new Set<string>();
      return data.metrics.filter((m) => {
        if (seen.has(m.type)) return false;
        seen.add(m.type);
        return true;
      });
    },
    staleTime: 30_000,
  });
}