"use client";

import { useState, useEffect } from "react";
import { useHealthConnect } from "@/hooks/useHealthConnect";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { HealthOverview } from "@/components/health/HealthOverview";
import { UpcomingAppointments } from "@/components/appointments/UpcomingAppointments";
import { QuickActions } from "@/components/ui/QuickActions";
import { HealthConnectBanner } from "@/components/health/HealthConnectBanner";
import { RecentMetrics } from "@/components/health/RecentMetrics";
import { DoctorSpotlight } from "@/components/doctors/DoctorSpotlight";

export default function DashboardPage() {
  const hc = useHealthConnect();
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting("Good morning");
    else if (h < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  return (
    <DashboardLayout>
      <div className="page-enter space-y-6 pb-24 lg:pb-8">

        {/* ── Header ── */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-secondary font-display">
              {greeting} 👋
            </p>
            <h1 className="text-2xl font-display font-bold text-primary mt-0.5">
              Your Health Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {hc.isSyncing ? (
              <span className="badge badge-info animate-pulse-slow">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-ping" />
                Syncing…
              </span>
            ) : hc.lastSyncAt ? (
              <span className="badge badge-success">
                <span className="pulse-dot text-accent-green" />
                Synced
              </span>
            ) : null}
          </div>
        </div>

        {/* ── Health Connect Banner ── */}
        {hc.availability !== "WebOnly" && hc.grantedPermissions.length === 0 && (
          <HealthConnectBanner
            availability={hc.availability}
            onConnect={() => hc.requestPermissions()}
            isSyncing={hc.isSyncing}
          />
        )}

        {/* ── Quick Actions ── */}
        <QuickActions onSync={() => hc.syncToServer()} isSyncing={hc.isSyncing} />

        {/* ── Health Overview ── */}
        <HealthOverview />

        {/* ── 2-Col Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UpcomingAppointments />
          <RecentMetrics />
        </div>

        {/* ── Doctor Spotlight ── */}
        <DoctorSpotlight />
      </div>
    </DashboardLayout>
  );
}
