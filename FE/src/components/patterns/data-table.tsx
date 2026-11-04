"use client";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/loading";
import { Pagination } from "@/components/ui/pagination";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { cn } from "@/lib/cn";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { type ComponentProps, type ReactNode } from "react";

type Sort = "ascending" | "descending" | "none";
// Cột có onSort hiện nút sắp xếp; chỉ dùng khi API thực sự sắp xếp theo cột đó.
type Column = string | { label: string; sort?: Sort; onSort?: () => void };

// Bề rộng tối thiểu theo số cột; dưới mức này bảng cuộn ngang trong vùng riêng.
const minWidth: Record<number, string> = {
  1: "min-w-[280px]",
  2: "min-w-[400px]",
  3: "min-w-[400px]",
  4: "min-w-[600px]",
  7: "min-w-[1080px]",
  8: "min-w-[1080px]",
};

// Bảng ít cột không kéo giãn hết bề rộng để ô không bị thừa khoảng trắng.
const maxWidth: Record<number, string> = {
  1: "max-w-[560px]",
  2: "max-w-[560px]",
  3: "max-w-[760px]",
  4: "max-w-[960px]",
  5: "max-w-[1120px]",
};

const SortIcon = {
  ascending: ArrowUp,
  descending: ArrowDown,
  none: ChevronsUpDown,
};

