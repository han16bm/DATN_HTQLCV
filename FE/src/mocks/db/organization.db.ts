import {
  type CreateTeamInput,
  type CreateUnitInput,
  type DeactivateTeamInput,
  type DeactivateUnitInput,
  type ReplaceTeamMembersInput,
  type TeamQuery,
  type UnitQuery,
  type UpdateTeamInput,
  type UpdateUnitInput,
} from "@/features/organization/types/organization.types";
import type { User } from "@/mocks/db/database";
import { ApiError } from "@/types/api/error";
import { paginate } from "../utils/pagination";
import { audit, can, db, entity, touch } from "./database";
import { requireVersion } from "./version";
export function requireAdmin(
  user: User,
  permission: "USERS_MANAGE" | "ORGANIZATION_MANAGE",
) {
  if (!can(user, permission))
    throw new ApiError(
      403,
      "FORBIDDEN",
      "Bạn chưa được cấp quyền quản trị này.",
    );
}
export function requireUnit(id: string) {
  const unit = db.units.find((u) => u.id === id);
  if (!unit)
    throw new ApiError(404, "UNIT_NOT_FOUND", "Không tìm thấy đơn vị.");
  return unit;
}
export function activeUnit(id: string) {
  const unit = requireUnit(id);
  if (unit.status !== "ACTIVE")
    throw new ApiError(422, "UNIT_INACTIVE", "Đơn vị đã ngừng sử dụng.");
  return unit;
}
export function requireUser(id: string) {
  const user = db.users.find((u) => u.id === id);
  if (!user)
    throw new ApiError(404, "USER_NOT_FOUND", "Không tìm thấy tài khoản.");
  return user;
}
export function validateUnitLinks(
  id: string | null,
  parentId: string | null,
  managerId: string | null,
) {
  if (managerId && requireUser(managerId).status !== "ACTIVE")
    throw new ApiError(
      422,
      "MANAGER_INACTIVE",
      "Người quản lý cần có tài khoản hoạt động.",
    );
  const visited = new Set<string>();
  let cursor = parentId;
  while (cursor) {
    if (cursor === id || visited.has(cursor))
      throw new ApiError(
        422,
        "UNIT_CYCLE",
        "Đơn vị cấp trên tạo thành chu trình.",
      );
    visited.add(cursor);
    cursor = activeUnit(cursor).parentId;
  }
}
export function validateTeamMembers(unitId: string, memberIds: string[]) {
  activeUnit(unitId);
  if (new Set(memberIds).size !== memberIds.length)
    throw new ApiError(
      422,
      "DUPLICATE_MEMBER",
      "Thành viên trong nhóm không được trùng.",
    );
  for (const id of memberIds) {
    const user = requireUser(id);
    if (user.unitId !== unitId || user.status !== "ACTIVE")
      throw new ApiError(
        422,
        "INVALID_TEAM_MEMBER",
        "Thành viên phải hoạt động và thuộc cùng đơn vị.",
      );
  }
}
export function protectLastAdmin(user: User) {
  if (
    user.systemRole === "ADMIN" &&
    user.status === "ACTIVE" &&
    db.users.filter((u) => u.systemRole === "ADMIN" && u.status === "ACTIVE")
      .length <= 1
  )
    throw new ApiError(
      409,
      "LAST_ADMIN",
      "Cần duy trì ít nhất một quản trị viên hoạt động.",
    );
}
export function revokeUserSessions(id: string) {
  for (const [accessToken, userId] of db.sessions)
    if (userId === id) {
      db.sessions.delete(accessToken);
      db.sessionExpiry.delete(accessToken);
      db.revoked.add(accessToken);
    }
  db.revoked.add(`mock-${id}`);
}
function team(id: string) {
  const value = db.teams.find((t) => t.id === id);
  if (!value) throw new ApiError(404, "NOT_FOUND", "Không tìm thấy nhóm.");
  return value;
}
export const organizationDb = {
  listUnits(viewer: User, query: UnitQuery) {
    requireAdmin(viewer, "ORGANIZATION_MANAGE");
    return paginate(
      db.units.filter(
        (u) =>
          (!query.q || u.name.toLowerCase().includes(query.q.toLowerCase())) &&
          (!query.status || u.status === query.status),
      ),
      query,
    );
  },
  getUnit(viewer: User, unitId: string) {
    requireAdmin(viewer, "ORGANIZATION_MANAGE");
    return requireUnit(unitId);
  },
  createUnit(viewer: User, body: CreateUnitInput) {
    requireAdmin(viewer, "ORGANIZATION_MANAGE");
    validateUnitLinks(null, body.parentId, body.managerId);
    const unit = { ...entity(), ...body, status: "ACTIVE" as const };
    db.units.push(unit);
    audit(viewer.id, "UNIT", unit.id, "Tạo đơn vị", null, body);
    return unit;
  },
  updateUnit(
    viewer: User,
    unitId: string,
    body: UpdateUnitInput,
    expectedVersion: string | null,
  ) {
    requireAdmin(viewer, "ORGANIZATION_MANAGE");
    const unit = requireUnit(unitId);
    requireVersion(expectedVersion, unit);
    if (unit.status !== "ACTIVE")
      throw new ApiError(409, "INACTIVE", "Đơn vị đã ngừng sử dụng.");
    const { reason, ...patch } = body;
    if (!Object.keys(patch).length)
      throw new ApiError(422, "EMPTY_PATCH", "Chưa có thông tin thay đổi.");
    validateUnitLinks(
      unit.id,
      patch.parentId === undefined ? unit.parentId : patch.parentId,
      patch.managerId === undefined ? unit.managerId : patch.managerId,
    );
    const before = {
      name: unit.name,
      parentId: unit.parentId,
      managerId: unit.managerId,
    };
    Object.assign(unit, patch);
    touch(unit);
    audit(viewer.id, "UNIT", unit.id, "Cập nhật đơn vị", before, patch, reason);
    return unit;
  },
  deactivateUnit(
    viewer: User,
    unitId: string,
    body: DeactivateUnitInput,
    expectedVersion: string | null,
  ) {
    requireAdmin(viewer, "ORGANIZATION_MANAGE");
    const unit = requireUnit(unitId);
    requireVersion(expectedVersion, unit);
    if (unit.status !== "ACTIVE")
      throw new ApiError(409, "INACTIVE", "Đơn vị đã ngừng sử dụng.");
    if (
      db.units.some((u) => u.parentId === unit.id && u.status === "ACTIVE") ||
      db.users.some((u) => u.unitId === unit.id && u.status === "ACTIVE") ||
      db.teams.some((t) => t.unitId === unit.id && t.status === "ACTIVE") ||
      db.projects.some(
        (p) => p.unitId === unit.id && ["PLANNED", "ACTIVE"].includes(p.status),
      )
    )
      throw new ApiError(
        409,
        "UNIT_IN_USE",
        "Đơn vị còn đơn vị con, nhân sự, nhóm hoặc dự án hoạt động.",
      );
    unit.status = "INACTIVE";
    touch(unit);
    audit(
      viewer.id,
      "UNIT",
      unit.id,
      "Ngừng sử dụng đơn vị",
      { status: "ACTIVE" },
      { status: "INACTIVE" },
      body.reason,
    );
    return unit;
  },
  listTeams(viewer: User, query: TeamQuery) {
    requireAdmin(viewer, "ORGANIZATION_MANAGE");
    return paginate(
      db.teams.filter(
        (t) =>
          (!query.unitId || t.unitId === query.unitId) &&
          (!query.q || t.name.toLowerCase().includes(query.q.toLowerCase())),
      ),
      query,
    );
  },
  getTeam(viewer: User, teamId: string) {
    requireAdmin(viewer, "ORGANIZATION_MANAGE");
    return team(teamId);
  },
  createTeam(viewer: User, body: CreateTeamInput) {
    requireAdmin(viewer, "ORGANIZATION_MANAGE");
    validateTeamMembers(body.unitId, body.memberIds);
    const value = { ...entity(), ...body, status: "ACTIVE" as const };
    db.teams.push(value);
    audit(viewer.id, "TEAM", value.id, "Tạo nhóm", null, body);
    return value;
  },
  updateTeam(
    viewer: User,
    teamId: string,
    body: UpdateTeamInput,
    expectedVersion: string | null,
  ) {
    requireAdmin(viewer, "ORGANIZATION_MANAGE");
    const value = team(teamId);
    requireVersion(expectedVersion, value);
    if (value.status !== "ACTIVE")
      throw new ApiError(409, "INACTIVE", "Nhóm đã ngừng sử dụng.");
    const { reason, ...patch } = body;
    if (!Object.keys(patch).length)
      throw new ApiError(422, "EMPTY_PATCH", "Chưa có thông tin thay đổi.");
    validateTeamMembers(patch.unitId ?? value.unitId, value.memberIds);
    const before = { name: value.name, unitId: value.unitId };
    Object.assign(value, patch);
    touch(value);
    audit(viewer.id, "TEAM", value.id, "Cập nhật nhóm", before, patch, reason);
    return value;
  },
  replaceTeamMembers(
    viewer: User,
    teamId: string,
    body: ReplaceTeamMembersInput,
    expectedVersion: string | null,
  ) {
    requireAdmin(viewer, "ORGANIZATION_MANAGE");
    const value = team(teamId);
    requireVersion(expectedVersion, value);
    if (value.status !== "ACTIVE")
      throw new ApiError(409, "INACTIVE", "Nhóm đã ngừng sử dụng.");
    validateTeamMembers(value.unitId, body.memberIds);
    const before = [...value.memberIds];
    value.memberIds = body.memberIds;
    touch(value);
    audit(
      viewer.id,
      "TEAM",
      value.id,
      "Thay thành viên nhóm",
      { memberIds: before },
      { memberIds: value.memberIds },
      body.reason,
    );
    return value;
  },
  deactivateTeam(
    viewer: User,
    teamId: string,
    body: DeactivateTeamInput,
    expectedVersion: string | null,
  ) {
    requireAdmin(viewer, "ORGANIZATION_MANAGE");
    const value = team(teamId);
    requireVersion(expectedVersion, value);
    if (value.status !== "ACTIVE")
      throw new ApiError(409, "INACTIVE", "Nhóm đã ngừng sử dụng.");
    activeUnit(value.unitId);
    value.status = "INACTIVE";
    touch(value);
    audit(
      viewer.id,
      "TEAM",
      value.id,
      "Ngừng sử dụng nhóm",
      { status: "ACTIVE" },
      { status: "INACTIVE" },
      body.reason,
    );
    return value;
  },
};
