import { authService } from "@/features/auth/api/auth.service";
import { organizationService } from "@/features/organization/api/organization.service";
import { usersService } from "@/features/users/api/users.service";
import type { ProfileDto } from "@/features/users/types/users.types";
import { createRequestTickets } from "@/lib/query/mutation-requests";
import { db } from "@/mocks/db";
import { resetMockState, server } from "@/mocks/node";
import { apiClient, registerRefresh, token } from "@/services/api-client";
import { QueryClient } from "@tanstack/react-query";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});
afterAll(() => {
  server.close();
});
beforeEach(async () => {
  server.resetHandlers();
  resetMockState();
  token.set(null);
  registerRefresh(null);
  await authService.login({ username: "admin", password: "Mock@12345" });
});
const key = () => crypto.randomUUID();

describe("Member profiles via HTTP/MSW", () => {
  it("lets signed-in employees read minimal profile data without admin access", async () => {
    await authService.login({ username: "lan", password: "Mock@12345" });
    const response = await apiClient.get<ProfileDto>("/users/u-lan/profile");
    const profile = response.data;
    expect(Object.keys(profile).sort()).toEqual([
      "avatarUrl",
      "displayName",
      "email",
      "id",
      "systemRole",
      "unit",
    ]);
    expect(profile).toMatchObject({
      displayName: "Trần Lan",
      unit: "Phòng sản phẩm",
      email: "lan@example.test",
    });
    await expect(usersService.getUser("u-lan")).rejects.toMatchObject({
      status: 403,
    });
  });

  it("lets employees read contact details across units without granting project access", async () => {
    const profile = await usersService.getProfile("u-other");
    await authService.login({ username: "lan", password: "Mock@12345" });
    const outside = await usersService.getProfile("u-other");
    expect(outside).toEqual(profile);
    expect(outside.displayName).toBe("Người dùng dự án khác");
    expect(outside.email).toBeTruthy();
    await expect(apiClient.get("/projects/p-other")).rejects.toMatchObject({
      status: 403,
    });
  });

  it("rejects pagination and filters that no longer belong to the profile resource", async () => {
    for (const params of [
      { unitId: "unit-other" },
      { page: 1 },
      { pageSize: 20 },
    ]) {
      await expect(
        apiClient.get("/users/u-pm/profile", { params }),
      ).rejects.toMatchObject({ status: 422 });
    }
  });

  it("requires authentication and handles unavailable member profiles", async () => {
    for (const id of ["missing-user", "u-locked"]) {
      await expect(usersService.getProfile(id)).rejects.toMatchObject({
        status: 404,
      });
    }
    token.set(null);
    await expect(usersService.getProfile("u-lan")).rejects.toMatchObject({
      status: 401,
    });
  });
});

