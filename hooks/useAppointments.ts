// hooks/useAppointments.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  scheduledAt: string;
  duration: number;
  type: "VIDEO" | "AUDIO" | "CHAT" | "IN_PERSON";
  status: "SCHEDULED" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW" | "RESCHEDULED";
  reason?: string;
  symptoms: string[];
  notes?: string;
  doctorNotes?: string;
  roomId?: string;
  doctor: {
    id: string; name: string; image?: string;
    doctorProfile?: { specializations: string[]; consultationFee: number; rating: number };
  };
  patient: { id: string; name: string; image?: string };
  payment?: { status: string; amount: number };
}

interface CreateAppointmentInput {
  doctorId: string;
  scheduledAt: string;
  duration?: number;
  type?: string;
  reason?: string;
  symptoms?: string[];
  notes?: string;
}

interface CancelInput { id: string; reason?: string }

export function useAppointments(options?: {
  upcoming?: boolean;
  status?: string;
}) {
  return useQuery({
    queryKey: ["appointments", options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.upcoming) params.set("upcoming", "true");
      if (options?.status)   params.set("status", options.status);
      const { data } = await axios.get<{ appointments: Appointment[] }>(
        `/api/appointments?${params}`
      );
      return data.appointments;
    },
    staleTime: 30_000,
  });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateAppointmentInput) => {
      const { data } = await axios.post("/api/appointments", input);
      return data.appointment as Appointment;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Appointment booked!");
    },
    onError: (err: unknown) => {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.error ?? "Booking failed"
        : "Booking failed";
      toast.error(msg);
    },
  });
}

export function useCancelAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: CancelInput) => {
      const { data } = await axios.patch(`/api/appointments/${id}`, {
        status: "CANCELLED", cancelReason: reason,
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Appointment cancelled");
    },
    onError: () => toast.error("Failed to cancel appointment"),
  });
}