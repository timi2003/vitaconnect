"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Calendar, Clock, Video, Headphones, MessageSquare,
  ChevronLeft, ChevronRight, CheckCircle2, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const CONSULT_TYPES = [
  { id: "VIDEO", label: "Video Call", icon: Video, desc: "Face-to-face video consultation" },
  { id: "AUDIO", label: "Audio Call", icon: Headphones, desc: "Voice-only consultation" },
  { id: "CHAT",  label: "Live Chat",  icon: MessageSquare, desc: "Text-based consultation" },
];

const TIME_SLOTS = [
  "09:00","09:30","10:00","10:30","11:00","11:30",
  "14:00","14:30","15:00","15:30","16:00","16:30","17:00",
];

const SYMPTOM_OPTIONS = [
  "Chest pain","Shortness of breath","Headache","Fever","Fatigue",
  "Nausea","Back pain","Joint pain","Cough","Dizziness",
  "Skin rash","High blood pressure","Diabetes management","Follow-up",
];

function getNext14Days() {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });
}

export default function BookAppointmentPage() {
  const sp = useSearchParams();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [consultType, setConsultType] = useState("VIDEO");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const days = getNext14Days();

  function toggleSymptom(s: string) {
    setSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  async function handleBook() {
    if (!selectedDate || !selectedTime) return;
    setLoading(true);
    try {
      const [h, m] = selectedTime.split(":").map(Number);
      const dt = new Date(selectedDate);
      dt.setHours(h, m, 0, 0);

      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: sp.get("doctorId") ?? "d1",
          scheduledAt: dt.toISOString(),
          type: consultType,
          reason,
          symptoms,
        }),
      });

      if (!res.ok) throw new Error("Booking failed");
      toast.success("Appointment booked successfully!");
      router.push("/appointments");
    } catch {
      toast.error("Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const STEPS = ["Consult Type", "Date & Time", "Symptoms", "Confirm"];

  return (
    <DashboardLayout>
      <div className="page-enter max-w-2xl mx-auto space-y-6 pb-24 lg:pb-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-display font-bold text-primary">Book Appointment</h1>
          <p className="text-sm text-muted mt-0.5">Schedule a consultation with your doctor</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-display font-bold",
                "border transition-all duration-300",
                i + 1 < step
                  ? "bg-accent-green border-accent-green/50 text-surface-950"
                  : i + 1 === step
                  ? "bg-brand-500 border-brand-500 text-white"
                  : "border-subtle text-muted"
              )}>
                {i + 1 < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span className={cn(
                "text-xs font-display hidden sm:block",
                i + 1 === step ? "text-primary font-semibold" : "text-muted"
              )}>{s}</span>
              {i < STEPS.length - 1 && (
                <div className={cn(
                  "flex-1 h-0.5 rounded",
                  i + 1 < step ? "bg-accent-green/50" : "bg-surface-700"
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Consult type */}
        {step === 1 && (
          <div className="glass p-6 border border-subtle space-y-4">
            <h2 className="font-display font-bold text-primary">Choose consultation type</h2>
            <div className="grid gap-3">
              {CONSULT_TYPES.map((t) => (
                <button key={t.id} onClick={() => setConsultType(t.id)}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-200",
                    consultType === t.id
                      ? "border-brand-500/40 bg-brand-500/10"
                      : "border-subtle hover:border-brand-500/25"
                  )}>
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                    consultType === t.id ? "bg-brand-500/20 border border-brand-500/30" : "bg-surface-800 border border-subtle"
                  )}>
                    <t.icon className={cn("w-5 h-5", consultType === t.id ? "text-brand-400" : "text-muted")} />
                  </div>
                  <div>
                    <p className="font-display font-semibold text-sm text-primary">{t.label}</p>
                    <p className="text-xs text-muted">{t.desc}</p>
                  </div>
                  {consultType === t.id && (
                    <CheckCircle2 className="w-4 h-4 text-brand-400 ml-auto" />
                  )}
                </button>
              ))}
            </div>
            <button onClick={() => setStep(2)} className="btn-primary w-full">Continue</button>
          </div>
        )}

        {/* Step 2: Date & Time */}
        {step === 2 && (
          <div className="glass p-6 border border-subtle space-y-5">
            <h2 className="font-display font-bold text-primary">Select date & time</h2>

            {/* Date picker */}
            <div>
              <p className="text-xs text-muted font-display mb-3">Available dates</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {days.map((d) => {
                  const isToday = d.toDateString() === new Date().toDateString();
                  const isSel   = selectedDate?.toDateString() === d.toDateString();
                  return (
                    <button key={d.toISOString()} onClick={() => setSelectedDate(d)}
                      className={cn(
                        "flex-shrink-0 flex flex-col items-center gap-1 w-16 py-3 rounded-xl border",
                        "text-xs font-display transition-all duration-200",
                        isSel
                          ? "border-brand-500/50 bg-brand-500/15 text-brand-300"
                          : "border-subtle text-muted hover:border-brand-500/25"
                      )}>
                      <span className="font-medium uppercase tracking-wider text-xs opacity-70">
                        {d.toLocaleDateString("en-US", { weekday: "short" })}
                      </span>
                      <span className="text-lg font-bold">{d.getDate()}</span>
                      {isToday && <span className="text-xs text-accent-green">Today</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time slots */}
            {selectedDate && (
              <div>
                <p className="text-xs text-muted font-display mb-3">Available time slots</p>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {TIME_SLOTS.map((t) => (
                    <button key={t} onClick={() => setSelectedTime(t)}
                      className={cn(
                        "py-2 rounded-xl border text-xs font-mono font-bold transition-all duration-200",
                        selectedTime === t
                          ? "border-brand-500/50 bg-brand-500/15 text-brand-300"
                          : "border-subtle text-muted hover:border-brand-500/25"
                      )}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="btn-ghost flex items-center gap-2">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!selectedDate || !selectedTime}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Symptoms */}
        {step === 3 && (
          <div className="glass p-6 border border-subtle space-y-5">
            <h2 className="font-display font-bold text-primary">Describe your symptoms</h2>
            <div>
              <p className="text-xs text-muted font-display mb-3">Select all that apply</p>
              <div className="flex flex-wrap gap-2">
                {SYMPTOM_OPTIONS.map((s) => (
                  <button key={s} onClick={() => toggleSymptom(s)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl border text-xs font-display font-medium transition-all duration-200",
                      symptoms.includes(s)
                        ? "border-brand-500/50 bg-brand-500/15 text-brand-300"
                        : "border-subtle text-muted hover:border-brand-500/25"
                    )}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted font-display block mb-2">
                Additional notes (optional)
              </label>
              <textarea
                className="input min-h-[100px] resize-none"
                placeholder="Describe your symptoms or reason for visit in more detail…"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(2)} className="btn-ghost flex items-center gap-2">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button onClick={() => setStep(4)} className="btn-primary flex-1">Continue</button>
            </div>
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === 4 && (
          <div className="glass p-6 border border-subtle space-y-5">
            <h2 className="font-display font-bold text-primary">Confirm appointment</h2>

            <div className="space-y-3">
              {[
                { label: "Doctor",    value: "Dr. Sarah Chen – Cardiologist" },
                { label: "Type",      value: CONSULT_TYPES.find((t) => t.id === consultType)?.label ?? "" },
                { label: "Date",      value: selectedDate?.toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric" }) ?? "" },
                { label: "Time",      value: selectedTime ?? "" },
                { label: "Duration",  value: "30 minutes" },
                { label: "Fee",       value: "$75.00" },
                { label: "Symptoms",  value: symptoms.length > 0 ? symptoms.join(", ") : "None selected" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-start py-2 border-b border-subtle last:border-0">
                  <span className="text-sm text-muted font-display">{label}</span>
                  <span className="text-sm font-display font-semibold text-primary text-right max-w-xs">{value}</span>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-brand-500/25 bg-brand-500/8 p-4">
              <p className="text-xs text-brand-300 font-display">
                💳 Payment will be charged after the consultation. Cancellation is free up to 2 hours before.
              </p>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setStep(3)} className="btn-ghost flex items-center gap-2">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button onClick={handleBook} disabled={loading}
                className="btn-primary flex-1 flex items-center justify-center gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Booking…" : "Confirm Booking"}
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}