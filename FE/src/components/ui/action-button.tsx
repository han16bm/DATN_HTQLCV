"use client";
import { useState, type ReactNode } from "react";
import { Button, type ButtonSize } from "./button";
import { Spinner } from "./loading";

export function ActionButton({
  children,
  onAction,
  primary = false,
  size = "md",
  pendingLabel = "Đang xử lý…",
}: {
  children: ReactNode;
  onAction: () => Promise<unknown>;
  primary?: boolean;
  size?: ButtonSize;
  pendingLabel?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="inline-flex w-fit min-w-0 max-w-full flex-none flex-col items-start gap-1">
      <Button
        variant={primary ? "primary" : "secondary"}
        size={size}
        disabled={busy}
        aria-busy={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            await onAction();
          } catch (cause) {
            setError(
              cause instanceof Error
                ? cause.message
                : "Chưa thực hiện được thao tác.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy && <Spinner />}
        {busy ? pendingLabel : children}
      </Button>
      {error && (
        <p role="alert" className="m-0 text-sm text-danger-fg">
          {error}
        </p>
      )}
    </div>
  );
}
