import { authService } from "@/features/auth/api/auth.service";
import { organizationService } from "@/features/organization/api/organization.service";
import { usersService } from "@/features/users/api/users.service";
import { createRequestTickets } from "@/lib/query/mutation-requests";
import { db } from "@/mocks/db";
import { resetMockState, server } from "@/mocks/node";
import { registerRefresh, token } from "@/services/api-client";
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
