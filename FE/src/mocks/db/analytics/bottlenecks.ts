import type { AnalyticsQuery } from "@/features/analytics/types/analytics.types";
import { type BottlenecksDto } from "@/features/analytics/types/analytics.types";
import { analyticsScope, meta, time } from "@/mocks/db/analytics/scope";
import { taskAnalysis } from "@/mocks/db/analytics/snapshot";
import type { User } from "@/mocks/db/database";
import { db, person } from "@/mocks/db/database";
import { z } from "zod";
export function bottlenecks(u: User, query: AnalyticsQuery): BottlenecksDto {
  const { scope, tasks } = analyticsScope(u, query);
  return {
    metadata: meta(scope),
    items: tasks
      .filter(
        (t) =>
          (t.status === "PENDING_REVIEW" &&
            Date.parse(time()) - Date.parse(t.statusChangedAt) >=
              24 * 3600000) ||
          (["TODO", "IN_PROGRESS"].includes(t.status) &&
            (Date.parse(time()) - Date.parse(t.statusChangedAt) >=
              48 * 3600000 ||
              db.submissions.filter(
                (s) => s.taskId === t.id && s.status === "REVISION_REQUESTED",
              ).length >= 3)),
      )
      .map((t) => ({
        taskId: t.id,
        taskTitle: t.title,
        stage: z
          .enum(["TODO", "IN_PROGRESS", "PENDING_REVIEW"])
          .parse(t.status),
        elapsedMinutes:
          (Date.parse(time()) - Date.parse(t.statusChangedAt)) / 60000,
        revisionCount: db.submissions.filter(
          (s) => s.taskId === t.id && s.status === "REVISION_REQUESTED",
        ).length,
        calendarBasis: "CONTINUOUS",
        evidence: [
          "Thời gian liên tục ở trạng thái hiện tại; không tương đương giờ công.",
        ],
        assignee: t.assigneeId ? person(t.assigneeId) : null,
        analysisRef: taskAnalysis(u, scope, t, "BOTTLENECK"),
      })),
  };
}
