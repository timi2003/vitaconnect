"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { OfflineBanner } from "@/components/ui/OfflineBanner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          staleTime:   60_000,
          retry:       1,
          networkMode: "offlineFirst",
        },
        mutations: {
          networkMode: "offlineFirst",
        },
      },
    })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <OfflineBanner />
      </QueryClientProvider>
    </SessionProvider>
  );
}