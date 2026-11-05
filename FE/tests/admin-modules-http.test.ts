import { auditLogsService } from "@/features/audit-logs/api/audit-logs.service";
import { authService } from "@/features/auth/api/auth.service";
import { ipWhitelistService } from "@/features/ip-whitelist/api/ip-whitelist.service";
import { jobsService } from "@/features/jobs/api/jobs.service";
import { organizationService } from "@/features/organization/api/organization.service";
import { permissionsService } from "@/features/permissions/api/permissions.service";
import { settingsService } from "@/features/settings/api/settings.service";
import { usersService } from "@/features/users/api/users.service";
import { db } from "@/mocks/db";
import { resetMockState, server } from "@/mocks/node";
import { registerRefresh, token } from "@/services/api-client";
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
  await login("admin");
});
const key = () => crypto.randomUUID();
const login = (username: string) =>
  authService.login({ username, password: "Mock@12345" });
const permissionsOf = async (userId: string) =>
  usersService.getUserPermissions(userId);
const setPermissions = async (
  userId: string,
  change: Partial<Parameters<typeof usersService.updateUserPermissions>[1]>,
) => {
  const current = await permissionsOf(userId);
  return usersService.updateUserPermissions(
    userId,
    {
      isSysAdmin: current.isSysAdmin,
      groupIds: current.groups.map((g) => g.id),
      grantedFeatures: current.grantedFeatures,
      revokedFeatures: current.revokedFeatures,
      reason: "Kiểm thử phân quyền",
      ...change,
    },
    { version: current.version, key: key() },
  );
};

