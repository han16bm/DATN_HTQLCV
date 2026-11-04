import { cn } from "@/lib/cn";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "subtle" | "danger";

const variants: Record<Variant | "selected", string> = {
  primary:
    "border-transparent bg-action text-white hover:bg-action-hover active:bg-action-pressed",
  secondary: "border-line bg-surface text-fg hover:bg-sunken active:bg-pressed",
  subtle:
    "border-transparent bg-transparent text-fg hover:bg-hover active:bg-pressed",
  danger:
    "border-transparent bg-danger-bold text-white hover:bg-danger-bold-hover",
  selected:
    "border-transparent bg-selected-bg text-selected-fg hover:bg-info-bg",
};

// Lớp của nút, dùng chung cho Button và liên kết trông như nút (ButtonLink).
export const buttonClass = (variant: Variant = "secondary", selected = false) =>
  cn(
    "relative inline-flex h-(--control-h) items-center justify-center gap-1.5 rounded-md border px-3",
    "text-sm font-medium whitespace-nowrap transition-colors duration-150 motion-reduce:transition-none",
    "disabled:cursor-not-allowed disabled:opacity-60 aria-disabled:cursor-wait pointer-coarse:min-h-11",
    variants[selected ? "selected" : variant],
  );

// Thang nút theo mức nhấn: Primary (một nút mỗi khu vực), Secondary, Subtle, Danger.
// `selected` là trạng thái chọn, `loading` thay nhãn bằng vòng quay và chặn bấm.
export function Button({
  variant = "secondary",
  selected,
  loading,
  className,
  type = "button",
  children,
  onClick,
  ...props
}: ComponentProps<"button"> & {
  variant?: Variant;
  selected?: boolean;
  loading?: boolean;
}) {
  return (
    <button
      data-ui
      type={type}
      aria-pressed={selected}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      onClick={loading ? undefined : onClick}
      className={cn(buttonClass(variant, selected), className)}
      {...props}
    >
      <span
        className={cn(
          "inline-flex items-center gap-1.5",
          loading && "invisible",
        )}
      >
        {children}
      </span>
      {loading && (
        <span
          aria-hidden="true"
          className="absolute size-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
        />
      )}
    </button>
  );
}
