import { z } from "zod";
import * as d from "./model-contracts";
import {
  db,
  now,
  taskDTO,
  person,
  can,
  type User,
  type Task,
} from "./database";
import { ApiError } from "@/types/api/error";

type Scope = d.AnalyticsAnalyticsQueryDTO;
const quality = (missingFields: string[] = []): d.AnalyticsQualityDTO => ({
  status: missingFields.length ? "PARTIAL" : "SUFFICIENT",
  missingFields,
  scopeLimited: false,
});
const time = () => (db.revision === 1 ? "2026-10-23T10:00:00.000Z" : now());
export function analyticsScope(u: User, query: unknown) {
  const q = d.AnalyticsAnalyticsQuerySchema.parse(query);
  const projects = db.projects.filter(
    (p) =>
      can(u, "ANALYTICS_VIEW", p.id) &&
      (!q.projectId || p.id === q.projectId) &&
      (!q.unitId || p.unitId === q.unitId) &&
      (!q.ownerId || p.ownerId === q.ownerId),
  );
  if ((q.projectId || q.unitId) && !projects.length)
    throw new ApiError(403, "FORBIDDEN", "Bạn không có quyền xem phạm vi này.");
  const scope = {
    ...q,
    ...(!q.unitId && !q.projectId ? { unitId: u.unitId } : {}),
  };
  if (
    q.teamId &&
    !db.teams.some(
      (t) => t.id === q.teamId && t.unitId === (q.unitId ?? u.unitId),
    )
  )
    throw new ApiError(403, "FORBIDDEN", "Nhóm nằm ngoài phạm vi.");
  const people = q.teamId
    ? (db.teams.find((t) => t.id === q.teamId)?.memberIds ?? [])
    : null;
  const tasks = db.tasks.filter(
    (t) =>
      projects.some((p) => p.id === t.projectId) &&
      (!scope.unitId ||
        db.projects.some(
          (p) => p.id === t.projectId && p.unitId === scope.unitId,
        )) &&
      (!q.assigneeId || t.assigneeId === q.assigneeId) &&
      (!q.status || t.status === q.status) &&
      (!q.priority || t.priority === q.priority) &&
      (!people || (t.assigneeId && people.includes(t.assigneeId))),
  );
  return {
    scope,
    tasks,
    projects: projects.filter(
      (p) => !scope.unitId || p.unitId === scope.unitId,
    ),
    people,
  };
}
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
const mean = (values: number[]) =>
  values.length ? sum(values) / values.length : null;
