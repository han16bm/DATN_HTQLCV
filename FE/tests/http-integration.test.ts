import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { server } from "@/mocks/node";
import { resetMockState } from "@/mocks/reset";
import { db } from "@/mocks/db/database";
import { authService } from "@/features/auth";
import { tasksService } from "@/features/tasks";
import { timeLogsService } from "@/features/time-logs";
import { submissionsService } from "@/features/submissions";
import { token, registerRefresh } from "@/services/auth-session";
import { ApiError, ContractError } from "@/types/api/error";

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
  return authService.login({ body: { username, password: "Mock@12345" } });
}

describe("Feature service → fetch HTTP → MSW → mock database", () => {
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
        query: { overdue: false, page: 1, pageSize: 20 },
      });
      const sent = requests.find(
        (r) => new URL(r.url).pathname === "/api/v1/tasks",
      );
      expect(sent).toMatchObject({
        method: "GET",
        authorization: "Bearer mock-u-lan",
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
    await expect(
      tasksService.getTask({ params: { taskId: "t-3" } }),
    ).rejects.toMatchObject({ status: 403, code: "FORBIDDEN" });
  });
  it("normalizes 401 and preserves password whitespace", async () => {
    await expect(
      authService.login({ body: { username: "lan", password: " Mock@12345" } }),
    ).rejects.toMatchObject({ status: 401, code: "INVALID_CREDENTIALS" });
    expect(token.get()).toBeNull();
  });
  it("returns session data without caching access credentials in Query results", async () => {
    const session = await signIn("lan");
    expect(session.user.id).toBe("u-lan");
    expect(session).not.toHaveProperty("accessToken");
    expect(session).not.toHaveProperty("refreshToken");
    expect(token.get()).toBe("mock-u-lan");
  });
  it("validates response JSON before it reaches a Query cache", async () => {
    await signIn("lan");
    await expect(
      tasksService.getTask({
        params: { taskId: "t-3" },
        scenario: "invalid-response",
      }),
    ).rejects.toBeInstanceOf(ContractError);
  });
  it("rejects stale versions over HTTP without changing the task", async () => {
    await signIn("lan");
    const task = await tasksService.getTask({ params: { taskId: "t-3" } });
    const result = await tasksService.updateRemainingEstimate({
      params: { taskId: task.id },
      body: { remainingMinutes: 240 },
      version: task.version,
      key: "remaining-1",
    });
    await expect(
      tasksService.updateRemainingEstimate({
        params: { taskId: task.id },
        body: { remainingMinutes: 120 },
        version: task.version,
        key: "remaining-2",
      }),
    ).rejects.toMatchObject({ status: 412 });
    expect(
      (await tasksService.getTask({ params: { taskId: task.id } }))
        .remainingMinutes,
    ).toBe(result.remainingMinutes);
  });
  it("replays a successful mutation once and rejects a reused key with another payload", async () => {
    await signIn("lan");
    const task = await tasksService.getTask({ params: { taskId: "t-3" } });
    const args = {
      params: { taskId: task.id },
      body: { remainingMinutes: 240 },
      version: task.version,
      key: "same-attempt",
    };
    const a = await tasksService.updateRemainingEstimate(args),
      b = await tasksService.updateRemainingEstimate(args);
    expect(b).toEqual(a);
    expect(b.version).toBe(task.version + 1);
    await expect(
      tasksService.updateRemainingEstimate({
        ...args,
        body: { remainingMinutes: 99 },
      }),
    ).rejects.toMatchObject({ status: 409, code: "IDEMPOTENCY_CONFLICT" });
  });
  it("enforces the per-person daily total and keeps pending tasks read-only", async () => {
    await signIn("lan");
    const task = await tasksService.getTask({ params: { taskId: "t-3" } });
    await expect(
      timeLogsService.createTimeLog({
        params: { taskId: task.id },
        body: {
          workDate: "2026-10-23",
          minutes: 1400,
          description: "Kiểm tra tổng phút",
        },
        version: task.version,
        key: "daily-limit",
      }),
    ).rejects.toMatchObject({ status: 422, code: "DAILY_LIMIT" });
    await signIn("minh");
    await expect(
      tasksService.cancelTask({
        params: { taskId: "t-4" },
        body: { reason: "Thử hủy" },
        version: 1,
        key: "cancel-pending",
      }),
    ).rejects.toBeInstanceOf(ApiError);
    expect(
      (await tasksService.getTask({ params: { taskId: "t-4" } })).status,
    ).toBe("PENDING_REVIEW");
  });
  it("creates, assigns, logs, revises, resubmits and accepts through HTTP", async () => {
    await signIn("minh");
    let task = await tasksService.createTask({
      params: { projectId: "p-main" },
      body: {
        title: "Kiểm tra toàn bộ luồng",
        description: "HTTP + MSW",
        acceptanceCriteria: "Có kết quả được đối chiếu",
        priority: "NORMAL",
        dueAt: "2026-10-30T10:00:00.000Z",
        estimatedMinutes: 180,
      },
      key: "create-flow",
    });
    expect(task.status).toBe("NEW");
    task = await tasksService.assignTask({
      params: { taskId: task.id },
      body: { assigneeId: "u-lan" },
      version: task.version,
      key: "assign-flow",
    });
    await signIn("lan");
    task = await tasksService.startTask({
      params: { taskId: task.id },
      version: task.version,
      key: "start-flow",
    });
    const log = await timeLogsService.createTimeLog({
      params: { taskId: task.id },
      body: {
        workDate: "2026-10-23",
        minutes: 90,
        description: "Thực hiện và kiểm tra",
      },
      version: task.version,
      key: "log-flow",
    });
    task = log.task;
    const first = await submissionsService.createSubmission({
      params: { taskId: task.id },
      body: { summary: "Kết quả lần 1", links: [], attachmentIds: [] },
      version: task.version,
      key: "submit-first",
    });
    expect(first.task.status).toBe("PENDING_REVIEW");
    await signIn("minh");
    const revised = await submissionsService.requestSubmissionRevision({
      params: { taskId: task.id, submissionId: first.submission.id },
      body: {
        reason: "Cần bổ sung",
        requestedChanges: "Bổ sung điều kiện ngoại lệ",
      },
      version: first.submission.version,
      key: "revise-flow",
    });
    expect(revised.task.status).toBe("IN_PROGRESS");
    await signIn("lan");
    const second = await submissionsService.createSubmission({
      params: { taskId: task.id },
      body: {
        summary: "Đã bổ sung điều kiện ngoại lệ",
        links: [],
        attachmentIds: [],
      },
      version: revised.task.version,
      key: "submit-second",
    });
    expect(second.submission.sequence).toBe(2);
    await signIn("minh");
    const accepted = await submissionsService.approveSubmission({
      params: { taskId: task.id, submissionId: second.submission.id },
      body: { comment: "Đạt tiêu chí" },
      version: second.submission.version,
      key: "approve-flow",
    });
    expect(accepted.task.status).toBe("COMPLETED");
    expect(accepted.task.actualMinutes).toBe(90);
    expect(db.timeLogs.filter((l) => l.taskId === task.id)).toHaveLength(1);
    expect(db.submissions.filter((s) => s.taskId === task.id)).toHaveLength(2);
  });
});
