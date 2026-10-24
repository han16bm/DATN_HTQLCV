import type { AnalyticsQuery } from "@/features/analytics/types/analytics.types";
import {
  type AnalysisMetaDto,
  type AnalyticsQueryDto,
  type QualityDto,
} from "@/features/analytics/types/analytics.types";
import type { User } from "@/mocks/db/database";
import { can, db, now } from "@/mocks/db/database";
import { ApiError } from "@/types/api/error";
import { type DomainActionDto } from "@/types/common";
export type Scope = AnalyticsQueryDto;

export const quality = (missingFields: string[] = []): QualityDto => ({
  status: missingFields.length ? "PARTIAL" : "SUFFICIENT",
  missingFields,
  scopeLimited: false,
});

export const time = () =>
  db.revision === 1 ? "2026-10-23T10:00:00.000Z" : now();

export function analyticsScope(u: User, query: AnalyticsQuery) {
  if (!db.projects.some((p) => can(u, "ANALYTICS_VIEW", p.id)))
    throw new ApiError(
      403,
      "FORBIDDEN",
      "Bạn chưa được cấp quyền phân tích trong dự án nào.",
    );
  if (
    query.from > query.to ||
    Date.parse(query.to) - Date.parse(query.from) > 366 * 86400000
  )
    throw new ApiError(
      422,
      "INVALID_RANGE",
      "Chọn khoảng ngày hợp lệ, tối đa 366 ngày.",
    );
  const projects = db.projects.filter(
    (p) =>
      can(u, "ANALYTICS_VIEW", p.id) &&
      (!query.projectId || p.id === query.projectId) &&
      (!query.unitId || p.unitId === query.unitId) &&
      (!query.ownerId || p.ownerId === query.ownerId),
  );
  if ((query.projectId || query.unitId) && !projects.length)
    throw new ApiError(403, "FORBIDDEN", "Bạn không có quyền xem phạm vi này.");
  const scope = {
    ...query,
    ...(!query.unitId && !query.projectId ? { unitId: u.unitId } : {}),
  };
  if (
    query.teamId &&
    !db.teams.some(
      (t) => t.id === query.teamId && t.unitId === (query.unitId ?? u.unitId),
    )
  )
    throw new ApiError(403, "FORBIDDEN", "Nhóm nằm ngoài phạm vi.");
  const people = query.teamId
    ? (db.teams.find((t) => t.id === query.teamId)?.memberIds ?? [])
    : null;
  const cohort = db.tasks.filter(
    (t) =>
      projects.some((p) => p.id === t.projectId) &&
      (!scope.unitId ||
        db.projects.some(
          (p) => p.id === t.projectId && p.unitId === scope.unitId,
        )) &&
      (!query.status || t.status === query.status) &&
      (!query.priority || t.priority === query.priority),
  );
  const tasks = cohort.filter(
    (t) =>
      (!query.assigneeId || t.assigneeId === query.assigneeId) &&
      (!people || (t.assigneeId && people.includes(t.assigneeId))),
  );
  return {
    scope,
    tasks,
    projects: projects.filter(
      (p) => !scope.unitId || p.unitId === scope.unitId,
    ),
    people,
    cohort,
  };
}

export const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

export const mean = (values: number[]) =>
  values.length ? sum(values) / values.length : null;

export const ratio = (a: number, b: number) => (b ? (a / b) * 100 : null);

export const action = (
  target: DomainActionDto["target"],
  taskId: string | null = null,
  submissionId: string | null = null,
): DomainActionDto => ({
  target,
  taskId,
  submissionId,
  reportId: null,
});

export function meta(scope: Scope, missing: string[] = []): AnalysisMetaDto {
  return {
    snapshotId: `aggregate-${db.revision}`,
    dataAsOf: time(),
    generatedAt: now(),
    scope,
    calculationMethod: "SERVER_RULES",
    calculationVersion: "business-rules-v2",
    quality: quality(missing),
  };
}
