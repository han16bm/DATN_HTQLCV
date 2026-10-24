import { alertSchema } from "@/features/alerts/schemas/alerts.schema";
import { taskAnalysis } from "@/mocks/db/analytics/snapshot";
import type { User } from "@/mocks/db/database";
import { db } from "@/mocks/db/database";
export function alertDTO(a: (typeof db.alerts)[number], u: User) {
  const task = db.tasks.find((t) => t.id === a.taskId);
  return alertSchema.parse({
    ...a,
    taskTitle: task?.title ?? null,
    analysisRef: task
      ? taskAnalysis(
          u,
          { projectId: a.projectId, from: "2026-10-01", to: "2026-10-23" },
          task,
          a.type === "BOTTLENECK" ? "BOTTLENECK" : "RISK",
        )
      : null,
  });
}
