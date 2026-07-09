"use client";

import { useState } from "react";
import { DoctorDashboardLayout } from "@/components/layout/DoctorDasboardLayout";
import Link from "next/link";
import { Search, Filter, User, Activity, Calendar, ChevronRight, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const PATIENTS = [
  { id:"p1", name:"Alex Johnson",  avatar:"AJ", avatarBg:"bg-brand-600/30 text-brand-300",
    age:35, gender:"Male",   condition:"Hypertension, Prediabetes",
    lastVisit:"Today",    nextVisit:"Jun 15", risk:"medium", bpLatest:"128/84", hrLatest:74 },
  { id:"p2", name:"Maria Santos",  avatar:"MS", avatarBg:"bg-violet-600/30 text-violet-300",
    age:52, gender:"Female", condition:"Type 2 Diabetes",
    lastVisit:"Jun 3",    nextVisit:"Jun 17", risk:"high",   bpLatest:"142/90", hrLatest:82 },
  { id:"p3", name:"Kwame Mensah",  avatar:"KM", avatarBg:"bg-teal-600/30 text-teal-300",
    age:44, gender:"Male",   condition:"Hypertension",
    lastVisit:"May 28",   nextVisit:"Jun 20", risk:"medium", bpLatest:"135/88", hrLatest:78 },
  { id:"p4", name:"Priya Nair",    avatar:"PN", avatarBg:"bg-amber-600/30 text-amber-300",
    age:29, gender:"Female", condition:"Post-surgery recovery",
    lastVisit:"May 20",   nextVisit:"Jun 22", risk:"low",    bpLatest:"118/76", hrLatest:68 },
  { id:"p5", name:"James Okonkwo", avatar:"JO", avatarBg:"bg-rose-600/30 text-rose-300",
    age:61, gender:"Male",   condition:"Coronary artery disease",
    lastVisit:"May 15",   nextVisit:"Jun 25", risk:"high",   bpLatest:"155/95", hrLatest:88 },
  { id:"p6", name:"Amara Diallo",  avatar:"AD", avatarBg:"bg-indigo-600/30 text-indigo-300",
    age:38, gender:"Female", condition:"Asthma, Anxiety",
    lastVisit:"Apr 30",   nextVisit:"Jul 1",  risk:"low",    bpLatest:"112/72", hrLatest:72 },
  { id:"p7", name:"Tunde Bakare",  avatar:"TB", avatarBg:"bg-emerald-600/30 text-emerald-300",
    age:48, gender:"Male",   condition:"High cholesterol",
    lastVisit:"Apr 20",   nextVisit:"Jul 5",  risk:"medium", bpLatest:"124/80", hrLatest:70 },
];

const RISK_CONFIG: Record<string,{ badge:string; dot:string }> = {
  high:   { badge:"badge-danger",  dot:"bg-accent-coral"  },
  medium: { badge:"badge-warning", dot:"bg-accent-amber"  },
  low:    { badge:"badge-success", dot:"bg-accent-green"  },
};

export default function MyPatientsPage() {
  const [search,     setSearch]     = useState("");
  const [riskFilter, setRiskFilter] = useState("all");

  const filtered = PATIENTS.filter((p) =>
    (riskFilter === "all" || p.risk === riskFilter) &&
    (search === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.condition.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <DoctorDashboardLayout>
      <div className="page-enter space-y-6 pb-24 lg:pb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-display font-bold text-primary">My Patients</h1>
            <p className="text-sm text-muted mt-0.5">{PATIENTS.length} patients under your care</p>
          </div>
        </div>

        {/* Risk summary */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label:"High Risk",   count: PATIENTS.filter(p=>p.risk==="high").length,   color:"text-accent-coral",  bg:"bg-rose-500/10",   border:"border-rose-500/20" },
            { label:"Medium Risk", count: PATIENTS.filter(p=>p.risk==="medium").length, color:"text-accent-amber",  bg:"bg-amber-500/10",  border:"border-amber-500/20" },
            { label:"Low Risk",    count: PATIENTS.filter(p=>p.risk==="low").length,    color:"text-accent-green",  bg:"bg-emerald-500/10",border:"border-emerald-500/20" },
          ].map((s) => (
            <div key={s.label} className={cn("glass border p-4 text-center cursor-pointer", s.bg, s.border)}
              onClick={() => setRiskFilter(s.label.split(" ")[0].toLowerCase())}>
              <p className={cn("text-2xl font-display font-bold", s.color)}>{s.count}</p>
              <p className="text-xs text-muted font-display mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search + filter */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input className="input pl-10 text-sm" placeholder="Search patients or conditions…"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-900/60 border border-subtle">
            {["all","high","medium","low"].map((r) => (
              <button key={r} onClick={() => setRiskFilter(r)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-display font-semibold transition-all capitalize",
                  riskFilter === r ? "bg-brand-500 text-white" : "text-muted hover:text-secondary"
                )}>{r}</button>
            ))}
          </div>
        </div>

        {/* Patient list */}
        <div className="space-y-3">
          {filtered.map((p) => {
            const risk = RISK_CONFIG[p.risk];
            return (
              <Link key={p.id} href={`/doctor-portal/patients/${p.id}`}
                className="glass border border-subtle flex items-start gap-4 p-4 rounded-2xl
                           hover:border-brand-500/25 transition-all duration-200 group block">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0",
                  "font-display font-bold text-sm border border-white/10", p.avatarBg
                )}>{p.avatar}</div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-display font-bold text-primary text-sm">{p.name}</p>
                    <span className={cn("badge text-xs py-0.5", risk.badge)}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", risk.dot)} />
                      {p.risk} risk
                    </span>
                  </div>
                  <p className="text-xs text-muted">{p.age}y · {p.gender}</p>
                  <p className="text-xs text-secondary mt-0.5">{p.condition}</p>

                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <Activity className="w-3 h-3" /> BP: {p.bpLatest} mmHg
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <Activity className="w-3 h-3" /> HR: {p.hrLatest} bpm
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <Calendar className="w-3 h-3" /> Last: {p.lastVisit}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <Calendar className="w-3 h-3" /> Next: {p.nextVisit}
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
    </DoctorDashboardLayout >
  );
}