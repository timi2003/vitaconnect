"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Search, Star, Video, Filter, BadgeCheck, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const SPECIALTIES = [
  "All", "General Practice", "Cardiology", "Endocrinology", "Dermatology",
  "Neurology", "Orthopedics", "Psychiatry", "Pediatrics", "Oncology",
  "Gynecology", "Urology", "Ophthalmology", "ENT", "Pulmonology",
];

const DOCTORS = [
  { id:"d1", name:"Dr. Sarah Chen",        specialty:"Cardiology",       rating:4.9, reviews:312, exp:14, fee:75,  available:true,  avatar:"SC", gradient:"from-brand-600/20 to-brand-700/10",   avatarBg:"bg-brand-600/30 text-brand-300",   tags:["Heart Disease","Hypertension","Arrhythmia"],   langs:["English","Mandarin"], nextSlot:"Today 2:30 PM" },
  { id:"d2", name:"Dr. Marcus Williams",   specialty:"General Practice", rating:4.8, reviews:521, exp:9,  fee:45,  available:true,  avatar:"MW", gradient:"from-violet-600/20 to-violet-700/10", avatarBg:"bg-violet-600/30 text-violet-300", tags:["Primary Care","Wellness","Preventive"],        langs:["English"],           nextSlot:"Today 4:00 PM" },
  { id:"d3", name:"Dr. Priya Patel",       specialty:"Endocrinology",    rating:4.9, reviews:198, exp:11, fee:90,  available:false, avatar:"PP", gradient:"from-teal-600/20 to-teal-700/10",     avatarBg:"bg-teal-600/30 text-teal-300",     tags:["Diabetes","Thyroid","Hormonal"],               langs:["English","Hindi"],    nextSlot:"Tomorrow 9:00 AM" },
  { id:"d4", name:"Dr. Aisha Okafor",      specialty:"Dermatology",      rating:4.7, reviews:445, exp:7,  fee:60,  available:true,  avatar:"AO", gradient:"from-amber-600/20 to-amber-700/10",   avatarBg:"bg-amber-600/30 text-amber-300",   tags:["Acne","Psoriasis","Cosmetic"],                 langs:["English","Yoruba"],   nextSlot:"Today 5:15 PM" },
  { id:"d5", name:"Dr. James Lim",         specialty:"Neurology",        rating:4.8, reviews:267, exp:15, fee:110, available:false, avatar:"JL", gradient:"from-rose-600/20 to-rose-700/10",     avatarBg:"bg-rose-600/30 text-rose-300",     tags:["Migraines","Epilepsy","Stroke"],               langs:["English","Korean"],   nextSlot:"Jun 8, 10:00 AM" },
  { id:"d6", name:"Dr. Fatima Al-Hassan",  specialty:"Psychiatry",       rating:4.9, reviews:389, exp:12, fee:85,  available:true,  avatar:"FA", gradient:"from-indigo-600/20 to-indigo-700/10", avatarBg:"bg-indigo-600/30 text-indigo-300", tags:["Anxiety","Depression","ADHD"],                 langs:["English","Arabic"],   nextSlot:"Today 3:00 PM" },
];

export default function DoctorsPage() {
  const [search, setSearch] = useState("");
  const [activeSpec, setActiveSpec] = useState("All");
  const [sortBy, setSortBy] = useState<"rating" | "fee" | "experience">("rating");

  const filtered = DOCTORS
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
          <p className="text-sm text-muted mt-0.5">Book a consultation with 2,400+ verified specialists</p>
        </div>

        {/* Search + Sort */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input className="input pl-10" placeholder="Search doctors, specialties, conditions…"
              value={search} onChange={(e) => setSearch(e.target.value)} />
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

        {/* Results count */}
        <p className="text-xs text-muted font-mono">
          {filtered.length} doctor{filtered.length !== 1 ? "s" : ""} found
        </p>

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
      </div>
    </DashboardLayout>
  );
}