const ratio = (a: number, b: number) => (b ? (a / b) * 100 : null);
const action = (
  target: d.SharedDomainActionDTO["target"],
  taskId: string | null = null,
  submissionId: string | null = null,
): d.SharedDomainActionDTO => ({
  target,
  taskId,
  submissionId,
  reportId: null,
});
function subjectKey(subject: d.SharedAnalysisSubjectDTO) {
  return JSON.stringify(subject);
}
export function snapshotRef(
  u: User,
  scope: Scope,
  type: d.SharedAnalysisRefDTO["analysisType"],
  subject: d.SharedAnalysisSubjectDTO,
  title: string,
  metrics: d.AnalyticsAnalysisMeasureDTO[],
  evidence: d.AnalyticsEvidenceDTO[],
  summary: string,
  context: d.AnalyticsContextItemDTO[] = [],
  missing: string[] = [],
): d.SharedAnalysisRefDTO {
  const revision = `source-${db.revision}|${u.id}|${JSON.stringify(scope)}|${subjectKey(subject)}|${type}`;
  let detail = [...db.details.values()].find(
    (v) => v.snapshot.sourceRevision === revision,
  );
  if (!detail) {
    const id = `an-${crypto.randomUUID()}`,
      snapshotId = `snap-${crypto.randomUUID()}`;
    detail = d.AnalyticsAnalysisDetailSchema.parse({
      snapshot: {
        id: snapshotId,
        analysisId: id,
        sourceRevision: revision,
        analysisType: type,
        title,
        subject,
        scope,
        dataAsOf: time(),
        createdAt: now(),
        expiresAt: "2026-11-30T10:00:00.000Z",
        calculationVersion: "business-rules-v2",
        quality: quality(missing),
        metrics,
        context,
        evidence,
        series: [],
      },
      freshness: {
        status: "CURRENT",
        checkedAt: now(),
        latestAnalysisId: null,
      },
      explanation: {
        status: "NOT_REQUESTED",
        lastSuccess: null,
        activeJobId: null,
        error: null,
      },
      generation: {
        allowed: true,
        blockedReason: null,
        retryAfterSeconds: null,
      },
      systemSummary: summary,
      feedback: {
        latest: null,
        canSubmit:
          type === "BOTTLENECK" && can(u, "ALERTS_MANAGE", scope.projectId),
      },
    });
    db.details.set(id, detail);
  }
  return {
    analysisId: detail.snapshot.analysisId,
    snapshotId: detail.snapshot.id,
    analysisType: type,
    subject,
    title,
    dataAsOf: detail.snapshot.dataAsOf,
    explanationStatus: detail.explanation.status,
  };
}
function measure(
  code: string,
  label: string,
  value: number | null,
  unit: d.AnalyticsAnalysisMeasureDTO["unit"],
  formula: string,
  evidenceIds: string[] = [],
): d.AnalyticsAnalysisMeasureDTO {
  return {
    id: `m-${code}`,
    code,
    label,
    value,
    unit,
    basis: "CURRENT",
    formula,
    evidenceIds,
    missingFields: value === null ? ["source"] : [],
  };
}
export function taskAnalysis(
  u: User,
  scope: Scope,
  t: Task,
  type: "RISK" | "BOTTLENECK",
) {
  const task = taskDTO(t),
    pending = db.submissions.find(
      (s) => s.id === t.latestSubmissionId && s.status === "PENDING",
    );
  const overdue = task.isOverdue
    ? Math.max(0, (Date.parse(time()) - Date.parse(t.dueAt)) / 60000)
    : 0;
  const wait = pending
    ? Math.max(
        0,
        (Date.parse(time()) - Date.parse(pending.submittedAt)) / 60000,
      )
    : 0;
  const evidence: d.AnalyticsEvidenceDTO[] = [
    {
      id: "e-task",
      sourceType: "TASK",
      sourceId: t.id,
      label: `Hạn công việc: ${t.dueAt}`,
      observedAt: time(),
      action: action("TASK_DETAIL", t.id),
    },
  ];
  if (pending)
    evidence.push({
      id: "e-submission",
      sourceType: "SUBMISSION",
      sourceId: pending.id,
      label: "Lần nộp mới nhất đang chờ nghiệm thu",
      observedAt: pending.submittedAt,
      action: action("SUBMISSION_REVIEW", t.id, pending.id),
    });
  const metrics = [
    measure(
      "OVERDUE",
      "Thời gian quá hạn",
      overdue,
      "MINUTE",
      "Mốc dữ liệu trừ hạn của công việc còn mở.",
      ["e-task"],
    ),
    measure(
      "WAIT",
      "Chờ nghiệm thu",
      wait,
      "MINUTE",
      "Mốc dữ liệu trừ thời điểm nộp kết quả.",
      pending ? ["e-submission"] : [],
    ),
    measure(
      "ACTUAL",
      "Giờ công đã ghi",
      task.actualMinutes,
      "MINUTE",
      "Tổng số phút nhật ký ACTIVE.",
      ["e-task"],
    ),
    measure(
      "REVISIONS",
      "Số lần yêu cầu sửa",
      db.submissions.filter(
        (s) => s.taskId === t.id && s.status === "REVISION_REQUESTED",
      ).length,
      "COUNT",
      "Đếm quyết định yêu cầu sửa.",
      ["e-task"],
    ),
  ];
  const summary = `${t.title}: ${task.isOverdue ? "công việc còn mở và đã quá hạn" : "chưa có dấu hiệu quá hạn hiện tại"}. Đã ghi ${task.actualMinutes} phút. ${pending ? "Kết quả đang chờ nghiệm thu; thời gian chờ không cộng vào giờ công." : "Cần đối chiếu dữ liệu kế hoạch và tiến độ trước khi đưa ra quyết định."}`;
  return snapshotRef(
    u,
    scope,
    type,
    { kind: "TASK", taskId: t.id },
    t.title,
    metrics,
    evidence,
    summary,
    [
      {
        key: "assignee",
        label: "Người thực hiện",
        value: task.assignee?.displayName ?? "Chưa phân công",
        valueType: "TEXT",
      },
      {
        key: "status",
        label: "Trạng thái",
        value: t.status,
        valueType: "TEXT",
      },
      { key: "due", label: "Hạn hoàn thành", value: t.dueAt, valueType: "UTC" },
    ],
  );
}
function meta(scope: Scope): d.AnalyticsAnalysisMetaDTO {
  return {
    snapshotId: `aggregate-${db.revision}`,
    dataAsOf: time(),
    generatedAt: now(),
    scope,
    calculationMethod: "SERVER_RULES",
    calculationVersion: "business-rules-v2",
    quality: quality(),
  };
}
export function dashboard(u: User, query: unknown): d.AnalyticsDashboardDTO {
  const { scope, tasks, projects } = analyticsScope(u, query);
  const valid = tasks.filter((t) => t.status !== "CANCELLED"),
    open = valid.filter((t) => t.status !== "COMPLETED"),
    completed = valid.filter((t) => t.status === "COMPLETED");
  const logs = db.timeLogs.filter(
    (l) =>
      l.status === "ACTIVE" &&
      tasks.some((t) => t.id === l.taskId) &&
      l.workDate >= scope.from &&
      l.workDate <= scope.to &&
      (!scope.assigneeId || l.userId === scope.assigneeId),
  );
  const period = (value: string | null) =>
    value &&
    new Date(Date.parse(value) + 7 * 3600000).toISOString().slice(0, 10) >=
      scope.from &&
    new Date(Date.parse(value) + 7 * 3600000).toISOString().slice(0, 10) <=
      scope.to;
  const submissions = db.submissions.filter(
    (s) =>
      tasks.some((t) => t.id === s.taskId) &&
      period(s.submittedAt) &&
      (!scope.assigneeId || s.submittedBy === scope.assigneeId),
  );
  const reports = db.reports.filter(
    (r) =>
      projects.some((p) => p.id === r.projectId) &&
      r.status === "SUBMITTED" &&
      period(r.submittedAt) &&
      (!scope.assigneeId || r.authorId === scope.assigneeId),
  );
  const overdue = open.filter((t) => t.dueAt < time()).length,
    actual = sum(logs.map((l) => l.minutes));
  const estimates = sum(valid.map((t) => t.estimatedMinutes)),
    original = sum(valid.map((t) => t.originalEstimatedMinutes));
  const accepted = submissions.filter((s) => s.status === "ACCEPTED");
  const currentWorking = tasks.filter((t) =>
    ["TODO", "IN_PROGRESS"].includes(t.status),
  );
  const spec: [
    string,
    string,
    number | null,
    d.AnalyticsMetricDTO["unit"],
    d.AnalyticsMetricDTO["basis"],
    d.AnalyticsMetricDTO["aggregation"],
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
      actual - estimates,
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
      accepted.filter((s) => s.reviewedAt && s.reviewedAt > s.dueAtSnapshot)
        .length,
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
      submissions.filter(
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
      return d.AnalyticsMetricSchema.parse({
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
    metadata: meta(scope),
    totalTasks: tasks.length,
    completedTasks: completed.length,
    cancelledTasks: tasks.length - valid.length,
    openTasks: open.length,
    overdueTasks: overdue,
    completionRate: ratio(completed.length, valid.length),
    actualMinutes: actual,
    byStatus: d.TasksTaskStatusSchema.options.map((status) => ({
      status,
      count: tasks.filter((t) => t.status === status).length,
    })),
    metrics,
    timeVariance: {
      actualMinutes: actual,
      currentEstimateMinutes: estimates,
      originalEstimateMinutes: original,
      deltaCurrentMinutes: actual - estimates,
      deltaOriginalMinutes: actual - original,
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
export function risks(u: User, query: unknown): d.AnalyticsRisksDTO {
  const { scope, tasks, projects } = analyticsScope(u, query);
  const items = tasks
    .filter((t) => !["COMPLETED", "CANCELLED"].includes(t.status))
    .map((t) => {
      const overdue = taskDTO(t).isOverdue;
      return d.AnalyticsRiskItemSchema.parse({
        taskId: t.id,
        taskTitle: t.title,
        status: t.status,
        assignee: t.assigneeId ? person(t.assigneeId) : null,
        dueAt: t.dueAt,
        category: overdue
          ? "OVERDUE"
          : t.remainingMinutes === null
            ? "INSUFFICIENT_DATA"
            : "NO_SIGNAL",
        riskLevel: overdue
          ? "HIGH"
          : t.remainingMinutes === null
            ? "UNKNOWN"
            : "LOW",
        assessmentBasis: "BUSINESS_RULES",
        ruleIds: overdue ? ["OPEN_AFTER_DUE"] : [],
        evidence: [
          overdue
            ? "Công việc còn mở sau hạn."
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
          : "UNKNOWN",
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
export function workload(u: User, query: unknown): d.AnalyticsWorkloadDTO {
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
    metadata: meta(scope),
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
export function bottlenecks(
  u: User,
  query: unknown,
): d.AnalyticsBottlenecksDTO {
  const { scope, tasks } = analyticsScope(u, query);
  return {
    metadata: meta(scope),
    items: tasks
      .filter(
        (t) =>
          t.status === "PENDING_REVIEW" ||
          (t.status === "IN_PROGRESS" &&
            Date.parse(time()) - Date.parse(t.statusChangedAt) > 48 * 3600000),
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
export function summary(u: User, query: unknown): d.AnalyticsSummaryDTO {
  const dash = dashboard(u, query),
    b = bottlenecks(u, query);
  return {
    metadata: dash.metadata,
    overviewRef: dash.overviewRef,
    summaryText: db.details.get(dash.overviewRef.analysisId)!.systemSummary,
    metrics: db.details.get(dash.overviewRef.analysisId)!.snapshot.metrics,
    highlights: b.items.map((i, index) => ({
      id: `highlight-${index}`,
      title: i.taskTitle,
      description: i.evidence.join(" "),
      severity: "MEDIUM",
      analysisRef: i.analysisRef,
    })),
  };
}
export function alertDTO(a: (typeof db.alerts)[number], u: User) {
  const task = db.tasks.find((t) => t.id === a.taskId);
  return d.AlertsAlertSchema.parse({
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
