import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export function FilterBar({
  label,
  tools,
  children,
}: {
  label: string;
  tools?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section aria-label={label} className="@container/filters compact-filters mb-3 flex min-w-0 flex-wrap items-end gap-2">
      {children}
      {tools && (
        <div className="ml-auto flex min-w-0 max-w-full flex-wrap items-center justify-end gap-2">
          {tools}
        </div>
      )}
    </section>
  );
}

export function FilterField({
  label,
  search = false,
  children,
}: {
  label: string;
  search?: boolean;
  children: ReactNode;
}) {
  return (
    <label
      className={cn(
        "flex min-w-0 flex-col gap-0.5 text-xs font-medium text-fg-subtle",
        search
          ? "max-w-[min(100%,16rem)] flex-[1_1_8rem] @max-[40rem]/filters:max-w-none @max-[40rem]/filters:basis-full"
          : "max-w-full @max-[40rem]/filters:flex-[1_1_9rem]",
      )}
    >
      {label}
      {children}
    </label>
  );
}
