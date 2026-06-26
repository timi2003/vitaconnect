"use client";

import { useState, useEffect, useRef, useCallback, DragEvent } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  FileText, Upload, Search, Filter, Download,
  Eye, Trash2, FileImage, FilePlus, RefreshCw,
  X, CheckCircle2, AlertCircle, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MedicalDocument {
  id: string;
  title: string;
  type: string;
  fileUrl: string;
  fileSize: number | null;
  mimeType: string | null;
  tags: string[];
  date: string | null;
  createdAt: string;
}

type UploadStatus = "idle" | "uploading" | "success" | "error";
interface UploadState { status: UploadStatus; message: string; progress: number; }

const TYPE_ICONS: Record<string, React.ElementType> = {
  LAB_REPORT: FileText, IMAGING: FileImage, PRESCRIPTION: FileText,
  DISCHARGE_SUMMARY: FileText, INSURANCE: FileText, VACCINATION: FileText,
  REFERRAL: FileText, CONSENT: FileText, OTHER: FileText,
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

const DOC_TYPES = [
  "ALL", "LAB_REPORT", "IMAGING", "PRESCRIPTION",
  "DISCHARGE_SUMMARY", "VACCINATION", "INSURANCE",
];

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

export default function RecordsPage() {
  const [docs, setDocs]               = useState<MedicalDocument[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [typeFilter, setTypeFilter]   = useState("ALL");
  const [dragOver, setDragOver]       = useState(false);
  const [upload, setUpload]           = useState<UploadState>({
    status: "idle", message: "", progress: 0,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/documents");
      if (!res.ok) throw new Error("fetch failed");
      const { documents } = (await res.json()) as { documents: MedicalDocument[] };
      setDocs(documents);
    } catch {
      // keep empty list, no crash
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const simulateProgress = () => {
    let val = 0;
    progressRef.current = setInterval(() => {
      val += Math.random() * 18;
      if (val >= 90) { clearInterval(progressRef.current!); val = 90; }
      setUpload((p) => ({ ...p, progress: Math.min(val, 90) }));
    }, 200);
  };

  const uploadFile = async (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      setUpload({ status: "error", message: "File exceeds 20 MB limit.", progress: 0 });
      return;
    }
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      setUpload({ status: "error", message: "Only PDF, JPG, PNG, WEBP, or GIF allowed.", progress: 0 });
      return;
    }

    setUpload({ status: "uploading", message: `Uploading ${file.name}…`, progress: 0 });
    simulateProgress();

    try {
      const body = new FormData();
      body.append("file", file);

      const res = await fetch("/api/documents/upload", { method: "POST", body });
      clearInterval(progressRef.current!);

      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "Upload failed" }));
        setUpload({ status: "error", message: error ?? "Upload failed.", progress: 0 });
        return;
      }

      const { document: newDoc } = (await res.json()) as { document: MedicalDocument };
      setUpload({ status: "success", message: `"${newDoc.title}" uploaded.`, progress: 100 });
      setDocs((prev) => [newDoc, ...prev]);
      setTimeout(() => setUpload({ status: "idle", message: "", progress: 0 }), 3000);
    } catch {
      clearInterval(progressRef.current!);
      setUpload({ status: "error", message: "Network error. Please try again.", progress: 0 });
    }
  };

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const deleteDoc = async (id: string) => {
    setDocs((prev) => prev.filter((d) => d.id !== id));
    try {
      await fetch(`/api/documents?id=${id}`, { method: "DELETE" });
    } catch {
      fetchDocs(); // restore on failure
    }
  };

  const filtered = docs.filter((d) =>
    (typeFilter === "ALL" || d.type === typeFilter) &&
    (search === "" ||
      d.title.toLowerCase().includes(search.toLowerCase()) ||
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
          <div className="flex gap-2">
            <button
              onClick={fetchDocs}
              disabled={loading}
              className="btn-ghost text-sm py-2 px-4 flex items-center gap-2"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              Refresh
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={upload.status === "uploading"}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Upload className="w-4 h-4" />
              Upload Document
            </button>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,.gif"
          className="hidden"
          onChange={onFileInput}
        />

        {/* Upload status banner */}
        {upload.status !== "idle" && (
          <div className={cn(
            "glass border flex items-start gap-3 p-4 rounded-xl",
            upload.status === "error"     && "border-rose-500/25 bg-rose-500/5",
            upload.status === "success"   && "border-emerald-500/25 bg-emerald-500/5",
            upload.status === "uploading" && "border-brand-500/25 bg-brand-500/5",
          )}>
            {upload.status === "uploading" && <Loader2 className="w-4 h-4 text-brand-400 animate-spin flex-shrink-0 mt-0.5" />}
            {upload.status === "success"   && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />}
            {upload.status === "error"     && <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />}
            <div className="flex-1 min-w-0">
              <p className={cn(
                "text-sm font-display",
                upload.status === "error"     && "text-rose-300",
                upload.status === "success"   && "text-emerald-300",
                upload.status === "uploading" && "text-brand-300",
              )}>
                {upload.message}
              </p>
              {upload.status === "uploading" && (
                <div className="progress-bar mt-2">
                  <div
                    className="progress-fill bg-brand-500 transition-all duration-300"
                    style={{ width: `${upload.progress}%` }}
                  />
                </div>
              )}
            </div>
            {upload.status !== "uploading" && (
              <button
                onClick={() => setUpload({ status: "idle", message: "", progress: 0 })}
                className="text-muted hover:text-primary transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Search */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              className="input pl-10 text-sm"
              placeholder="Search records, tags…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
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

        {/* Drop zone */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Drop zone for file upload"
          onClick={() => upload.status !== "uploading" && fileInputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          className={cn(
            "border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 cursor-pointer group select-none",
            dragOver
              ? "border-brand-500/70 bg-brand-500/10 scale-[1.01]"
              : "border-subtle hover:border-brand-500/40 hover:bg-brand-500/5",
            upload.status === "uploading" && "pointer-events-none opacity-60",
          )}
        >
          <FilePlus className={cn(
            "w-8 h-8 mx-auto mb-3 transition-colors",
            dragOver ? "text-brand-400" : "text-muted group-hover:text-brand-400",
          )} />
          <p className="text-sm font-display font-semibold text-secondary group-hover:text-primary transition-colors">
            {dragOver ? "Release to upload" : "Drop files here or click to upload"}
          </p>
          <p className="text-xs text-muted mt-1">PDF, JPG, PNG, WEBP up to 20 MB</p>
        </div>

        {/* Document list */}
        <div className="space-y-2">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass border border-subtle flex items-center gap-4 p-4">
                <div className="w-10 h-10 rounded-xl bg-surface-700/50 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-48 rounded bg-surface-700/50 animate-pulse" />
                  <div className="h-3 w-32 rounded bg-surface-700/30 animate-pulse" />
                </div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="glass border border-subtle p-12 text-center">
              <FileText className="w-12 h-12 text-muted mx-auto mb-4 opacity-50" />
              <p className="font-display font-semibold text-secondary">No documents found</p>
              <p className="text-sm text-muted mt-1">
                {docs.length === 0
                  ? "Upload your first document using the button above"
                  : "Try adjusting your filters"}
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
                             hover:border-brand-500/25 hover:bg-surface-800/20
                             transition-all duration-200 group"
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border",
                    colorClass,
                  )}>
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-display font-semibold text-primary truncate">
                      {doc.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-muted">
                        {formatDate(doc.date ?? doc.createdAt)}
                      </span>
                      <span className="text-muted text-xs">·</span>
                      <span className="text-xs text-muted font-mono">{formatSize(doc.fileSize)}</span>
                      <span className="text-muted text-xs">·</span>
                      <span className="text-xs text-muted">{doc.type.replace(/_/g, " ")}</span>
                    </div>
                    {doc.tags.length > 0 && (
                      <div className="flex gap-1.5 mt-1.5 flex-wrap">
                        {doc.tags.map((tag) => (
                          <span key={tag} className="badge badge-info text-xs py-0.5">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
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
                    <button
                      onClick={() => deleteDoc(doc.id)}
                      className="p-2 rounded-xl hover:bg-rose-500/15 text-muted hover:text-rose-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}