import type { User } from "@/mocks/db/database";
import { ApiError } from "@/types/api/error";
import { analysisProjectIds, requireAnalysis } from "./analysis-jobs.db";
import { can, db, inProject, visibleTask } from "./database";
export function authorizeReplay(
  operation: string,
  permission: string | null,
  user: User,
  params: Record<string, string>,
  payload: Record<string, unknown>,
) {
  let projectId =
    typeof params.projectId === "string" ? params.projectId : undefined;
  if (!projectId && typeof params.taskId === "string")
    projectId = db.tasks.find((t) => t.id === params.taskId)?.projectId;
  if (!projectId && typeof params.timeLogId === "string") {
    const log = db.timeLogs.find((l) => l.id === params.timeLogId);
    projectId = db.tasks.find((t) => t.id === log?.taskId)?.projectId;
  }
  if (!projectId && typeof params.alertId === "string")
    projectId = db.alerts.find((a) => a.id === params.alertId)?.projectId;
  const analysisId = params.analysisId ?? payload.analysisId;
  if (typeof analysisId === "string") requireAnalysis(user, analysisId);
  const taskId =
    typeof params.taskId === "string"
      ? params.taskId
      : typeof payload.taskId === "string"
        ? payload.taskId
        : typeof params.timeLogId === "string"
          ? db.timeLogs.find((l) => l.id === params.timeLogId)?.taskId
          : undefined;
  const task = taskId ? db.tasks.find((t) => t.id === taskId) : undefined;
  if (
    task &&
    (!visibleTask(user, task) || (!permission && task.assigneeId !== user.id))
  )
    throw new ApiError(
      403,
      "FORBIDDEN",
      "Bạn không còn quyền thực hiện trên công việc này.",
    );
  if (typeof params.reportId === "string") {
    const report = db.reports.find((r) => r.id === params.reportId);
    if (
      report &&
      (!inProject(user, report.projectId) || report.authorId !== user.id)
    )
      throw new ApiError(
        403,
        "FORBIDDEN",
        "Bạn không còn quyền thao tác báo cáo này.",
      );
  }
  if (!projectId && typeof analysisId === "string")
    projectId = db.details.get(analysisId)?.snapshot.scope.projectId;
  const analysisProjects =
    typeof analysisId === "string" ? analysisProjectIds(analysisId) : [];
  const scopedCan = (permission: string) =>
    analysisProjects.length
      ? analysisProjects.every((id) => can(user, permission, id))
      : can(user, permission, projectId);
  if (permission && !scopedCan(permission))
    throw new ApiError(
      403,
      "FORBIDDEN",
      "Quyền thực hiện thao tác không còn hiệu lực.",
    );
  if (
    operation === "createAnalysisFeedback" &&
    (!scopedCan("ANALYTICS_VIEW") || !scopedCan("ALERTS_MANAGE"))
  )
    throw new ApiError(
      403,
      "FORBIDDEN",
      "Bạn không có quyền phản hồi nhận định này.",
    );
}
