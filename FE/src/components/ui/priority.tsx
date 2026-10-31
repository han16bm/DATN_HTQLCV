import { label } from "@/lib/format";

export function Priority({
  value,
}: {
  value: "URGENT" | "HIGH" | "NORMAL" | "LOW";
}) {
  return (
    <span className={`priority priority-${value.toLowerCase()}`}>
      {label(value)}
    </span>
  );
}
