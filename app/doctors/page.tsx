"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Search, Star, Video, Filter, BadgeCheck, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const SPECIALTIES = [
  "All", "General Practice", "Cardiology", "Endocrinology", "Dermatology",
  "Neurology", "Orthopedics", "Psychiatry", "Pediatrics", "Oncology",
  "Gynecology", "Urology", "Ophthalmology", "ENT", "Pulmonology",
];

type Doctor = {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviews: number;
  exp: number;
  fee: number;
  available: boolean;
  avatar: string;
  avatarBg: string;
  tags: string[];
  langs: string[];
  nextSlot?: string;
  gradient?: string;
};

export default function DoctorsPage() {
  const [search, setSearch] = useState("");
  const [activeSpec, setActiveSpec] = useState("All");
  const [sortBy, setSortBy] = useState<"rating" | "fee" | "experience">("rating");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real doctors
  useEffect(() => {
    async function fetchDoctors() {
      try {
        const res = await fetch("/api/doctors");
        if (!res.ok) throw new Error("Failed to fetch doctors");
        
        const data = await res.json();
        
        const transformed = (data.doctors || []).map((d: any) => ({
          id: d.id,
          name: d.name,
          specialty: d.doctorProfile?.specializations?.[0] || "General Practice",
          rating: d.doctorProfile?.rating || 4.5,
          reviews: d.doctorProfile?.totalReviews || 0,
          exp: d.doctorProfile?.experience || 5,
          fee: d.doctorProfile?.consultationFee || 75,
          available: d.doctorProfile?.isAvailableNow || false,
          avatar: d.name?.split(" ").map((n: string) => n[0]).join("").slice(0,2) || "DR",
          avatarBg: "bg-brand-600/30 text-brand-300",
          tags: d.doctorProfile?.specializations?.slice(0, 3) || [],
          langs: d.doctorProfile?.languages || ["English"],
          nextSlot: "Check availability",
          gradient: "from-brand-600/20 to-brand-700/10",
        }));

        setDoctors(transformed);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load doctors");
      } finally {
        setLoading(false);
      }
    }

    fetchDoctors();
  }, []);

  const filtered = doctors
    .filter((d) =>
      (activeSpec === "All" || d.specialty === activeSpec) &&
      (search === "" ||
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.specialty.toLowerCase().includes(search.toLowerCase()) ||
        d.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())))
    )
    .sort((a, b) => {
      if (sortBy === "rating")     return b.rating - a.rating;
      if (sortBy === "fee")        return a.fee - b.fee;
      if (sortBy === "experience") return b.exp - a.exp;
      return 0;
    });

  return (
    <DashboardLayout>
      <div className="page-enter space-y-6 pb-24 lg:pb-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-display font-bold text-primary">Find a Doctor</h1>
          <p className="text-sm text-muted mt-0.5">Book a consultation with verified specialists</p>
        </div>

        {/* Search + Sort */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input 
              className="input pl-10" 
              placeholder="Search doctors, specialties, conditions…" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
          <select
            className="input w-auto text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          >
            <option value="rating">Top Rated</option>
            <option value="fee">Lowest Fee</option>
            <option value="experience">Most Experienced</option>
          </select>
          <button className="btn-ghost text-sm py-2 px-4 flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Specialty tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {SPECIALTIES.map((s) => (
            <button key={s} onClick={() => setActiveSpec(s)}
              className={cn(
                "flex-shrink-0 px-4 py-2 rounded-xl border text-sm font-display font-medium transition-all duration-200",
                activeSpec === s
                  ? "border-brand-500/40 bg-brand-500/12 text-brand-300"
                  : "border-subtle text-muted hover:border-brand-500/25 hover:text-secondary"
              )}>
              {s}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Results count */}
        {!loading && (
          <p className="text-xs text-muted font-mono">
            {filtered.length} doctor{filtered.length !== 1 ? "s" : ""} found
          </p>
        )}

        {/* Doctor cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((doc) => (
            <div key={doc.id}
                 className={cn(
                   "metric-card p-5 bg-gradient-to-br border",
                   doc.gradient,
                   doc.available ? "border-brand-500/20" : "border-subtle"
                 )}>
              <div className="flex items-start gap-4 mb-4">
                {/* Avatar */}
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0",
                  "border border-white/10 font-display font-bold text-lg",
                  doc.avatarBg
                )}>
                  {doc.avatar}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-display font-bold text-primary text-sm">{doc.name}</h3>
                    <BadgeCheck className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
                    <span className={cn("ml-auto w-2 h-2 rounded-full flex-shrink-0",
                      doc.available ? "bg-accent-green animate-pulse" : "bg-surface-600")} />
                  </div>
                  <p className="text-xs text-muted">{doc.specialty} · {doc.exp}y exp</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="flex items-center gap-1 text-xs text-amber-400">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span className="font-mono font-bold">{doc.rating}</span>
                      <span className="text-muted">({doc.reviews})</span>
                    </span>
                    <span className="text-xs text-muted">·</span>
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <Video className="w-3 h-3" />
                      ${doc.fee}/session
                    </span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {doc.tags.map((t) => (
                  <span key={t} className="badge badge-info text-xs py-0.5">{t}</span>
                ))}
                {doc.langs.map((l) => (
                  <span key={l} className="badge badge-purple text-xs py-0.5">{l}</span>
                ))}
              </div>

              {/* Next slot */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-muted font-display">
                  Next available: <span className={cn("font-semibold",
                    doc.available ? "text-accent-green" : "text-secondary"
                  )}>{doc.nextSlot}</span>
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Link href={`/appointments/new?doctorId=${doc.id}`}
                      className="btn-primary flex-1 text-center text-xs py-2.5">
                  Book Now
                </Link>
                <Link href={`/doctors/${doc.id}`}
                      className="btn-ghost text-xs py-2.5 px-4">
                  Profile
                </Link>
              </div>
            </div>
          ))}
        </div>

        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 text-muted">
            No doctors found matching your criteria.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}