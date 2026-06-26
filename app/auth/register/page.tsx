"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Heart, Loader2, Mail, Lock, User, Phone } from "lucide-react";
import toast from "react-hot-toast";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "", confirmPassword: "",
    role: "PATIENT" as "PATIENT" | "DOCTOR",
    dateOfBirth: "", gender: "",
  });

  function update(k: string, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Registration failed");
      }

      await signIn("credentials", {
        email: form.email, 
        password: form.password, 
        redirect: false,
      });

      toast.success("Account created! Welcome to VitaConnect.");

      // Role-based redirect - FIXED
      if (form.role === "DOCTOR") {
        router.push("/doctor-portal");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface-950 bg-grid flex items-center justify-center p-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-20 right-0 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="absolute bottom-0 -left-20 w-80 h-80 rounded-full bg-brand-500/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-brand-500 flex items-center justify-center shadow-glow-sm">
              <Heart className="w-6 h-6 text-white" fill="white" />
            </div>
            <p className="font-display font-bold text-lg text-primary">VitaConnect</p>
          </Link>
        </div>

        <div className="glass-strong p-8 border border-subtle">
          <h1 className="text-xl font-display font-bold text-primary mb-1">Create your account</h1>
          <p className="text-sm text-muted mb-6">Join 120K+ patients managing their health smarter</p>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            {(["PATIENT", "DOCTOR"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => update("role", r)}
                className={`py-3 px-4 rounded-xl border text-sm font-display font-semibold transition-all duration-200 ${
                  form.role === r
                    ? "border-brand-500/40 bg-brand-500/12 text-brand-400"
                    : "border-subtle text-muted hover:border-brand-500/25"
                }`}
              >
                {r === "PATIENT" ? "🧑‍⚕️ I'm a Patient" : "👨‍⚕️ I'm a Doctor"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Name */}
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input className="input pl-10" placeholder="Full name" required
                value={form.name} onChange={(e) => update("name", e.target.value)} />
            </div>

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input className="input pl-10" type="email" placeholder="Email address" required
                value={form.email} onChange={(e) => update("email", e.target.value)} />
            </div>

            {/* Phone */}
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input className="input pl-10" type="tel" placeholder="Phone number (optional)"
                value={form.phone} onChange={(e) => update("phone", e.target.value)} />
            </div>

            {/* DOB + Gender row */}
            <div className="grid grid-cols-2 gap-3">
              <input className="input text-sm" type="date" placeholder="Date of birth"
                value={form.dateOfBirth} onChange={(e) => update("dateOfBirth", e.target.value)} />
              <select className="input text-sm"
                value={form.gender} onChange={(e) => update("gender", e.target.value)}>
                <option value="">Gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="NON_BINARY">Non-binary</option>
                <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
              </select>
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                className="input pl-10 pr-10" placeholder="Password (8+ chars)"
                type={showPw ? "text" : "password"} required minLength={8}
                value={form.password} onChange={(e) => update("password", e.target.value)}
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-secondary">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Confirm password */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                className="input pl-10" placeholder="Confirm password"
                type="password" required
                value={form.confirmPassword}
                onChange={(e) => update("confirmPassword", e.target.value)}
              />
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <p className="text-center text-sm text-muted mt-6">
            Already have an account?{" "}
            <Link href="/auth/login"
                  className="text-brand-400 hover:text-brand-300 font-display font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}