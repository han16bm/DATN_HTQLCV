import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

// Thanh công cụ của danh sách: tìm kiếm và bộ lọc xếp từ trái, công cụ phụ (xóa bộ
// lọc, đổi chế độ xem) dồn về phải. Mỗi điều khiển có nhãn luôn hiện ở trên.
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
    <section
      aria-label={label}
      className="mb-4 flex flex-wrap items-end gap-x-3 gap-y-3"
    >
      {children}
      {tools && (
        <div className="ml-auto flex flex-wrap items-center gap-2 max-md:w-full max-md:justify-between">
          {tools}
        </div>
      )}
    </section>
  );
}

// Nhãn bọc điều khiển nên bấm nhãn là focus vào ô, tên truy cập lấy từ nhãn.
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
        "flex min-w-0 flex-col gap-1 text-xs font-medium text-fg-subtle",
        search
          ? "max-md:basis-full md:min-w-40 md:flex-[0_1_18rem]"
          : "max-md:flex-1 max-md:basis-[calc(50%-6px)]",
      )}
    >
      {label}
      {children}
    </label>
  );
}
