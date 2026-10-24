import { analysisSchema } from "@/features/analytics/schemas/analysis-detail.schema";
import {
  type ContextItemDto,
  type EvidenceDto,
  type MeasureDto,
} from "@/features/analytics/types/analytics.types";
import { action, quality, time, type Scope } from "@/mocks/db/analytics/scope";
import type { Task, User } from "@/mocks/db/database";
import { can, db, now, taskDTO } from "@/mocks/db/database";
import { type AnalysisRefDto, type AnalysisSubjectDto } from "@/types/common";
export function subjectKey(subject: AnalysisSubjectDto) {
  return JSON.stringify(subject);
}

export function snapshotRef(
  u: User,
  scope: Scope,
  type: AnalysisRefDto["analysisType"],
  subject: AnalysisSubjectDto,
  title: string,
  metrics: MeasureDto[],
  evidence: EvidenceDto[],
  summary: string,
  context: ContextItemDto[] = [],
  missing: string[] = [],
): AnalysisRefDto {
  const index = `${db.revision}|${u.id}|${JSON.stringify(scope)}|${subjectKey(subject)}|${type}`;
  let detail = db.details.get(db.snapshotIndex.get(index) ?? "");
  if (!detail) {
    const id = `an-${crypto.randomUUID()}`;
    const snapshotId = `snap-${crypto.randomUUID()}`;
    detail = analysisSchema.parse({
      snapshot: {
        id: snapshotId,
        analysisId: id,
        sourceRevision: `source-${db.revision}-${crypto.randomUUID()}`,
        analysisType: type,
        title,
        subject,
        scope,
        dataAsOf: time(),
        createdAt: now(),
        expiresAt: "2026-11-30T10:00:00.000Z",
        calculationVersion: "business-rules-v2",
        quality:
          metrics.length && metrics.every((m) => m.value === null)
            ? {
                ...quality(
                  missing.length
                    ? missing
                    : metrics.flatMap((m) => m.missingFields),
                ),
                status: "INSUFFICIENT",
              }
            : quality(
                missing.length
                  ? missing
                  : metrics.flatMap((m) => m.missingFields),
              ),
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
        allowed: !(metrics.length && metrics.every((m) => m.value === null)),
        blockedReason:
          metrics.length && metrics.every((m) => m.value === null)
            ? "INSUFFICIENT_DATA"
            : null,
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
    db.snapshotIndex.set(index, id);
    db.snapshotProjects.set(
      id,
      db.projects
        .filter(
          (p) =>
            (!scope.projectId || p.id === scope.projectId) &&
            (!scope.unitId || p.unitId === scope.unitId) &&
            can(u, "ANALYTICS_VIEW", p.id),
        )
        .map((p) => p.id),
    );
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

export function measure(
  code: string,
  label: string,
  value: number | null,
  unit: MeasureDto["unit"],
  formula: string,
  evidenceIds: string[] = [],
): MeasureDto {
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
  const task = taskDTO(t);
  const pending = db.submissions.find(
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
  const evidence: EvidenceDto[] = [
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
