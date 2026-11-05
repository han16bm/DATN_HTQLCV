import { cn } from "@/lib/cn";
import { ChevronRight } from "lucide-react";
import type { ComponentProps } from "react";

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
