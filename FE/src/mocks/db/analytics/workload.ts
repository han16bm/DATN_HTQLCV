import type { AnalyticsQuery } from "@/features/analytics/types/analytics.types";
import { type WorkloadDto } from "@/features/analytics/types/analytics.types";
import { analyticsScope, meta, quality, sum } from "@/mocks/db/analytics/scope";
import { measure, snapshotRef } from "@/mocks/db/analytics/snapshot";
import type { User } from "@/mocks/db/database";
import { db, person } from "@/mocks/db/database";
export function workload(u: User, query: AnalyticsQuery): WorkloadDto {
  const { scope, tasks, projects, people } = analyticsScope(u, query);
  const ids = [
    ...new Set(
      db.members
        .filter(
          (m) =>
            !m.endedAt &&
            projects.some((p) => p.id === m.projectId) &&
            (!people || people.includes(m.userId)) &&
            (!scope.assigneeId || scope.assigneeId === m.userId),
        )
        .map((m) => m.userId),
    ),
  ];
  return {
    metadata: meta(scope, ["workingCalendar"]),
    items: ids.map((id) => {
      const current = tasks.filter(
        (t) =>
          t.assigneeId === id && ["TODO", "IN_PROGRESS"].includes(t.status),
      );
      const remaining = current.some((t) => t.remainingMinutes === null)
        ? null
        : sum(current.map((t) => t.remainingMinutes ?? 0));
      return {
        userId: id,
        person: person(id),
        openTaskCount: current.length,
        pendingReviewCount: tasks.filter(
          (t) => t.assigneeId === id && t.status === "PENDING_REVIEW",
        ).length,
        originalEstimateMinutes: sum(
          current.map((t) => t.originalEstimatedMinutes),
        ),
        currentEstimateMinutes: sum(current.map((t) => t.estimatedMinutes)),
        remainingMinutes: remaining,
        capacityMinutes: null,
        utilizationRate: null,
        quality: quality([
          "workingCalendar",
          ...(remaining === null ? ["remainingMinutes"] : []),
        ]),
        analysisRef: snapshotRef(
          u,
          scope,
          "WORKLOAD",
          { kind: "PERSON", userId: id },
          person(id).displayName,
          [
            measure(
              "OPEN",
              "Việc đang nhận",
              current.length,
              "TASK",
              "TODO/IN_PROGRESS theo người nhận.",
            ),
            measure(
              "REMAINING",
              "Phút còn lại",
              remaining,
              "MINUTE",
              "Tổng ước lượng còn lại được nhập riêng.",
            ),
            measure(
              "CAPACITY",
              "Khả dụng",
              null,
              "MINUTE",
              "Lịch làm việc trừ nghỉ và nghĩa vụ khác.",
            ),
          ],
          [],
          `${person(id).displayName} đang nhận ${current.length} công việc. Chưa có lịch khả dụng nên chưa đủ dữ liệu kết luận quá tải.`,
          [],
          ["workingCalendar"],
        ),
      };
    }),
  };
}
