import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

// Trạng thái rỗng: nói rõ vì sao trống và, nếu có, hành động tiếp theo.
export function EmptyState({
  title = "Chưa có dữ liệu",
  message,
  action,
  className,
}: {
  title?: string;
  message?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid justify-items-center gap-1 px-5 py-8 text-center",
        className,
      )}
    >
      <p className="m-0 text-sm font-semibold text-fg">{title}</p>
      {message && (
        <p className="m-0 max-w-prose text-sm text-fg-subtle">{message}</p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
