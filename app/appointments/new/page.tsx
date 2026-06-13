// app/appointments/new/page.tsx
import { Suspense } from "react";
import BookAppointmentPage from "./BookAppointmentPage";

export default function NewAppointmentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[80vh] flex items-center justify-center bg-surface-950">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted">Loading appointment scheduler...</p>
        </div>
      </div>
    }>
      <BookAppointmentPage />
    </Suspense>
  );
}