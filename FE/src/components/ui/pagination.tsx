"use client";
import { cn } from "@/lib/cn";
import { Button } from "./button";

// Chân bảng: tổng số kết quả và, khi có nhiều trang, nút Trước/Sau.
export function Pagination({
  page = 1,
  total,
  pageSize = total || 1,
  onPage,
  className,
}: {
  page?: number;
  pageSize?: number;
  total: number;
  onPage?: (page: number) => void;
  className?: string;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div
      className={cn(
        "flex min-h-9 flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-line bg-surface px-3 py-1",
        className,
      )}
    >
      <span className="text-xs text-fg-subtle">{total} kết quả</span>
      {onPage && (total > pageSize || page > 1) && (
        <nav
          aria-label="Phân trang"
          className="ml-auto flex items-center gap-2"
        >
          <Button
            className="h-7 px-2 text-xs"
            disabled={page <= 1}
            onClick={() => onPage(page - 1)}
          >
            Trước
          </Button>
          <span className="text-xs text-fg-subtle" aria-live="polite">
            Trang {page} / {pages}
          </span>
          <Button
            className="h-7 px-2 text-xs"
            disabled={page * pageSize >= total}
            onClick={() => onPage(page + 1)}
          >
            Sau
          </Button>
        </nav>
      )}
    </div>
  );
}
