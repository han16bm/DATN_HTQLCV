import { analysisSchema } from "@/features/analytics/schemas/analysis-detail.schema";
import { llmExplanationSchema } from "@/features/analytics/schemas/analysis-explanation.schema";
import {
  type AnalysisDto,
  type AnalysisErrorDto,
  type AnalysisFeedbackCreateDto,
  type FeedbackDto,
  type JobDto,
} from "@/features/analytics/types/analytics.types";
import { bottlenecks } from "@/mocks/db/analytics/bottlenecks";
import { dashboard } from "@/mocks/db/analytics/dashboard";
import { risks } from "@/mocks/db/analytics/risks";
import { workload } from "@/mocks/db/analytics/workload";
import type { User } from "@/mocks/db/database";
import { ApiError } from "@/types/api/error";
import { can, db, now, person, schedule } from "./database";
export function analysisProjectIds(id: string) {
  const detail = db.details.get(id);
  return (
    db.snapshotProjects.get(id) ??
    (detail?.snapshot.scope.projectId ? [detail.snapshot.scope.projectId] : [])
  );
}
export function requireAnalysis(actor: User, id: string) {
  const detail = db.details.get(id);
  if (!detail)
    throw new ApiError(404, "NOT_FOUND", "Không tìm thấy bản phân tích.");
  const ids = analysisProjectIds(id);
  if (
    !ids.length ||
    ids.some((projectId) => !can(actor, "ANALYTICS_VIEW", projectId))
  )
    throw new ApiError(
      403,
      "FORBIDDEN",
      "Bạn không còn quyền xem toàn bộ phạm vi của bản phân tích này.",
    );
  if (detail.snapshot.expiresAt <= now())
    throw new ApiError(
      410,
      "SNAPSHOT_EXPIRED",
      "Bản phân tích đã hết thời gian lưu. Mở trang tổng quan để lấy bản mới.",
    );
  return detail;
}
export function detailDTO(actor: User, id: string): AnalysisDto {
  const original = requireAnalysis(actor, id);
  const s = original.snapshot;
  const revision = /^source-(\d+)-/.exec(s.sourceRevision)?.[1];
  const outdated = revision
    ? Number(revision) !== db.revision
    : db.revision !== 1;
  let latest: string | null = null;
  if (outdated) {
    if (s.analysisType === "RISK") risks(actor, s.scope);
    else if (s.analysisType === "WORKLOAD") workload(actor, s.scope);
    else if (s.analysisType === "BOTTLENECK") bottlenecks(actor, s.scope);
    else dashboard(actor, s.scope);
    const indexPrefix = `${db.revision}|${actor.id}|${JSON.stringify(s.scope)}|${JSON.stringify(s.subject)}|${s.analysisType}`;
    latest = db.snapshotIndex.get(indexPrefix) ?? null;
  }
  const value = structuredClone(original);
  value.freshness = {
    status: outdated ? "OUTDATED" : "CURRENT",
    checkedAt: now(),
    latestAnalysisId: latest,
  };
  if (outdated)
    value.generation = {
      allowed: false,
      blockedReason: "SNAPSHOT_OUTDATED",
      retryAfterSeconds: null,
    };
  else if (value.explanation.activeJobId)
    value.generation = {
      allowed: false,
      blockedReason: "ACTIVE_JOB",
      retryAfterSeconds: null,
    };
  value.feedback = {
    latest: db.feedback.filter((f) => f.analysisId === id).at(-1) ?? null,
    canSubmit:
      !outdated &&
      s.analysisType === "BOTTLENECK" &&
      analysisProjectIds(id).every((p) => can(actor, "ALERTS_MANAGE", p)),
  };
  return analysisSchema.parse(value);
}
export function createJob(
  actor: User,
  id: string,
  mode: "REUSE_OR_CREATE" | "REGENERATE",
  scenario: string | null,
) {
  const detail = requireAnalysis(actor, id);
  const existing = [...db.jobs.values()]
    .filter((j) => j.analysisId === id)
    .at(-1);
  if (
    existing &&
    (existing.status === "RUNNING" ||
      existing.status === "QUEUED" ||
      (mode === "REUSE_OR_CREATE" && existing.status === "SUCCEEDED"))
  )
    return existing;
  const current = detailDTO(actor, id);
  if (!current.generation.allowed)
    throw new ApiError(
      409,
      "GENERATION_BLOCKED",
      "Không thể yêu cầu diễn giải cho bản dữ liệu này.",
      [],
      { blockedReason: current.generation.blockedReason },
    );
  if (mode === "REUSE_OR_CREATE" && detail.explanation.lastSuccess) {
    const job: JobDto = {
      id: crypto.randomUUID(),
      analysisId: id,
      snapshotId: detail.snapshot.id,
      status: "SUCCEEDED",
      createdAt: now(),
      updatedAt: now(),
      completedAt: now(),
      pollAfterMs: 0,
      result: {
        analysisId: id,
        explanationId: detail.explanation.lastSuccess.id,
      },
      error: null,
    };
    db.jobs.set(job.id, job);
    return job;
  }
  const job: JobDto = {
    id: crypto.randomUUID(),
    analysisId: id,
    snapshotId: detail.snapshot.id,
    status: "QUEUED",
    createdAt: now(),
    updatedAt: now(),
    completedAt: null,
    pollAfterMs: 2000,
    result: null,
    error: null,
  };
  db.jobs.set(job.id, job);
  detail.explanation.status = "QUEUED";
  detail.explanation.activeJobId = job.id;
  detail.explanation.error = null;
  schedule(() => {
    const active = db.jobs.get(job.id);
    const target = db.details.get(id);
    if (!active || !target) return;
    active.status = "RUNNING";
    active.updatedAt = now();
    target.explanation.status = "RUNNING";
  }, 300);
  schedule(() => {
    const active = db.jobs.get(job.id);
    const target = db.details.get(id);
    if (!active || !target) return;
    const failures: Record<string, AnalysisErrorDto["code"]> = {
      "llm-timeout": "PROVIDER_TIMEOUT",
      "llm-rate-limit": "PROVIDER_RATE_LIMIT",
      "llm-unavailable": "PROVIDER_UNAVAILABLE",
      "llm-invalid": "OUTPUT_INVALID",
      "llm-refused": "REFUSED",
      "llm-not-configured": "LLM_NOT_CONFIGURED",
    };
    active.updatedAt = now();
    active.completedAt = now();
    active.pollAfterMs = 0;
    target.explanation.activeJobId = null;
    const code = failures[scenario ?? ""];
    if (code) {
      const error: AnalysisErrorDto = {
        code,
        message:
          "Lượt diễn giải mô phỏng chưa hoàn tất. Số liệu và căn cứ vẫn được giữ nguyên.",
        retryable: !["LLM_NOT_CONFIGURED", "REFUSED"].includes(code),
        retryAfterSeconds: code === "PROVIDER_RATE_LIMIT" ? 10 : null,
      };
      active.status = "FAILED";
      active.error = error;
      target.explanation.status =
        code === "LLM_NOT_CONFIGURED" ? "UNAVAILABLE" : "FAILED";
      target.explanation.error = error;
      if (code === "LLM_NOT_CONFIGURED")
        target.generation = {
          allowed: false,
          blockedReason: "LLM_NOT_CONFIGURED",
          retryAfterSeconds: null,
        };
      return;
    }
    try {
      const snapshot = target.snapshot;
      const explanation = llmExplanationSchema.parse({
        id: crypto.randomUUID(),
        analysisId: id,
        snapshotId: snapshot.id,
        locale: "vi-VN",
        generatedAt: now(),
        modelDisplayName: "LLM mô phỏng · MSW",
        promptVersion: "snapshot-explanation-v1",
        summary: target.systemSummary,
        findings: [
          {
            id: "finding-1",
            title: "Đối chiếu dữ liệu hiện có",
            text: "Các thông số phản ánh phạm vi và mốc dữ liệu đã chọn. Cần xem căn cứ trước khi điều chỉnh kế hoạch hoặc phân công.",
            metricIds: snapshot.metrics.map((m) => m.id),
            evidenceIds: snapshot.evidence.map((e) => e.id),
          },
        ],
        recommendations: snapshot.evidence
          .filter((e) => e.action)
          .slice(0, 2)
          .map((e, i) => ({
            id: `recommendation-${i}`,
            title: "Kiểm tra nguồn nghiệp vụ",
            text: e.label,
            priority: "NORMAL",
            evidenceIds: [e.id],
            action: e.action,
          })),
        limitations: [
          "Diễn giải mô phỏng để kiểm thử giao diện, chưa kết nối nhà cung cấp LLM.",
          ...(snapshot.quality.missingFields.length
            ? [
                "Nguồn dữ liệu còn thiếu; chưa đủ căn cứ kết luận quá tải hoặc hiệu suất cá nhân.",
              ]
            : []),
        ],
      });
      const checked = analysisSchema.parse({
        ...target,
        explanation: {
          status: "READY",
          lastSuccess: explanation,
          activeJobId: null,
          error: null,
        },
      });
      target.explanation = checked.explanation;
      active.status = "SUCCEEDED";
      active.result = { analysisId: id, explanationId: explanation.id };
    } catch {
      active.status = "FAILED";
      active.error = {
        code: "OUTPUT_INVALID",
        message: "Nội dung diễn giải không khớp dữ liệu nguồn.",
        retryable: true,
        retryAfterSeconds: null,
      };
      target.explanation.status = "FAILED";
      target.explanation.error = active.error;
    }
  }, 1500);
  return job;
}
export function feedback(
  actor: User,
  id: string,
  body: AnalysisFeedbackCreateDto,
) {
  const detail = detailDTO(actor, id);
  if (!detail.feedback.canSubmit)
    throw new ApiError(
      detail.freshness.status === "OUTDATED" ? 409 : 403,
      "FEEDBACK_NOT_ALLOWED",
      "Không được phản hồi bản phân tích này trong quyền hoặc phiên bản hiện tại.",
    );
  const item: FeedbackDto = {
    id: crypto.randomUUID(),
    analysisId: id,
    snapshotId: detail.snapshot.id,
    ...body,
    actorId: actor.id,
    actor: person(actor.id),
    createdAt: now(),
  };
  db.feedback.push(item);
  return item;
}
