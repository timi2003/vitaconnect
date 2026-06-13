// lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, opts?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric", year: "numeric",
    ...opts,
  }).format(new Date(date));
}

export function formatTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric", minute: "2-digit", hour12: true,
  }).format(new Date(date));
}

export function formatRelative(date: Date | string): string {
  const now = Date.now();
  const d   = new Date(date).getTime();
  const diff = now - d;
  if (diff < 60000)  return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export function bmi(weightKg: number, heightCm: number): number {
  const hm = heightCm / 100;
  return Math.round((weightKg / (hm * hm)) * 10) / 10;
}

export function bmiCategory(bmiValue: number): { label: string; color: string } {
  if (bmiValue < 18.5) return { label: "Underweight", color: "amber" };
  if (bmiValue < 25)   return { label: "Normal",      color: "green" };
  if (bmiValue < 30)   return { label: "Overweight",  color: "amber" };
  return                      { label: "Obese",        color: "coral" };
}

export function generateRoomId(): string {
  return `vc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function truncate(str: string, max = 80): string {
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}