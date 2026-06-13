"use client";

import Link from "next/link";
import { Video, Calendar, Clock, ChevronRight, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const MOCK_APPOINTMENTS = [
  {
    id: "apt1",
    doctor: "Dr. Sarah Chen",
    specialty: "Cardiologist",
    date: "Today",
    time: "2:30 PM",
    type: "VIDEO",
    status: "CONFIRMED",
    avatar: "SC",
    avatarColor: "bg-brand-600/30 text-brand-400",
  },
  {
    id: "apt2",
    doctor: "Dr. Marcus Williams",
    specialty: "General Practice",
    date: "Tomorrow",
    time: "10:00 AM",
    type: "VIDEO",
    status: "SCHEDULED",
    avatar: "MW",
    avatarColor: "bg-violet-600/30 text-violet-400",
  },
  {
    id: "apt3",
    doctor: "Dr. Priya Patel",
    specialty: "Endocrinologist",
    date: "Jun 12",
    time: "3:15 PM",
    type: "AUDIO",
    status: "SCHEDULED",
    avatar: "PP",
    avatarColor: "bg-teal-600/30 text-teal-400",
  },
];

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: "badge-success",
  SCHEDULED: "badge-info",
  IN_PROGRESS: "badge-warning",
  CANCELLED: "badge-danger",
};

export function UpcomingAppointments() {
  return (
    <div className="glass p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-display font-bold text-primary">
          Upcoming Appointments
        </h2>
        <Link
          href="/appointments"
          className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1
                     font-display font-medium transition-colors"
        >
          View all <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="space-y-2.5">
        {MOCK_APPOINTMENTS.map((apt, i) => (
          <Link
            key={apt.id}
            href={`/appointments/${apt.id}`}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl border border-subtle",
              "hover:border-brand-500/30 hover:bg-surface-800/40 transition-all duration-200",
              i === 0 && "border-brand-500/25 bg-brand-500/5"
            )}
          >
            {/* Avatar */}
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
              "border border-white/10 font-display font-bold text-sm",
              apt.avatarColor
            )}>
              {apt.avatar}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-display font-semibold text-primary truncate">
                {apt.doctor}
              </p>
              <p className="text-xs text-muted">{apt.specialty}</p>
            </div>

            {/* Right */}
            <div className="text-right flex-shrink-0">
              <div className="flex items-center gap-1.5 justify-end mb-1">
                <span className={cn("badge text-xs py-0.5", STATUS_STYLES[apt.status])}>
                  {apt.status === "CONFIRMED" && i === 0 ? "Today" : apt.status.toLowerCase()}
                </span>
              </div>
              <div className="flex items-center gap-1 justify-end text-xs text-muted">
                <Clock className="w-3 h-3" />
                {apt.time}
              </div>
            </div>

            {/* Join button for today */}
            {i === 0 && (
              <div className="ml-1">
                <div className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5">
                  <Video className="w-3 h-3" />
                  Join
                </div>
              </div>
            )}
          </Link>
        ))}
      </div>

      {/* Book new */}
      <Link
        href="/appointments/new"
        className="flex items-center justify-center gap-2 w-full p-3 rounded-xl
                   border border-dashed border-brand-500/25 text-sm text-brand-400
                   hover:bg-brand-500/8 hover:border-brand-500/40 transition-all duration-200
                   font-display font-medium"
      >
        <Calendar className="w-4 h-4" />
        Book New Appointment
      </Link>
    </div>
  );
}
