import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export function SplitLayout({
  aside,
  children,
  className,
}: {
  aside: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid items-start gap-5 @min-[56.25rem]/page:grid-cols-[minmax(0,1fr)_18.75rem]",
        className,
      )}
    >
      <div className="grid min-w-0 content-start gap-5">{children}</div>
      <div className="grid min-w-0 content-start gap-5">{aside}</div>
    </div>
  );
}
