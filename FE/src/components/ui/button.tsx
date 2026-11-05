import { cn } from "@/lib/cn";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "subtle" | "danger";
export type ButtonSize = "sm" | "md";

const variants: Record<Variant | "selected", string> = {
  primary:
    "border-transparent bg-action text-surface hover:bg-action-hover active:bg-action-pressed",
  secondary: "border-line bg-surface text-fg hover:bg-sunken active:bg-pressed",
  subtle:
    "border-transparent bg-transparent text-fg hover:bg-hover active:bg-pressed",
  danger:
    "border-transparent bg-danger-bold text-white hover:bg-danger-bold-hover",
  selected:
    "border-transparent bg-selected-bg text-selected-fg hover:bg-info-bg",
};

export const buttonClass = (
  variant: Variant = "secondary",
  selected = false,
  size: ButtonSize = "md",
) =>
  cn(
    "relative inline-flex min-w-0 max-w-full items-center justify-center gap-1.5 rounded-full border",
    size === "sm"
      ? "w-fit flex-none min-h-8 px-2 py-1 text-center text-xs font-medium whitespace-normal"
      : "h-(--control-h) px-4 text-sm font-semibold whitespace-nowrap",
    "transition-[background-color,border-color,color,scale] duration-150 ease-out active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100",
    "disabled:cursor-not-allowed disabled:opacity-60 aria-disabled:cursor-wait pointer-coarse:min-h-11",
    variants[selected ? "selected" : variant],
  );

export function Button({
  variant = "secondary",
  size = "md",
  selected,
  loading,
  className,
  type = "button",
  children,
  onClick,
  ...props
}: ComponentProps<"button"> & {
  variant?: Variant;
  size?: ButtonSize;
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
      className={cn(buttonClass(variant, selected, size), className)}
      {...props}
    >
      <span
        className={cn(
          "inline-flex min-w-0 items-center gap-1.5 [&_svg]:shrink-0",
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
