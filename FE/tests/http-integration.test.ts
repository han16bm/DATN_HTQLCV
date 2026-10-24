import { authService } from "@/features/auth/api/auth.service";
import { submissionsService } from "@/features/submissions/api/submissions.service";
import { tasksService } from "@/features/tasks/api/tasks.service";
import { timeLogsService } from "@/features/time-logs/api/time-logs.service";
import { db } from "@/mocks/db/database";
import { server } from "@/mocks/node";
import { resetMockState } from "@/mocks/reset";
import { registerRefresh, token } from "@/services/auth-session";
import { ApiError, ContractError } from "@/types/api/error";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
beforeAll(() => {
  process.env.NEXT_PUBLIC_API_ORIGIN = "http://gateway.test";
  server.listen({ onUnhandledRequest: "error" });
});
afterAll(() => {
  server.close();
  delete process.env.NEXT_PUBLIC_API_ORIGIN;
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
describe("Feature service → fetch HTTP → MSW → mock database", () => {
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
        new URL(request.url).pathname === "/api/v1/projects/p-main/tasks"
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
        (r) => new URL(r.url).pathname === "/api/v1/tasks",
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
  it("keeps ADMIN outside project business scope", async () => {
    await signIn("admin");
    await expect(tasksService.getTask("t-3")).rejects.toMatchObject({
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
  it("validates response JSON before it reaches a Query cache", async () => {
    await signIn("lan");
    await expect(
      tasksService.getTask("t-3", {
        scenario: "invalid-response",
      }),
    ).rejects.toBeInstanceOf(ContractError);
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
