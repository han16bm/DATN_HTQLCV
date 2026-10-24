import {
  type CreateReportDraftInput,
  type GetReportPreviewQuery,
  type ReportQuery,
  type SubmitReportInput,
  type UpdateReportDraftInput,
} from "@/features/reports/types/reports.types";
import type { Report, User } from "@/mocks/db/database";
import { ApiError } from "@/types/api/error";
import { paginate } from "../utils/pagination";
import {
  audit,
  can,
  db,
  entity,
  inProject,
  now,
  reportDTO,
  reportPreview,
  today,
  touch,
} from "./database";
import { requireProject } from "./projects.db";
import { requireVersion } from "./version";
function activeProject(actor: User, id: string) {
  const project = requireProject(actor, id);
  if (project.status !== "ACTIVE")
    throw new ApiError(
      409,
      "PROJECT_NOT_ACTIVE",
      "Chỉ lập báo cáo trong dự án đang triển khai.",
    );
}
function validPeriod(periodType: Report["periodType"], start: string) {
  if (
    start > today() ||
    (periodType === "WEEKLY" &&
      new Date(`${start}T00:00:00+07:00`).getUTCDay() !== 0)
  )
    throw new ApiError(
      422,
      "INVALID_PERIOD",
      "Kỳ không ở tương lai; tuần bắt đầu thứ Hai theo giờ Việt Nam.",
    );
}
const canRead = (actor: User, r: Report) =>
  inProject(actor, r.projectId) &&
  (r.authorId === actor.id ||
    (r.status === "SUBMITTED" &&
      (can(actor, "PROJECT_MANAGE", r.projectId) ||
        can(actor, "TASKS_MANAGE", r.projectId) ||
        can(actor, "ANALYTICS_VIEW", r.projectId))));
