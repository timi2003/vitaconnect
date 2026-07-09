"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TestTube2, AlertTriangle, CheckCircle2, Download, ChevronDown, ChevronUp, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type LabResult = {
  id: string;
  testName: string;
  testCode?: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  isAbnormal: boolean;
  abnormalFlag?: string;
  interpretation?: string;
  reportedAt: string;
  labName?: string;
};

type LabGroup = {
  id: string;
  name: string;
  date: string;
  lab: string;
  orderedBy: string;
  status: string;
  hasAbnormal: boolean;
  tests: LabResult[];
};

export default function LabResultsPage() {
  const [labGroups, setLabGroups] = useState<LabGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchLabResults() {
      try {
        const res = await fetch("/api/lab-results");
        const data = await res.json();
        setLabGroups(data.labGroups || []);
      } catch (err) {
        console.error("Failed to fetch lab results", err);
      } finally {
        setLoading(false);
      }
    }

    fetchLabResults();
  }, []);

  const filtered = labGroups.filter((group) =>
    search === "" ||
    group.name.toLowerCase().includes(search.toLowerCase()) ||
    group.orderedBy.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-[70vh] flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-brand-500" />
        </div>
      </DashboardLayout>
    );
  }

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
          <input 
            className="input pl-10 text-sm" 
            placeholder="Search test names…" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Tests", value: labGroups.length, color: "text-brand-400" },
            { label: "With Abnormals", value: labGroups.filter(r => r.hasAbnormal).length, color: "text-amber-400" },
            { label: "Pending", value: labGroups.filter(r => r.status === "PENDING").length, color: "text-muted" },
          ].map((s) => (
            <div key={s.label} className="glass border border-subtle p-4 text-center">
              <p className={cn("text-2xl font-display font-bold", s.color)}>{s.value}</p>
              <p className="text-xs text-muted font-display mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Results */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="glass border border-subtle p-12 text-center">
              <TestTube2 className="w-12 h-12 text-muted mx-auto mb-4 opacity-50" />
              <p className="font-display font-semibold text-secondary">No lab results found</p>
            </div>
          ) : (
            filtered.map((result) => {
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
                      {result.status === "PENDING" ? (
                        <TestTube2 className="w-5 h-5 text-muted" />
                      ) : result.hasAbnormal ? (
                        <AlertTriangle className="w-5 h-5 text-amber-400" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-teal-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-display font-bold text-primary">{result.name}</p>
                        {result.hasAbnormal && <span className="badge badge-warning text-xs py-0.5">Abnormal values</span>}
                        {result.status === "PENDING" && <span className="badge badge-info text-xs py-0.5">Pending</span>}
                      </div>
                      <p className="text-xs text-muted">{result.date} · {result.orderedBy} · {result.lab}</p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {result.status === "COMPLETED" && (
                        <button className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <Download className="w-3.5 h-3.5" /> PDF
                        </button>
                      )}
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
                    </div>
                  </button>

                  {/* Expanded Results */}
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
                            test.abnormalFlag ? "bg-amber-500/5" : "hover:bg-surface-800/20"
                          )}>
                            <p className="text-sm font-display text-secondary">{test.testName}</p>
                            <p className={cn(
                              "text-sm font-mono font-bold",
                              test.abnormalFlag === "H" ? "text-amber-400" : test.abnormalFlag === "L" ? "text-rose-400" : "text-primary"
                            )}>
                              {test.value} <span className="font-normal text-muted text-xs">{test.unit}</span>
                            </p>
                            <p className="text-xs text-muted font-mono">{test.referenceRange}</p>
                            <div>
                              {test.abnormalFlag && (
                                <span className={cn(
                                  "badge text-xs py-0.5",
                                  test.abnormalFlag === "H" ? "badge-warning" : "badge-danger"
                                )}>
                                  {test.abnormalFlag === "H" ? "High" : "Low"}
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
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}