import {
  type CreateUserInput,
  type LockUserInput,
  type ResetUserPasswordInput,
  type UnlockUserInput,
  type UpdateUserInput,
  type UserQuery,
} from "@/features/users/types/users.types";
import type { User } from "@/mocks/db/database";
import { ApiError } from "@/types/api/error";
import { paginate } from "../utils/pagination";
import { audit, db, entity, touch, userDTO } from "./database";
import {
  activeUnit,
  protectLastAdmin,
  requireAdmin,
  requireUser,
  revokeUserSessions,
} from "./organization.db";
import { requireVersion } from "./version";
function unique(username: string, email: string, except?: string) {
  if (db.users.some((u) => u.id !== except && u.username === username))
    throw new ApiError(
      409,
      "DUPLICATE_USERNAME",
      "Tên đăng nhập đã được sử dụng.",
      [{ path: ["username"], message: "Tên đăng nhập đã tồn tại." }],
    );
  if (
    db.users.some(
      (u) => u.id !== except && u.email.toLowerCase() === email.toLowerCase(),
    )
  )
    throw new ApiError(409, "DUPLICATE_EMAIL", "Email đã được sử dụng.", [
      { path: ["email"], message: "Email đã tồn tại." },
    ]);
}
export const usersDb = {
  listUsers(viewer: User, query: UserQuery) {
    requireAdmin(viewer, "USERS_MANAGE");
    return paginate(
      db.users
        .filter(
          (u) =>
            (!query.q ||
              `${u.username} ${u.displayName} ${u.email}`
                .toLowerCase()
                .includes(query.q.toLowerCase())) &&
            (!query.unitId || u.unitId === query.unitId) &&
            (!query.status || u.status === query.status) &&
            (!query.systemRole || u.systemRole === query.systemRole),
        )
        .map(userDTO),
      query,
    );
  },
  getUser(viewer: User, userId: string) {
    requireAdmin(viewer, "USERS_MANAGE");
    return userDTO(requireUser(userId));
  },
  createUser(viewer: User, body: CreateUserInput) {
    requireAdmin(viewer, "USERS_MANAGE");
    activeUnit(body.unitId);
    unique(body.username, body.email);
    const { initialPassword, ...data } = body;
    const user = { ...entity(), ...data, status: "ACTIVE" as const };
    db.users.push(user);
    db.passwords.set(user.id, initialPassword);
    audit(viewer.id, "USER", user.id, "Cấp tài khoản", null, {
      username: user.username,
      systemRole: user.systemRole,
      unitId: user.unitId,
    });
    return userDTO(user);
  },
  updateUser(
    viewer: User,
    userId: string,
    body: UpdateUserInput,
    expectedVersion: string | null,
  ) {
    requireAdmin(viewer, "USERS_MANAGE");
    const user = requireUser(userId);
    requireVersion(expectedVersion, user);
    const { reason, ...patch } = body;
    if (!Object.keys(patch).length)
      throw new ApiError(422, "EMPTY_PATCH", "Chưa có thông tin thay đổi.");
    if (patch.systemRole && patch.systemRole !== user.systemRole) {
      if (!reason)
        throw new ApiError(
          422,
          "REASON_REQUIRED",
          "Đổi vai trò cần có lý do.",
          [{ path: ["reason"], message: "Nhập lý do thay đổi vai trò." }],
        );
      if (viewer.id === user.id)
        throw new ApiError(
          403,
          "SELF_ROLE_CHANGE",
          "Không được tự thay đổi vai trò của mình.",
        );
      protectLastAdmin(user);
    }
    if (patch.unitId && patch.unitId !== user.unitId) {
      activeUnit(patch.unitId);
      if (
        db.teams.some(
          (t) => t.status === "ACTIVE" && t.memberIds.includes(user.id),
        ) ||
        db.tasks.some(
          (t) =>
            t.assigneeId === user.id &&
            !["COMPLETED", "CANCELLED"].includes(t.status),
        )
      )
        throw new ApiError(
          409,
          "HANDOVER_REQUIRED",
          "Cần xử lý nhóm và bàn giao công việc trước khi chuyển đơn vị.",
        );
    }
    unique(user.username, patch.email ?? user.email, user.id);
    const before = {
      displayName: user.displayName,
      email: user.email,
      systemRole: user.systemRole,
      unitId: user.unitId,
    };
    Object.assign(user, patch);
    touch(user);
    audit(
      viewer.id,
      "USER",
      user.id,
      "Cập nhật tài khoản",
      before,
      patch,
      reason ?? null,
    );
    return userDTO(user);
  },
  lockUser(
    viewer: User,
    userId: string,
    body: LockUserInput,
    expectedVersion: string | null,
  ) {
    requireAdmin(viewer, "USERS_MANAGE");
    const user = requireUser(userId);
    requireVersion(expectedVersion, user);
    protectLastAdmin(user);
    if (user.id === viewer.id)
      throw new ApiError(403, "SELF_LOCK", "Không được tự khóa tài khoản.");
    if (user.status === "LOCKED")
      throw new ApiError(409, "ALREADY_LOCKED", "Tài khoản đã được khóa.");
    const ownsActive = db.projects.some(
      (p) => p.ownerId === user.id && ["PLANNED", "ACTIVE"].includes(p.status),
    );
    const hasTasks = db.tasks.some(
      (t) =>
        t.assigneeId === user.id &&
        !["COMPLETED", "CANCELLED"].includes(t.status),
    );
    if (body.mode === "NORMAL" && (ownsActive || hasTasks))
      throw new ApiError(
        409,
        "HANDOVER_REQUIRED",
        "Cần bàn giao công việc và trách nhiệm dự án trước khi khóa thông thường.",
      );
    user.status = "LOCKED";
    revokeUserSessions(user.id);
    touch(user);
    audit(
      viewer.id,
      "USER",
      user.id,
      "Khóa tài khoản",
      { status: "ACTIVE" },
      { status: "LOCKED", mode: body.mode },
      body.reason,
    );
    return userDTO(user);
  },
  unlockUser(
    viewer: User,
    userId: string,
    body: UnlockUserInput,
    expectedVersion: string | null,
  ) {
    requireAdmin(viewer, "USERS_MANAGE");
    const user = requireUser(userId);
    requireVersion(expectedVersion, user);
    if (user.status !== "LOCKED")
      throw new ApiError(409, "NOT_LOCKED", "Tài khoản đang hoạt động.");
    user.status = "ACTIVE";
    touch(user);
    audit(
      viewer.id,
      "USER",
      user.id,
      "Mở khóa",
      { status: "LOCKED" },
      { status: "ACTIVE" },
      body.reason,
    );
    return userDTO(user);
  },
  resetUserPassword(
    viewer: User,
    userId: string,
    body: ResetUserPasswordInput,
    expectedVersion: string | null,
  ) {
    requireAdmin(viewer, "USERS_MANAGE");
    const user = requireUser(userId);
    requireVersion(expectedVersion, user);
    db.passwords.set(user.id, body.temporaryPassword);
    revokeUserSessions(user.id);
    touch(user);
    audit(
      viewer.id,
      "USER",
      user.id,
      "Cấp lại mật khẩu",
      null,
      { sessionsRevoked: true },
      body.reason,
    );
    return { ok: true };
  },
};
