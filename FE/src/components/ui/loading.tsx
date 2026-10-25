export function Spinner({ label }: { label?: string }) {
  return (
    <span
      className="spinner"
      role={label ? "status" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

export function PageSkeleton({
  variant = "detail",
}: {
  variant?: "table" | "detail" | "cards" | "form";
}) {
  return (
    <div
      className={`page-skeleton skeleton-${variant}`}
      role="status"
      aria-label="Đang tải dữ liệu"
      aria-busy="true"
    >
      <Skeleton className="skeleton-title" />
      {variant === "table" ? (
        <div className="skeleton-table">
          {Array.from({ length: 6 }, (_, row) => (
            <div className="skeleton-row" key={row}>
              {Array.from({ length: 4 }, (_, column) => (
                <Skeleton key={column} />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="skeleton-grid">
          {Array.from({ length: variant === "cards" ? 4 : 2 }, (_, index) => (
            <div className="skeleton-block" key={index}>
              <Skeleton className="skeleton-heading" />
              <Skeleton />
              <Skeleton />
              <Skeleton />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
