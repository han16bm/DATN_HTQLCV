"use client";
import { cn } from "@/lib/cn";
import type { LucideIcon } from "lucide-react";

// Chọn một trong vài chế độ xem (ví dụ Danh sách / Bảng trạng thái). Mỗi nút giữ
// aria-pressed và tên truy cập; icon tiết kiệm chỗ, title giải thích khi rê chuột.
export function SegmentedControl({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string; icon: LucideIcon }[];
  onChange: (value: string) => void;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex h-(--control-h) shrink-0 items-center gap-0.5 rounded-full bg-sunken p-0.5 pointer-coarse:h-12"
    >
      {options.map(({ value: key, label: name, icon: Icon }) => (
        <button
          key={key}
          data-ui
          type="button"
          aria-label={name}
          title={name}
          aria-pressed={key === value}
          onClick={() => onChange(key)}
          className={cn(
            "grid aspect-square h-full place-items-center rounded-full text-fg-subtle transition-colors duration-150 ease-out hover:bg-hover active:bg-pressed motion-reduce:transition-none",
            "aria-pressed:bg-surface aria-pressed:text-selected-fg",
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
