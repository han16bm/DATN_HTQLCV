"use client";
import { useState, type ReactNode } from "react";
import { Button } from "./button";
import { Spinner } from "./loading";

// Nút chạy một thao tác bất đồng bộ: khóa nút, hiện vòng quay và nhãn đang xử lý,
// báo lỗi ngay dưới nút nếu thất bại.
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
    <div className="inline-flex flex-col items-start gap-1">
      <Button
        variant={primary ? "primary" : "secondary"}
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
