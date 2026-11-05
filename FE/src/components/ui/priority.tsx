import { cn } from "@/lib/cn";
import { label } from "@/lib/format";

const tones = {
  URGENT: "font-semibold text-danger-fg",
  HIGH: "font-medium text-warning-fg",
  NORMAL: "text-fg-subtle",
  LOW: "text-fg-subtlest",
};

// Ưu tiên chỉ là chữ có màu (không biểu tượng); mức khẩn và cao đậm hơn.
export function Priority({
  value,
}: {
  value: "URGENT" | "HIGH" | "NORMAL" | "LOW";
}) {
  return (
    <span
      className={cn("inline-flex items-center whitespace-nowrap", tones[value])}
    >
      {label(value)}
    </span>
  );
}
