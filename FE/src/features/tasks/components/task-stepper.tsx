import { cn } from "@/lib/cn";
import { Check } from "lucide-react";
import type { TaskDto } from "../types/tasks.types";

const steps: [TaskDto["status"], string][] = [
  ["NEW", "Mới"],
  ["TODO", "Cần làm"],
  ["IN_PROGRESS", "Đang thực hiện"],
  ["PENDING_REVIEW", "Chờ nghiệm thu"],
  ["COMPLETED", "Hoàn thành"],
];

// Vị trí của công việc trên quy trình: bước đã qua có dấu tích, bước hiện tại đậm và
// có aria-current. Việc đã hủy rời khỏi quy trình nên hiện riêng một dòng.
export function TaskStepper({ status }: { status: TaskDto["status"] }) {
  if (status === "CANCELLED")
    return (
      <p className="m-0 inline-flex items-center gap-2 rounded-md bg-sunken px-2.5 py-1 text-sm font-medium text-fg-subtle">
        <span
          className="size-2 rounded-full bg-line-input"
          aria-hidden="true"
        />
        Công việc đã hủy
      </p>
    );
  const current = steps.findIndex(([value]) => value === status);
  return (
    <ol
      aria-label="Tiến trình công việc"
      className="m-0 flex list-none items-center gap-0 overflow-x-auto p-0 py-1"
    >
      {steps.map(([value, text], index) => {
        const done = index < current;
        const now = index === current;
        return (
          <li
            key={value}
            aria-current={now ? "step" : undefined}
            className="flex shrink-0 items-center"
          >
            <span
              className={cn(
                "grid size-5 place-items-center rounded-full border text-xs font-semibold",
                done && "border-success-fg bg-success-fg text-white",
                now && "border-action bg-action text-white",
                !done && !now && "border-line-input bg-surface text-fg-subtle",
              )}
              aria-hidden="true"
            >
              {done ? <Check className="size-3" strokeWidth={3} /> : index + 1}
            </span>
            <span
              className={cn(
                "ml-1.5 text-sm whitespace-nowrap",
                now ? "font-semibold text-fg" : "text-fg-subtle",
              )}
            >
              {text}
              <span className="sr-only">
                {done ? " (đã qua)" : now ? " (hiện tại)" : ""}
              </span>
            </span>
            {index < steps.length - 1 && (
              <span
                className={cn(
                  "mx-2.5 h-px w-6 sm:w-10",
                  done ? "bg-success-fg" : "bg-line-input",
                )}
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
