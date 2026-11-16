import { cn } from "@/lib/cn";
import type { ComponentProps } from "react";

export function IconButton({
  label,
  selected,
  className,
  type = "button",
  ...props
}: Omit<ComponentProps<"button">, "aria-label"> & {
  label: string;
  selected?: boolean;
}) {
  return (
    <button
      data-ui
      type={type}
      aria-label={label}
      aria-pressed={selected}
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-full p-0",
        "text-fg-subtle hover:bg-hover hover:text-fg active:bg-pressed",
        "aria-pressed:bg-selected-bg aria-pressed:text-selected-fg",
        "transition-colors duration-150 motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-50 pointer-coarse:size-11",
        className,
      )}
      {...props}
    />
  );
}
