import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export function KeyValueList({
  children,
  className,
  compact = false,
}: {
  children: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <dl
      className={cn(
        "@container/metadata m-0 grid min-w-0 text-sm",
        compact ? "gap-y-2" : "gap-y-3",
        className,
      )}
    >
      {children}
    </dl>
  );
}

export function KeyValue({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-w-0 items-baseline gap-x-2 @min-[15rem]/metadata:grid-cols-[minmax(6rem,0.9fr)_minmax(0,1.1fr)]">
      <dt className="text-xs leading-6 text-fg-subtle after:content-[':']">
        {label}
      </dt>
      <dd className="m-0 min-w-0 text-left break-words text-fg">{children}</dd>
    </div>
  );
}
