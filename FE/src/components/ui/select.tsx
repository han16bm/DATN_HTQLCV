import { cn } from "@/lib/cn";
import { ChevronDown } from "lucide-react";
import type { ComponentProps } from "react";
import { controlClass, type ControlSize } from "./input";

export function Select({
  fit = false,
  size = "default",
  className,
  children,
  ...props
}: Omit<ComponentProps<"select">, "size"> & {
  fit?: boolean;
  size?: ControlSize;
}) {
  return (
    <span
      className={cn(
        "relative min-w-0",
        fit ? "inline-flex max-w-full @max-[40rem]/filters:flex @max-[40rem]/filters:w-full" : "flex w-full",
      )}
    >
      <select
        data-ui
        className={cn(
          controlClass(size),
          "peer cursor-pointer appearance-none pr-8",
          fit
            ? "w-auto max-w-60 min-w-[min(6rem,100%)] field-sizing-content @max-[40rem]/filters:w-full @max-[40rem]/filters:max-w-none"
            : "w-full",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 text-fg-subtle peer-open:rotate-180"
        aria-hidden="true"
      />
    </span>
  );
}
