"use client";
import { cn } from "@/lib/cn";

// Chọn một trong vài chế độ xem (ví dụ Danh sách / Bảng trạng thái). Mỗi nút giữ
// aria-pressed; mục đang chọn là ô nổi trên nền thanh công cụ, chữ đậm hơn.
export function SegmentedControl({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-sunken p-1"
    >
      {options.map((option) => (
        <button
          key={option.value}
          data-ui
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
          className={cn(
            "h-[calc(var(--control-h)-4px)] rounded-md px-3 text-sm font-medium text-fg-subtle transition-colors hover:bg-hover pointer-coarse:min-h-11",
            "aria-pressed:bg-surface aria-pressed:font-semibold aria-pressed:text-selected-fg",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
