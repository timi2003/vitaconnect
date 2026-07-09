"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Calendar, Clock, Video, Headphones, MessageSquare, ArrowLeft,
  CheckCircle2, XCircle, AlertCircle, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

type AppointmentDetail = {
  id: string;
  scheduledAt: string;
  duration: number;
  type: string;
  status: string;
  reason?: string;
  symptoms: string[];
  notes?: string;
  doctorNotes?: string;
  doctor: {
    id: string;
    name: string;
    image?: string;
    specialty?: string;
  };
  patient: {
    name: string;
  };
  roomId?: string;
  payment?: {
    amount: number;
    status: string;
  };
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  SCHEDULED:   { label: "Scheduled",   color: "text-blue-400", icon: Calendar },
  CONFIRMED:   { label: "Confirmed",   color: "text-green-400", icon: CheckCircle2 },
  IN_PROGRESS: { label: "In Progress", color: "text-accent-green", icon: AlertCircle },
  COMPLETED:   { label: "Completed",   color: "text-teal-400", icon: CheckCircle2 },
  CANCELLED:   { label: "Cancelled",   color: "text-red-400", icon: XCircle },
};

export default function AppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function fetchAppointment() {
      try {
        const res = await fetch(`/api/appointments/${id}`);
        if (!res.ok) throw new Error("Failed to load appointment");
        const data = await res.json();
        setAppointment(data.appointment);
      } catch (err) {
        toast.error("Failed to load appointment details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchAppointment();
  }, [id]);

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });

      if (res.ok) {
        toast.success("Appointment cancelled successfully");
        // Refresh data
        const refreshed = await fetch(`/api/appointments/${id}`);
        const data = await refreshed.json();
        setAppointment(data.appointment);
      } else {
        toast.error("Failed to cancel appointment");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-[70vh] flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-brand-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (!appointment) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <p className="text-red-400">Appointment not found</p>
          <button onClick={() => router.push("/appointments")} className="btn-primary mt-4">
            Back to Appointments
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const statusInfo = STATUS_CONFIG[appointment.status] || STATUS_CONFIG.SCHEDULED;
  const StatusIcon = statusInfo.icon;
  const isUpcoming = ["SCHEDULED", "CONFIRMED"].includes(appointment.status);

  return (
    <DashboardLayout>
      <div className="page-enter max-w-3xl mx-auto space-y-8 pb-12">
        <button
          onClick={() => router.push("/appointments")}
          className="flex items-center gap-2 text-muted hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Appointments
        </button>

        <div className="glass border border-subtle p-8 rounded-3xl">
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="flex items-center gap-3">
                <div className={cn("w-4 h-4 rounded-full", 
                  appointment.status === "IN_PROGRESS" ? "bg-accent-green animate-pulse" : ""
                )} />
                <h1 className="text-3xl font-display font-bold">Appointment Details</h1>
              </div>
              <p className="text-muted mt-1">ID: {appointment.id}</p>
            </div>
            <div className={cn("badge text-sm px-4 py-1.5 flex items-center gap-2", 
              appointment.status === "IN_PROGRESS" ? "badge-warning" : ""
            )}>
              <StatusIcon className="w-4 h-4" />
              {statusInfo.label}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Doctor Info */}
            <div className="space-y-6">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted mb-2">With</p>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-surface-800 flex items-center justify-center text-2xl font-display border border-white/10">
                    {appointment.doctor.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <p className="font-semibold text-xl">{appointment.doctor.name}</p>
                    <p className="text-muted">{appointment.doctor.specialty}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-muted" />
                  <div>
                    <p className="font-medium">Date</p>
                    <p className="text-lg">
                      {new Date(appointment.scheduledAt).toLocaleDateString("en-US", {
                        weekday: "long", month: "long", day: "numeric"
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-muted" />
                  <div>
                    <p className="font-medium">Time</p>
                    <p className="text-lg">
                      {new Date(appointment.scheduledAt).toLocaleTimeString("en-US", {
                        hour: "numeric", minute: "2-digit"
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Consultation Info */}
            <div className="space-y-6">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted mb-3">Consultation</p>
                <div className="flex items-center gap-3 p-4 bg-surface-900 rounded-2xl">
                  {appointment.type === "VIDEO" && <Video className="w-8 h-8" />}
                  {appointment.type === "AUDIO" && <Headphones className="w-8 h-8" />}
                  {appointment.type === "CHAT" && <MessageSquare className="w-8 h-8" />}
                  <div>
                    <p className="font-semibold">{appointment.type} Consultation</p>
                    <p className="text-sm text-muted">{appointment.duration} minutes</p>
                  </div>
                </div>
              </div>

              {appointment.roomId && isUpcoming && (
                <button 
                  onClick={() => router.push(`/video?room=${appointment.roomId}`)}
                  className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-3"
                >
                  <Video className="w-6 h-6" />
                  Join Video Call
                </button>
              )}
            </div>
          </div>

          {/* Reason & Symptoms */}
          {(appointment.reason || appointment.symptoms?.length > 0) && (
            <div className="mt-10 pt-8 border-t border-subtle">
              <h3 className="font-display font-semibold mb-4">Reason for Visit</h3>
              <p className="text-secondary leading-relaxed">{appointment.reason}</p>

              {appointment.symptoms?.length > 0 && (
                <div className="mt-6">
                  <p className="text-xs text-muted mb-3">Symptoms</p>
                  <div className="flex flex-wrap gap-2">
                    {appointment.symptoms.map((symptom, i) => (
                      <span key={i} className="px-4 py-1.5 bg-surface-900 rounded-xl text-sm">
                        {symptom}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="mt-10 flex gap-3">
            {isUpcoming && (
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="btn-ghost flex-1 text-red-400 hover:bg-red-500/10"
              >
                {actionLoading ? "Cancelling..." : "Cancel Appointment"}
              </button>
            )}
            <button
              onClick={() => router.push("/appointments")}
              className="btn-primary flex-1"
            >
              Back to List
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}