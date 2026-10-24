"use client";
import { useState, type ReactNode } from "react";

export function ActionButton({
  children,
  onAction,
  primary = false,
}: {
  children: ReactNode;
  onAction: () => Promise<void>;
  primary?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div>
      <button
        disabled={busy}
        className={primary ? "primary" : ""}
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
        {busy ? "Đang xử lý…" : children}
      </button>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
