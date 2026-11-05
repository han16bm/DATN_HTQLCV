import { cn } from "@/lib/cn";
import { ChevronRight } from "lucide-react";
import type { ComponentProps } from "react";

// Hành động phụ nằm ở tiêu đề một khối: chữ nhỏ kèm mũi tên, mở phần chi tiết của khối
// (ngăn kéo) mà không tranh nút chính. Nút viền đầy đủ dành cho hành động chính.
export function PanelLink({
  className,
  children,
  type = "button",
  ...props
}: ComponentProps<"button">) {
  return (
    <button
      data-ui
      type={type}
      className={cn(
        "inline-flex h-7 shrink-0 items-center gap-0.5 rounded-full pr-1.5 pl-2.5 text-xs font-medium whitespace-nowrap text-selected-fg transition-colors duration-150 ease-out hover:bg-selected-bg active:bg-pressed motion-reduce:transition-none pointer-coarse:min-h-11",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRight className="size-3.5" aria-hidden="true" />
    </button>
  );
}
