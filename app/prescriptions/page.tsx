"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Pill, Download, RefreshCw, Clock, CheckCircle2, AlertCircle, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const PRESCRIPTIONS = [
  {
    id: "rx1", doctor: "Dr. Marcus Williams", date: "Jun 1, 2026",
    status: "ACTIVE", diagnosis: "Hypertension",
    medications: [
      { name: "Lisinopril", dosage: "10mg", frequency: "Once daily", duration: "90 days", instructions: "Take in the morning with water" },
      { name: "Amlodipine", dosage: "5mg",  frequency: "Once daily", duration: "90 days", instructions: "Can be taken with or without food" },
    ],
    refills: 2, refillsUsed: 0,
  },
  {
    id: "rx2", doctor: "Dr. Priya Patel", date: "May 20, 2026",
    status: "ACTIVE", diagnosis: "Type 2 Diabetes",
    medications: [
      { name: "Metformin",  dosage: "500mg", frequency: "Twice daily", duration: "180 days", instructions: "Take with meals to reduce GI side effects" },
      { name: "Empagliflozin", dosage: "10mg", frequency: "Once daily", duration: "180 days", instructions: "Take in the morning" },
    ],
    refills: 1, refillsUsed: 0,
  },
  {
    id: "rx3", doctor: "Dr. Sarah Chen", date: "Apr 15, 2026",
    status: "COMPLETED", diagnosis: "Anxiety (short-term)",
    medications: [
      { name: "Lorazepam", dosage: "0.5mg", frequency: "As needed", duration: "14 days", instructions: "Maximum 2 tablets per day" },
    ],
    refills: 0, refillsUsed: 0,
  },
];

const STATUS_MAP: Record<string, { label: string; badge: string; icon: React.ElementType }> = {
  ACTIVE:    { label: "Active",    badge: "badge-success", icon: CheckCircle2 },
  COMPLETED: { label: "Completed", badge: "badge-teal",    icon: CheckCircle2 },
  EXPIRED:   { label: "Expired",   badge: "badge-warning", icon: AlertCircle  },
  CANCELLED: { label: "Cancelled", badge: "badge-danger",  icon: AlertCircle  },
};

export default function PrescriptionsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  const filtered = PRESCRIPTIONS.filter((rx) =>
    (filter === "ALL" || rx.status === filter) &&
    (search === "" ||
      rx.doctor.toLowerCase().includes(search.toLowerCase()) ||
      rx.diagnosis.toLowerCase().includes(search.toLowerCase()) ||
      rx.medications.some((m) => m.name.toLowerCase().includes(search.toLowerCase())))
  );

  return (
    <DashboardLayout>
      <div className="page-enter space-y-6 pb-24 lg:pb-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-display font-bold text-primary">Prescriptions</h1>
            <p className="text-sm text-muted mt-0.5">Your issued medications and refill status</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input className="input pl-10 text-sm" placeholder="Search medications, conditions…"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-900/60 border border-subtle">
            {["ALL","ACTIVE","COMPLETED"].map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-display font-semibold transition-all duration-200",
                  filter === f ? "bg-brand-500 text-white" : "text-muted hover:text-secondary"
                )}>
                {f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Cards */}
        <div className="space-y-4">
          {filtered.map((rx) => {
            const st = STATUS_MAP[rx.status];
            return (
              <div key={rx.id} className="glass border border-subtle overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-subtle">
                  <div>
                    <div className="flex items-center gap-2">
                      <Pill className="w-4 h-4 text-violet-400" />
                      <p className="text-sm font-display font-bold text-primary">{rx.diagnosis}</p>
                      <span className={cn("badge text-xs py-0.5", st.badge)}>
                        {st.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted mt-0.5">
                      Prescribed by {rx.doctor} · {rx.date}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {rx.status === "ACTIVE" && rx.refills > rx.refillsUsed && (
                      <button className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5" />
                        Refill ({rx.refills - rx.refillsUsed} left)
                      </button>
                    )}
                    <button className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5">
                      <Download className="w-3.5 h-3.5" />
                      PDF
                    </button>
                  </div>
                </div>

                {/* Medications */}
                <div className="divide-y divide-subtle">
                  {rx.medications.map((med, i) => (
                    <div key={i} className="flex items-start gap-4 px-5 py-4">
                      <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/25
                                      flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Pill className="w-4 h-4 text-violet-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-display font-bold text-primary">{med.name}</p>
                          <span className="badge badge-purple text-xs py-0.5">{med.dosage}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="flex items-center gap-1 text-xs text-muted">
                            <Clock className="w-3 h-3" /> {med.frequency}
                          </span>
                          <span className="text-xs text-muted">·</span>
                          <span className="text-xs text-muted">{med.duration}</span>
                        </div>
                        <p className="text-xs text-secondary mt-1 italic">{med.instructions}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="glass border border-subtle p-12 text-center">
              <Pill className="w-12 h-12 text-muted mx-auto mb-4 opacity-50" />
              <p className="font-display font-semibold text-secondary">No prescriptions found</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
