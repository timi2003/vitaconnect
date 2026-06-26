"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Heart, Loader2, Mail, Lock } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);

  // Honour any ?callbackUrl= from middleware redirects
  const callbackUrl = searchParams.get("callbackUrl") || null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setLoading(false);
      toast.error("Invalid email or password");
      return;
    }

    if (res?.ok) {
      // Read the freshly-created session to get the role NextAuth stored in JWT
      const session = await getSession();
      const role    = (session?.user as { role?: string })?.role ?? "PATIENT";

      toast.success("Welcome back!");

      if (callbackUrl) {
        router.push(callbackUrl);
      } else if (role === "DOCTOR") {
        router.push("/doctor-portal");
      } else if (role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }

      router.refresh();
    }

    setLoading(false);
  }

  async function handleGoogle() {
    // For OAuth we can't know the role before redirect, so NextAuth will land
    // on the default. After the signIn callback runs we redirect in authOptions
    // pages.newUser or via a post-login redirect page if needed.
    // For now mirror the same pattern: signIn then let the server redirect.
    await signIn("google", {
      callbackUrl: callbackUrl ?? "/auth/redirect", // /auth/redirect handles role routing
    });
  }

  return (
    <div className="min-h-screen bg-surface-950 bg-grid flex items-center justify-center p-4">
      {/* Glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-brand-500/12 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-violet-500/8 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-brand-500 flex items-center justify-center shadow-glow-md animate-float">
              <Heart className="w-7 h-7 text-white" fill="white" />
            </div>
            <div>
              <p className="font-display font-bold text-xl text-primary">VitaConnect</p>
              <p className="text-sm text-muted font-mono">Telehealth Platform</p>
            </div>
          </Link>
        </div>

        {/* Card */}
        <div className="glass-strong p-8 border border-subtle">
          <h1 className="text-xl font-display font-bold text-primary mb-1">Welcome back</h1>
          <p className="text-sm text-muted mb-6">Sign in to your health dashboard</p>

          {/* Google */}
          <button
            onClick={handleGoogle}
            className="btn-ghost w-full flex items-center justify-center gap-2 mb-4"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-surface-700" />
            <span className="text-xs text-muted font-mono">or</span>
            <div className="flex-1 h-px bg-surface-700" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="email"
                className="input pl-10"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type={showPw ? "text" : "password"}
                className="input pl-10 pr-10"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-secondary"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex justify-end">
              <Link href="/auth/forgot-password"
                    className="text-xs text-brand-400 hover:text-brand-300 transition-colors font-display">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p className="text-center text-sm text-muted mt-6">
            New to VitaConnect?{" "}
            <Link href="/auth/register"
                  className="text-brand-400 hover:text-brand-300 font-display font-semibold transition-colors">
              Create account
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-muted mt-4 px-4">
          By signing in you agree to our{" "}
          <a href="/terms" className="text-brand-400 hover:underline">Terms</a> and{" "}
          <a href="/privacy" className="text-brand-400 hover:underline">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}