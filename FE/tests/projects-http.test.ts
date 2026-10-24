import { authService } from "@/features/auth/api/auth.service";
import { projectMembersService } from "@/features/project-members/api/project-members.service";
import { projectsService } from "@/features/projects/api/projects.service";
import { tasksService } from "@/features/tasks/api/tasks.service";
import { usersService } from "@/features/users/api/users.service";
import { db } from "@/mocks/db/database";
import { server } from "@/mocks/node";
import { resetMockState } from "@/mocks/reset";
import { registerRefresh, token } from "@/services/auth-session";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
beforeAll(() => {
  process.env.NEXT_PUBLIC_API_ORIGIN = "http://gateway.test";
  server.listen({ onUnhandledRequest: "error" });
});
afterAll(() => {
  server.close();
  delete process.env.NEXT_PUBLIC_API_ORIGIN;
});
beforeEach(async () => {
  server.resetHandlers();
  resetMockState();
  token.set(null);
  registerRefresh(null);
  await login("minh");
});
const login = (username: string) =>
  authService.login({ username, password: "Mock@12345" });
const key = () => crypto.randomUUID();
const newPlan = () => ({
  code: "NEW_PROJECT",
  name: "Dự án mới",
  objective: "Kiểm tra vòng đời dự án",
  unitId: "unit-product",
  ownerId: "u-pm",
  startDate: "2026-10-24",
  dueAt: "2026-12-01T10:00:00.000Z",
});
describe("S08–S14 projects and memberships", () => {
  it("creates an owner membership and activates then closes an empty project", async () => {
    let project = await projectsService.createProject(newPlan(), {
      key: key(),
    });
    expect(project.status).toBe("PLANNED");
    const members = await projectMembersService.listProjectMembers(
      project.id,
      {},
    );
    expect(members.items[0]).toMatchObject({
      userId: "u-pm",
      projectRole: "OWNER",
    });
    await expect(
      tasksService.createTask(
        project.id,
        {
          title: "Chưa triển khai",
          acceptanceCriteria: "Đạt",
          priority: "NORMAL",
          dueAt: "2026-11-01T10:00:00.000Z",
          estimatedMinutes: 60,
        },
        {
          key: key(),
        },
      ),
    ).rejects.toMatchObject({ code: "PROJECT_NOT_ACTIVE" });
    project = await projectsService.activateProject(project.id, {
      version: project.version,
      key: key(),
    });
    expect(project.status).toBe("ACTIVE");
    expect(
      (await projectsService.getProjectClosureChecks(project.id)).canClose,
    ).toBe(true);
    project = await projectsService.completeProject(project.id, {
      version: project.version,
      key: key(),
    });
    expect(project.status).toBe("COMPLETED");
    await expect(
      projectsService.updateProject(
        project.id,
        { name: "Không mở lại", changeReason: "Thử" },
        {
          version: project.version,
          key: key(),
        },
      ),
    ).rejects.toMatchObject({ code: "PROJECT_READ_ONLY" });
  });
  it("coalesces simultaneous requests with the same idempotency key", async () => {
    const request = { body: newPlan(), key: key() };
    const [a, b] = await Promise.all([
      projectsService.createProject(request.body, {
        key: request.key,
      }),
      projectsService.createProject(request.body, {
        key: request.key,
      }),
    ]);
    expect(a.id).toBe(b.id);
    expect(db.projects.filter((p) => p.code === "NEW_PROJECT")).toHaveLength(1);
  });
  it("checks task deadlines, pending review, draft reports and required-report fixture", async () => {
    const p = await projectsService.getProject("p-main");
    await expect(
      projectsService.updateProject(
        p.id,
        { dueAt: "2026-10-24T10:00:00.000Z", changeReason: "Rút ngắn" },
        {
          version: p.version,
          key: key(),
        },
      ),
    ).rejects.toMatchObject({ code: "TASK_DUE_EXCEEDS_PROJECT" });
    await expect(
      projectsService.completeProject(p.id, {
        version: p.version,
        key: key(),
      }),
    ).rejects.toMatchObject({ code: "PROJECT_HAS_PENDING_WORK" });
    expect(
      (await projectsService.getProjectClosureChecks(p.id)).pendingReviewCount,
    ).toBe(1);
    const plan = await projectsService.createProject(newPlan(), {
      key: key(),
    });
    db.requiredReports.set(plan.id, 1);
    await expect(
      projectsService.cancelProject(
        plan.id,
        { reason: "Dừng" },
        {
          version: plan.version,
          key: key(),
        },
      ),
    ).rejects.toMatchObject({ code: "PROJECT_HAS_PENDING_WORK" });
  });
  it("creates members without project permissions, validates grants and keeps membership history", async () => {
    await login("admin");
    const user = await usersService.createUser(
      {
        username: "project.user",
        displayName: "Thành viên mới",
        email: "project.user@example.test",
        unitId: "unit-product",
        systemRole: "EMPLOYEE",
        initialPassword: "Start@12345",
      },
      {
        key: key(),
      },
    );
    await login("minh");
    let member = await projectMembersService.addProjectMember(
      "p-main",
      { userId: user.id, projectRole: "MEMBER", permissions: [] },
      {
        key: key(),
      },
    );
    expect(member.permissions).toEqual([]);
    await expect(
      projectMembersService.updateProjectMemberPermissions(
        "p-main",
        member.id,
        {
          projectRole: "MANAGER",
          permissions: ["USERS_MANAGE"],
          reason: "Thử vượt quyền",
        },
        {
          version: member.version,
          key: key(),
        },
      ),
    ).rejects.toMatchObject({ code: "PERMISSION_ESCALATION" });
    member = await projectMembersService.updateProjectMemberPermissions(
      "p-main",
      member.id,
      {
        projectRole: "MEMBER",
        permissions: ["TASKS_REVIEW"],
        reason: "Ủy quyền nghiệm thu",
      },
      {
        version: member.version,
        key: key(),
      },
    );
    expect(member.permissions).toEqual(["TASKS_REVIEW"]);
    member = await projectMembersService.endProjectMembership(
      "p-main",
      member.id,
      { reason: "Kết thúc tham gia" },
      {
        version: member.version,
        key: key(),
      },
    );
    expect(member.endedAt).not.toBeNull();
    expect(db.members.some((m) => m.id === member.id)).toBe(true);
  });
  it("blocks ending the owner or someone still responsible for open work and checks scope", async () => {
    const list = await projectMembersService.listProjectMembers("p-main", {});
    const owner = list.items.find((m) => m.userId === "u-pm")!;
    const lan = list.items.find((m) => m.userId === "u-lan")!;
    await expect(
      projectMembersService.endProjectMembership(
        "p-main",
        owner.id,
        { reason: "Thử" },
        {
          version: owner.version,
          key: key(),
        },
      ),
    ).rejects.toMatchObject({ code: "OWNER_REQUIRED" });
    await expect(
      projectMembersService.endProjectMembership(
        "p-main",
        lan.id,
        { reason: "Thử" },
        {
          version: lan.version,
          key: key(),
        },
      ),
    ).rejects.toMatchObject({ code: "HANDOVER_REQUIRED" });
    await login("other");
    await expect(projectsService.getProject("p-main")).rejects.toMatchObject({
      status: 403,
    });
  });
});
