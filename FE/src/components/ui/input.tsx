import { cn } from "@/lib/cn";
import { Search } from "lucide-react";
import type { ComponentProps } from "react";

export type ControlSize = "default" | "form" | "auto" | "compact";

export const controlClass = (size: ControlSize = "default") =>
  cn(
    "min-w-0 rounded-md border border-line-input bg-surface px-3 text-fg transition-colors duration-150 motion-reduce:transition-none",
    size === "compact" ? "text-xs" : "text-sm",
    size === "form" && "h-(--control-h-form)",
    (size === "default" || size === "compact") && "h-(--control-h)",
    "placeholder:text-fg-subtlest hover:bg-hover disabled:cursor-not-allowed disabled:bg-sunken disabled:text-fg-subtlest",
    "read-only:border-transparent read-only:bg-sunken read-only:text-fg-subtle",
    "aria-invalid:border-danger-bold pointer-coarse:text-base",
    size !== "auto" && "pointer-coarse:min-h-11",
    "file:mr-3 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-selected-fg",
  );

export function Input({
  size = "default",
  className,
  ...props
}: Omit<ComponentProps<"input">, "size"> & { size?: ControlSize }) {
  return (
    <input
      data-ui
      className={cn(controlClass(size), "w-full", className)}
      {...props}
    />
  );
}

export function SearchInput({
  className,
  ...props
}: Omit<ComponentProps<"input">, "type" | "size">) {
  return (
    <span className="relative flex min-w-0">
      <Search
        className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-fg-subtlest"
        aria-hidden="true"
      />
      <input
        data-ui
        type="search"
        className={cn(controlClass(), "w-full pl-8", className)}
        {...props}
      />
    </span>
  );
}
