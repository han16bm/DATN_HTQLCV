import {
  type AddProjectMemberInput,
  type EndProjectMembershipInput,
  type ProjectMemberQuery,
  type UpdateProjectMemberPermissionsInput,
} from "@/features/project-members/types/project-members.types";
import type { User } from "@/mocks/db/database";
import { ApiError } from "@/types/api/error";
import { paginate } from "../utils/pagination";
import { audit, db, entity, memberDTO, now, touch } from "./database";
import { requireUser } from "./organization.db";
import { projectEditable, requireProject, validateGrant } from "./projects.db";
import { requireVersion } from "./version";
function membership(projectId: string, id: string) {
  const value = db.members.find(
    (m) => m.projectId === projectId && m.id === id,
  );
  if (!value)
    throw new ApiError(
      404,
      "MEMBERSHIP_NOT_FOUND",
      "Không tìm thấy tư cách thành viên.",
    );
  return value;
}
export const projectMembersDb = {
  listProjectMembers(
    viewer: User,
    projectId: string,
    query: ProjectMemberQuery,
  ) {
    requireProject(viewer, projectId);
    return paginate(
      db.members
        .filter(
          (m) =>
            m.projectId === projectId &&
            (!query.q ||
              memberDTO(m)
                .user.displayName.toLowerCase()
                .includes(query.q.toLowerCase())),
        )
        .map(memberDTO),
      query,
    );
  },
  addProjectMember(
    viewer: User,
    projectId: string,
    body: AddProjectMemberInput,
  ) {
    const project = requireProject(viewer, projectId, "MEMBERS_MANAGE");
    projectEditable(project);
    const user = requireUser(body.userId);
    if (user.status !== "ACTIVE")
      throw new ApiError(
        422,
        "USER_INACTIVE",
        "Người được thêm phải có tài khoản hoạt động.",
      );
    if (
      db.members.some(
        (m) =>
          m.projectId === project.id && m.userId === body.userId && !m.endedAt,
      )
    )
      throw new ApiError(
        409,
        "ALREADY_MEMBER",
        "Người này đang là thành viên dự án.",
      );
    validateGrant(viewer, project.id, body.permissions);
    const value = {
      ...entity(),
      projectId: project.id,
      ...body,
      joinedAt: now(),
      endedAt: null,
    };
    db.members.push(value);
    audit(viewer.id, "PROJECT", project.id, "Thêm thành viên", null, {
      userId: value.userId,
      projectRole: value.projectRole,
    });
    return memberDTO(value);
  },
  updateProjectMemberPermissions(
    viewer: User,
    projectId: string,
    membershipId: string,
    body: UpdateProjectMemberPermissionsInput,
    expectedVersion: string | null,
  ) {
    const project = requireProject(viewer, projectId, "MEMBERS_MANAGE");
    projectEditable(project);
    const value = membership(project.id, membershipId);
    requireVersion(expectedVersion, value);
    if (value.projectRole === "OWNER")
      throw new ApiError(
        409,
        "OWNER_MANAGED_BY_PLAN",
        "Đổi người phụ trách tại màn điều chỉnh dự án.",
      );
    if (value.endedAt)
      throw new ApiError(
        409,
        "MEMBERSHIP_ENDED",
        "Thành viên đã kết thúc tư cách.",
      );
    validateGrant(viewer, project.id, body.permissions);
    const before = {
      permissions: value.permissions,
      projectRole: value.projectRole,
    };
    value.permissions = body.permissions;
    value.projectRole = body.projectRole;
    touch(value);
    audit(
      viewer.id,
      "PROJECT",
      project.id,
      "Thay đổi quyền thành viên",
      before,
      {
        userId: value.userId,
        permissions: value.permissions,
        projectRole: value.projectRole,
      },
      body.reason,
    );
    return memberDTO(value);
  },
  endProjectMembership(
    viewer: User,
    projectId: string,
    membershipId: string,
    body: EndProjectMembershipInput,
    expectedVersion: string | null,
  ) {
    const project = requireProject(viewer, projectId, "MEMBERS_MANAGE");
    projectEditable(project);
    const value = membership(project.id, membershipId);
    requireVersion(expectedVersion, value);
    if (value.userId === project.ownerId || value.projectRole === "OWNER")
      throw new ApiError(
        409,
        "OWNER_REQUIRED",
        "Không được kết thúc người phụ trách hiện tại.",
      );
    if (value.endedAt)
      throw new ApiError(
        409,
        "MEMBERSHIP_ENDED",
        "Tư cách thành viên đã kết thúc.",
      );
    if (
      db.tasks.some(
        (t) =>
          t.projectId === project.id &&
          t.assigneeId === value.userId &&
          !["COMPLETED", "CANCELLED"].includes(t.status),
      )
    )
      throw new ApiError(
        409,
        "HANDOVER_REQUIRED",
        "Bàn giao công việc mở trước khi kết thúc tư cách.",
      );
    value.endedAt = now();
    touch(value);
    audit(
      viewer.id,
      "PROJECT",
      project.id,
      "Kết thúc thành viên",
      { userId: value.userId, endedAt: null },
      { userId: value.userId, endedAt: value.endedAt },
      body.reason,
    );
    return memberDTO(value);
  },
};
