"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DoctorDashboardLayout } from "@/components/layout/DoctorDasboardLayout";
import {
  FileText, Search, Download, Eye, FileImage, Loader2, ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MedicalDocument {
  id:        string;
  title:     string;
  type:      string;
  fileUrl:   string;
  fileSize:  number | null;
  mimeType:  string | null;
  tags:      string[];
  date:      string | null;
  createdAt: string;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  LAB_REPORT:        FileText,  IMAGING:           FileImage,
  PRESCRIPTION:      FileText,  DISCHARGE_SUMMARY: FileText,
  INSURANCE:         FileText,  VACCINATION:       FileText,
  REFERRAL:          FileText,  CONSENT:           FileText,
  OTHER:             FileText,
};

const TYPE_COLORS: Record<string, string> = {
  LAB_REPORT:        "text-brand-400   bg-brand-500/15   border-brand-500/25",
  IMAGING:           "text-teal-400    bg-teal-500/15    border-teal-500/25",
  PRESCRIPTION:      "text-violet-400  bg-violet-500/15  border-violet-500/25",
  DISCHARGE_SUMMARY: "text-amber-400   bg-amber-500/15   border-amber-500/25",
  INSURANCE:         "text-emerald-400 bg-emerald-500/15 border-emerald-500/25",
  VACCINATION:       "text-rose-400    bg-rose-500/15    border-rose-500/25",
  REFERRAL:          "text-sky-400     bg-sky-500/15     border-sky-500/25",
  CONSENT:           "text-orange-400  bg-orange-500/15  border-orange-500/25",
  OTHER:             "text-muted       bg-surface-800    border-subtle",
};

function formatSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(raw: string | null): string {
  if (!raw) return "—";
  return new Date(raw).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

// ── Inner component — allowed to call useSearchParams() ───────────────────────
function PatientRecordsContent() {
  const sp        = useSearchParams();
  const router    = useRouter();
  const patientId = sp.get("patientId");

  const [docs,          setDocs]          = useState<MedicalDocument[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [notAuthorized, setNotAuthorized] = useState(false);
  const [search,        setSearch]        = useState("");

  const load = useCallback(async () => {
    if (!patientId) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/doctor/patients/${patientId}/records`);
      if (res.status === 404 || res.status === 403) {
        setNotAuthorized(true);
        return;
      }
      if (!res.ok) {
        console.error("[PatientRecords] fetch failed:", res.status);
        return;
      }
      const { documents } = await res.json();
      setDocs(documents ?? []);
    } catch (err) {
      console.error("[PatientRecords] load failed:", err);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => { load(); }, [load]);

  const filtered = docs.filter((d) =>
    search === "" ||
    d.title.toLowerCase().includes(search.toLowerCase()) ||
    d.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  if (!patientId) {
    return (
      <div className="max-w-2xl mx-auto py-24 text-center">
        <p className="text-secondary font-display font-semibold">No patient selected.</p>
      </div>
    );
  }

  return (
    <div className="page-enter space-y-6 pb-24 lg:pb-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors font-display"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div>
        <h1 className="text-2xl font-display font-bold text-primary">Patient Records</h1>
        <p className="text-sm text-muted mt-0.5">Documents this patient has shared with you</p>
      </div>

      {!notAuthorized && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            className="input pl-10 text-sm"
            placeholder="Search records, tags…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      <div className="space-y-2">
        {loading ? (
          <div className="glass border border-subtle p-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-brand-400 mx-auto" />
          </div>
        ) : notAuthorized ? (
          <div className="glass border border-subtle p-12 text-center">
            <p className="text-secondary font-display font-semibold">
              No access — you don&apos;t have an appointment history with this patient.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass border border-subtle p-12 text-center">
            <FileText className="w-12 h-12 text-muted mx-auto mb-4 opacity-50" />
            <p className="font-display font-semibold text-secondary">
              {docs.length === 0
                ? "This patient hasn't shared any documents yet"
                : "No documents match your search"}
            </p>
          </div>
        ) : (
          filtered.map((doc) => {
            const Icon       = TYPE_ICONS[doc.type] ?? FileText;
            const colorClass = TYPE_COLORS[doc.type] ?? TYPE_COLORS.OTHER;
            return (
              <div
                key={doc.id}
                className="glass border border-subtle flex items-center gap-4 p-4
                           hover:border-brand-500/25 hover:bg-surface-800/20 transition-all duration-200 group"
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border",
                  colorClass,
                )}>
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-display font-semibold text-primary truncate">{doc.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-muted">{formatDate(doc.date ?? doc.createdAt)}</span>
                    <span className="text-muted text-xs">·</span>
                    <span className="text-xs text-muted font-mono">{formatSize(doc.fileSize)}</span>
                    <span className="text-muted text-xs">·</span>
                    <span className="text-xs text-muted">{doc.type.replace(/_/g, " ")}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl hover:bg-surface-700 text-muted hover:text-primary transition-colors"
                    title="View"
                  >
                    <Eye className="w-4 h-4" />
                  </a>
                  <a
                    href={doc.fileUrl}
                    download={doc.title}
                    className="p-2 rounded-xl hover:bg-surface-700 text-muted hover:text-primary transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Default export wraps everything in Suspense ───────────────────────────────
export default function DoctorPatientRecordsPage() {
  return (
    <DoctorDashboardLayout>
      <Suspense fallback={
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
        </div>
      }>
        <PatientRecordsContent />
      </Suspense>
    </DoctorDashboardLayout>
  );
}