describe("Personal profile via HTTP/MSW", () => {
  it("returns personal and employment details only from the viewer's private profile", async () => {
    const session = await authService.login({ username: "lan", password: "Mock@12345" });
    const profile = await authService.getProfile();
    expect(profile).toMatchObject({
      displayName: "Trần Lan", gender: "FEMALE", birthDate: "1997-08-21",
      phone: "0912345678", permanentAddress: "Hải Phòng", temporaryAddress: "Hà Nội",
      systemRole: "EMPLOYEE", unit: "Phòng sản phẩm",
      teams: [{ id: "team-main", name: "Nhóm phát triển" }],
      projects: [{ id: "p-main", name: "Cổng quản lý nội bộ" }],
    });
    const publicProfile = await usersService.getProfile("u-lan");
    await authService.login({ username: "admin", password: "Mock@12345" });
    const row = (await usersService.listUsers()).items.find((user) => user.id === "u-lan");
    for (const field of ["gender", "birthDate", "phone", "permanentAddress", "temporaryAddress", "position", "teams", "projects"]) {
      expect(session.user).not.toHaveProperty(field);
      expect(publicProfile).not.toHaveProperty(field);
      expect(row).not.toHaveProperty(field);
    }
  });

  it("saves all editable personal fields, allows clearing them and protects assigned affiliations", async () => {
    const session = await authService.login({ username: "lan", password: "Mock@12345" });
    const updated = await authService.updateProfile({
      gender: "OTHER", birthDate: "1996-02-29", phone: "+84 912 345 678",
      permanentAddress: "  Đà Nẵng  ", temporaryAddress: "Hà Nội",
    }, { key: key(), version: session.user.version });
    expect(await authService.getProfile()).toMatchObject({
      gender: "OTHER", birthDate: "1996-02-29", phone: "+84 912 345 678",
      permanentAddress: "Đà Nẵng", temporaryAddress: "Hà Nội",
    });
    for (const field of ["teams", "projects", "unitId", "systemRole", "position"]) {
      const form = new FormData();
      form.set(field, "changed");
      await expect(apiClient.patch("/auth/me", form, { headers: {
        "If-Match": `"${updated.user.version}"`, "Idempotency-Key": key(),
      } })).rejects.toMatchObject({ status: 422 });
    }
    await authService.updateProfile({ gender: null, birthDate: null, phone: null, permanentAddress: null, temporaryAddress: null },
      { key: key(), version: updated.user.version });
    expect(await authService.getProfile()).toMatchObject({ gender: null, birthDate: null, phone: null, permanentAddress: null, temporaryAddress: null });
  });

  it("derives current groups and projects without including inactive groups or ended membership", async () => {
    await authService.login({ username: "lan", password: "Mock@12345" });
    db.teams[0].status = "INACTIVE";
    const member = db.members.find((member) => member.projectId === "p-main" && member.userId === "u-lan")!;
    member.endedAt = new Date().toISOString();
    expect(await authService.getProfile()).toMatchObject({ teams: [], projects: [] });
  });

  it.each(["COMPLETED", "CANCELLED"] as const)("omits %s projects from current affiliations", async (status) => {
    await authService.login({ username: "lan", password: "Mock@12345" });
    db.projects.find((project) => project.id === "p-main")!.status = status;
    expect((await authService.getProfile()).projects).toEqual([]);
  });

  it.each([
    { gender: "UNKNOWN" }, { birthDate: "2999-01-01" }, { birthDate: "2001-02-29" },
    { phone: "abc123" }, { phone: "123" }, { permanentAddress: "x".repeat(501) },
    { position: "Leader" },
  ])("rejects invalid personal data atomically: %j", async (payload) => {
    const before = await authService.getProfile();
    const form = new FormData();
    form.set("displayName", "Không được lưu");
    for (const [name, value] of Object.entries(payload)) form.set(name, value);
    await expect(apiClient.patch("/auth/me", form, { headers: {
      "If-Match": `"${before.version}"`, "Idempotency-Key": key(),
    } })).rejects.toMatchObject({ status: 422 });
    expect(await authService.getProfile()).toEqual(before);
  });

  it("requires authentication and refuses targeting a different private profile by query", async () => {
    await expect(apiClient.get("/auth/me/profile", { params: { userId: "u-lan" } })).rejects.toMatchObject({ status: 422 });
    token.set(null);
    await expect(authService.getProfile()).rejects.toMatchObject({ status: 401 });
  });

  it("returns the same personal fields in administrator details and saves their edits without exposing them in the list", async () => {
    const user = await usersService.getUser("u-lan");
    expect(user).toMatchObject({ gender: "FEMALE", phone: "0912345678", systemRole: "EMPLOYEE", teams: [{ id: "team-main" }], projects: [{ id: "p-main" }] });
    const updated = await usersService.updateUser(user.id, {
      gender: "OTHER", birthDate: "1994-10-12", phone: "0987654321", permanentAddress: "Cần Thơ", temporaryAddress: "Đà Nẵng",
    }, { key: key(), version: user.version });
    expect(updated).toMatchObject({ gender: "OTHER", birthDate: "1994-10-12", phone: "0987654321", permanentAddress: "Cần Thơ", temporaryAddress: "Đà Nẵng" });
    expect(updated.teams).toEqual(user.teams);
    expect(updated.projects).toEqual(user.projects);
    expect((await usersService.listUsers()).items.find((item) => item.id === user.id)).not.toHaveProperty("birthDate");
  });

  it("keeps position derived from systemRole and rejects an independently editable position even for admins", async () => {
    const user = await usersService.getUser("u-lan");
    expect(user).not.toHaveProperty("position");
    expect(db.users.find((item) => item.id === user.id)).not.toHaveProperty("position");
    await expect(apiClient.patch(`/users/${user.id}`, { position: "Admin", displayName: "Không được lưu" }, {
      headers: { "If-Match": `"${user.version}"`, "Idempotency-Key": key() },
    })).rejects.toMatchObject({ status: 422 });
    expect((await usersService.getUser(user.id)).displayName).toBe(user.displayName);
    await usersService.updateUser(user.id, { systemRole: "MANAGER", reason: "Giao vai trò leader" }, { key: key(), version: user.version });
    await authService.login({ username: "lan", password: "Mock@12345" });
    const profile = await authService.getProfile();
    expect(profile.systemRole).toBe("MANAGER");
    expect(profile).not.toHaveProperty("position");
  });

  it("edits only the signed-in profile and keeps email and organization unchanged", async () => {
    const adminName = db.users.find(
      (user) => user.id === "u-admin",
    )?.displayName;
    const session = await authService.login({
      username: "lan",
      password: "Mock@12345",
    });
    const result = await authService.updateProfile(
      { displayName: "Lan Nguyễn" },
      { key: key(), version: session.user.version },
    );
    expect(result.user).toMatchObject({
      id: session.user.id,
      username: session.user.username,
      displayName: "Lan Nguyễn",
      email: session.user.email,
      unitId: session.user.unitId,
      systemRole: session.user.systemRole,
      version: session.user.version + 1,
      avatarUrl: null,
    });
    expect((await authService.getSession()).user).toEqual(result.user);
    expect(db.users.find((user) => user.id === "u-admin")?.displayName).toBe(
      adminName,
    );
    await expect(
      authService.login({ username: "lan.profile", password: "Mock@12345" }),
    ).rejects.toMatchObject({ status: 401 });
    expect(
      (
        await authService.login({
          username: "lan",
          password: "Mock@12345",
        })
      ).user.id,
    ).toBe(session.user.id);
  });

  it("rejects username changes, protected fields and stale versions", async () => {
    const session = await authService.getSession();
    const payload = { displayName: "Tên mới" };
    for (const [field, value] of [
      ["username", "renamed.user"],
      ["email", "new@example.test"],
      ["systemRole", "EMPLOYEE"],
      ["unitId", "unit-other"],
      ["userId", "u-lan"],
    ]) {
      const form = new FormData();
      Object.entries(payload).forEach(([name, value]) => form.set(name, value));
      form.set(field, value);
      await expect(
        apiClient.patch("/auth/me", form, {
          headers: {
            "If-Match": `"${session.user.version}"`,
            "Idempotency-Key": key(),
          },
        }),
      ).rejects.toMatchObject({ status: 422 });
    }
    await authService.updateProfile(payload, {
      key: key(),
      version: session.user.version,
    });
    await expect(
      authService.updateProfile(
        { ...payload, displayName: "Bản cũ" },
        { key: key(), version: session.user.version },
      ),
    ).rejects.toMatchObject({ status: 412 });
    expect((await authService.getSession()).user.displayName).toBe("Tên mới");
  });

  it("uploads an avatar, serves its bytes and replaces it without retaining old images", async () => {
    const session = await authService.getSession();
    const avatar = new Blob(
      [
        Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aRZkAAAAASUVORK5CYII=",
          "base64",
        ),
      ],
      { type: "image/png" },
    );
    const payload = { avatar };
    const options = { key: key(), version: session.user.version };
    const updated = await authService.updateProfile(payload, options);
    const replay = await authService.updateProfile(payload, options);
    expect(replay).toEqual(updated);
    expect(db.avatars.size).toBe(1);
    expect(updated.user.avatarUrl).toMatch(/^\/api\/avatars\//);
    expect(updated.user.username).toBe(session.user.username);
    expect(updated.user.displayName).toBe(session.user.displayName);
    const image = await fetch(`http://gateway.test${updated.user.avatarUrl}`);
    expect(image.status).toBe(200);
    expect(image.headers.get("content-type")).toBe("image/png");
    expect(new Uint8Array(await image.arrayBuffer())).toEqual(
      new Uint8Array(await avatar.arrayBuffer()),
    );
    expect((await usersService.getUser(session.user.id)).avatarUrl).toBe(
      updated.user.avatarUrl,
    );
    const replaced = await authService.updateProfile(payload, {
      key: key(),
      version: updated.user.version,
    });
    expect(replaced.user.avatarUrl).not.toBe(updated.user.avatarUrl);
    expect(db.avatars.size).toBe(1);
    expect(
      (await fetch(`http://gateway.test${updated.user.avatarUrl}`)).status,
    ).toBe(404);
  });

  it.each([
    new Blob(["<svg></svg>"], { type: "image/svg+xml" }),
    new Blob([new Uint8Array(2 * 1024 ** 2 + 1)], { type: "image/png" }),
    new Blob(["not an image"], { type: "image/png" }),
  ])("rejects invalid avatar uploads atomically", async (avatar) => {
    const session = await authService.getSession();
    await expect(
      authService.updateProfile(
        {
          displayName: "Không được lưu",
          avatar,
        },
        { key: key(), version: session.user.version },
      ),
    ).rejects.toMatchObject({ status: 422 });
    expect((await authService.getSession()).user).toEqual(session.user);
    expect(db.avatars.size).toBe(0);
  });

  it("requires a valid session to edit a profile", async () => {
    token.set(null);
    await expect(
      authService.updateProfile(
        { displayName: "Không được lưu" },
        { key: key(), version: 1 },
      ),
    ).rejects.toMatchObject({ status: 401 });
    await expect(
      authService.changePassword(
        { currentPassword: "Mock@12345", newPassword: "New@12345" },
        { key: key() },
      ),
    ).rejects.toMatchObject({ status: 401 });
  });
  it("accepts a profile patch without unrelated fields and rejects an empty patch", async () => {
    const session = await authService.getSession();
    await expect(
      authService.updateProfile(
        {},
        { key: key(), version: session.user.version },
      ),
    ).rejects.toMatchObject({ status: 422 });
    const result = await authService.updateProfile(
      { displayName: "Tên hiển thị mới" },
      { key: key(), version: session.user.version },
    );
    expect(result.user).toMatchObject({
      username: session.user.username,
      displayName: "Tên hiển thị mới",
      email: session.user.email,
    });
  });
  it("verifies the current password, changes only the viewer and replays the same attempt safely", async () => {
    await authService.login({ username: "lan", password: "Mock@12345" });
    await expect(
      authService.changePassword(
        { currentPassword: "Wrong@12345", newPassword: " New@12345 " },
        { key: key() },
      ),
    ).rejects.toMatchObject({ status: 422, code: "WRONG_PASSWORD" });
    const body = { currentPassword: "Mock@12345", newPassword: " New@12345 " };
    const options = { key: key() };
    expect(await authService.changePassword(body, options)).toEqual({
      ok: true,
    });
    expect(await authService.changePassword(body, options)).toEqual({
      ok: true,
    });
    expect(db.passwords.get("u-admin")).toBe("Mock@12345");
    expect(JSON.stringify(db.audits)).not.toContain(body.newPassword);
    expect(
      db.audits.filter((audit) => audit.action === "Đổi mật khẩu"),
    ).toHaveLength(1);
    await expect(
      authService.login({ username: "lan", password: "Mock@12345" }),
    ).rejects.toMatchObject({ status: 401 });
    await expect(
      authService.login({ username: "lan", password: "New@12345" }),
    ).rejects.toMatchObject({ status: 401 });
    expect(
      (await authService.login({ username: "lan", password: body.newPassword }))
        .user.id,
    ).toBe("u-lan");
  });
  it("rejects weak, unchanged and extra password fields", async () => {
    for (const body of [
      { currentPassword: "", newPassword: "New@12345" },
      { currentPassword: "Mock@12345", newPassword: "short" },
      { currentPassword: "Mock@12345", newPassword: "Mock@12345" },
      {
        currentPassword: "Mock@12345",
        newPassword: "New@12345",
        confirmPassword: "New@12345",
      },
      {
        currentPassword: "Mock@12345",
        newPassword: "New@12345",
        userId: "u-lan",
      },
    ])
      await expect(
        authService.changePassword(body, { key: key() }),
      ).rejects.toMatchObject({ status: 422 });
    expect(db.passwords.get("u-admin")).toBe("Mock@12345");
    expect(db.passwords.get("u-lan")).toBe("Mock@12345");
  });
});
describe("S03–S07 administration via HTTP/MSW", () => {
  it("creates, filters, edits, locks and unlocks a user without returning a password", async () => {
    let user = await usersService.createUser(
      {
        username: "new.member",
        displayName: "Nhân viên mới",
        email: " NEW@example.test ",
        systemRole: "EMPLOYEE",
        unitId: "unit-product",
        initialPassword: "Start@12345",
      },
      {
        key: key(),
      },
    );
    expect(user.email).toBe("new@example.test");
    expect(user).not.toHaveProperty("initialPassword");
    expect(
      (await usersService.listUsers({ q: "new.member" })).items.map(
        (u) => u.id,
      ),
    ).toEqual([user.id]);
    user = await usersService.updateUser(
      user.id,
      { displayName: "Đã cập nhật" },
      {
        version: user.version,
        key: key(),
      },
    );
    user = await usersService.lockUser(
      user.id,
      { mode: "NORMAL", reason: "Tạm khóa" },
      {
        version: user.version,
        key: key(),
      },
    );
    expect(user.status).toBe("LOCKED");
    user = await usersService.unlockUser(
      user.id,
      { reason: "Cho phép truy cập" },
      {
        version: user.version,
        key: key(),
      },
    );
    expect(user.status).toBe("ACTIVE");
    expect(JSON.stringify(db.audits)).not.toContain("Start@12345");
  });
  it("rejects duplicate identities, protected admin actions and stale updates", async () => {
    await expect(
      usersService.createUser(
        {
          username: "lan",
          displayName: "Trùng",
          email: "unique@example.test",
          unitId: "unit-product",
          systemRole: "EMPLOYEE",
          initialPassword: "Start@12345",
        },
        {
          key: key(),
        },
      ),
    ).rejects.toMatchObject({ status: 409, code: "DUPLICATE_USERNAME" });
    const admin = await usersService.getUser("u-admin");
    await expect(
      usersService.lockUser(
        admin.id,
        { mode: "EMERGENCY", reason: "Kiểm tra bảo vệ" },
        {
          version: admin.version,
          key: key(),
        },
      ),
    ).rejects.toMatchObject({ status: 409, code: "LAST_ADMIN" });
    const lan = await usersService.getUser("u-lan");
    await usersService.updateUser(
      lan.id,
      { displayName: "Lan cập nhật" },
      {
        version: lan.version,
        key: key(),
      },
    );
    await expect(
      usersService.updateUser(
        lan.id,
        { displayName: "Bản cũ" },
        {
          version: lan.version,
          key: key(),
        },
      ),
    ).rejects.toMatchObject({ status: 412 });
  });
  it("requires handover for normal lock and permanently revokes previous access tokens", async () => {
    await authService.login({ username: "lan", password: "Mock@12345" });
    const oldToken = token.get();
    await authService.login({ username: "admin", password: "Mock@12345" });
    const lan = await usersService.getUser("u-lan");
    await expect(
      usersService.lockUser(
        lan.id,
        { mode: "NORMAL", reason: "Nghỉ việc" },
        {
          version: lan.version,
          key: key(),
        },
      ),
    ).rejects.toMatchObject({ code: "HANDOVER_REQUIRED" });
    const locked = await usersService.lockUser(
      lan.id,
      { mode: "EMERGENCY", reason: "Khóa khẩn cấp" },
      {
        version: lan.version,
        key: key(),
      },
    );
    await usersService.unlockUser(
      lan.id,
      { reason: "Khôi phục tài khoản" },
      {
        version: locked.version,
        key: key(),
      },
    );
    token.set(oldToken);
    await expect(authService.getSession()).rejects.toMatchObject({
      status: 401,
    });
    await authService.login({ username: "lan", password: "Mock@12345" });
    expect(token.get()).not.toBe(oldToken);
    expect(db.tasks.find((t) => t.id === "t-3")?.assigneeId).toBe("u-lan");
  });
  it("resets a password separately, revokes sessions and keeps audits free of credentials", async () => {
    const user = await usersService.getUser("u-lan");
    await usersService.resetUserPassword(
      user.id,
      {
        temporaryPassword: " Replaced@12345 ",
        reason: "Cấp lại theo yêu cầu",
      },
      {
        version: user.version,
        key: key(),
      },
    );
    await expect(
      authService.login({ username: "lan", password: "Replaced@12345" }),
    ).rejects.toMatchObject({ status: 401 });
    await authService.login({ username: "lan", password: " Replaced@12345 " });
    expect(JSON.stringify(db.audits)).not.toContain("Replaced@12345");
  });
  it("enforces unit trees and prevents deactivation while resources remain active", async () => {
    const child = await organizationService.createUnit(
      { name: "Đơn vị con", parentId: "unit-product", managerId: null },
      {
        key: key(),
      },
    );
    const parent = await organizationService.getUnit("unit-product");
    await expect(
      organizationService.updateUnit(
        parent.id,
        { parentId: child.id, reason: "Thử chu trình" },
        {
          version: parent.version,
          key: key(),
        },
      ),
    ).rejects.toMatchObject({ code: "UNIT_CYCLE" });
    await expect(
      organizationService.deactivateUnit(
        parent.id,
        { reason: "Ngừng" },
        {
          version: parent.version,
          key: key(),
        },
      ),
    ).rejects.toMatchObject({ code: "UNIT_IN_USE" });
    expect(
      (
        await organizationService.deactivateUnit(
          child.id,
          { reason: "Không còn nhu cầu" },
          {
            version: child.version,
            key: key(),
          },
        )
      ).status,
    ).toBe("INACTIVE");
  });
  it("validates team membership independently of project memberships and checks versions", async () => {
    const count = db.members.length;
    let team = await organizationService.createTeam(
      {
        name: "Nhóm thử nghiệm",
        unitId: "unit-product",
        memberIds: ["u-lan"],
      },
      {
        key: key(),
      },
    );
    await expect(
      organizationService.replaceTeamMembers(
        team.id,
        { memberIds: ["u-other"], reason: "Thử khác đơn vị" },
        {
          version: team.version,
          key: key(),
        },
      ),
    ).rejects.toMatchObject({ code: "INVALID_TEAM_MEMBER" });
    team = await organizationService.replaceTeamMembers(
      team.id,
      { memberIds: ["u-huy"], reason: "Điều chỉnh" },
      {
        version: team.version,
        key: key(),
      },
    );
    expect(team.memberIds).toEqual(["u-huy"]);
    expect(db.members).toHaveLength(count);
    expect(
      (
        await organizationService.deactivateTeam(
          team.id,
          { reason: "Kết thúc nhóm" },
          {
            version: team.version,
            key: key(),
          },
        )
      ).status,
    ).toBe("INACTIVE");
  });
  it("denies administration to an employee through HTTP", async () => {
    await authService.login({ username: "lan", password: "Mock@12345" });
    await expect(usersService.listUsers({})).rejects.toMatchObject({
      status: 403,
    });
    await expect(organizationService.listUnits({})).rejects.toMatchObject({
      status: 403,
    });
  });
  it("stores only an opaque mutation ticket in React Query and releases sensitive payloads", async () => {
    const client = new QueryClient();
    const requests = createRequestTickets((body: { password: string }) =>
      Promise.resolve({ ok: body.password === "Private@12345" }),
    );
    const ticket = requests.put({ password: "Private@12345" });
    const mutation = client
      .getMutationCache()
      .build(client, { mutationFn: requests.execute });
    await mutation.execute(ticket);
    expect(mutation.state.data).toEqual({ ok: true });
    expect(JSON.stringify(mutation.state)).not.toContain("Private@12345");
    await expect(requests.execute(ticket)).rejects.toThrow(
      "Yêu cầu đã kết thúc.",
    );
    client.clear();
  });
});
