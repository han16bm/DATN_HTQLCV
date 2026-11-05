import { cn } from "@/lib/cn";

export function Spinner({ label }: { label?: string }) {
  return (
    <span
      className="inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none"
      role={label ? "status" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-3 min-w-0 animate-pulse rounded bg-sunken motion-reduce:animate-none",
        className,
      )}
      aria-hidden="true"
    />
  );
}

export function PageSkeleton({
  variant = "detail",
}: {
  variant?: "table" | "detail" | "cards" | "form";
}) {
  return (
    <div
      className="mb-5 grid min-w-0 gap-4"
      role="status"
      aria-label="Đang tải dữ liệu"
      aria-busy="true"
    >
      <Skeleton className="h-5 w-[min(280px,55%)]" />
      {variant === "table" ? (
        <div className="overflow-hidden rounded-lg border border-line bg-surface">
          {Array.from({ length: 6 }, (_, row) => (
            <div
              className={cn(
                "grid grid-cols-4 gap-4 border-b border-line/70 px-3 py-3 last:border-b-0",
                row === 0 && "bg-sunken/60",
              )}
              key={row}
            >
              {Array.from({ length: 4 }, (_, column) => (
                <Skeleton key={column} />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div
          className={cn(
            "grid gap-3",
            variant === "cards"
              ? "grid-cols-[repeat(auto-fill,minmax(min(100%,13.75rem),1fr))]"
              : "grid-cols-[repeat(auto-fit,minmax(min(100%,17.5rem),1fr))]",
          )}
        >
          {Array.from({ length: variant === "cards" ? 4 : 2 }, (_, index) => (
            <div
              className="grid gap-3 rounded-lg border border-line bg-surface p-4"
              key={index}
            >
              <Skeleton className="h-3.5 w-2/5" />
              <Skeleton />
              <Skeleton />
              <Skeleton className="w-4/5" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
