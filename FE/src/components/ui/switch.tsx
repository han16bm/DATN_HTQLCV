"use client";
import { cn } from "@/lib/cn";
import { useId, type ReactNode } from "react";

// Công tắc bật/tắt có hiệu lực ngay (không cần nút lưu): tiêu đề ngắn, mô tả một dòng
// nhỏ bên dưới, công tắc ở bên phải. Bấm vào chữ cũng bật/tắt như bấm công tắc.
export function Switch({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2">
      <label htmlFor={id} className="grid min-w-0 cursor-pointer gap-0.5">
        <span className="text-sm font-medium text-fg">{label}</span>
        {hint && (
          <span id={hintId} className="text-xs text-fg-subtle">
            {hint}
          </span>
        )}
      </label>
      <button
        data-ui
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        aria-describedby={hint ? hintId : undefined}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full bg-line-input transition-colors pointer-coarse:my-1 motion-reduce:transition-none",
          "aria-checked:bg-action",
          "after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-white after:shadow-raised after:transition-transform motion-reduce:after:transition-none",
          "aria-checked:after:translate-x-5",
        )}
      />
    </div>
  );
}
