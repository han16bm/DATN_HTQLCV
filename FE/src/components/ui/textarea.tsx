import { cn } from "@/lib/cn";
import type { ComponentProps } from "react";
import { controlClass } from "./input";

// Ô nhập nhiều dòng: cao tối thiểu 88px, kéo giãn dọc; FormTextarea tự co giãn theo nội dung.
export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      data-ui
      className={cn(
        controlClass("auto"),
        "max-h-90 min-h-22 w-full resize-y overflow-y-auto py-2 leading-relaxed",
        className,
      )}
      {...props}
    />
  );
}
