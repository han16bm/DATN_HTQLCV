import { label } from "@/lib/format";
import { ChevronsUp, ChevronUp, Equal, ChevronDown } from "lucide-react";

const icons = {
  URGENT: { Icon: ChevronsUp, className: "priority-urgent" },
  HIGH: { Icon: ChevronUp, className: "priority-high" },
  NORMAL: { Icon: Equal, className: "priority-normal" },
  LOW: { Icon: ChevronDown, className: "priority-low" },
} as const;

// Độ ưu tiên dạng biểu tượng như Jira; chữ vẫn có cho trình đọc màn hình.
export function PriorityIcon({
  value,
  showLabel = false,
}: {
  value: keyof typeof icons;
  showLabel?: boolean;
}) {
  const { Icon, className } = icons[value];
  return (
    <span className={`priority ${className}`} title={label(value)}>
      <Icon size={15} strokeWidth={2.2} aria-hidden="true" />
      {showLabel ? (
        label(value)
      ) : (
        <span className="sr-only">{label(value)}</span>
      )}
    </span>
  );
}
