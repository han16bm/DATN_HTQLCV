import { riskItemSchema } from "@/features/analytics/schemas/risks.schema";
import type { AnalyticsQuery } from "@/features/analytics/types/analytics.types";
import { type RisksDto } from "@/features/analytics/types/analytics.types";
import {
  analyticsScope,
  meta,
  quality,
  time,
} from "@/mocks/db/analytics/scope";
import {
  measure,
  snapshotRef,
  taskAnalysis,
} from "@/mocks/db/analytics/snapshot";
import type { User } from "@/mocks/db/database";
import { person, taskDTO } from "@/mocks/db/database";
export function risks(u: User, query: AnalyticsQuery): RisksDto {
  const { scope, tasks, projects } = analyticsScope(u, query);
  const items = tasks
    .filter((t) => !["COMPLETED", "CANCELLED"].includes(t.status))
    .map((t) => {
      const overdue = taskDTO(t).isOverdue;
      const nearReview =
        !overdue &&
        t.status === "PENDING_REVIEW" &&
        Date.parse(time()) - Date.parse(t.statusChangedAt) >= 24 * 3600000 &&
        Date.parse(t.dueAt) - Date.parse(time()) <= 48 * 3600000;
      return riskItemSchema.parse({
        taskId: t.id,
        taskTitle: t.title,
        status: t.status,
        assignee: t.assigneeId ? person(t.assigneeId) : null,
        dueAt: t.dueAt,
        category: overdue
          ? "OVERDUE"
          : nearReview
            ? "AT_RISK"
            : t.remainingMinutes === null
              ? "INSUFFICIENT_DATA"
              : "NO_SIGNAL",
        riskLevel: overdue
          ? "HIGH"
          : nearReview
            ? "MEDIUM"
            : t.remainingMinutes === null
              ? "UNKNOWN"
              : "LOW",
        assessmentBasis: "BUSINESS_RULES",
        ruleIds: overdue
          ? ["OPEN_AFTER_DUE"]
          : nearReview
            ? ["TRIAL_REVIEW_WAIT_NEAR_DUE"]
            : [],
        evidence: [
          overdue
            ? "Công việc còn mở sau hạn."
            : nearReview
              ? "Chờ nghiệm thu từ 24 giờ liên tục và hạn trong 48 giờ; ngưỡng thử nghiệm."
              : "Cần đối chiếu nguồn tiến độ.",
        ],
        quality: quality(
          t.remainingMinutes === null ? ["remainingMinutes"] : [],
        ),
        analysisRef: taskAnalysis(u, scope, t, "RISK"),
      });
    });
  return {
    metadata: meta(scope),
    items,
    projects: projects.map((p) => {
      const rows = items.filter((i) =>
        tasks.some((t) => t.id === i.taskId && t.projectId === p.id),
      );
      return {
        projectId: p.id,
        projectName: p.name,
        riskLevel: rows.some((r) => r.category === "OVERDUE")
          ? "HIGH"
          : rows.some((r) => r.category === "AT_RISK")
            ? "MEDIUM"
            : !rows.length ||
                rows.some((r) => r.category === "INSUFFICIENT_DATA")
              ? "UNKNOWN"
              : "LOW",
        overdueCount: rows.filter((r) => r.category === "OVERDUE").length,
        atRiskCount: rows.filter((r) => r.category === "AT_RISK").length,
        insufficientDataCount: rows.filter(
          (r) => r.category === "INSUFFICIENT_DATA",
        ).length,
        ruleIds: rows.some((r) => r.category === "OVERDUE")
          ? ["PROJECT_HAS_OVERDUE"]
          : [],
        evidence: ["Phân loại từ công việc trong cùng phạm vi."],
        quality: quality(),
        analysisRef: snapshotRef(
          u,
          { ...scope, projectId: p.id },
          "RISK",
          { kind: "PROJECT", projectId: p.id },
          p.name,
          [
            measure(
              "OVERDUE",
              "Công việc quá hạn",
              rows.filter((r) => r.category === "OVERDUE").length,
              "TASK",
              "Đếm công việc mở sau hạn.",
            ),
          ],
          [],
          `Dự án có ${rows.filter((r) => r.category === "OVERDUE").length} công việc quá hạn.`,
        ),
      };
    }),
  };
}
