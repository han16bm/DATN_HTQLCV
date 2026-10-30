import { analyticsService } from "@/features/analytics/api/analytics.service";
import { authService } from "@/features/auth/api/auth.service";
import { projectMembersService } from "@/features/project-members/api/project-members.service";
import { projectsService } from "@/features/projects/api/projects.service";
import { submissionsService } from "@/features/submissions/api/submissions.service";
import { tasksService } from "@/features/tasks/api/tasks.service";
import { timeLogsService } from "@/features/time-logs/api/time-logs.service";
import { usersService } from "@/features/users/api/users.service";
import { db, setClock } from "@/mocks/db";
import { resetMockState, server } from "@/mocks/node";
import { apiClient, registerRefresh, token } from "@/services/api-client";
import { shouldRetryQuery } from "@/services/http-error";
import { ApiError, ContractError } from "@/types/api/error";
import axios from "axios";
import { http, HttpResponse } from "msw";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});
afterAll(() => {
  server.close();
});
beforeEach(() => {
  server.resetHandlers();
  resetMockState();
  token.set(null);
  registerRefresh(null);
});
async function signIn(username: string) {
  return authService.login({ username, password: "Mock@12345" });
}
describe("Feature service → Axios HTTP → MSW → mock database", () => {
  it("uses the unversioned API and delays both successful and failed mock responses", async () => {
    expect(apiClient.defaults.baseURL).toBe("http://gateway.test/api");
    await signIn("minh");
    vi.stubEnv("NEXT_PUBLIC_MSW_DELAY", "40");
    try {
      let started = performance.now();
      await tasksService.getTask("t-3");
      expect(performance.now() - started).toBeGreaterThanOrEqual(35);
      started = performance.now();
      await expect(tasksService.getTask("missing-task")).rejects.toMatchObject({
        status: 404,
      });
      expect(performance.now() - started).toBeGreaterThanOrEqual(35);
    } finally {
      vi.unstubAllEnvs();
    }
  });
  it("projects history with readable people and only compared fields while preserving internal audit facts", async () => {
    await signIn("admin");
    const user = await usersService.getUser("u-huy");
    await usersService.updateUser(
      user.id,
      { systemRole: "MANAGER", reason: "Bổ nhiệm quản lý dự án" },
      { version: user.version, key: "promote-owner" },
    );
    await signIn("minh");
    const project = await projectsService.getProject("p-main");
    await projectsService.updateProject(
      project.id,
      { ownerId: "u-huy", changeReason: "Đổi người phụ trách" },
      { version: project.version, key: "history-owner-change" },
    );
    const result = await apiClient.get<{
      items: {
        actor: { displayName: string };
        before: object;
        after: object;
        action: string;
      }[];
    }>(`/projects/${project.id}/history`);
    const audit = result.data.items.find(
      (item) => item.action === "Điều chỉnh kế hoạch",
    )!;
    expect(audit.actor.displayName).toBe("Nguyễn Minh");
    expect(audit).not.toHaveProperty("actorId");
    expect(audit.before).toEqual({
      owner: { id: "u-pm", displayName: "Nguyễn Minh" },
    });
    expect(audit.after).toEqual({
      owner: { id: "u-huy", displayName: "Nguyễn Huy" },
    });
    expect(
      db.audits.find((item) => item.action === "Điều chỉnh kế hoạch")?.before,
    ).toMatchObject({ ownerId: "u-pm", name: project.name });
  });
  it("sends compact list rows over HTTP before the client parses the response", async () => {
    const check = async (path: string, fields: string[]) => {
      const response = await apiClient.get<{
        items: Record<string, unknown>[];
      }>(path);
      expect(Object.keys(response.data).sort(), path).toEqual([
        "items",
        "pagination",
      ]);
      expect(response.data.items.length, path).toBeGreaterThan(0);
      for (const item of response.data.items) {
        expect(Object.keys(item).sort(), path).toEqual(fields.toSorted());
      }
    };
    await signIn("admin");
    await check("/users", [
      "id",
      "username",
      "displayName",
      "email",
      "avatarUrl",
      "unitId",
      "systemRole",
      "status",
      "unit",
    ]);
    await check("/units", ["id", "name", "status"]);
    await check("/teams", ["id", "name", "unit", "status", "memberCount"]);
    await signIn("minh");
    await check("/projects", [
      "id",
      "name",
      "startDate",
      "dueAt",
      "status",
      "owner",
      "unit",
    ]);
    await check("/tasks", [
      "id",
      "title",
      "status",
      "priority",
      "dueAt",
      "firstStartedAt",
      "isOverdue",
      "project",
      "assignee",
    ]);
    await check("/reports", [
      "id",
      "project",
      "periodType",
      "periodStart",
      "status",
      "author",
      "totalMinutes",
    ]);
    await check("/tasks/t-4/submissions", [
      "id",
      "sequence",
      "submitter",
      "submittedAt",
      "status",
    ]);
    await check("/review-queue", [
      "id",
      "taskId",
      "taskTitle",
      "sequence",
      "submitter",
      "submittedAt",
      "dueAtSnapshot",
    ]);
    await check("/alerts", [
      "id",
      "type",
      "taskTitle",
      "severity",
      "status",
      "conditionActive",
    ]);
  });
  it("keeps private model facts out of session, attachment and task responses", async () => {
    await signIn("lan");
    const session = await apiClient.get<{
      user: object;
      projectAccess: object[];
    }>("/auth/me");
    expect(Object.keys(session.data.user).sort()).toEqual([
      "avatarUrl",
      "displayName",
      "email",
      "id",
      "systemRole",
      "unit",
      "unitId",
      "username",
      "version",
    ]);
    expect(Object.keys(session.data.projectAccess[0]).sort()).toEqual([
      "permissions",
      "projectId",
      "projectRole",
    ]);
    const file = await apiClient.get<object>("/attachments/a-criteria");
    expect(Object.keys(file.data).sort()).toEqual([
      "filename",
      "id",
      "sizeBytes",
      "status",
    ]);
    expect(
      db.attachments.find((item) => item.id === "a-criteria"),
    ).toMatchObject({
      taskId: "t-3",
      uploadedBy: "u-lan",
      mimeType: "application/pdf",
    });
    const task = await apiClient.get<Record<string, unknown>>("/tasks/t-3");
    for (const field of ["updatedAt", "statusChangedAt", "completedAt"]) {
      expect(task.data).not.toHaveProperty(field);
      expect(db.tasks.find((item) => item.id === "t-3")).toHaveProperty(field);
    }
    const storedTask = db.tasks.find((item) => item.id === "t-3")!;
    expect(task.data).toMatchObject({
      id: "t-3",
      version: 1,
      createdAt: storedTask.createdAt,
      firstStartedAt: storedTask.firstStartedAt,
    });
    await signIn("minh");
    const scope = {
      projectId: "p-main",
      from: "2026-10-01",
      to: "2026-10-23",
      assigneeId: "u-lan",
    };
    const dashboard = await analyticsService.getDashboard(scope);
    const snapshot = await apiClient.get<{
      snapshot: { scope: object };
    }>(`/analytics/details/${dashboard.overviewRef.analysisId}`);
    expect(Object.keys(snapshot.data.snapshot.scope).sort()).toEqual([
      "from",
      "projectId",
      "to",
    ]);
    const stored = db.details.get(dashboard.overviewRef.analysisId)!;
    expect(stored.snapshot.scope.assigneeId).toBe("u-lan");
    for (const field of ["sourceRevision", "subject", "expiresAt"]) {
      expect(snapshot.data.snapshot).not.toHaveProperty(field);
      expect(stored.snapshot).toHaveProperty(field);
    }
  });
  it("projects current task hours and overdue state without storing duplicate counters", async () => {
    await signIn("lan");
    const before = await tasksService.getTask("t-3");
    const log = db.timeLogs.find(
      (item) =>
        item.taskId === before.id &&
        item.userId === "u-lan" &&
        item.status === "ACTIVE",
    )!;
    const result = await timeLogsService.voidTimeLog(
      log.id,
      { reason: "Loại nhật ký ghi trùng" },
      {
        version: log.version,
        key: "projection-void",
      },
    );
    expect(result.task.actualMinutes).toBe(before.actualMinutes - log.minutes);
    const stored = structuredClone(
      db.tasks.find((item) => item.id === before.id)!,
    );
    expect(stored).not.toHaveProperty("actualMinutes");
    expect(stored).not.toHaveProperty("isOverdue");
    setClock(before.dueAt);
    await signIn("lan");
    expect((await tasksService.getTask(before.id)).isOverdue).toBe(false);
    setClock(new Date(Date.parse(before.dueAt) + 1).toISOString());
    expect((await tasksService.getTask(before.id)).isOverdue).toBe(true);
    expect(db.tasks.find((item) => item.id === before.id)).toEqual(stored);
  });
  it("uses the same paging and query whitelist for collections and subresources", async () => {
    await signIn("minh");
    const lists = [
      (query: { page?: number; pageSize?: number }) =>
        tasksService.listTasks(query),
      (query: { page?: number; pageSize?: number }) =>
        projectMembersService.listProjectMembers("p-main", query),
      (query: { page?: number; pageSize?: number }) =>
        analyticsService.listAnalyticsFilterOptions({
          kind: "PROJECT",
          ...query,
        }),
    ];
    for (const list of lists) {
      expect((await list({})).pagination).toMatchObject({
        page: 1,
        pageSize: 20,
      });
      const result = await list({ page: 2, pageSize: 1 });
      expect(result.pagination).toMatchObject({ page: 2, pageSize: 1 });
      expect(result.items.length).toBeLessThanOrEqual(1);
      for (const query of [{ page: 0 }, { page: 1.5 }, { pageSize: 101 }]) {
        await expect(list(query)).rejects.toMatchObject({
          status: 422,
          code: "VALIDATION_ERROR",
        });
      }
      const unsupported = { page: 1, slug: "p-main" };
      await expect(list(unsupported)).rejects.toMatchObject({
        status: 422,
        code: "VALIDATION_ERROR",
      });
    }
    const people = await analyticsService.listAnalyticsFilterOptions({
      kind: "PERSON",
      projectId: "  p-main  ",
    });
    expect(people.items.length).toBeGreaterThan(0);
    for (const projectId of ["   ", "x".repeat(101)]) {
      await expect(
        analyticsService.listAnalyticsFilterOptions({
          kind: "PERSON",
          projectId,
        }),
      ).rejects.toMatchObject({ status: 422, code: "VALIDATION_ERROR" });
    }
  });
  it("refreshes once for concurrent 401 responses and replays with the new bearer", async () => {
    await signIn("lan");
    const old = token.get()!;
    db.sessionExpiry.set(old, "2026-10-01T00:00:00.000Z");
    let refreshes = 0;
    const headers: (string | null)[] = [];
    const observe = ({ request }: { request: Request }) => {
      if (new URL(request.url).pathname.startsWith("/api/tasks"))
        headers.push(request.headers.get("Authorization"));
    };
    server.events.on("request:start", observe);
    registerRefresh(async () => {
      refreshes++;
      await new Promise((resolve) => setTimeout(resolve, 25));
      await authService.refreshSession();
    });
    try {
      const [first, list, second] = await Promise.all([
        tasksService.getTask("t-3"),
        tasksService.listTasks(),
        tasksService.getTask("t-3"),
      ]);
      expect(first.id).toBe(second.id);
      expect(list.items.length).toBeGreaterThan(0);
      expect(refreshes).toBe(1);
      expect(token.get()).not.toBe(old);
      expect(
        headers.filter((header) => header === `Bearer ${old}`),
      ).toHaveLength(3);
      expect(
        headers.filter((header) => header === `Bearer ${token.get()}`),
      ).toHaveLength(3);
    } finally {
      server.events.removeListener("request:start", observe);
    }
  });
  it("stops after one refresh when the replay is still unauthorized", async () => {
    await signIn("lan");
    db.revoked.add(token.get()!);
    let refreshes = 0;
    registerRefresh(async () => {
      refreshes++;
      token.set("invalid-token");
    });
    await expect(tasksService.getTask("t-3")).rejects.toMatchObject({
      status: 401,
      code: "UNAUTHORIZED",
    });
    expect(refreshes).toBe(1);
  });
  it("preserves cancellation without classifying it as a retryable network error", async () => {
    await signIn("lan");
    const controller = new AbortController();
    let begin = () => {};
    const started = new Promise<void>((resolve) => {
      begin = resolve;
    });
    const observe = ({ request }: { request: Request }) => {
      if (new URL(request.url).pathname === "/api/tasks") begin();
    };
    server.events.on("request:start", observe);
    try {
      const request = tasksService
        .listTasks({}, { scenario: "slow", signal: controller.signal })
        .catch((error: unknown) => error);
      await started;
      controller.abort();
      const error = await request;
      expect(axios.isCancel(error)).toBe(true);
      expect(error).not.toHaveProperty("config");
      expect(error).not.toHaveProperty("request");
      expect(shouldRetryQuery(0, error)).toBe(false);
    } finally {
      server.events.removeListener("request:start", observe);
    }
  });
  it("normalizes transport failures for the query retry policy", async () => {
    await signIn("lan");
    server.use(http.get("*/api/tasks/t-3", () => HttpResponse.error()));
    const error = await tasksService
      .getTask("t-3")
      .catch((error: unknown) => error);
    expect(error).toMatchObject({ status: 0, code: "NETWORK_ERROR" });
    expect(shouldRetryQuery(0, error)).toBe(true);
    expect(shouldRetryQuery(1, error)).toBe(false);
  });
  it("rejects extra payload fields at the HTTP boundary without writing mock data", async () => {
    await signIn("minh");
    const count = db.tasks.length;
    const payload = {
      title: "Công việc kiểm tra whitelist",
      acceptanceCriteria: "Chỉ nhận các trường trong API",
      priority: "NORMAL" as const,
      dueAt: "2026-10-30T10:00:00.000Z",
      estimatedMinutes: 60,
      adminOnly: true,
    };
    let posts = 0;
    const observe = ({ request }: { request: Request }) => {
      if (
        request.method === "POST" &&
        new URL(request.url).pathname === "/api/projects/p-main/tasks"
      )
        posts++;
    };
    server.events.on("request:start", observe);
    try {
      await expect(
        tasksService.createTask("p-main", payload, { key: "invalid-fields" }),
      ).rejects.toMatchObject({ status: 422, code: "VALIDATION_ERROR" });
      expect(posts).toBe(1);
      expect(db.tasks).toHaveLength(count);
    } finally {
      server.events.removeListener("request:start", observe);
    }
  });
  it("uses the configured public Gateway and real HTTP request metadata", async () => {
    const requests: {
      url: string;
      method: string;
      authorization: string | null;
    }[] = [];
    const observe = ({ request }: { request: Request }) => {
      requests.push({
        url: request.url,
        method: request.method,
        authorization: request.headers.get("Authorization"),
      });
    };
    server.events.on("request:start", observe);
    try {
      await signIn("lan");
      await tasksService.listTasks({
        overdue: false,
        page: 1,
        pageSize: 20,
        sort: "dueAt",
      });
      const sent = requests.find(
        (r) => new URL(r.url).pathname === "/api/tasks",
      );
      expect(sent).toMatchObject({
        method: "GET",
        authorization: `Bearer ${token.get()}`,
      });
      expect(new URL(sent!.url).origin).toBe("http://gateway.test");
      expect(Object.fromEntries(new URL(sent!.url).searchParams)).toEqual({
        page: "1",
        pageSize: "20",
        overdue: "false",
        sort: "dueAt",
      });
    } finally {
      server.events.removeListener("request:start", observe);
    }
  });
  it("does not let an account administrator read projects by role, and read-only analytics access never grants mutations", async () => {
    await signIn("admin");
    await expect(tasksService.getTask("t-3")).rejects.toMatchObject({
      status: 403,
    });
    db.permissionGroups[0].memberIds.push("u-admin");
    await signIn("admin");
    const task = await tasksService.getTask("t-3");
    expect(task.id).toBe("t-3");
    await expect(
      tasksService.cancelTask(
        task.id,
        { reason: "Kiểm tra quyền" },
        { version: task.version, key: "admin-denied-write" },
      ),
    ).rejects.toMatchObject({
      status: 403,
      code: "FORBIDDEN",
    });
  });
  it("normalizes 401 and preserves password whitespace", async () => {
    await expect(
      authService.login({ username: "lan", password: " Mock@12345" }),
    ).rejects.toMatchObject({ status: 401, code: "INVALID_CREDENTIALS" });
    expect(token.get()).toBeNull();
  });
  it("returns session data without caching access credentials in Query results", async () => {
    const session = await signIn("lan");
    expect(session.user.id).toBe("u-lan");
    expect(session).not.toHaveProperty("accessToken");
    expect(session).not.toHaveProperty("refreshToken");
    expect(token.get()).toMatch(/^mock-u-lan-/);
  });
  it("returns flat authentication and validation errors as HTTP JSON", async () => {
    for (const [payload, status, code, keys] of [
      [
        { username: "lan", password: "wrong-password" },
        401,
        "INVALID_CREDENTIALS",
        ["code", "message"],
      ],
      [
        { username: "lan" },
        422,
        "VALIDATION_ERROR",
        ["code", "fieldErrors", "message"],
      ],
    ] as const) {
      const response = await fetch(`${apiClient.defaults.baseURL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      expect(response.status).toBe(status);
      expect(response.headers.get("content-type")).toContain(
        "application/json",
      );
      const body = await response.json();
      expect(Object.keys(body).sort()).toEqual(keys);
      expect(body).toMatchObject({ code, message: expect.any(String) });
      if (status === 422)
        expect(body.fieldErrors).toContainEqual({
          path: ["password"],
          message: expect.any(String),
        });
    }
  });
  it("validates response JSON before it reaches a Query cache", async () => {
    await signIn("lan");
    const task = await tasksService.getTask("t-3");
    await expect(
      tasksService.getTask("t-3", {
        scenario: "invalid-response",
      }),
    ).rejects.toBeInstanceOf(ContractError);
    for (const body of [
      { data: task },
      {},
      { ...task, version: 0 },
      { ...task, firstStartedAt: "invalid" },
      null,
      [task],
    ]) {
      server.use(http.get("*/api/tasks/t-3", () => HttpResponse.json(body)));
      await expect(tasksService.getTask("t-3")).rejects.toBeInstanceOf(
        ContractError,
      );
    }
    for (const body of [
      { code: "VALIDATION_ERROR" },
      { error: { code: "VALIDATION_ERROR", message: "Invalid request" } },
    ]) {
      server.use(
        http.get("*/api/tasks/t-3", () =>
          HttpResponse.json(body, { status: 422 }),
        ),
      );
      await expect(tasksService.getTask("t-3")).rejects.toBeInstanceOf(
        ContractError,
      );
    }
    server.use(
      http.get("*/api/tasks/t-3", () =>
        HttpResponse.json({ ...task, privateNote: "Not part of TaskDto" }),
      ),
    );
    expect(await tasksService.getTask("t-3")).toEqual(task);
  });
  it("rejects stale versions over HTTP without changing the task", async () => {
    await signIn("lan");
    const task = await tasksService.getTask("t-3");
    const result = await tasksService.updateRemainingEstimate(
      task.id,
      { remainingMinutes: 240 },
      {
        version: task.version,
        key: "remaining-1",
      },
    );
    await expect(
      tasksService.updateRemainingEstimate(
        task.id,
        { remainingMinutes: 120 },
        {
          version: task.version,
          key: "remaining-2",
        },
      ),
    ).rejects.toMatchObject({ status: 412 });
    expect((await tasksService.getTask(task.id)).remainingMinutes).toBe(
      result.remainingMinutes,
    );
  });
  it("replays a successful mutation once and rejects a reused key with another payload", async () => {
    await signIn("lan");
    const task = await tasksService.getTask("t-3");
    const args = {
      params: { taskId: task.id },
      body: { remainingMinutes: 240 },
      version: task.version,
      key: "same-attempt",
    };
    const a = await tasksService.updateRemainingEstimate(
      args.params.taskId,
      args.body,
      {
        version: args.version,
        key: args.key,
      },
    );
    const b = await tasksService.updateRemainingEstimate(
      args.params.taskId,
      args.body,
      {
        version: args.version,
        key: args.key,
      },
    );
    expect(b).toEqual(a);
    expect(b.version).toBe(task.version + 1);
    await expect(
      tasksService.updateRemainingEstimate(
        args.params.taskId,
        { remainingMinutes: 99 },
        {
          version: args.version,
          key: args.key,
        },
      ),
    ).rejects.toMatchObject({ status: 409, code: "IDEMPOTENCY_CONFLICT" });
  });
  it("enforces the per-person daily total and keeps pending tasks read-only", async () => {
    await signIn("lan");
    const task = await tasksService.getTask("t-3");
    await expect(
      timeLogsService.createTimeLog(
        task.id,
        {
          workDate: "2026-10-23",
          minutes: 1400,
          description: "Kiểm tra tổng phút",
        },
        {
          version: task.version,
          key: "daily-limit",
        },
      ),
    ).rejects.toMatchObject({ status: 422, code: "DAILY_LIMIT" });
    await signIn("minh");
    await expect(
      tasksService.cancelTask(
        "t-4",
        { reason: "Thử hủy" },
        {
          version: 1,
          key: "cancel-pending",
        },
      ),
    ).rejects.toBeInstanceOf(ApiError);
    expect((await tasksService.getTask("t-4")).status).toBe("PENDING_REVIEW");
  });
  it("preserves creation and first-start timestamps through pause, restart and handover", async () => {
    await signIn("lan");
    let task = await tasksService.getTask("t-2");
    const createdAt = task.createdAt;
    expect(task.firstStartedAt).toBeNull();
    setClock("2026-10-23T10:06:00.000Z");
    task = await tasksService.startTask(task.id, {
      version: task.version,
      key: "first-start",
    });
    const firstStartedAt = task.firstStartedAt;
    expect(firstStartedAt).toBe("2026-10-23T10:06:00.000Z");
    setClock("2026-10-23T10:07:00.000Z");
    task = await tasksService.pauseTask(
      task.id,
      { reason: "Chờ thông tin" },
      { version: task.version, key: "pause" },
    );
    task = await tasksService.startTask(task.id, {
      version: task.version,
      key: "restart",
    });
    expect(task).toMatchObject({ createdAt, firstStartedAt });
    await signIn("minh");
    task = await tasksService.assignTask(
      task.id,
      { assigneeId: "u-huy", reason: "Bàn giao công việc" },
      { version: task.version, key: "handover" },
    );
    expect(task).toMatchObject({ status: "TODO", createdAt, firstStartedAt });
    await signIn("huy");
    setClock("2026-10-23T10:08:00.000Z");
    task = await tasksService.startTask(task.id, {
      version: task.version,
      key: "start-after-handover",
    });
    expect(task).toMatchObject({ createdAt, firstStartedAt, actualMinutes: 0 });
    expect(await tasksService.getTask(task.id)).toMatchObject({
      createdAt,
      firstStartedAt,
    });
  });
  it("creates, assigns, logs, revises, resubmits and accepts through HTTP", async () => {
    await signIn("minh");
    let task = await tasksService.createTask(
      "p-main",
      {
        title: "Kiểm tra toàn bộ luồng",
        description: "HTTP + MSW",
        acceptanceCriteria: "Có kết quả được đối chiếu",
        priority: "NORMAL",
        dueAt: "2026-10-30T10:00:00.000Z",
        estimatedMinutes: 180,
      },
      {
        key: "create-flow",
      },
    );
    expect(task.status).toBe("NEW");
    expect(task.createdAt).toBe("2026-10-23T10:05:00.000Z");
    expect(task.firstStartedAt).toBeNull();
    task = await tasksService.assignTask(
      task.id,
      { assigneeId: "u-lan" },
      {
        version: task.version,
        key: "assign-flow",
      },
    );
    await signIn("lan");
    task = await tasksService.startTask(task.id, {
      version: task.version,
      key: "start-flow",
    });
    const log = await timeLogsService.createTimeLog(
      task.id,
      {
        workDate: "2026-10-23",
        minutes: 90,
        description: "Thực hiện và kiểm tra",
      },
      {
        version: task.version,
        key: "log-flow",
      },
    );
    task = log.task;
    const first = await submissionsService.createSubmission(
      task.id,
      { summary: "Kết quả lần 1", links: [], attachmentIds: [] },
      {
        version: task.version,
        key: "submit-first",
      },
    );
    expect(first.task.status).toBe("PENDING_REVIEW");
    await signIn("minh");
    const revised = await submissionsService.requestSubmissionRevision(
      task.id,
      first.submission.id,
      {
        reason: "Cần bổ sung",
        requestedChanges: "Bổ sung điều kiện ngoại lệ",
      },
      {
        version: first.submission.version,
        key: "revise-flow",
      },
    );
    expect(revised.task.status).toBe("IN_PROGRESS");
    await signIn("lan");
    const second = await submissionsService.createSubmission(
      task.id,
      {
        summary: "Đã bổ sung điều kiện ngoại lệ",
        links: [],
        attachmentIds: [],
      },
      {
        version: revised.task.version,
        key: "submit-second",
      },
    );
    expect(second.submission.sequence).toBe(2);
    await signIn("minh");
    const accepted = await submissionsService.approveSubmission(
      task.id,
      second.submission.id,
      { comment: "Đạt tiêu chí" },
      {
        version: second.submission.version,
        key: "approve-flow",
      },
    );
    expect(accepted.task.status).toBe("COMPLETED");
    expect(accepted.task.actualMinutes).toBe(90);
    expect(db.timeLogs.filter((l) => l.taskId === task.id)).toHaveLength(1);
    expect(db.submissions.filter((s) => s.taskId === task.id)).toHaveLength(2);
  });
});
