"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import LoginForm from "./LoginForm";   // We'll create this

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface-950 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
            <p className="text-muted">Loading...</p>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}