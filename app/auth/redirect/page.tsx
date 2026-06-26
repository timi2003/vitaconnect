// app/auth/redirect/page.tsx
// Landing page after OAuth sign-in — reads the session role and bounces the
// user to the right portal. Renders nothing visible.
"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";

export default function AuthRedirectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.replace("/auth/login");
      return;
    }

    const role = (session?.user as { role?: string })?.role ?? "PATIENT";

    if (role === "DOCTOR") {
      router.replace("/doctor-portal");
    } else if (role === "ADMIN") {
      router.replace("/admin");
    } else {
      router.replace("/dashboard");
    }
  }, [status, session, router]);

  // Minimal loading state while session resolves
  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-brand-500 flex items-center justify-center shadow-glow-sm animate-pulse">
          <Heart className="w-6 h-6 text-white" fill="white" />
        </div>
        <p className="text-sm text-muted font-mono">Redirecting…</p>
      </div>
    </div>
  );
}