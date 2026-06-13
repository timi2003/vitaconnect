"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  FileText, Upload, Search, Filter, Download,
  Eye, Trash2, Image, FileImage, FilePlus,
} from "lucide-react";
import { cn } from "@/lib/utils";

const DOCS = [
  { id: "d1", title: "Cardiology Report – May 2026",       type: "LAB_REPORT",        size: "1.2 MB", date: "May 28, 2026", doctor: "Dr. Sarah Chen",      mime: "application/pdf", tags: ["Cardiology","ECG"] },
  { id: "d2", title: "Chest X-Ray Imaging",                type: "IMAGING",            size: "8.4 MB", date: "May 20, 2026", doctor: "Quest Diagnostics",   mime: "image/jpeg",      tags: ["Imaging","Chest"] },
  { id: "d3", title: "Prescription – Lisinopril",          type: "PRESCRIPTION",       size: "0.4 MB", date: "Jun 1, 2026",  doctor: "Dr. Marcus Williams", mime: "application/pdf", tags: ["Prescription"] },
  { id: "d4", title: "Discharge Summary – May 2025",       type: "DISCHARGE_SUMMARY",  size: "0.9 MB", date: "May 5, 2025",  doctor: "City General Hospital",mime: "application/pdf", tags: ["Discharge","Hospital"] },
  { id: "d5", title: "Insurance Card",                     type: "INSURANCE",          size: "0.3 MB", date: "Jan 1, 2026",  doctor: "BlueCross",           mime: "image/png",       tags: ["Insurance"] },
  { id: "d6", title: "COVID Vaccination Certificate",      type: "VACCINATION",        size: "0.5 MB", date: "Nov 10, 2023", doctor: "Health Dept.",        mime: "application/pdf", tags: ["Vaccination","COVID"] },
];

const TYPE_ICONS: Record<string, React.ElementType> = {
  LAB_REPORT:       FileText,
  IMAGING:          FileImage,
  PRESCRIPTION:     FileText,
  DISCHARGE_SUMMARY:FileText,
  INSURANCE:        FileText,
  VACCINATION:      FileText,
  OTHER:            FileText,
};

const TYPE_COLORS: Record<string, string> = {
  LAB_REPORT:       "text-brand-400   bg-brand-500/15   border-brand-500/25",
  IMAGING:          "text-teal-400    bg-teal-500/15    border-teal-500/25",
  PRESCRIPTION:     "text-violet-400  bg-violet-500/15  border-violet-500/25",
  DISCHARGE_SUMMARY:"text-amber-400   bg-amber-500/15   border-amber-500/25",
  INSURANCE:        "text-emerald-400 bg-emerald-500/15 border-emerald-500/25",
  VACCINATION:      "text-rose-400    bg-rose-500/15    border-rose-500/25",
  OTHER:            "text-muted       bg-surface-800    border-subtle",
};

const DOC_TYPES = ["ALL","LAB_REPORT","IMAGING","PRESCRIPTION","DISCHARGE_SUMMARY","VACCINATION","INSURANCE"];

export default function RecordsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [view, setView] = useState<"grid" | "list">("list");

  const filtered = DOCS.filter((d) =>
    (typeFilter === "ALL" || d.type === typeFilter) &&
    (search === "" ||
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.doctor.toLowerCase().includes(search.toLowerCase()) ||
      d.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())))
  );

  return (
    <DashboardLayout>
      <div className="page-enter space-y-6 pb-24 lg:pb-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-display font-bold text-primary">Medical Records</h1>
            <p className="text-sm text-muted mt-0.5">All your health documents in one place</p>
          </div>
          <button className="btn-primary flex items-center gap-2 text-sm">
            <Upload className="w-4 h-4" /> Upload Document
          </button>
        </div>

        {/* Search + filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input className="input pl-10 text-sm" placeholder="Search records, doctors, tags…"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button className="btn-ghost text-sm py-2 px-4 flex items-center gap-2">
            <Filter className="w-4 h-4" /> More filters
          </button>
        </div>

        {/* Type filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {DOC_TYPES.map((t) => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={cn(
                "flex-shrink-0 px-3.5 py-1.5 rounded-xl border text-xs font-display font-medium transition-all duration-200",
                typeFilter === t
                  ? "border-brand-500/40 bg-brand-500/12 text-brand-300"
                  : "border-subtle text-muted hover:border-brand-500/25"
              )}>
              {t === "ALL" ? "All Types" : t.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        {/* Upload drop zone */}
        <div className="border-2 border-dashed border-subtle rounded-2xl p-8 text-center
                        hover:border-brand-500/40 hover:bg-brand-500/5 transition-all duration-200 cursor-pointer group">
          <FilePlus className="w-8 h-8 text-muted mx-auto mb-3 group-hover:text-brand-400 transition-colors" />
          <p className="text-sm font-display font-semibold text-secondary group-hover:text-primary transition-colors">
            Drop files here or click to upload
          </p>
          <p className="text-xs text-muted mt-1">PDF, JPG, PNG up to 20MB</p>
        </div>

        {/* Documents list */}
        <div className="space-y-2">
          {filtered.map((doc) => {
            const Icon = TYPE_ICONS[doc.type] ?? FileText;
            const colorClass = TYPE_COLORS[doc.type] ?? TYPE_COLORS.OTHER;

            return (
              <div key={doc.id}
                className="glass border border-subtle flex items-center gap-4 p-4
                           hover:border-brand-500/25 hover:bg-surface-800/20 transition-all duration-200 group">
                {/* Icon */}
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border", colorClass)}>
                  <Icon className="w-4 h-4" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-display font-semibold text-primary truncate">{doc.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-muted">{doc.date}</span>
                    <span className="text-muted text-xs">·</span>
                    <span className="text-xs text-muted">{doc.doctor}</span>
                    <span className="text-muted text-xs">·</span>
                    <span className="text-xs text-muted font-mono">{doc.size}</span>
                  </div>
                  <div className="flex gap-1.5 mt-1.5">
                    {doc.tags.map((tag) => (
                      <span key={tag} className="badge badge-info text-xs py-0.5">{tag}</span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button className="p-2 rounded-xl hover:bg-surface-700 text-muted hover:text-primary transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-xl hover:bg-surface-700 text-muted hover:text-primary transition-colors">
                    <Download className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-xl hover:bg-rose-500/15 text-muted hover:text-rose-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="glass border border-subtle p-12 text-center">
              <FileText className="w-12 h-12 text-muted mx-auto mb-4 opacity-50" />
              <p className="font-display font-semibold text-secondary">No documents found</p>
              <p className="text-sm text-muted mt-1">Try adjusting your filters or upload a new document</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