describe("dynamic RBAC via HTTP/MSW", () => {
  it("migrates seed users and computes effective permissions from flags, groups and overrides", async () => {
    const admin = await authService.getSession();
    expect(admin.user).toMatchObject({
      isSysAdmin: true,
      groups: [{ id: "pg-admin", label: "Quản trị viên" }],
    });
    expect(admin.user).not.toHaveProperty("systemRole");
    expect(admin.permissions).toEqual([
      "USERS_MANAGE",
      "ORGANIZATION_MANAGE",
      "PERMISSIONS_MANAGE",
      "AUDIT_VIEW",
      "SETTINGS_MANAGE",
      "JOBS_MANAGE",
      "PROJECT_CREATE",
      "ANALYTICS_VIEW",
    ]);
    expect((await login("minh")).permissions).toEqual(["PROJECT_CREATE"]);
    expect((await login("lan")).permissions).toEqual([]);
    await login("admin");
    await setPermissions("u-lan", { grantedFeatures: ["AUDIT_VIEW"] });
    await setPermissions("u-pm", { revokedFeatures: ["PROJECT_CREATE"] });
    expect((await login("lan")).permissions).toEqual(["AUDIT_VIEW"]);
    const pm = await login("minh");
    expect(pm.permissions).toEqual([]);
    // Vai trò quản lý trong dự án cần PROJECT_CREATE hiệu lực.
    expect(
      pm.projectAccess.find((p) => p.projectId === "p-main")?.permissions,
    ).toEqual([]);
  });

  it("removes a disabled feature from everyone including sysadmins and rejects unsafe feature toggles", async () => {
    const features = await permissionsService.listFeatures();
    const analytics = features.find((f) => f.code === "ANALYTICS_VIEW")!;
    await permissionsService.updateFeature(
      analytics.code,
      { isActive: false, reason: "Tạm dừng phân tích" },
      { version: analytics.version, key: key() },
    );
    expect((await authService.getSession()).permissions).not.toContain(
      "ANALYTICS_VIEW",
    );
    for (const code of ["ADMIN", "PERMISSIONS_MANAGE"]) {
      const feature = features.find((f) => f.code === code)!;
      await expect(
        permissionsService.updateFeature(
          code,
          { isActive: false, reason: "Thử tắt" },
          { version: feature.version, key: key() },
        ),
      ).rejects.toMatchObject({ status: 422, code: "BUSINESS_RULE" });
    }
  });

  it("keeps at least one active sysadmin and lets only sysadmins change the flag", async () => {
    await expect(
      setPermissions("u-admin", { isSysAdmin: false }),
    ).rejects.toMatchObject({ status: 422, code: "BUSINESS_RULE" });
    await setPermissions("u-lan", { isSysAdmin: true });
    expect(
      (await setPermissions("u-admin", { isSysAdmin: false })).isSysAdmin,
    ).toBe(false);
    await login("lan");
    const admin = await usersService.getUser("u-lan");
    await expect(
      usersService.lockUser(
        admin.id,
        { mode: "EMERGENCY", reason: "Khóa sysadmin cuối" },
        { version: admin.version, key: key() },
      ),
    ).rejects.toMatchObject({ status: 422, code: "BUSINESS_RULE" });
  });

  it("blocks privilege escalation by a non-sysadmin permission manager", async () => {
    Object.assign(
      db.users.find((u) => u.id === "u-pm")!,
      {
        grantedFeatures: ["PERMISSIONS_MANAGE", "USERS_MANAGE"],
      },
    );
    await login("minh");
    for (const change of [
      { grantedFeatures: ["AUDIT_VIEW"] },
      { groupIds: ["pg-admin"] },
      { isSysAdmin: true },
    ])
      await expect(setPermissions("u-lan", change)).rejects.toMatchObject({
        status: 403,
        code: "FORBIDDEN",
      });
    // Mã chính người thao tác đang có thì được cấp.
    const granted = await setPermissions("u-lan", {
      grantedFeatures: ["PROJECT_CREATE"],
    });
    expect(granted.effective).toEqual(["PROJECT_CREATE"]);
    const admins = await permissionsService.getPermissionGroup("pg-admin");
    await expect(
      permissionsService.replacePermissionGroupMembers(
        admins.id,
        { memberIds: [...admins.memberIds, "u-lan"] },
        { version: admins.version, key: key() },
      ),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      permissionsService.createPermissionGroup(
        {
          code: "AUDITORS",
          name: "Kiểm toán",
          features: ["AUDIT_VIEW"],
          memberIds: [],
        },
        { key: key() },
      ),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      usersService.createUser(
        {
          username: "escalated",
          displayName: "Leo thang",
          email: "escalated@example.test",
          unitId: "unit-product",
          groupIds: ["pg-admin"],
          initialPassword: "Start@12345",
        },
        { key: key() },
      ),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("creates, edits and deactivates groups while protecting system groups", async () => {
    let group = await permissionsService.createPermissionGroup(
      {
        code: "AUDITORS",
        name: "Kiểm toán",
        features: ["AUDIT_VIEW"],
        memberIds: ["u-lan"],
      },
      { key: key() },
    );
    expect(group.members).toEqual([{ id: "u-lan", label: "Trần Lan" }]);
    await expect(
      permissionsService.createPermissionGroup(
        { code: "AUDITORS", name: "Trùng", features: [], memberIds: [] },
        { key: key() },
      ),
    ).rejects.toMatchObject({ status: 409 });
    expect((await login("lan")).permissions).toEqual(["AUDIT_VIEW"]);
    await login("admin");
    group = await permissionsService.deactivatePermissionGroup(
      group.id,
      { reason: "Hết nhu cầu" },
      { version: group.version, key: key() },
    );
    expect(group.status).toBe("INACTIVE");
    expect((await login("lan")).permissions).toEqual([]);
    await login("admin");
    const system = await permissionsService.getPermissionGroup("pg-pm");
    await expect(
      permissionsService.deactivatePermissionGroup(
        system.id,
        { reason: "Thử" },
        { version: system.version, key: key() },
      ),
    ).rejects.toMatchObject({ status: 422, code: "BUSINESS_RULE" });
    const users = await usersService.listUsers({ groupId: "pg-pm" });
    expect(users.items.map((u) => u.id).sort()).toEqual(["u-other", "u-pm"]);
  });

  it("opens cross-module lookups to the permissions listed in the contract", async () => {
    Object.assign(
      db.users.find((u) => u.id === "u-admin")!,
      {
        isSysAdmin: false,
        revokedFeatures: [
          "USERS_MANAGE",
          "ORGANIZATION_MANAGE",
          "AUDIT_VIEW",
          "SETTINGS_MANAGE",
          "JOBS_MANAGE",
        ],
      },
    );
    await login("admin");
    expect((await usersService.listUsers({})).items.length).toBeGreaterThan(0);
    await expect(organizationService.listUnits({})).rejects.toMatchObject({
      status: 403,
    });
    await expect(auditLogsService.listAuditLogs({})).rejects.toMatchObject({
      status: 403,
    });
  });
});

describe("audit logs, jobs, settings and IP whitelist via HTTP/MSW", () => {
  it("lists audit logs newest first with filters and before/after detail", async () => {
    await setPermissions("u-lan", { grantedFeatures: ["AUDIT_VIEW"] });
    const list = await auditLogsService.listAuditLogs({ entityType: "USER" });
    expect(list.items[0]).toMatchObject({
      action: "Cập nhật phân quyền",
      entityId: "u-lan",
      actor: { id: "u-admin", label: "Quản trị hệ thống" },
    });
    const detail = await auditLogsService.getAuditLog(list.items[0].id);
    expect(detail.after).toMatchObject({ grantedFeatures: ["AUDIT_VIEW"] });
    expect(
      (await auditLogsService.listAuditLogs({ q: "phân quyền" })).items.length,
    ).toBe(1);
    expect(await auditLogsService.listEntityTypes()).toContain("TASK");
    await login("huy");
    await expect(auditLogsService.listAuditLogs({})).rejects.toMatchObject({
      status: 403,
    });
  });

  it("runs a job now, records the run and refuses a concurrent run", async () => {
    const [job] = await jobsService.listJobs();
    const run = await jobsService.runJob(job.code, { key: key() });
    expect(run).toMatchObject({
      status: "SUCCEEDED",
      trigger: "MANUAL",
      triggeredBy: { id: "u-admin" },
      durationMs: 0,
    });
    expect(Object.keys(run.summary!).sort()).toEqual([
      "created",
      "deactivated",
      "updated",
    ]);
    const runs = await jobsService.listJobRuns(job.code, {});
    expect(runs.items[0].id).toBe(run.id);
    expect(
      (await jobsService.listJobRuns(job.code, { status: "FAILED" })).items,
    ).toHaveLength(1);
    db.backgroundJobs[0].lastStatus = "RUNNING";
    await expect(
      jobsService.runJob(job.code, { key: key() }),
    ).rejects.toMatchObject({ status: 409, code: "CONFLICT" });
    const latest = (await jobsService.listJobs())[0];
    expect(latest.version).toBe(job.version);
    const updated = await jobsService.updateJob(
      job.code,
      { isEnabled: false, reason: "Bảo trì" },
      { version: latest.version, key: key() },
    );
    expect(updated).toMatchObject({ isEnabled: false, nextRunAt: null });
    await expect(
      jobsService.updateJob(
        job.code,
        { intervalMinutes: 5 },
        { version: latest.version, key: key() },
      ),
    ).rejects.toMatchObject({ status: 412 });
  });

  it("validates central configuration values, keys and protected rows", async () => {
    const all = await settingsService.listSettings();
    expect(all).toHaveLength(6);
    const identity = await settingsService.listSettings({
      serviceType: "Identity.Api",
    });
    expect(identity.map((s) => s.key).sort()).toEqual([
      "Auth:MaxFailedAttempts",
      "Jwt:AccessTokenHours",
    ]);
    const attempts = all.find((s) => s.key === "Auth:MaxFailedAttempts")!;
    expect(attempts).toMatchObject({ known: true, minValue: 3, maxValue: 20 });
    await expect(
      settingsService.updateSetting(
        attempts.id,
        { value: "50", reason: "Quá giới hạn" },
        { version: attempts.version, key: key() },
      ),
    ).rejects.toMatchObject({
      status: 422,
      fields: [{ path: ["value"] }],
    });
    const log = all.find((s) => s.key === "Serilog:MinimumLevel")!;
    await expect(
      settingsService.updateSetting(
        log.id,
        { value: "Loud", reason: "Sai giá trị" },
        { version: log.version, key: key() },
      ),
    ).rejects.toMatchObject({ status: 422 });
    const issuer = all.find((s) => s.key === "Jwt:Issuer")!;
    await expect(
      settingsService.updateSetting(
        issuer.id,
        { isActive: false, reason: "Thử tắt" },
        { version: issuer.version, key: key() },
      ),
    ).rejects.toMatchObject({ status: 422, code: "BUSINESS_RULE" });
    const saved = await settingsService.updateSetting(
      attempts.id,
      { value: "7", reason: "Siết đăng nhập" },
      { version: attempts.version, key: key() },
    );
    expect(saved).toMatchObject({
      value: "7",
      updatedBy: { id: "u-admin" },
      version: attempts.version + 1,
    });
    const custom = {
      key: "Features:BetaReports",
      serviceType: "Global" as const,
      group: "FEATURES",
      name: "Báo cáo thử nghiệm",
      dataType: "BOOL" as const,
      value: "true",
    };
    expect(
      await settingsService.createSetting(custom, { key: key() }),
    ).toMatchObject({ known: false, requiresRestart: false });
    await expect(
      settingsService.createSetting(custom, { key: key() }),
    ).rejects.toMatchObject({ status: 409, code: "CONFLICT" });
    for (const forbidden of ["ConnectionStrings:Main", "Smtp:Password"])
      await expect(
        settingsService.createSetting(
          { ...custom, key: forbidden, dataType: "STRING" },
          { key: key() },
        ),
      ).rejects.toMatchObject({ status: 422, fields: [{ path: ["key"] }] });
  });

  it("toggles the whitelist through its setting and rejects self-lockout", async () => {
    let state = await ipWhitelistService.getIpWhitelist();
    expect(state).toMatchObject({ enabled: false, currentIp: "127.0.0.1" });
    const local = state.entries.find((e) => e.cidr === "127.0.0.1")!;
    // Tắt dòng duy nhất khớp IP hiện tại rồi bật whitelist thì tự khóa.
    const disabled = await ipWhitelistService.updateIpWhitelistEntry(
      local.id,
      { isActive: false },
      { version: local.version, key: key() },
    );
    await expect(
      settingsService.updateSetting(
        state.settingId,
        { value: "true", reason: "Bật whitelist" },
        { version: state.settingVersion, key: key() },
      ),
    ).rejects.toMatchObject({ status: 422, code: "BUSINESS_RULE" });
    await ipWhitelistService.updateIpWhitelistEntry(
      local.id,
      { isActive: true },
      { version: disabled.version, key: key() },
    );
    await settingsService.updateSetting(
      state.settingId,
      { value: "true", reason: "Bật whitelist" },
      { version: state.settingVersion, key: key() },
    );
    state = await ipWhitelistService.getIpWhitelist();
    expect(state.enabled).toBe(true);
    const current = state.entries.find((e) => e.id === local.id)!;
    await expect(
      ipWhitelistService.deleteIpWhitelistEntry(current.id, {
        version: current.version,
        key: key(),
      }),
    ).rejects.toMatchObject({ status: 422, code: "BUSINESS_RULE" });
    await expect(
      ipWhitelistService.updateIpWhitelistEntry(
        current.id,
        { cidr: "10.9.9.9" },
        { version: current.version, key: key() },
      ),
    ).rejects.toMatchObject({ status: 422 });
    const extra = await ipWhitelistService.createIpWhitelistEntry(
      { cidr: "127.0.0.0/8", description: "Loopback" },
      { key: key() },
    );
    await ipWhitelistService.deleteIpWhitelistEntry(current.id, {
      version: current.version,
      key: key(),
    });
    expect(
      (await ipWhitelistService.getIpWhitelist()).entries.map((e) => e.id),
    ).toContain(extra.id);
    await expect(
      ipWhitelistService.createIpWhitelistEntry(
        { cidr: "not-an-ip" },
        { key: key() },
      ),
    ).rejects.toMatchObject({ status: 422 });
  });

  it("rejects admin calls from an IP outside an enabled whitelist with the caller IP", async () => {
    db.settings.find(
      (s) => s.key === "Security:AdminIpWhitelistEnabled",
    )!.value = "true";
    for (const entry of db.ipWhitelist) entry.isActive = false;
    await expect(usersService.listUsers({})).rejects.toMatchObject({
      status: 403,
      code: "IP_NOT_ALLOWED",
      details: { ip: "127.0.0.1" },
    });
    // Hồ sơ công khai không thuộc khu quản trị.
    expect((await usersService.getProfile("u-lan")).groups).toEqual([]);
  });
});

describe("created/updated stamps on administration records", () => {
  const admin = { id: "u-admin", label: "Quản trị hệ thống" };
  const minh = { id: "u-pm", label: "Nguyễn Minh" };
  it("seeds organization data as created by u-admin and stamps the editor on update", async () => {
    let unit = await organizationService.getUnit("unit-product");
    expect(unit).toMatchObject({ createdBy: admin, updatedBy: admin });
    Object.assign(
      db.users.find((u) => u.id === "u-pm")!,
      {
        grantedFeatures: ["ORGANIZATION_MANAGE", "USERS_MANAGE"],
      },
    );
    await login("minh");
    unit = await organizationService.updateUnit(
      unit.id,
      { name: "Phòng sản phẩm mới", reason: "Đổi tên" },
      { version: unit.version, key: key() },
    );
    expect(unit).toMatchObject({ createdBy: admin, updatedBy: minh });
    const team = await organizationService.createTeam(
      { name: "Nhóm dấu vết", unitId: "unit-product", memberIds: [] },
      { key: key() },
    );
    expect(team).toMatchObject({ createdBy: minh, updatedBy: minh });
    const user = await usersService.updateUser(
      "u-lan",
      { displayName: "Lan đã sửa" },
      {
        version: (await usersService.getUser("u-lan")).version,
        key: key(),
      },
    );
    expect(user).toMatchObject({ createdBy: admin, updatedBy: minh });
  });
  it("stamps permission groups, features, settings, IP entries and jobs", async () => {
    let group = await permissionsService.getPermissionGroup("pg-pm");
    expect(group).toMatchObject({ createdBy: admin, updatedBy: admin });
    const features = await permissionsService.listFeatures();
    const audit = features.find((f) => f.code === "AUDIT_VIEW")!;
    expect(audit.updatedBy).toBeNull();
    expect(
      await permissionsService.updateFeature(
        audit.code,
        { isActive: false, reason: "Tạm tắt" },
        { version: audit.version, key: key() },
      ),
    ).toMatchObject({ updatedBy: admin });
    group = await permissionsService.updatePermissionGroup(
      group.id,
      { name: "Leader/PM" },
      { version: group.version, key: key() },
    );
    expect(group.updatedBy).toEqual(admin);
    const created = await settingsService.createSetting(
      {
        key: "Features:Stamp",
        serviceType: "Global",
        group: "FEATURES",
        name: "Dấu vết",
        dataType: "BOOL",
        value: "false",
      },
      { key: key() },
    );
    expect(created).toMatchObject({ createdBy: admin, updatedBy: admin });
    const [seeded] = await settingsService.listSettings({ q: "Jwt:Issuer" });
    expect(seeded.createdBy).toBeNull();
    const entry = await ipWhitelistService.createIpWhitelistEntry(
      { cidr: "10.1.1.1" },
      { key: key() },
    );
    expect(entry).toMatchObject({ createdBy: admin, updatedBy: admin });
    const [job] = await jobsService.listJobs();
    expect(job.updatedBy).toBeNull();
    await jobsService.runJob(job.code, { key: key() });
    // Chạy job không đổi người sửa cấu hình job.
    expect((await jobsService.listJobs())[0].updatedBy).toBeNull();
    expect(
      await jobsService.updateJob(
        job.code,
        { intervalMinutes: 30 },
        { version: job.version, key: key() },
      ),
    ).toMatchObject({ updatedBy: admin });
  });
  it("marks alerts generated by a manual job run as created by Hệ thống", async () => {
    db.alerts.length = 0;
    const [job] = await jobsService.listJobs();
    const run = await jobsService.runJob(job.code, { key: key() });
    expect(run.summary?.created).toBeGreaterThan(0);
    expect(db.alerts.every((a) => a.createdBy === "SYSTEM")).toBe(true);
  });
});

describe("project roles of a person and session revocation (ADMIN_MODULES §11)", () => {
  it("lists every project a leader holds with the role and effective permissions there", async () => {
    const projects = await usersService.listUserProjects("u-pm");
    const active = projects.filter((p) => !p.endedAt);
    // Một Leader giữ vai trò ở nhiều dự án; quyền tính theo từng dự án.
    expect(active.length).toBeGreaterThan(1);
    expect(active.every((p) => p.projectRole !== "MEMBER")).toBe(true);
    expect(active[0].permissions).toContain("TASKS_MANAGE");
    const member = await usersService.listUserProjects("u-lan");
    expect(member.every((p) => p.permissions.length === 0)).toBe(true);
    // Mất PROJECT_CREATE thì vai trò quản lý không còn quyền (fail-closed).
    await setPermissions("u-pm", { groupIds: [] });
    const demoted = await usersService.listUserProjects("u-pm");
    expect(demoted.every((p) => p.permissions.length === 0)).toBe(true);
    await login("lan");
    await expect(usersService.listUserProjects("u-pm")).rejects.toMatchObject({
      status: 403,
    });
  });
  it("revokes another account's sessions without locking it and refuses self", async () => {
    await login("minh");
    const minhToken = token.get();
    await login("admin");
    await usersService.revokeUserSessions(
      "u-pm",
      { reason: "Máy bị mất" },
      { key: key() },
    );
    token.set(minhToken);
    await expect(authService.getSession()).rejects.toMatchObject({
      status: 401,
    });
    // Tài khoản vẫn hoạt động: đăng nhập lại được.
    await expect(login("minh")).resolves.toMatchObject({
      user: expect.objectContaining({ id: "u-pm" }),
    });
    await login("admin");
    await expect(
      usersService.revokeUserSessions(
        "u-admin",
        { reason: "Tự thu hồi" },
        { key: key() },
      ),
    ).rejects.toMatchObject({ status: 422, code: "BUSINESS_RULE" });
  });
});
