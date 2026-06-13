"use client";

import Link from "next/link";
import { Star, Video, Clock, ChevronRight, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const DOCTORS = [
  {
    id: "d1",
    name: "Dr. Sarah Chen",
    specialty: "Cardiologist",
    rating: 4.9,
    reviews: 312,
    experience: 14,
    fee: 75,
    available: true,
    avatar: "SC",
    gradient: "from-brand-600/25 to-brand-700/10",
    border: "border-brand-500/25",
    avatarBg: "bg-brand-600/30 text-brand-300",
    tags: ["Heart Disease", "Hypertension", "ECG"],
  },
  {
    id: "d2",
    name: "Dr. Marcus Williams",
    specialty: "General Practice",
    rating: 4.8,
    reviews: 521,
    experience: 9,
    fee: 45,
    available: true,
    avatar: "MW",
    gradient: "from-violet-600/25 to-violet-700/10",
    border: "border-violet-500/25",
    avatarBg: "bg-violet-600/30 text-violet-300",
    tags: ["Primary Care", "Preventive Medicine", "Wellness"],
  },
  {
    id: "d3",
    name: "Dr. Priya Patel",
    specialty: "Endocrinologist",
    rating: 4.9,
    reviews: 198,
    experience: 11,
    fee: 90,
    available: false,
    avatar: "PP",
    gradient: "from-teal-600/25 to-teal-700/10",
    border: "border-teal-500/25",
    avatarBg: "bg-teal-600/30 text-teal-300",
    tags: ["Diabetes", "Thyroid", "Hormonal"],
  },
];

export function DoctorSpotlight() {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-display font-bold text-primary">
          Available Doctors
        </h2>
        <Link
          href="/doctors"
          className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1
                     font-display font-medium transition-colors"
        >
          Browse all <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {DOCTORS.map((doc) => (
          <div
            key={doc.id}
            className={cn(
              "metric-card p-5 bg-gradient-to-br",
              doc.gradient, doc.border
            )}
          >
            {/* Top */}
            <div className="flex items-start gap-3 mb-4">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0",
                "border border-white/10 font-display font-bold text-base",
                doc.avatarBg
              )}>
                {doc.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-display font-bold text-primary">{doc.name}</p>
                  <BadgeCheck className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
                </div>
                <p className="text-xs text-muted">{doc.specialty} • {doc.experience}y exp.</p>
              </div>
              <div className={cn(
                "flex-shrink-0 w-2 h-2 rounded-full mt-1",
                doc.available ? "bg-accent-green animate-pulse" : "bg-muted"
              )} />
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-1 text-xs text-amber-400">
                <Star className="w-3 h-3 fill-amber-400" />
                <span className="font-mono font-bold">{doc.rating}</span>
                <span className="text-muted">({doc.reviews})</span>
              </div>
              <span className="text-muted">·</span>
              <div className="flex items-center gap-1 text-xs text-muted">
                <Video className="w-3 h-3" />
                ${doc.fee}/session
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1 mb-4">
              {doc.tags.map((t) => (
                <span key={t} className="badge badge-info text-xs py-0.5">{t}</span>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Link
                href={`/appointments/new?doctorId=${doc.id}`}
                className="btn-primary flex-1 text-center text-xs py-2"
              >
                Book Now
              </Link>
              <Link
                href={`/doctors/${doc.id}`}
                className="btn-ghost text-xs py-2 px-3"
              >
                Profile
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
