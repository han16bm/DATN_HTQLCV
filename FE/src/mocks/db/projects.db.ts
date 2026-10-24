import {
  type CancelProjectInput,
  type CreateProjectInput,
  type ProjectHistoryQuery,
  type ProjectQuery,
  type UpdateProjectInput,
} from "@/features/projects/types/projects.types";
import type { User } from "@/mocks/db/database";
import { ApiError } from "@/types/api/error";
import { paginate } from "../utils/pagination";
import {
  audit,
  can,
  db,
  entity,
  inProject,
  now,
  projectDTO,
  projectPermissions,
  touch,
} from "./database";
import { activeUnit, requireUser } from "./organization.db";
import { requireVersion } from "./version";
export function projectEditable(project: (typeof db.projects)[number]) {
  if (!["PLANNED", "ACTIVE"].includes(project.status))
    throw new ApiError(
      409,
      "PROJECT_READ_ONLY",
      "Dự án đã đóng, chỉ được tra cứu.",
    );
}
export function validateProjectPlan(
  unitId: string,
  ownerId: string,
  startDate: string,
  dueAt: string,
  requireFuture = true,
) {
  activeUnit(unitId);
  const owner = requireUser(ownerId);
  if (owner.status !== "ACTIVE" || owner.unitId !== unitId)
    throw new ApiError(
      422,
      "INVALID_OWNER",
      "Người phụ trách cần hoạt động trong đúng đơn vị.",
    );
  if (
    (requireFuture && dueAt <= now()) ||
    startDate >
      new Date(Date.parse(dueAt) + 7 * 3600000).toISOString().slice(0, 10)
  )
    throw new ApiError(
      422,
      "INVALID_PLAN",
      "Hạn phải ở tương lai và không trước ngày bắt đầu.",
    );
}
export function ensureOwner(projectId: string, ownerId: string) {
  const member = db.members.find(
    (m) => m.projectId === projectId && m.userId === ownerId && !m.endedAt,
  );
  if (member) {
    member.projectRole = "OWNER";
    member.permissions = [...projectPermissions];
    touch(member);
  } else
    db.members.push({
      ...entity(),
      projectId,
      userId: ownerId,
      projectRole: "OWNER",
      permissions: [...projectPermissions],
      joinedAt: now(),
      endedAt: null,
    });
}
export function closureChecks(projectId: string) {
  const tasks = db.tasks.filter((t) => t.projectId === projectId);
  const openTaskCount = tasks.filter((t) =>
    ["NEW", "TODO", "IN_PROGRESS"].includes(t.status),
  ).length;
  const pendingReviewCount = tasks.filter(
    (t) => t.status === "PENDING_REVIEW",
  ).length;
  const pendingReportCount =
    db.reports.filter((r) => r.projectId === projectId && r.status === "DRAFT")
      .length + (db.requiredReports.get(projectId) ?? 0);
  return {
    openTaskCount,
    pendingReviewCount,
    pendingReportCount,
    canClose: openTaskCount + pendingReviewCount + pendingReportCount === 0,
  };
}
export function requireClosure(projectId: string) {
  const checks = closureChecks(projectId);
  if (!checks.canClose)
    throw new ApiError(
      409,
      "PROJECT_HAS_PENDING_WORK",
      "Cần xử lý công việc mở, kết quả chờ nghiệm thu và báo cáo còn thiếu trước khi đóng.",
      [],
      checks,
    );
}
export function validateGrant(
  actor: User,
  projectId: string,
  permissions: string[],
) {
  const membership = db.members.find(
    (m) => m.projectId === projectId && m.userId === actor.id && !m.endedAt,
  );
  if (
    new Set(permissions).size !== permissions.length ||
    permissions.some(
      (p) =>
        !membership?.permissions.some((granted) => granted === p) ||
        !projectPermissions.some((granted) => granted === p),
    )
  )
    throw new ApiError(
      403,
      "PERMISSION_ESCALATION",
      "Không được cấp quyền ngoài thẩm quyền trên dự án.",
    );
}
export function requireProject(user: User, id: string, permission?: string) {
  const project = db.projects.find((p) => p.id === id);
  if (!project) throw new ApiError(404, "NOT_FOUND", "Không tìm thấy dự án.");
  if (
    !db.members.some(
      (m) => m.projectId === id && m.userId === user.id && !m.endedAt,
    ) ||
    (permission && !can(user, permission, id))
  )
    throw new ApiError(
      403,
      "FORBIDDEN",
      "Bạn không có quyền thực hiện trong dự án.",
    );
  return project;
}
export const projectsDb = {
  listProjects(viewer: User, query: ProjectQuery) {
    return paginate(
      db.projects
        .filter(
          (p) =>
            inProject(viewer, p.id) &&
            (!query.q ||
              `${p.code} ${p.name}`
                .toLowerCase()
                .includes(query.q.toLowerCase())) &&
            (!query.status || p.status === query.status) &&
            (!query.unitId || p.unitId === query.unitId),
        )
        .map(projectDTO),
      query,
    );
  },
  getProject(viewer: User, projectId: string) {
    return projectDTO(requireProject(viewer, projectId));
  },
  createProject(viewer: User, body: CreateProjectInput) {
    if (!can(viewer, "PROJECT_CREATE") || body.unitId !== viewer.unitId)
      throw new ApiError(
        403,
        "FORBIDDEN",
        "Không được tạo dự án ngoài đơn vị được cấp quyền.",
      );
    if (db.projects.some((p) => p.code === body.code))
      throw new ApiError(409, "DUPLICATE_CODE", "Mã dự án đã tồn tại.", [
        { path: ["code"], message: "Mã dự án đã tồn tại." },
      ]);
    validateProjectPlan(body.unitId, body.ownerId, body.startDate, body.dueAt);
    const project = {
      ...entity(),
      ...body,
      status: "PLANNED" as const,
      completedAt: null,
      cancelledAt: null,
    };
    db.projects.push(project);
    ensureOwner(project.id, project.ownerId);
    audit(viewer.id, "PROJECT", project.id, "Tạo dự án", null, {
      code: project.code,
      name: project.name,
    });
    return projectDTO(project);
  },
  updateProject(
    viewer: User,
    projectId: string,
    body: UpdateProjectInput,
    expectedVersion: string | null,
  ) {
    const project = requireProject(viewer, projectId, "PROJECT_MANAGE");
    requireVersion(expectedVersion, project);
    projectEditable(project);
    const { changeReason, ...patch } = body;
    if (!Object.keys(patch).length)
      throw new ApiError(422, "EMPTY_PATCH", "Chưa có thay đổi kế hoạch.");
    validateProjectPlan(
      project.unitId,
      patch.ownerId ?? project.ownerId,
      patch.startDate ?? project.startDate,
      patch.dueAt ?? project.dueAt,
      Boolean(patch.dueAt && patch.dueAt !== project.dueAt),
    );
    if (
      patch.dueAt &&
      db.tasks.some(
        (t) =>
          t.projectId === project.id &&
          t.status !== "CANCELLED" &&
          t.dueAt > patch.dueAt!,
      )
    )
      throw new ApiError(
        422,
        "TASK_DUE_EXCEEDS_PROJECT",
        "Không rút hạn dự án xuống trước hạn công việc.",
      );
    const before = {
      name: project.name,
      objective: project.objective,
      ownerId: project.ownerId,
      startDate: project.startDate,
      dueAt: project.dueAt,
    };
    if (patch.ownerId && patch.ownerId !== project.ownerId) {
      const previous = db.members.find(
        (m) =>
          m.projectId === project.id &&
          m.userId === project.ownerId &&
          !m.endedAt,
      );
      if (previous) {
        previous.projectRole = "MANAGER";
        touch(previous);
      }
      ensureOwner(project.id, patch.ownerId);
    }
    Object.assign(project, patch);
    touch(project);
    audit(
      viewer.id,
      "PROJECT",
      project.id,
      "Điều chỉnh kế hoạch",
      before,
      patch,
      changeReason,
    );
    return projectDTO(project);
  },
  activateProject(
    viewer: User,
    projectId: string,
    expectedVersion: string | null,
  ) {
    const project = requireProject(viewer, projectId, "PROJECT_MANAGE");
    requireVersion(expectedVersion, project);
    if (project.status !== "PLANNED")
      throw new ApiError(
        409,
        "INVALID_PROJECT_STATE",
        "Chỉ triển khai dự án đang ở trạng thái dự kiến.",
      );
    validateProjectPlan(
      project.unitId,
      project.ownerId,
      project.startDate,
      project.dueAt,
    );
    project.status = "ACTIVE";
    touch(project);
    audit(
      viewer.id,
      "PROJECT",
      project.id,
      "Triển khai dự án",
      { status: "PLANNED" },
      { status: "ACTIVE" },
    );
    return projectDTO(project);
  },
  getProjectClosureChecks(viewer: User, projectId: string) {
    requireProject(viewer, projectId, "PROJECT_MANAGE");
    return closureChecks(projectId);
  },
  completeProject(
    viewer: User,
    projectId: string,
    expectedVersion: string | null,
  ) {
    const project = requireProject(viewer, projectId, "PROJECT_MANAGE");
    requireVersion(expectedVersion, project);
    if (project.status !== "ACTIVE")
      throw new ApiError(
        409,
        "INVALID_PROJECT_STATE",
        "Chỉ kết thúc dự án đang triển khai.",
      );
    requireClosure(project.id);
    project.status = "COMPLETED";
    project.completedAt = now();
    touch(project);
    audit(
      viewer.id,
      "PROJECT",
      project.id,
      "Kết thúc dự án",
      { status: "ACTIVE" },
      { status: "COMPLETED" },
    );
    return projectDTO(project);
  },
  cancelProject(
    viewer: User,
    projectId: string,
    body: CancelProjectInput,
    expectedVersion: string | null,
  ) {
    const project = requireProject(viewer, projectId, "PROJECT_MANAGE");
    requireVersion(expectedVersion, project);
    projectEditable(project);
    requireClosure(project.id);
    const before = project.status;
    project.status = "CANCELLED";
    project.cancelledAt = now();
    touch(project);
    audit(
      viewer.id,
      "PROJECT",
      project.id,
      "Hủy dự án",
      { status: before },
      { status: "CANCELLED" },
      body.reason,
    );
    return projectDTO(project);
  },
  listProjectHistory(
    viewer: User,
    projectId: string,
    query: ProjectHistoryQuery,
  ) {
    requireProject(viewer, projectId);
    return paginate(
      db.audits
        .filter((a) => a.entityType === "PROJECT" && a.entityId === projectId)
        .sort((a, b) => b.at.localeCompare(a.at)),
      query,
    );
  },
};
