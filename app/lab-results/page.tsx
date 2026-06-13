"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TestTube2, AlertTriangle, CheckCircle2, Download, ChevronDown, ChevronUp, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const LAB_RESULTS = [
  {
    id: "lr1", name: "Comprehensive Metabolic Panel",
    date: "Jun 1, 2026", lab: "Quest Diagnostics", orderedBy: "Dr. Marcus Williams",
    status: "COMPLETED", hasAbnormal: false,
    tests: [
      { name: "Glucose",       value: "94",   unit: "mg/dL",  range: "70–99",    flag: null },
      { name: "BUN",           value: "16",   unit: "mg/dL",  range: "7–20",     flag: null },
      { name: "Creatinine",    value: "0.9",  unit: "mg/dL",  range: "0.6–1.2",  flag: null },
      { name: "Sodium",        value: "140",  unit: "mEq/L",  range: "136–145",  flag: null },
      { name: "Potassium",     value: "4.1",  unit: "mEq/L",  range: "3.5–5.1",  flag: null },
      { name: "ALT",           value: "28",   unit: "U/L",    range: "7–56",     flag: null },
      { name: "AST",           value: "24",   unit: "U/L",    range: "10–40",    flag: null },
    ],
  },
  {
    id: "lr2", name: "Lipid Panel",
    date: "Jun 1, 2026", lab: "Quest Diagnostics", orderedBy: "Dr. Sarah Chen",
    status: "COMPLETED", hasAbnormal: true,
    tests: [
      { name: "Total Cholesterol", value: "212",  unit: "mg/dL", range: "<200",    flag: "H"  },
      { name: "LDL Cholesterol",   value: "138",  unit: "mg/dL", range: "<100",    flag: "H"  },
      { name: "HDL Cholesterol",   value: "52",   unit: "mg/dL", range: ">40",     flag: null },
      { name: "Triglycerides",     value: "148",  unit: "mg/dL", range: "<150",    flag: null },
      { name: "Non-HDL Chol.",     value: "160",  unit: "mg/dL", range: "<130",    flag: "H"  },
    ],
  },
  {
    id: "lr3", name: "HbA1c (Glycated Hemoglobin)",
    date: "May 20, 2026", lab: "LabCorp", orderedBy: "Dr. Priya Patel",
    status: "COMPLETED", hasAbnormal: false,
    tests: [
      { name: "HbA1c", value: "6.2", unit: "%", range: "<5.7 normal, 5.7–6.4 prediabetes", flag: null },
    ],
  },
  {
    id: "lr4", name: "Complete Blood Count (CBC)",
    date: "Jun 5, 2026", lab: "Quest Diagnostics", orderedBy: "Dr. Marcus Williams",
    status: "PENDING", hasAbnormal: false,
    tests: [],
  },
];

export default function LabResultsPage() {
  const [expanded, setExpanded] = useState<string | null>("lr1");
  const [search, setSearch] = useState("");

  const filtered = LAB_RESULTS.filter((r) =>
    search === "" ||
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.orderedBy.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="page-enter space-y-6 pb-24 lg:pb-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-display font-bold text-primary">Lab Results</h1>
          <p className="text-sm text-muted mt-0.5">Your test results and diagnostic reports</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input className="input pl-10 text-sm" placeholder="Search test names…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Tests",   value: LAB_RESULTS.length, color: "text-brand-400"   },
            { label: "With Abnormals",value: LAB_RESULTS.filter((r) => r.hasAbnormal).length, color: "text-amber-400" },
            { label: "Pending",       value: LAB_RESULTS.filter((r) => r.status === "PENDING").length, color: "text-muted" },
          ].map((s) => (
            <div key={s.label} className="glass border border-subtle p-4 text-center">
              <p className={cn("text-2xl font-display font-bold", s.color)}>{s.value}</p>
              <p className="text-xs text-muted font-display mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Results */}
        <div className="space-y-3">
          {filtered.map((result) => {
            const isExpanded = expanded === result.id;
            return (
              <div key={result.id} className={cn(
                "glass border overflow-hidden transition-all duration-200",
                result.hasAbnormal ? "border-amber-500/30" : "border-subtle"
              )}>
                {/* Header */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : result.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-surface-800/20 transition-colors">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                    result.hasAbnormal
                      ? "bg-amber-500/15 border border-amber-500/25"
                      : result.status === "PENDING"
                      ? "bg-surface-800 border border-subtle"
                      : "bg-teal-500/15 border border-teal-500/25"
                  )}>
                    {result.status === "PENDING"
                      ? <TestTube2 className="w-5 h-5 text-muted" />
                      : result.hasAbnormal
                      ? <AlertTriangle className="w-5 h-5 text-amber-400" />
                      : <CheckCircle2 className="w-5 h-5 text-teal-400" />
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-display font-bold text-primary">{result.name}</p>
                      {result.hasAbnormal && (
                        <span className="badge badge-warning text-xs py-0.5">Abnormal values</span>
                      )}
                      {result.status === "PENDING" && (
                        <span className="badge badge-info text-xs py-0.5">Pending</span>
                      )}
                    </div>
                    <p className="text-xs text-muted">{result.date} · {result.orderedBy} · {result.lab}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {result.status === "COMPLETED" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); }}
                        className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5">
                        <Download className="w-3.5 h-3.5" /> PDF
                      </button>
                    )}
                    {isExpanded
                      ? <ChevronUp className="w-4 h-4 text-muted" />
                      : <ChevronDown className="w-4 h-4 text-muted" />}
                  </div>
                </button>

                {/* Expanded test results */}
                {isExpanded && result.tests.length > 0 && (
                  <div className="border-t border-subtle">
                    <div className="grid grid-cols-4 gap-0 px-5 py-2 bg-surface-900/40">
                      {["Test", "Result", "Reference Range", "Flag"].map((h) => (
                        <p key={h} className="text-xs font-mono font-bold text-muted uppercase tracking-wider">{h}</p>
                      ))}
                    </div>
                    <div className="divide-y divide-subtle">
                      {result.tests.map((test, i) => (
                        <div key={i} className={cn(
                          "grid grid-cols-4 gap-0 px-5 py-3 transition-colors",
                          test.flag ? "bg-amber-500/5" : "hover:bg-surface-800/20"
                        )}>
                          <p className="text-sm font-display text-secondary">{test.name}</p>
                          <p className={cn(
                            "text-sm font-mono font-bold",
                            test.flag === "H" ? "text-amber-400"
                            : test.flag === "L" ? "text-rose-400"
                            : "text-primary"
                          )}>
                            {test.value} <span className="font-normal text-muted text-xs">{test.unit}</span>
                          </p>
                          <p className="text-xs text-muted font-mono">{test.range}</p>
                          <div>
                            {test.flag && (
                              <span className={cn(
                                "badge text-xs py-0.5",
                                test.flag === "H" ? "badge-warning" : "badge-danger"
                              )}>
                                {test.flag === "H" ? "High" : "Low"}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {isExpanded && result.status === "PENDING" && (
                  <div className="border-t border-subtle px-5 py-6 text-center">
                    <TestTube2 className="w-8 h-8 text-muted mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-muted font-display">Results pending — sample under analysis</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
