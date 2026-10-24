"use client";
import { AuthObserver } from "@/features/auth/components/auth-observer";
import { shouldRetryQuery } from "@/services/http-error";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "sonner";

const mocking =
  process.env.NODE_ENV === "development" &&
  process.env.NEXT_PUBLIC_API_MOCKING === "enabled";
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
          if (new URL(request.url).pathname.startsWith("/api/v1/"))
            print.error();
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
      <div role="alert" className="boot-state">
        Chưa thể mở không gian làm việc.{" "}
        <button onClick={() => window.location.reload()}>Tải lại</button>
      </div>
    );
  if (!ready)
    return (
      <div role="status" className="boot-state">
        Đang chuẩn bị không gian làm việc…
      </div>
    );
  return (
    <QueryClientProvider client={client}>
      <AuthObserver>{children}</AuthObserver>
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}
