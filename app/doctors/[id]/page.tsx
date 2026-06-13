"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import Link from "next/link";
import {
  Star, BadgeCheck, Video, Mic, MessageSquare,
  Clock, Globe, ArrowLeft, CheckCircle2, Calendar,
  Loader2, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

interface Qualification {
  degree:      string;
  institution: string;
  year:        number;
}

interface Review {
  id:          string;
  patientName: string;
  rating:      number;
  comment:     string | null;
  tags:        string[];
  isAnonymous: boolean;
  createdAt:   string;
}

interface DoctorProfile {
  id:               string;
  name:             string;
  image:            string | null;
  doctorProfile: {
    specializations:    string[];
    subSpecializations: string[];
    experience:         number;
    consultationFee:    number;
    followUpFee:        number;
    rating:             number;
    totalReviews:       number;
    totalConsultations: number;
    bio:                string | null;
    languages:          string[];
    availableFor:       string[];
    hospital:           string | null;
    qualifications:     Qualification[];
    isAvailableNow:     boolean;
  };
}

interface AvailabilitySlot {
  dayOfWeek:    number;
  startTime:    string;
  endTime:      string;
  slotDuration: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_ICONS: Record<string, React.ElementType> = {
  VIDEO: Video,
  AUDIO: Mic,
  CHAT:  MessageSquare,
};

function getNextSlots(slots: AvailabilitySlot[]): string[] {
  const results: string[] = [];
  const now = new Date();

  for (let dayOffset = 0; dayOffset < 7 && results.length < 4; dayOffset++) {
    const date = new Date(now);
    date.setDate(now.getDate() + dayOffset);
    const dow = date.getDay();

    const matching = slots.filter((s) => s.dayOfWeek === dow);
    for (const slot of matching) {
      if (results.length >= 4) break;
      const [h, m] = slot.startTime.split(":").map(Number);
      const slotTime = new Date(date);
      slotTime.setHours(h, m, 0, 0);
      if (slotTime <= now) continue;

      const label =
        dayOffset === 0 ? "Today" :
        dayOffset === 1 ? "Tomorrow" :
        date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      results.push(`${label} ${slot.startTime}`);
    }
  }
  return results;
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DoctorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();

  const [doctor,  setDoctor]  = useState<DoctorProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [slots,   setSlots]   = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [docRes, revRes] = await Promise.all([
          fetch(`/api/doctors/${id}`),
          fetch(`/api/reviews?doctorId=${id}`),
        ]);

        if (!docRes.ok) throw new Error("Doctor not found");

        const docData = await docRes.json();
        setDoctor(docData.doctor);
        setSlots(docData.slots ?? []);

        if (revRes.ok) {
          const revData = await revRes.json();
          setReviews(revData.reviews ?? []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load doctor");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error || !doctor) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <AlertCircle className="w-10 h-10 text-rose-400" />
          <p className="text-secondary font-display">{error ?? "Doctor not found"}</p>
          <button onClick={() => router.back()} className="btn-ghost text-sm">
            Go Back
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const dp         = doctor.doctorProfile;
  const nextSlots  = getNextSlots(slots);
  const initials   = doctor.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <DashboardLayout>
      <div className="page-enter max-w-3xl mx-auto space-y-5 pb-24 lg:pb-8">

        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors font-display"
        >
          <ArrowLeft className="w-4 h-4" /> Back to doctors
        </button>

        {/* Hero card */}
        <div className="glass border border-brand-500/25 p-6 bg-gradient-to-br from-brand-600/15 to-brand-700/5 relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-brand-500/10 blur-3xl" />

          <div className="relative flex items-start gap-5 flex-wrap">
            {/* Avatar */}
            {doctor.image ? (
              <img
                src={doctor.image}
                alt={doctor.name}
                className="w-20 h-20 rounded-2xl object-cover border border-white/10 flex-shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center font-display font-bold text-2xl border border-white/10 flex-shrink-0 bg-brand-600/30 text-brand-300">
                {initials}
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-display font-bold text-primary">{doctor.name}</h1>
                <BadgeCheck className="w-5 h-5 text-brand-400" />
                {dp.isAvailableNow && (
                  <span className="badge badge-success text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
                    Available Now
                  </span>
                )}
              </div>

              <p className="text-sm text-secondary">
                {dp.specializations.join(", ")}
                {dp.subSpecializations.length > 0 && ` · ${dp.subSpecializations[0]}`}
              </p>
              {dp.hospital && <p className="text-xs text-muted mt-0.5">{dp.hospital}</p>}

              <div className="flex items-center gap-4 mt-3 flex-wrap">
                <span className="flex items-center gap-1.5 text-sm">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="font-mono font-bold text-primary">{dp.rating.toFixed(1)}</span>
                  <span className="text-muted">({dp.totalReviews} reviews)</span>
                </span>
                <span className="text-muted">·</span>
                <span className="text-sm text-muted">{dp.experience} yrs exp.</span>
                <span className="text-muted">·</span>
                <span className="text-sm text-muted">{dp.totalConsultations.toLocaleString()} consultations</span>
              </div>

              <div className="flex gap-1.5 mt-3 flex-wrap">
                {dp.availableFor.map((t) => {
                  const Icon = TYPE_ICONS[t] ?? Video;
                  return (
                    <span key={t} className="badge badge-info text-xs">
                      <Icon className="w-3 h-3" /> {t}
                    </span>
                  );
                })}
                {dp.languages.map((l) => (
                  <span key={l} className="badge badge-purple text-xs">
                    <Globe className="w-3 h-3" /> {l}
                  </span>
                ))}
              </div>
            </div>

            {/* Fee */}
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-muted font-display">Consultation</p>
              <p className="text-3xl font-display font-bold text-primary">${dp.consultationFee}</p>
              <p className="text-xs text-muted">Follow-up: ${dp.followUpFee}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── Left column ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Bio */}
            {dp.bio && (
              <div className="glass border border-subtle p-5">
                <h2 className="text-sm font-display font-bold text-primary mb-3">About</h2>
                <p className="text-sm text-secondary leading-relaxed">{dp.bio}</p>
              </div>
            )}

            {/* Qualifications */}
            {dp.qualifications.length > 0 && (
              <div className="glass border border-subtle p-5">
                <h2 className="text-sm font-display font-bold text-primary mb-4">Qualifications</h2>
                <div className="space-y-3">
                  {dp.qualifications.map((q, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-brand-500/15 border border-brand-500/25 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4 text-brand-400" />
                      </div>
                      <div>
                        <p className="text-sm font-display font-semibold text-primary">{q.degree}</p>
                        <p className="text-xs text-muted">{q.institution} · {q.year}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Specializations */}
            {dp.specializations.length > 0 && (
              <div className="glass border border-subtle p-5">
                <h2 className="text-sm font-display font-bold text-primary mb-3">Specializations</h2>
                <div className="flex flex-wrap gap-2">
                  {[...dp.specializations, ...dp.subSpecializations].map((t) => (
                    <span key={t} className="badge badge-info">{t}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className="glass border border-subtle p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-display font-bold text-primary">Patient Reviews</h2>
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="font-mono font-bold text-primary">{dp.rating.toFixed(1)}</span>
                  <span className="text-xs text-muted">/ 5.0 ({dp.totalReviews})</span>
                </div>
              </div>

              {reviews.length === 0 ? (
                <div className="text-center py-8">
                  <Star className="w-8 h-8 text-muted mx-auto mb-2 opacity-40" />
                  <p className="text-sm text-muted font-display">No reviews yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((r) => (
                    <div key={r.id} className="p-4 rounded-xl bg-surface-800/40 border border-subtle">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-display font-semibold text-primary">
                          {r.isAnonymous ? "Anonymous" : r.patientName}
                        </p>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, j) => (
                            <Star
                              key={j}
                              className={cn(
                                "w-3 h-3",
                                j < r.rating ? "text-amber-400 fill-amber-400" : "text-surface-600"
                              )}
                            />
                          ))}
                          <span className="text-xs text-muted ml-1">
                            {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        </div>
                      </div>
                      {r.comment && (
                        <p className="text-xs text-secondary leading-relaxed italic">
                          &ldquo;{r.comment}&rdquo;
                        </p>
                      )}
                      {r.tags.length > 0 && (
                        <div className="flex gap-1.5 mt-2 flex-wrap">
                          {r.tags.map((tag) => (
                            <span key={tag} className="badge badge-teal text-xs py-0">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Right column ── */}
          <div className="space-y-4">

            {/* Next available slots */}
            <div className="glass border border-subtle p-4">
              <h3 className="text-sm font-display font-bold text-primary mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-400" /> Next Available
              </h3>

              {nextSlots.length === 0 ? (
                <p className="text-xs text-muted text-center py-4">No slots available this week</p>
              ) : (
                <div className="space-y-2">
                  {nextSlots.map((slot) => (
                    <Link
                      key={slot}
                      href={`/appointments/new?doctorId=${doctor.id}&slot=${encodeURIComponent(slot)}`}
                      className={cn(
                        "flex items-center justify-between p-2.5 rounded-xl border text-sm font-display",
                        "hover:border-brand-500/40 hover:bg-brand-500/8 transition-all duration-200",
                        slot.startsWith("Today")
                          ? "border-brand-500/30 bg-brand-500/8"
                          : "border-subtle"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-brand-400" />
                        <span className={slot.startsWith("Today") ? "text-brand-300 font-semibold" : "text-secondary"}>
                          {slot}
                        </span>
                      </span>
                      <span className="text-xs text-muted">30 min</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Book CTA */}
            <Link href={`/appointments/new?doctorId=${doctor.id}`} className="btn-primary w-full block text-center">
              Book Appointment
            </Link>
            <Link
              href={`/messages?doctorId=${doctor.id}`}
              className="btn-ghost w-full flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4" /> Send Message
            </Link>

            {/* Fee breakdown */}
            <div className="glass border border-subtle p-4 space-y-2">
              <h3 className="text-xs font-display font-bold text-muted uppercase tracking-wider">Fee Breakdown</h3>
              {[
                { label: "First Consultation", value: `$${dp.consultationFee}` },
                { label: "Follow-up Visit",    value: `$${dp.followUpFee}` },
                { label: "Insurance",          value: "Most major plans" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-xs py-1 border-b border-subtle last:border-0">
                  <span className="text-muted font-display">{label}</span>
                  <span className="text-primary font-semibold">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}