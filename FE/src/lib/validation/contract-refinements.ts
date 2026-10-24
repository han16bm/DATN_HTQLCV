import type { z } from "zod";
type JsonObject = Record<string, unknown>;
const object = (v: unknown): v is JsonObject =>
  typeof v === "object" && v !== null && !Array.isArray(v);
function issue(ctx: z.RefinementCtx, message: string) {
  ctx.addIssue({ code: "custom", message });
}
export function checkProjection(v: JsonObject, ctx: z.RefinementCtx) {
  for (const [label, id] of [
    ["assignee", "assigneeId"],
    ["project", "projectId"],
    ["owner", "ownerId"],
    ["unit", "unitId"],
    ["user", "userId"],
    ["submitter", "submittedBy"],
    ["reviewer", "reviewedBy"],
    ["author", "authorId"],
    ["actor", "actorId"],
  ]) {
    if (!(label in v) || !(id in v)) continue;
    if (v[label] === null && v[id] === null) continue;
    if (!object(v[label]) || v[label].id !== v[id])
      issue(ctx, `${label}.id không khớp ${id}`);
  }
}
export function checkAction(v: JsonObject, ctx: z.RefinementCtx) {
  if (typeof v.target !== "string") return;
  if (
    (v.target.startsWith("TASK_") || v.target === "SUBMISSION_REVIEW") &&
    !v.taskId
  )
    issue(ctx, "Action thiếu taskId");
  if (v.target === "SUBMISSION_REVIEW" && !v.submissionId)
    issue(ctx, "Action thiếu submissionId");
  if (v.target === "REPORT_DETAIL" && !v.reportId)
    issue(ctx, "Action thiếu reportId");
}
export function checkJob(v: JsonObject, ctx: z.RefinementCtx) {
  if (v.status === "QUEUED" || v.status === "RUNNING") {
    if (
      v.completedAt !== null ||
      v.error !== null ||
      typeof v.pollAfterMs !== "number" ||
      v.pollAfterMs < 2000 ||
      v.pollAfterMs > 10000
    )
      issue(ctx, "Job đang chạy sai trạng thái");
  } else {
    if (!v.completedAt || v.pollAfterMs !== 0)
      issue(ctx, "Job kết thúc thiếu thời điểm");
    if (v.status === "SUCCEEDED" && v.error !== null)
      issue(ctx, "SUCCEEDED job has an error");
    if (v.status === "FAILED" && !v.error) issue(ctx, "Job lỗi sai cấu trúc");
  }
}
export function checkAnalysisData(v: JsonObject, ctx: z.RefinementCtx) {
  if (!object(v.snapshot) || !object(v.explanation) || !object(v.generation))
    return;
  const s = v.snapshot;
  const e = v.explanation;
  const metrics = Array.isArray(s.metrics) ? s.metrics.filter(object) : [];
  const evidence = Array.isArray(s.evidence) ? s.evidence.filter(object) : [];
  const mids = new Set(metrics.map((m) => m.id));
  const eids = new Set(evidence.map((m) => m.id));
  if (mids.size !== metrics.length || eids.size !== evidence.length)
    issue(ctx, "ID thông số/căn cứ trùng");
  const kinds: Record<string, string[]> = {
    RISK: ["TASK", "PROJECT"],
    WORKLOAD: ["PERSON", "PROJECT"],
    BOTTLENECK: ["TASK", "PROCESS"],
    SUMMARY: ["PROJECT", "UNIT"],
    METRIC: ["METRIC"],
  };
  if (
    object(s.subject) &&
    typeof s.analysisType === "string" &&
    !kinds[s.analysisType]?.includes(String(s.subject.kind))
  )
    issue(ctx, "Subject không đúng loại phân tích");
  if (e.status === "READY" && !e.lastSuccess)
    issue(ctx, "READY thiếu lời phân tích");
  if (["QUEUED", "RUNNING"].includes(String(e.status)) && !e.activeJobId)
    issue(ctx, "Thiếu activeJobId");
  if (["FAILED", "UNAVAILABLE"].includes(String(e.status)) && !e.error)
    issue(ctx, "Thiếu nguyên nhân lỗi AI");
  if (e.status === "NOT_REQUESTED" && (e.lastSuccess || e.activeJobId))
    issue(ctx, "NOT_REQUESTED có kết quả/job");
  if (object(e.lastSuccess)) {
    const llm = e.lastSuccess;
    if (llm.analysisId !== s.analysisId || llm.snapshotId !== s.id)
      issue(ctx, "Lời phân tích không thuộc snapshot");
    const findings = Array.isArray(llm.findings)
      ? llm.findings.filter(object)
      : [];
    if (new Set(findings.map((f) => f.id)).size !== findings.length)
      issue(ctx, "Finding ID trùng");
    for (const f of [
      ...findings,
      ...(Array.isArray(llm.recommendations)
        ? llm.recommendations.filter(object)
        : []),
    ]) {
      if (Array.isArray(f.metricIds) && f.metricIds.some((id) => !mids.has(id)))
        issue(ctx, "Citation thông số không tồn tại");
      if (
        Array.isArray(f.evidenceIds) &&
        f.evidenceIds.some((id) => !eids.has(id))
      )
        issue(ctx, "Citation căn cứ không tồn tại");
    }
  }
}
export function checkAnalysisDetail(v: JsonObject, ctx: z.RefinementCtx) {
  checkAnalysisData(v, ctx);
  if (!object(v.snapshot) || !object(v.freshness)) return;
  const s = v.snapshot;
  if (
    v.freshness.status === "OUTDATED" &&
    v.freshness.latestAnalysisId === s.analysisId
  )
    issue(ctx, "OUTDATED trỏ về chính snapshot cũ");
}