function requireReport(actor: User, id: string, edit = false) {
  const r = db.reports.find((r) => r.id === id);
  if (!r) throw new ApiError(404, "NOT_FOUND", "Không tìm thấy báo cáo.");
  if (!canRead(actor, r) || (edit && r.authorId !== actor.id))
    throw new ApiError(
      403,
      "FORBIDDEN",
      "Bản nháp chỉ dành cho tác giả; bản gửi cần quyền xem trong dự án.",
    );
  if (edit) {
    activeProject(actor, r.projectId);
    if (r.status !== "DRAFT")
      throw new ApiError(
        409,
        "REPORT_IMMUTABLE",
        "Báo cáo đã gửi không được sửa hoặc gửi lại.",
      );
  }
  return r;
}
function selectedValid(
  r: Pick<Report, "authorId" | "projectId" | "periodType" | "periodStart">,
  ids: string[],
) {
  const valid = reportPreview(r).items.map((i) => i.taskId);
  if (new Set(ids).size !== ids.length || ids.some((id) => !valid.includes(id)))
    throw new ApiError(
      422,
      "INVALID_RELATED_TASK",
      "Công việc phải có nhật ký của tác giả trong đúng dự án và kỳ.",
    );
}
export const reportsDb = {
  listReports(viewer: User, query: ReportQuery) {
    if (query.from && query.to && query.from > query.to)
      throw new ApiError(
        422,
        "INVALID_RANGE",
        "Ngày bắt đầu không được sau ngày kết thúc.",
      );
    return paginate(
      db.reports
        .filter(
          (r) =>
            canRead(viewer, r) &&
            (!query.projectId || r.projectId === query.projectId) &&
            (!query.authorId || r.authorId === query.authorId) &&
            (!query.periodType || r.periodType === query.periodType) &&
            (!query.status || r.status === query.status) &&
            (!query.from || r.periodStart >= query.from) &&
            (!query.to || r.periodStart <= query.to) &&
            (!query.q ||
              `${r.achievements} ${r.periodStart}`
                .toLowerCase()
                .includes(query.q.toLowerCase())),
        )
        .sort((a, b) => b.periodStart.localeCompare(a.periodStart))
        .map(reportDTO),
      query,
    );
  },
  getReportPreview(viewer: User, query: GetReportPreviewQuery) {
    activeProject(viewer, query.projectId);
    validPeriod(query.periodType, query.periodStart);
    return reportPreview({ ...query, authorId: viewer.id });
  },
  getReport(viewer: User, reportId: string) {
    return reportDTO(requireReport(viewer, reportId));
  },
  createReportDraft(viewer: User, body: CreateReportDraftInput) {
    activeProject(viewer, body.projectId);
    validPeriod(body.periodType, body.periodStart);
    const existing = db.reports.find(
      (r) =>
        r.authorId === viewer.id &&
        r.projectId === body.projectId &&
        r.periodType === body.periodType &&
        r.periodStart === body.periodStart,
    );
    if (existing)
      throw new ApiError(
        409,
        "REPORT_EXISTS",
        "Đã có báo cáo cho kỳ này.",
        [],
        { existingReportId: existing.id },
      );
    selectedValid({ ...body, authorId: viewer.id }, body.selectedTaskIds ?? []);
    const r: Report = {
      ...entity(),
      ...body,
      authorId: viewer.id,
      status: "DRAFT",
      achievements: body.achievements ?? "",
      blockers: body.blockers ?? "",
      nextPlan: body.nextPlan ?? "",
      selectedTaskIds: body.selectedTaskIds ?? [],
      zeroTimeReason: null,
      submittedAt: null,
      snapshot: null,
    };
    db.reports.push(r);
    return reportDTO(r);
  },
  updateReportDraft(
    viewer: User,
    reportId: string,
    body: UpdateReportDraftInput,
    expectedVersion: string | null,
  ) {
    const r = requireReport(viewer, reportId, true);
    requireVersion(expectedVersion, r);
    if (!Object.keys(body).length)
      throw new ApiError(422, "EMPTY_PATCH", "Chưa có nội dung thay đổi.");
    if (body.selectedTaskIds) selectedValid(r, body.selectedTaskIds);
    Object.assign(r, body);
    touch(r);
    return reportDTO(r);
  },
  refreshReportDraft(
    viewer: User,
    reportId: string,
    expectedVersion: string | null,
  ) {
    const r = requireReport(viewer, reportId, true);
    requireVersion(expectedVersion, r);
    return reportPreview(r);
  },
  submitReport(
    viewer: User,
    reportId: string,
    body: SubmitReportInput,
    expectedVersion: string | null,
  ) {
    const r = requireReport(viewer, reportId, true);
    requireVersion(expectedVersion, r);
    if (!r.achievements.trim() || !r.nextPlan.trim())
      throw new ApiError(
        422,
        "REPORT_CONTENT_REQUIRED",
        "Kết quả thực hiện và kế hoạch tiếp theo là bắt buộc khi gửi.",
      );
    selectedValid(r, r.selectedTaskIds);
    const preview = reportPreview(r);
    const reason = body.zeroTimeReason ?? r.zeroTimeReason;
    if (preview.totalMinutes === 0 && !reason?.trim())
      throw new ApiError(
        422,
        "ZERO_TIME_REASON_REQUIRED",
        "Cần giải thích khi tổng giờ công bằng 0.",
        [
          {
            path: ["zeroTimeReason"],
            message: "Vui lòng giải thích kỳ không có giờ công.",
          },
        ],
      );
    r.snapshot = structuredClone(preview);
    r.status = "SUBMITTED";
    r.submittedAt = now();
    r.zeroTimeReason = preview.totalMinutes === 0 ? reason : null;
    touch(r);
    audit(
      viewer.id,
      "REPORT",
      r.id,
      "Gửi báo cáo",
      { status: "DRAFT" },
      { status: "SUBMITTED", totalMinutes: preview.totalMinutes },
    );
    return reportDTO(r);
  },
};
