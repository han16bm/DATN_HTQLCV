"use client";
import { useState, type ReactNode } from "react";
import { Spinner } from "./loading";

export function ActionButton({
  children,
  onAction,
  primary = false,
  pendingLabel = "Đang xử lý…",
}: {
  children: ReactNode;
  onAction: () => Promise<unknown>;
  primary?: boolean;
  pendingLabel?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div>
      <button
        type="button"
        disabled={busy}
        className={`pending-button ${primary ? "primary" : ""}`}
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
      </button>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
