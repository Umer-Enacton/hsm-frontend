"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes";
import { queryClient } from "@/lib/queries/query-client";
import { FCMTokenRegistration } from "@/components/FCMTokenRegistration";
import { ServiceWorkerProvider } from "@/components/ServiceWorkerProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <ServiceWorkerProvider />
        <FCMTokenRegistration />
        {children}
        <Toaster richColors />
        {process.env.NODE_ENV === "development" && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
