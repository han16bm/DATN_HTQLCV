import {
  type AnalyticsQuery,
  type CreateJobInput,
  type FeedbackInput,
  type FilterQuery,
} from "@/features/analytics/types/analytics.types";
import {
  createJob,
  detailDTO,
  feedback,
  requireAnalysis,
} from "@/mocks/db/analysis-jobs.db";
import { bottlenecks } from "@/mocks/db/analytics/bottlenecks";
import { dashboard } from "@/mocks/db/analytics/dashboard";
import { risks } from "@/mocks/db/analytics/risks";
import { summary } from "@/mocks/db/analytics/summary";
import { workload } from "@/mocks/db/analytics/workload";
import type { User } from "@/mocks/db/database";
import { can, db } from "@/mocks/db/database";
import { paginate } from "@/mocks/utils/pagination";
import { ApiError } from "@/types/api/error";
export const analyticsDb = {
  getDashboard(viewer: User, query: AnalyticsQuery) {
    return dashboard(viewer, query);
  },
  getDeadlineRisks(viewer: User, query: AnalyticsQuery) {
    return risks(viewer, query);
  },
  getWorkload(viewer: User, query: AnalyticsQuery) {
    return workload(viewer, query);
  },
  getBottlenecks(viewer: User, query: AnalyticsQuery) {
    return bottlenecks(viewer, query);
  },
  getAnalysisSummary(viewer: User, query: AnalyticsQuery) {
    return summary(viewer, query);
  },
  createAnalysisJob(
    viewer: User,
    body: CreateJobInput,
    scenario: string | null,
  ) {
    const job = createJob(
      viewer,
      body.analysisId,
      body.generationMode ?? "REUSE_OR_CREATE",
      scenario,
    );
    return job;
  },
  getAnalysisJob(viewer: User, jobId: string) {
    const job = db.jobs.get(jobId);
    if (!job)
      throw new ApiError(404, "NOT_FOUND", "Không tìm thấy tiến trình.");
    requireAnalysis(viewer, job.analysisId);
    return job;
  },
  getAnalysisDetail(viewer: User, analysisId: string) {
    return detailDTO(viewer, analysisId);
  },
  createAnalysisFeedback(
    viewer: User,
    analysisId: string,
    body: FeedbackInput,
  ) {
    return feedback(viewer, analysisId, body);
  },
  listAnalyticsFilterOptions(viewer: User, query: FilterQuery) {
    const projects = db.projects.filter(
      (p) =>
        can(viewer, "ANALYTICS_VIEW", p.id) &&
        (!query.unitId || p.unitId === query.unitId) &&
        (!query.projectId || p.id === query.projectId),
    );
    if ((query.unitId || query.projectId) && !projects.length)
      throw new ApiError(403, "FORBIDDEN", "Không có quyền trong phạm vi lọc.");
    const unitIds = projects.map((p) => p.unitId);
    const memberIds = db.members
      .filter((m) => !m.endedAt && projects.some((p) => p.id === m.projectId))
      .map((m) => m.userId);
    const teams = db.teams.filter(
      (t) => unitIds.includes(t.unitId) && t.status === "ACTIVE",
    );
    if (query.teamId && !teams.some((t) => t.id === query.teamId))
      throw new ApiError(403, "FORBIDDEN", "Nhóm nằm ngoài phạm vi.");
    const team = query.teamId
      ? teams.find((t) => t.id === query.teamId)
      : undefined;
    const items =
      query.kind === "UNIT"
        ? db.units
            .filter((u) => unitIds.includes(u.id))
            .map((u) => ({ id: u.id, name: u.name }))
        : query.kind === "PROJECT"
          ? projects.map((p) => ({ id: p.id, name: p.name }))
          : query.kind === "TEAM"
            ? teams.map((t) => ({ id: t.id, name: t.name }))
            : db.users
                .filter(
                  (u) =>
                    memberIds.includes(u.id) &&
                    (!team || team.memberIds.includes(u.id)),
                )
                .map((u) => ({ id: u.id, name: u.displayName }));
    return paginate(
      items.filter(
        (i) => !query.q || i.name.toLowerCase().includes(query.q.toLowerCase()),
      ),
      query,
    );
  },
};
