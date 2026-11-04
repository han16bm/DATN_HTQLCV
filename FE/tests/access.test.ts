import type { SessionDto } from "@/features/auth/types/auth.types";
import {
  canAdminister,
  canVisit,
  hasAnyPermission,
  hasPermission,
} from "@/lib/auth/access";
import { describe, expect, it } from "vitest";

function session(
  permissions: SessionDto["permissions"],
  projectAccess: SessionDto["projectAccess"] = [],
  isSysAdmin = false,
): SessionDto {
  return {
    user: {
      id: "u-test",
      version: 1,
      avatarUrl: null,
      displayName: "Người thử",
      username: "test",
      email: "test@example.test",
      unitId: "unit-product",
      unit: { id: "unit-product", name: "Phòng sản phẩm" },
      isSysAdmin,
      groups: [],
    },
    permissions,
    projectAccess,
  };
}
const leader = (projectId: string): SessionDto["projectAccess"][number] => ({
  projectId,
  permissions: [
    "PROJECT_MANAGE",
    "TASKS_MANAGE",
    "TASKS_REVIEW",
    "ANALYTICS_VIEW",
  ],
});

describe("effective permissions by scope", () => {
  it("never grants anything without a session", () => {
    expect(hasPermission(null, "USERS_MANAGE")).toBe(false);
    expect(hasPermission(undefined, "TASKS_MANAGE", "p-1")).toBe(false);
    expect(canVisit(null, "/workspace")).toBe(false);
    expect(canAdminister(undefined)).toBe(false);
  });

  it("keeps project permissions inside their own project", () => {
    const manager = session(["PROJECT_CREATE"], [leader("p-1")]);
    expect(hasPermission(manager, "TASKS_REVIEW", "p-1")).toBe(true);
    expect(hasPermission(manager, "TASKS_REVIEW", "p-2")).toBe(false);
    // Không có projectId nghĩa là phạm vi hệ thống, không nhìn vào dự án.
    expect(hasPermission(manager, "TASKS_REVIEW")).toBe(false);
    expect(hasAnyPermission(manager, "TASKS_REVIEW")).toBe(true);
    expect(hasPermission(manager, "PROJECT_CREATE")).toBe(true);
  });

  it("does not let account administration read, edit or review a project", () => {
    const admin = session(["USERS_MANAGE", "ORGANIZATION_MANAGE"]);
    expect(canAdminister(admin)).toBe(true);
    for (const permission of [
      "PROJECT_MANAGE",
      "MEMBERS_MANAGE",
      "TASKS_MANAGE",
      "TASKS_REVIEW",
      "ALERTS_MANAGE",
      "ANALYTICS_VIEW",
    ] as const) {
      expect(hasPermission(admin, permission, "p-1")).toBe(false);
      expect(hasAnyPermission(admin, permission)).toBe(false);
    }
  });

  it("applies only read-only system analytics to every project", () => {
    const viewer = session(["ANALYTICS_VIEW", "TASKS_REVIEW"]);
    expect(hasPermission(viewer, "ANALYTICS_VIEW", "p-9")).toBe(true);
    // Quyền ghi/nghiệm thu cấp ở hệ thống không tự áp cho từng dự án.
    expect(hasPermission(viewer, "TASKS_REVIEW", "p-9")).toBe(false);
  });

  it("does not trust the sysadmin flag for permissions", () => {
    const relabelled = session([], [leader("p-1")], true);
    expect(canAdminister(relabelled)).toBe(false);
    expect(canVisit(relabelled, "/admin/users")).toBe(false);
    const employee = session([], [{ projectId: "p-1", permissions: [] }]);
    expect(hasPermission(employee, "PROJECT_MANAGE", "p-1")).toBe(false);
    expect(canVisit(employee, "/projects/p-1/edit")).toBe(false);
  });
});

describe("route access", () => {
  const admin = session(["USERS_MANAGE", "ORGANIZATION_MANAGE"]);
  const accounts = session(["USERS_MANAGE"]);
  const leaderSession = session(["PROJECT_CREATE"], [leader("p-1")]);
  const member = session([], [{ projectId: "p-1", permissions: [] }]);

  it("opens administration routes by their own permission", () => {
    expect(canVisit(admin, "/admin")).toBe(true);
    expect(canVisit(admin, "/admin/users/u-1")).toBe(true);
    expect(canVisit(admin, "/admin/organization/new")).toBe(true);
    expect(canVisit(accounts, "/admin/teams")).toBe(false);
    expect(canVisit(accounts, "/admin/users")).toBe(true);
    expect(canVisit(leaderSession, "/admin")).toBe(false);
  });

  it("guards each new administration module by its own permission", () => {
    const cases = [
      [
        "PERMISSIONS_MANAGE",
        [
          "/admin/permission-groups",
          "/admin/permission-groups/pg-1",
          "/admin/features",
        ],
      ],
      ["AUDIT_VIEW", ["/admin/audit-logs"]],
      ["JOBS_MANAGE", ["/admin/jobs"]],
      ["SETTINGS_MANAGE", ["/admin/settings", "/admin/ip-whitelist"]],
    ] as const;
    for (const [permission, paths] of cases) {
      const only = session([permission]);
      // Mọi mã trong nhóm ADMIN đều mở được khu quản trị và trang tổng quan.
      expect(canAdminister(only), permission).toBe(true);
      expect(canVisit(only, "/admin"), permission).toBe(true);
      expect(canVisit(only, "/admin/users"), permission).toBe(false);
      for (const path of paths) {
        expect(canVisit(only, path), path).toBe(true);
        expect(canVisit(admin, path), path).toBe(false);
      }
    }
    expect(canAdminister(session(["PROJECT_CREATE", "ANALYTICS_VIEW"]))).toBe(
      false,
    );
  });

  it("opens analytics, review and form routes only for matching permissions", () => {
    for (const path of ["/dashboard", "/analytics/risks"]) {
      expect(canVisit(leaderSession, path)).toBe(true);
      expect(canVisit(member, path)).toBe(false);
      expect(canVisit(admin, path)).toBe(false);
    }
    // Cảnh báo là thông báo cá nhân: ai đăng nhập cũng mở được, BE lọc theo người nhận
    expect(canVisit(member, "/alerts/a-1")).toBe(true);
    expect(canVisit(leaderSession, "/reviews")).toBe(true);
    expect(canVisit(member, "/reviews")).toBe(false);
    expect(canVisit(leaderSession, "/projects/new")).toBe(true);
    expect(canVisit(admin, "/projects/new")).toBe(false);
    expect(canVisit(leaderSession, "/projects/p-1/edit")).toBe(true);
    expect(canVisit(member, "/projects/p-1/tasks/new")).toBe(false);
    expect(canVisit(member, "/tasks/t-1/edit")).toBe(false);
  });

  it("keeps ordinary work pages open to every signed-in member", () => {
    for (const path of [
      "/workspace",
      "/projects",
      "/projects/p-1",
      "/projects/p-1/tasks",
      "/projects/p-1/members",
      "/tasks",
      "/tasks/t-1/history",
      "/reports/new",
      "/profile",
      "/users/u-1",
    ])
      expect(canVisit(member, path), path).toBe(true);
  });
});
