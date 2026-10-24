import { metricSchema } from "@/features/analytics/schemas/dashboard.schema";
import type { AnalyticsQuery } from "@/features/analytics/types/analytics.types";
import {
  type DashboardDto,
  type MetricDto,
} from "@/features/analytics/types/analytics.types";
import { taskStatusSchema } from "@/features/tasks/schemas/task.schema";
import {
  analyticsScope,
  mean,
  meta,
  quality,
  ratio,
  sum,
  time,
} from "@/mocks/db/analytics/scope";
import { measure, snapshotRef } from "@/mocks/db/analytics/snapshot";
import type { User } from "@/mocks/db/database";
import { db, taskDTO } from "@/mocks/db/database";
export function dashboard(u: User, query: AnalyticsQuery): DashboardDto {
  const { scope, tasks, projects, cohort, people } = analyticsScope(u, query);
  const valid = tasks.filter((t) => t.status !== "CANCELLED");
  const open = valid.filter((t) => t.status !== "COMPLETED");
  const completed = valid.filter((t) => t.status === "COMPLETED");
  const logs = db.timeLogs.filter(
    (l) =>
      l.status === "ACTIVE" &&
      cohort.some((t) => t.id === l.taskId) &&
      l.workDate >= scope.from &&
      l.workDate <= scope.to &&
      (!scope.assigneeId || l.userId === scope.assigneeId) &&
      (!people || people.includes(l.userId)),
  );
  const period = (value: string | null) =>
    value &&
    new Date(Date.parse(value) + 7 * 3600000).toISOString().slice(0, 10) >=
      scope.from &&
    new Date(Date.parse(value) + 7 * 3600000).toISOString().slice(0, 10) <=
      scope.to;
  const submissions = db.submissions.filter(
    (s) =>
      cohort.some((t) => t.id === s.taskId) &&
      period(s.submittedAt) &&
      (!scope.assigneeId || s.submittedBy === scope.assigneeId) &&
      (!people || people.includes(s.submittedBy)),
  );
  const reports = db.reports.filter(
    (r) =>
      projects.some((p) => p.id === r.projectId) &&
      r.status === "SUBMITTED" &&
      period(r.submittedAt) &&
      (!scope.assigneeId || r.authorId === scope.assigneeId) &&
      (!people || people.includes(r.authorId)),
  );
  const overdue = open.filter((t) => t.dueAt < time()).length;
  const actual = sum(logs.map((l) => l.minutes));
  const estimates = sum(valid.map((t) => t.estimatedMinutes));
  const original = sum(valid.map((t) => t.originalEstimatedMinutes));
  const cohortActual = sum(
    db.timeLogs
      .filter(
        (l) => l.status === "ACTIVE" && valid.some((t) => t.id === l.taskId),
      )
      .map((l) => l.minutes),
  );
  const reviewed = db.submissions.filter(
    (s) =>
      cohort.some((t) => t.id === s.taskId) &&
      period(s.reviewedAt) &&
      (!scope.assigneeId || s.submittedBy === scope.assigneeId) &&
      (!people || people.includes(s.submittedBy)),
  );
  const accepted = submissions.filter((s) => s.status === "ACCEPTED");
  const currentWorking = tasks.filter((t) =>
    ["TODO", "IN_PROGRESS"].includes(t.status),
  );
  const spec: [
    string,
    string,
    number | null,
    MetricDto["unit"],
    MetricDto["basis"],
    MetricDto["aggregation"],
    number | null,
  ][] = [
    [
      "K01",
      "Công việc được tính",
      valid.length,
      "TASK",
      "CURRENT",
      "COUNT",
      null,
    ],
    [
      "K02",
      "Hoàn thành trong kỳ",
      completed.filter((t) => period(t.completedAt)).length,
      "TASK",
      "PERIOD",
      "COUNT",
      null,
    ],
    [
      "K03",
      "Tỷ lệ hoàn thành",
      ratio(completed.length, valid.length),
      "PERCENT",
      "CURRENT",
      "RATIO",
      valid.length,
    ],
    ["K04", "Công việc quá hạn", overdue, "TASK", "CURRENT", "COUNT", null],
    [
      "K05",
      "Tỷ lệ quá hạn",
      ratio(overdue, open.length),
      "PERCENT",
      "CURRENT",
      "RATIO",
      open.length,
    ],
    ["K06", "Giờ công trong kỳ", actual / 60, "HOUR", "PERIOD", "SUM", null],
    [
      "K07",
      "Chênh lệch dự kiến",
      cohortActual - estimates,
      "MINUTE",
      "CURRENT",
      "SUM",
      null,
    ],
    [
      "K08",
      "Lần nộp muộn",
      submissions.filter((s) => s.submittedAt > s.dueAtSnapshot).length,
      "COUNT",
      "PERIOD",
      "COUNT",
      null,
    ],
    [
      "K09",
      "Hoàn tất muộn",
      reviewed.filter(
        (s) =>
          s.status === "ACCEPTED" &&
          s.reviewedAt &&
          s.reviewedAt > s.dueAtSnapshot,
      ).length,
      "TASK",
      "PERIOD",
      "COUNT",
      null,
    ],
    [
      "K10",
      "Chờ xét trung bình",
      mean(
        submissions.map(
          (s) =>
            (Date.parse(s.reviewedAt ?? time()) - Date.parse(s.submittedAt)) /
            60000,
        ),
      ),
      "MINUTE",
      "PERIOD",
      "MEAN",
      submissions.length,
    ],
    [
      "K11",
      "Yêu cầu chỉnh sửa",
      reviewed.filter(
        (s) => s.status === "REVISION_REQUESTED" && period(s.reviewedAt),
      ).length,
      "COUNT",
      "PERIOD",
      "COUNT",
      null,
    ],
    [
      "K12",
      "Việc đang làm / chờ làm",
      currentWorking.length,
      "TASK",
      "CURRENT",
      "COUNT",
      null,
    ],
    ["K13", "Thời gian khả dụng", null, "MINUTE", "PERIOD", "SUM", null],
    ["K14", "Tỷ lệ tải", null, "PERCENT", "PERIOD", "RATIO", null],
    [
      "K15",
      "Thời gian ở trạng thái",
      mean(
        open.map(
          (t) => (Date.parse(time()) - Date.parse(t.statusChangedAt)) / 60000,
        ),
      ),
      "MINUTE",
      "CURRENT",
      "MEAN",
      open.length,
    ],
    [
      "K16",
      "Báo cáo đã gửi",
      reports.length,
      "REPORT",
      "PERIOD",
      "COUNT",
      null,
    ],
  ];
  const metrics = spec.map(
    ([code, label, value, unit, basis, aggregation, denominator]) => {
      const m = measure(
        code,
        label,
        value,
        unit === "REPORT" ? "COUNT" : unit,
        "Tính theo quy tắc " + code + " từ dữ liệu trong phạm vi đã chọn.",
      );
      m.basis = basis;
      m.missingFields =
        value === null
          ? [
              code === "K13" || code === "K14"
                ? "workingCalendar"
                : "denominator",
            ]
          : [];
      return metricSchema.parse({
        code,
        label,
        value,
        unit,
        basis,
        aggregation,
        denominator,
        missingFields:
          value === null
            ? [
                code === "K13" || code === "K14"
                  ? "workingCalendar"
                  : "denominator",
              ]
            : [],
        analysisRef: snapshotRef(
          u,
          scope,
          "METRIC",
          { kind: "METRIC", metricCode: code },
          label,
          [m],
          [],
          value === null
            ? "Chưa đủ dữ liệu để tính chỉ số."
            : `${label}: ${value} ${unit}.`,
        ),
      });
    },
  );
  const overviewRef = snapshotRef(
    u,
    scope,
    "SUMMARY",
    scope.projectId
      ? { kind: "PROJECT", projectId: scope.projectId }
      : { kind: "UNIT", unitId: scope.unitId ?? u.unitId },
    "Tổng hợp tiến độ",
    metrics.map((m) => ({
      ...measure(
        m.code,
        m.label,
        m.value,
        m.unit === "REPORT" ? "COUNT" : m.unit,
        "Theo quy tắc " + m.code,
      ),
      basis: m.basis,
    })),
    [],
    `${projects.length} dự án, ${valid.length} công việc không hủy, ${completed.length} hoàn thành; ${overdue} việc quá hạn và ${actual} phút giờ công trong kỳ.`,
  );
  const timeliness = (items: typeof submissions) => ({
    onTimeCount: items.filter((s) => s.submittedAt <= s.dueAtSnapshot).length,
    lateCount: items.filter((s) => s.submittedAt > s.dueAtSnapshot).length,
    denominator: items.length,
  });
  return {
    metadata: meta(scope, ["workingCalendar", "reportingSchedule"]),
    totalTasks: tasks.length,
    completedTasks: completed.length,
    cancelledTasks: tasks.length - valid.length,
    openTasks: open.length,
    overdueTasks: overdue,
    completionRate: ratio(completed.length, valid.length),
    actualMinutes: actual,
    byStatus: taskStatusSchema.options.map((status) => ({
      status,
      count: tasks.filter((t) => t.status === status).length,
    })),
    metrics,
    timeVariance: {
      actualMinutes: cohortActual,
      currentEstimateMinutes: estimates,
      originalEstimateMinutes: original,
      deltaCurrentMinutes: cohortActual - estimates,
      deltaOriginalMinutes: cohortActual - original,
    },
    submissionTimeliness: timeliness(submissions),
    acceptedSubmissionTimeliness: timeliness(accepted),
    reporting: {
      submittedDaily: reports.filter((r) => r.periodType === "DAILY").length,
      submittedWeekly: reports.filter((r) => r.periodType === "WEEKLY").length,
      expectedCount: null,
      submissionCoverageRate: null,
    },
    trend: [
      ...new Set(
        logs
          .map((l) => l.workDate)
          .concat(
            submissions.map((s) =>
              new Date(Date.parse(s.submittedAt) + 7 * 3600000)
                .toISOString()
                .slice(0, 10),
            ),
          )
          .concat(
            completed.flatMap((t) =>
              t.completedAt
                ? [
                    new Date(Date.parse(t.completedAt) + 7 * 3600000)
                      .toISOString()
                      .slice(0, 10),
                  ]
                : [],
            ),
          ),
      ).add("2026-10-23"),
    ]
      .filter((date) => date >= scope.from && date <= scope.to)
      .sort()
      .map((date) => ({
        date,
        completedCount: completed.filter(
          (t) =>
            t.completedAt &&
            new Date(Date.parse(t.completedAt) + 7 * 3600000)
              .toISOString()
              .startsWith(date),
        ).length,
        submissionCount: submissions.filter((s) =>
          new Date(Date.parse(s.submittedAt) + 7 * 3600000)
            .toISOString()
            .startsWith(date),
        ).length,
        actualMinutes: sum(
          logs.filter((l) => l.workDate === date).map((l) => l.minutes),
        ),
        complete: true,
      })),
    projectComparisons: projects.map((p) => {
      const pts = tasks.filter(
        (t) => t.projectId === p.id && t.status !== "CANCELLED",
      );
      return {
        projectId: p.id,
        projectName: p.name,
        validTaskCount: pts.length,
        completionRate: ratio(
          pts.filter((t) => t.status === "COMPLETED").length,
          pts.length,
        ),
        overdueCount: pts.filter((t) => taskDTO(t).isOverdue).length,
        actualMinutes: sum(
          logs
            .filter((l) => pts.some((t) => t.id === l.taskId))
            .map((l) => l.minutes),
        ),
        activeAlertCount: db.alerts.filter(
          (a) => a.projectId === p.id && a.conditionActive,
        ).length,
        quality: quality(),
        analysisRef: snapshotRef(
          u,
          { ...scope, projectId: p.id },
          "SUMMARY",
          { kind: "PROJECT", projectId: p.id },
          p.name,
          [],
          [],
          `${p.name}: ${pts.length} công việc không hủy.`,
        ),
      };
    }),
    overviewRef,
  };
}
