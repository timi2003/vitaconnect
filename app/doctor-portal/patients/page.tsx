"use client";

import { useState, useEffect } from "react";
import { DoctorDashboardLayout } from "@/components/layout/DoctorDasboardLayout";
import Link from "next/link";
import { Search, User, Calendar, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Patient {
  id: string;
  name: string;
  image: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  conditions: string[];
  lastVisit: string | null;
  nextVisit: string | null;
}

const AVATAR_COLORS = [
  "bg-brand-600/30 text-brand-300", "bg-violet-600/30 text-violet-300",
  "bg-teal-600/30 text-teal-300", "bg-amber-600/30 text-amber-300",
  "bg-rose-600/30 text-rose-300", "bg-indigo-600/30 text-indigo-300",
  "bg-emerald-600/30 text-emerald-300",
];

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?";
}

function avatarBg(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function ageFromDOB(dob: string | null) {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function MyPatientsPage() {
  const [search, setSearch] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/doctors/patients");
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          console.error("[MyPatientsPage] fetch failed:", res.status, body);
          return;
        }
        const { patients: data } = await res.json();
        setPatients(data || []);
      } catch (err) {
        console.error("[MyPatientsPage] load failed:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = patients.filter((p) =>
    search === "" ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.conditions.some((c) => c.toLowerCase().includes(search.toLowerCase()))
  );

  const upcomingCount = patients.filter((p) => p.nextVisit).length;

  return (
    <DoctorDashboardLayout>
      <div className="page-enter space-y-6 pb-24 lg:pb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-display font-bold text-primary">My Patients</h1>
            <p className="text-sm text-muted mt-0.5">
              {loading ? "Loading…" : `${patients.length} patient${patients.length !== 1 ? "s" : ""} under your care`}
            </p>
          </div>
        </div>

        {/* Summary — real counts only, no fabricated risk scoring */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass border border-subtle p-4 text-center">
            <p className="text-2xl font-display font-bold text-primary">{patients.length}</p>
            <p className="text-xs text-muted font-display mt-0.5">Total Patients</p>
          </div>
          <div className="glass border border-subtle p-4 text-center">
            <p className="text-2xl font-display font-bold text-brand-400">{upcomingCount}</p>
            <p className="text-xs text-muted font-display mt-0.5">With Upcoming Visit</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input className="input pl-10 text-sm" placeholder="Search patients or conditions…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {/* Patient list */}
        <div className="space-y-3">
          {loading ? (
            <div className="glass border border-subtle p-12 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-brand-400 mx-auto" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="glass border border-subtle p-12 text-center">
              <User className="w-10 h-10 text-muted mx-auto mb-3 opacity-40" />
              <p className="text-secondary font-display">
                {patients.length === 0 ? "No patients yet" : "No patients found"}
              </p>
            </div>
          ) : filtered.map((p) => {
            const age = ageFromDOB(p.dateOfBirth);
            return (
              <Link key={p.id} href={`/doctor-portal/patients/${p.id}`}
                className="glass border border-subtle flex items-start gap-4 p-4 rounded-2xl
                           hover:border-brand-500/25 transition-all duration-200 group block">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0",
                  "font-display font-bold text-sm border border-white/10", avatarBg(p.id)
                )}>{initials(p.name)}</div>

                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-primary text-sm">{p.name}</p>
                  <p className="text-xs text-muted">
                    {age !== null ? `${age}y` : "Age unknown"}{p.gender ? ` · ${p.gender}` : ""}
                  </p>
                  <p className="text-xs text-secondary mt-0.5">
                    {p.conditions.length > 0 ? p.conditions.join(", ") : "No conditions on file"}
                  </p>

                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <Calendar className="w-3 h-3" /> Last: {formatDate(p.lastVisit)}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <Calendar className="w-3 h-3" /> Next: {formatDate(p.nextVisit)}
                    </span>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-muted flex-shrink-0 mt-1
                                         group-hover:text-brand-400 transition-colors" />
              </Link>
            );
          })}
        </div>
      </div>
    </DoctorDashboardLayout>
  );
}