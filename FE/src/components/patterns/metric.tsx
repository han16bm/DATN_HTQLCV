import { cn } from "@/lib/cn";
import Link from "next/link";
import type { ReactNode } from "react";

// Dải số liệu chính ở đầu trang: vài ô nhỏ cạnh nhau, số lớn hơn nhãn.
export function MetricStrip({
  children,
  className,
  "aria-label": label,
}: {
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <section
      aria-label={label}
      className={cn(
        "mb-5 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-px overflow-hidden rounded-lg border border-line bg-line",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function Metric({
  label,
  value,
  hint,
  tone,
  href,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "danger" | "warning";
  href?: string;
}) {
  const box = cn(
    "block min-w-0 bg-surface px-4 py-3",
    href && "hover:border-line-input hover:bg-hover",
  );
  const body = (
    <>
      <div className="mb-1 text-xs font-medium text-fg-subtle">{label}</div>
      <div
        className={cn(
          "text-metric font-semibold tabular-nums",
          tone === "danger" && "text-danger-fg",
          tone === "warning" && "text-warning-fg",
        )}
      >
        {value}
      </div>
      {hint && <div className="text-xs text-fg-subtle">{hint}</div>}
    </>
  );
  return href ? (
    <Link href={href} className={box}>
      {body}
    </Link>
  ) : (
    <div className={box}>{body}</div>
  );
}
