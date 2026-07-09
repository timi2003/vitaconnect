"use client";

import { useState } from "react";
import { DoctorDashboardLayout } from "@/components/layout/DoctorDasboardLayout";
import {
  FileText, Search, Filter, Download, Eye,
  Upload, FileImage, Pill, TestTube2, User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const RECORDS = [
  { id:"d1", patient:"Alex Johnson",  avatar:"AJ", avatarBg:"bg-brand-600/30 text-brand-300",
    title:"ECG Report – Jun 2026",        type:"LAB_REPORT",  size:"1.2 MB", date:"Jun 1",  tags:["Cardiology","ECG"],    shared:true  },
  { id:"d2", patient:"Maria Santos",  avatar:"MS", avatarBg:"bg-violet-600/30 text-violet-300",
    title:"HbA1c Lab Results – May 2026", type:"LAB_REPORT",  size:"0.4 MB", date:"May 28", tags:["Diabetes","Labs"],     shared:true  },
  { id:"d3", patient:"Kwame Mensah",  avatar:"KM", avatarBg:"bg-teal-600/30 text-teal-300",
    title:"Chest X-Ray Imaging",         type:"IMAGING",     size:"8.4 MB", date:"May 20", tags:["Imaging","Chest"],     shared:false },
  { id:"d4", patient:"Priya Nair",    avatar:"PN", avatarBg:"bg-amber-600/30 text-amber-300",
    title:"Post-Surgery Discharge Note", type:"DISCHARGE_SUMMARY", size:"0.9 MB", date:"May 5", tags:["Surgery","Discharge"], shared:true },
  { id:"d5", patient:"James Okonkwo", avatar:"JO", avatarBg:"bg-rose-600/30 text-rose-300",
    title:"Cardiac MRI – Apr 2026",      type:"IMAGING",     size:"22.1 MB",date:"Apr 30", tags:["Cardiology","MRI"],   shared:false },
  { id:"d6", patient:"Amara Diallo",  avatar:"AD", avatarBg:"bg-indigo-600/30 text-indigo-300",
    title:"Asthma Management Plan",      type:"OTHER",       size:"0.3 MB", date:"Apr 20", tags:["Asthma","Plan"],      shared:true  },
  { id:"d7", patient:"Tunde Bakare",  avatar:"TB", avatarBg:"bg-emerald-600/30 text-emerald-300",
    title:"Lipid Panel Results – Apr 2026", type:"LAB_REPORT", size:"0.5 MB", date:"Apr 15", tags:["Lipids","Labs"],   shared:true  },
];

const TYPE_ICONS: Record<string,React.ElementType> = {
  LAB_REPORT:"FileText" as unknown as React.ElementType,
  IMAGING:   FileImage,
  DISCHARGE_SUMMARY: FileText,
  PRESCRIPTION: Pill,
  OTHER:     FileText,
};

const TYPE_COLORS: Record<string,string> = {
  LAB_REPORT:       "text-brand-400   bg-brand-500/10   border-brand-500/20",
  IMAGING:          "text-teal-400    bg-teal-500/10    border-teal-500/20",
  DISCHARGE_SUMMARY:"text-amber-400   bg-amber-500/10   border-amber-500/20",
  PRESCRIPTION:     "text-violet-400  bg-violet-500/10  border-violet-500/20",
  OTHER:            "text-muted       bg-surface-800    border-subtle",
};

const TYPE_LABELS: Record<string,string> = {
  LAB_REPORT:"Lab Report", IMAGING:"Imaging", DISCHARGE_SUMMARY:"Discharge",
  PRESCRIPTION:"Prescription", OTHER:"Other",
};

export default function MedicalRecordsPage() {
  const [search,     setSearch]     = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [patient,    setPatient]    = useState("ALL");

  const patients = ["ALL", ...Array.from(new Set(RECORDS.map(r => r.patient)))];

  const filtered = RECORDS.filter((r) =>
    (typeFilter === "ALL" || r.type === typeFilter) &&
    (patient    === "ALL" || r.patient === patient) &&
    (search === "" ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.patient.toLowerCase().includes(search.toLowerCase()) ||
      r.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())))
  );

  return (
    <DoctorDashboardLayout>
      <div className="page-enter space-y-6 pb-24 lg:pb-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-display font-bold text-primary">Medical Records</h1>
            <p className="text-sm text-muted mt-0.5">Patient documents shared with you</p>
          </div>
          <button className="btn-primary text-sm flex items-center gap-2">
            <Upload className="w-4 h-4" /> Upload Record
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input className="input pl-10 text-sm" placeholder="Search records, patients, tags…"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="input w-auto text-sm"
            value={patient} onChange={(e) => setPatient(e.target.value)}>
            {patients.map((p) => (
              <option key={p} value={p}>{p === "ALL" ? "All Patients" : p}</option>
            ))}
          </select>
        </div>

        {/* Type pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {["ALL","LAB_REPORT","IMAGING","DISCHARGE_SUMMARY","PRESCRIPTION","OTHER"].map((t) => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={cn(
                "flex-shrink-0 px-3.5 py-1.5 rounded-xl border text-xs font-display font-medium transition-all",
                typeFilter === t
                  ? "border-brand-500/40 bg-brand-500/12 text-brand-300"
                  : "border-subtle text-muted hover:border-brand-500/25"
              )}>
              {t === "ALL" ? "All Types" : TYPE_LABELS[t] ?? t}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label:"Total Records", value:RECORDS.length,                                  color:"text-brand-400"  },
            { label:"Shared With Me",value:RECORDS.filter(r=>r.shared).length,              color:"text-teal-400"   },
            { label:"Lab Reports",   value:RECORDS.filter(r=>r.type==="LAB_REPORT").length, color:"text-violet-400" },
            { label:"Imaging",       value:RECORDS.filter(r=>r.type==="IMAGING").length,    color:"text-amber-400"  },
          ].map((s) => (
            <div key={s.label} className="glass border border-subtle p-4 text-center">
              <p className={cn("text-2xl font-display font-bold", s.color)}>{s.value}</p>
              <p className="text-xs text-muted font-display mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Records list */}
        <div className="space-y-2">
          {filtered.map((doc) => {
            const Icon       = typeof TYPE_ICONS[doc.type] === "function" ? TYPE_ICONS[doc.type] : FileText;
            const colorClass = TYPE_COLORS[doc.type] ?? TYPE_COLORS.OTHER;

            return (
              <div key={doc.id}
                className="glass border border-subtle flex items-center gap-4 p-4 rounded-xl
                           hover:border-brand-500/25 hover:bg-surface-800/20 transition-all group">

                {/* Doc type icon */}
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border",
                  colorClass
                )}>
                  <FileText className="w-4 h-4" />
                </div>

                {/* Patient avatar */}
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                  "font-display font-bold text-xs border border-white/10", doc.avatarBg
                )}>{doc.avatar}</div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-display font-semibold text-primary truncate">{doc.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-muted flex items-center gap-1">
                      <User className="w-3 h-3" />{doc.patient}
                    </span>
                    <span className="text-muted text-xs">·</span>
                    <span className="text-xs text-muted">{doc.date}</span>
                    <span className="text-muted text-xs">·</span>
                    <span className="text-xs text-muted font-mono">{doc.size}</span>
                  </div>
                  <div className="flex gap-1.5 mt-1.5 flex-wrap">
                    {doc.tags.map((tag) => (
                      <span key={tag} className="badge badge-info text-xs py-0">{tag}</span>
                    ))}
                    {doc.shared && (
                      <span className="badge badge-success text-xs py-0">Shared</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100
                                transition-opacity flex-shrink-0">
                  <button className="p-2 rounded-xl hover:bg-surface-700 text-muted hover:text-primary transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-xl hover:bg-surface-700 text-muted hover:text-primary transition-colors">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="glass border border-subtle p-12 text-center">
              <FileText className="w-12 h-12 text-muted mx-auto mb-4 opacity-40" />
              <p className="font-display font-semibold text-secondary">No records found</p>
            </div>
          )}
        </div>
      </div>
    </DoctorDashboardLayout>
  );
}