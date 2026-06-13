"use client";

import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import Link from "next/link";
import {
  ArrowLeft, Video, Calendar, Clock, FileText,
  Pill, TestTube2, Star, MessageSquare, Download,
  CheckCircle2, XCircle, AlertTriangle, BadgeCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock detail data
const MOCK = {
  id: "a1",
  doctor: { name: "Dr. Sarah Chen", specialty: "Cardiologist", avatar: "SC",
            avatarBg: "bg-brand-600/30 text-brand-300", verified: true },
  date: "June 6, 2026", time: "2:30 PM", duration: 30, type: "VIDEO",
  status: "CONFIRMED", fee: 75,
  reason: "Follow-up on ECG results and blood pressure management",
  symptoms: ["Chest discomfort", "Occasional shortness of breath", "Fatigue"],
  doctorNotes: null,
  prescription: null,
  roomId: "vc-demo-001",
};

const STATUS_MAP: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  CONFIRMED: { icon: CheckCircle2, color: "text-accent-green", label: "Confirmed" },
  SCHEDULED: { icon: Calendar,     color: "text-brand-400",    label: "Scheduled" },
  COMPLETED: { icon: CheckCircle2, color: "text-teal-400",     label: "Completed" },
  CANCELLED: { icon: XCircle,      color: "text-rose-400",     label: "Cancelled" },
};

export default function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const apt = MOCK; // Replace with real fetch
  const st = STATUS_MAP[apt.status];

  return (
    <DashboardLayout>
      <div className="page-enter max-w-2xl mx-auto space-y-5 pb-24 lg:pb-8">

        {/* Back */}
        <button onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors font-display">
          <ArrowLeft className="w-4 h-4" /> Back to appointments
        </button>

        {/* Header card */}
        <div className="glass border border-subtle p-6">
          <div className="flex items-start gap-4">
            <div className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0",
              "border border-white/10 font-display font-bold text-lg", apt.doctor.avatarBg
            )}>
              {apt.doctor.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-lg font-display font-bold text-primary">{apt.doctor.name}</h1>
                {apt.doctor.verified && <BadgeCheck className="w-4 h-4 text-brand-400" />}
              </div>
              <p className="text-sm text-muted">{apt.doctor.specialty}</p>
              <div className="flex items-center gap-2 mt-2">
                <st.icon className={cn("w-4 h-4", st.color)} />
                <span className={cn("text-sm font-display font-semibold", st.color)}>{st.label}</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-2xl font-display font-bold text-primary">${apt.fee}</p>
              <p className="text-xs text-muted font-mono">consultation fee</p>
            </div>
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Date",     value: apt.date,              icon: Calendar },
            { label: "Time",     value: apt.time,              icon: Clock },
            { label: "Duration", value: `${apt.duration} min`, icon: Clock },
            { label: "Type",     value: apt.type,              icon: Video },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="glass border border-subtle p-4 text-center">
              <Icon className="w-4 h-4 text-brand-400 mx-auto mb-2" />
              <p className="text-xs text-muted font-display">{label}</p>
              <p className="text-sm font-display font-bold text-primary mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        {/* Reason & symptoms */}
        <div className="glass border border-subtle p-5 space-y-4">
          <h2 className="text-sm font-display font-bold text-primary">Consultation Details</h2>
          <div>
            <p className="text-xs text-muted font-display mb-1">Reason for visit</p>
            <p className="text-sm text-secondary">{apt.reason}</p>
          </div>
          {apt.symptoms.length > 0 && (
            <div>
              <p className="text-xs text-muted font-display mb-2">Reported symptoms</p>
              <div className="flex flex-wrap gap-1.5">
                {apt.symptoms.map((s) => (
                  <span key={s} className="badge badge-info text-xs">{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Doctor notes (post-consult) */}
        {apt.doctorNotes && (
          <div className="glass border border-teal-500/25 p-5 bg-teal-500/5">
            <h2 className="text-sm font-display font-bold text-primary mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-400" /> Doctor&apos;s Notes
            </h2>
            <p className="text-sm text-secondary">{apt.doctorNotes}</p>
          </div>
        )}

        {/* Warning for upcoming */}
        {apt.status === "CONFIRMED" && (
          <div className="glass border border-amber-500/25 p-4 bg-amber-500/5 flex gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-display font-semibold text-amber-300">Appointment today</p>
              <p className="text-xs text-muted mt-0.5">
                Join 5 minutes early. Make sure your camera and microphone are working.
              </p>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {apt.status === "CONFIRMED" && (
            <Link href={`/video?room=${apt.roomId}`}
              className="btn-primary flex-1 flex items-center justify-center gap-2">
              <Video className="w-4 h-4" /> Join Video Call
            </Link>
          )}
          <Link href={`/messages?doctorId=${apt.doctor.name}`}
            className="btn-ghost flex-1 flex items-center justify-center gap-2">
            <MessageSquare className="w-4 h-4" /> Message Doctor
          </Link>
          {apt.status === "COMPLETED" && (
            <button className="btn-ghost flex items-center justify-center gap-2">
              <Download className="w-4 h-4" /> Download Summary
            </button>
          )}
        </div>

        {/* Post-consult actions */}
        {apt.status === "COMPLETED" && (
          <div className="grid grid-cols-2 gap-3">
            <Link href={`/prescriptions?aptId=${apt.id}`}
              className="glass border border-subtle p-4 text-center hover:border-brand-500/30 transition-colors">
              <Pill className="w-5 h-5 text-violet-400 mx-auto mb-2" />
              <p className="text-sm font-display font-semibold text-primary">Prescriptions</p>
              <p className="text-xs text-muted">View issued medications</p>
            </Link>
            <Link href={`/lab-results?aptId=${apt.id}`}
              className="glass border border-subtle p-4 text-center hover:border-brand-500/30 transition-colors">
              <TestTube2 className="w-5 h-5 text-teal-400 mx-auto mb-2" />
              <p className="text-sm font-display font-semibold text-primary">Lab Orders</p>
              <p className="text-xs text-muted">View test orders</p>
            </Link>
          </div>
        )}

        {/* Review (completed only) */}
        {apt.status === "COMPLETED" && (
          <div className="glass border border-amber-500/20 p-5 bg-amber-500/5">
            <h2 className="text-sm font-display font-bold text-primary mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400" /> Rate your experience
            </h2>
            <div className="flex gap-2 mb-3">
              {[1,2,3,4,5].map((n) => (
                <button key={n} className="text-amber-400 hover:scale-110 transition-transform">
                  <Star className="w-6 h-6 hover:fill-amber-400" />
                </button>
              ))}
            </div>
            <textarea
              className="input min-h-[80px] resize-none text-sm"
              placeholder="Share your experience (optional)…"
            />
            <button className="btn-primary mt-3 text-sm">Submit Review</button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