// Bảng dữ liệu: tiêu đề và hành động nằm ngoài thẻ, dữ liệu và chân bảng trong thẻ.
// Bốn trạng thái: đang tải (khung xương khi chưa có hàng, mờ 20% kèm vòng quay khi
// làm mới), lỗi (kèm thử lại), rỗng, và không có kết quả theo bộ lọc.
export function DataTable({
  headers,
  rows,
  actions = false,
  fit = false,
  title,
  headerActions,
  description,
  pagination,
  widths,
  loading = false,
  error,
  onRetry,
  filtered = false,
  onClearFilters,
  empty,
}: {
  headers: Column[];
  rows: ReactNode[][];
  actions?: boolean;
  // Vừa cột nội dung; màn hẹp chuyển từng hàng thành nhóm có nhãn, không ép cuộn ngang.
  fit?: boolean;
  title?: string;
  headerActions?: ReactNode;
  description?: ReactNode;
  pagination?: ComponentProps<typeof Pagination>;
  widths?: number[];
  loading?: boolean;
  error?: Error | null;
  onRetry?: () => Promise<unknown>;
  // Rỗng vì bộ lọc: hiện "Không có kết quả phù hợp" kèm Xóa bộ lọc nếu có.
  filtered?: boolean;
  onClearFilters?: () => void;
  // Khung rỗng tùy biến, ví dụ lời nhắc kèm nút tạo mục đầu tiên.
  empty?: ReactNode;
}) {
  const columns = headers.length;
  const refreshing = loading && rows.length > 0;
  const skeleton = loading && rows.length === 0 && !error;
  const settled = !loading && !error;
  return (
    <section
      data-columns={columns}
      className={cn(
        "@container/table mb-4 w-full max-w-full min-w-0 self-start",
        maxWidth[columns],
      )}
    >
      {(title || headerActions) && (
        <div className="mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          {title && (
            <h2 className="m-0 text-heading-sm font-semibold text-fg">
              {title}
            </h2>
          )}
          {headerActions && (
            <div className="actions flex flex-wrap items-center gap-2">
              {headerActions}
            </div>
          )}
        </div>
      )}
      <div
        data-slot="card"
        aria-busy={loading || undefined}
        className="min-w-0 overflow-hidden rounded-lg border border-line bg-surface"
      >
        {description && (
          <div className="border-b border-line px-4 py-2.5 text-sm [&>:first-child]:mt-0 [&>:last-child]:mb-0">
            {description}
          </div>
        )}
        <div className="relative">
          <div
            className="scroll-shadow-x max-w-full overflow-x-auto overscroll-x-contain focus-visible:outline-offset-[-2px]"
            tabIndex={0}
            role="region"
            aria-label={title ?? "Bảng dữ liệu"}
          >
            <table
              aria-label={title}
              data-columns={columns}
              className={cn(
                "w-full table-fixed border-collapse text-left transition-opacity motion-reduce:transition-none",
                fit
                  ? "min-w-0 @max-[42rem]/table:block"
                  : minWidth[columns] ?? "min-w-[760px]",
                refreshing && "opacity-20",
              )}
            >
              {widths && (
                <colgroup
                  className={fit ? "@max-[42rem]/table:hidden" : undefined}
                >
                  {widths.map((width, index) => (
                    <col key={index} style={{ width: `${width}%` }} />
                  ))}
                </colgroup>
              )}
              <thead className={fit ? "@max-[42rem]/table:sr-only" : undefined}>
                <tr>
                  {headers.map((header, i) => {
                    const column =
                      typeof header === "string" ? { label: header } : header;
                    const Icon = SortIcon[column.sort ?? "none"];
                    return (
                      <th
                        key={i}
                        scope="col"
                        aria-sort={
                          column.onSort ? (column.sort ?? "none") : undefined
                        }
                        className={cn(
                          "h-9 bg-sunken/60 py-2 text-xs font-medium text-fg-subtle",
                          fit ? "px-2" : "px-3",
                          actions && i === columns - 1
                            ? "text-center"
                            : "text-left",
                        )}
                      >
                        {column.onSort ? (
                          <button
                            data-ui
                            type="button"
                            onClick={column.onSort}
                            className="-mx-1 inline-flex items-center gap-1 rounded-sm px-1 font-semibold hover:bg-hover hover:text-fg"
                          >
                            {column.label}
                            <Icon className="size-3.5" aria-hidden="true" />
                          </button>
                        ) : (
                          column.label
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className={fit ? "@max-[42rem]/table:block" : undefined}>
                {skeleton
                  ? Array.from({ length: 6 }, (_, row) => (
                      <tr
                        key={row}
                        aria-hidden="true"
                        className={fit ? "@max-[42rem]/table:grid @max-[42rem]/table:grid-cols-2" : undefined}
                      >
                        {headers.map((_, column) => (
                          <td
                            key={column}
                            className={cn(
                              "h-9 border-t border-line/70 py-1",
                              fit ? "px-2" : "px-3",
                            )}
                          >
                            <div className="h-3 animate-pulse rounded bg-sunken motion-reduce:animate-none" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : rows.map((row, i) => (
                      <tr
                        key={i}
                        className={cn(
                          "hover:bg-hover",
                          fit && "@max-[42rem]/table:grid @max-[42rem]/table:grid-cols-2 @max-[42rem]/table:border-t @max-[42rem]/table:border-line/70 @max-[42rem]/table:p-2",
                        )}
                      >
                        {row.map((cell, j) => (
                          <td
                            key={j}
                            className={cn(
                              "h-(--row-h) border-t border-line/70 py-2 align-middle text-sm leading-5 break-words",
                              fit ? "px-2 @max-[42rem]/table:block @max-[42rem]/table:h-auto @max-[42rem]/table:border-t-0" : "px-3",
                              fit && j === 0 && "@max-[42rem]/table:col-span-2",
                              fit && actions && j === row.length - 1 && "@max-[42rem]/table:col-span-2 @max-[42rem]/table:text-right",
                              actions &&
                                j === row.length - 1 &&
                                "text-center whitespace-nowrap [&_.actions]:flex-nowrap [&_.actions]:justify-center [&_.actions]:gap-1.5 [&_button]:min-h-7 [&_button]:px-1.5",
                            )}
                          >
                            {fit && j > 0 && !(actions && j === row.length - 1) && (
                              <span aria-hidden="true" className="hidden text-xs text-fg-subtle @max-[42rem]/table:mb-1 @max-[42rem]/table:block">
                                {typeof headers[j] === "string"
                                  ? headers[j]
                                  : headers[j].label}
                              </span>
                            )}
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
          {refreshing && (
            <div
              role="status"
              aria-label="Đang cập nhật bảng"
              className="pointer-events-none absolute inset-0 grid place-items-center"
            >
              <Spinner />
            </div>
          )}
        </div>
        {skeleton && (
          <span
            role="status"
            aria-label="Đang tải dữ liệu"
            className="sr-only"
          />
        )}
        {error && (
          <div className="p-4">
            <QueryErrorState error={error} retry={onRetry} />
          </div>
        )}
        {settled &&
          rows.length === 0 &&
          (empty ?? (
            <EmptyState
              title={filtered ? "Không có kết quả phù hợp" : "Chưa có dữ liệu"}
              message={
                filtered
                  ? "Hãy thử đổi hoặc xóa bộ lọc."
                  : "Chưa có mục nào để hiển thị."
              }
              action={
                filtered && onClearFilters ? (
                  <Button onClick={onClearFilters}>Xóa bộ lọc</Button>
                ) : undefined
              }
              className="py-6"
            />
          ))}
        {!error && !skeleton && (
          <Pagination {...(pagination ?? { total: rows.length })} />
        )}
      </div>
    </section>
  );
}
