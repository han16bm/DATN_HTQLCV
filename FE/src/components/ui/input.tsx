import { cn } from "@/lib/cn";
import { Search } from "lucide-react";
import type { ComponentProps } from "react";

export type ControlSize = "default" | "form" | "auto";

// Điều khiển cao 32px ở thanh công cụ, 36px ở biểu mẫu, tối thiểu 44px khi cảm ứng.
// Viền đạt 3:1; ô chỉ
// đọc đổi nền thay vì viền để không giống ô đang nhập.
export const controlClass = (size: ControlSize = "default") =>
  cn(
    "min-w-0 rounded-md border border-line-input bg-surface px-3 text-sm text-fg transition-colors duration-150 motion-reduce:transition-none",
    size === "form" && "h-(--control-h-form)",
    size === "default" && "h-(--control-h)",
    "placeholder:text-fg-subtlest hover:bg-hover disabled:cursor-not-allowed disabled:bg-sunken disabled:text-fg-subtlest",
    "read-only:border-transparent read-only:bg-sunken read-only:text-fg-subtle",
    "aria-invalid:border-danger-bold pointer-coarse:text-base",
    size !== "auto" && "pointer-coarse:min-h-11",
    "file:mr-3 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-selected-fg",
  );

// Ô nhập một dòng. Nhãn luôn nằm ngoài (FilterField/Field); placeholder chỉ gợi ý.
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

// Ô tìm kiếm có biểu tượng kính lúp; vai trò searchbox.
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
