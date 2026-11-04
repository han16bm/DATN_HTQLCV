"use client";
import { PreferencesSync } from "@/components/layout/preferences-sync";
import { AuthObserver } from "@/features/auth/components/auth-observer";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Spinner } from "@/components/ui/loading";
import { shouldRetryQuery } from "@/services/http-error";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "sonner";

const mocking = process.env.NEXT_PUBLIC_API_MODE === "mock";
let workerReady: Promise<unknown> | undefined;
export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: shouldRetryQuery,
            refetchOnWindowFocus: false,
            gcTime: 300_000,
          },
          mutations: { retry: false },
        },
      }),
  );
  const [ready, setReady] = useState(!mocking);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!mocking) return;
    let mounted = true;
    workerReady ??= import("@/mocks/browser").then(({ worker }) =>
      worker.start({
        onUnhandledRequest(request, print) {
          if (new URL(request.url).pathname.startsWith("/api/")) print.error();
        },
      }),
    );
    workerReady
      .then(() => {
        if (mounted) setReady(true);
      })
      .catch(() => {
        if (mounted) setError(true);
      });
    return () => {
      mounted = false;
    };
  }, []);
  if (error)
    return (
      <div
        role="alert"
        className="flex min-h-screen items-center justify-center gap-3.5 text-sm text-fg"
      >
        Chưa thể mở không gian làm việc.{" "}
        <Button onClick={() => window.location.reload()}>Tải lại</Button>
      </div>
    );
  if (!ready)
    return (
      <div
        role="status"
        className="flex min-h-screen items-center justify-center gap-3.5 text-sm text-fg"
      >
        <Spinner />
        Đang chuẩn bị không gian làm việc…
      </div>
    );
  return (
    <QueryClientProvider client={client}>
      <PreferencesSync />
      <AuthObserver>{children}</AuthObserver>
      <ConfirmDialog />
      <Toaster position="top-right" richColors closeButton duration={3500} />
    </QueryClientProvider>
  );
}
