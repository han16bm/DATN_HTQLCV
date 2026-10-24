import { analyticsService } from "@/features/analytics/api/analytics.service";
import { authService } from "@/features/auth/api/auth.service";
import { submissionsService } from "@/features/submissions/api/submissions.service";
import { tasksService } from "@/features/tasks/api/tasks.service";
import { timeLogsService } from "@/features/time-logs/api/time-logs.service";
import { db, setClock } from "@/mocks/db";
import { resetMockState, server } from "@/mocks/node";
import { registerRefresh, token } from "@/services/api-client";
import { afterAll, beforeAll, beforeEach, expect, it } from "vitest";
beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});
afterAll(() => {
  server.close();
});
beforeEach(() => {
  resetMockState();
  server.resetHandlers();
  token.set(null);
  registerRefresh(null);
});
const login = (username: string) =>
  authService.login({ username, password: "Mock@12345" });
it("expires access sessions and never revives an old token when signing in again", async () => {
  await login("lan");
  const old = token.get();
  setClock("2026-10-23T11:05:00.000Z");
  await expect(authService.getSession()).rejects.toMatchObject({
    status: 401,
  });
  await login("lan");
  expect((await authService.getSession()).user.id).toBe("u-lan");
  token.set(old);
  await expect(authService.getSession()).rejects.toMatchObject({
    status: 401,
  });
});
it("rejects receipt replay after the caller loses assignment and project scope", async () => {
  await login("lan");
  const task = await tasksService.getTask("t-3");
  const request = {
    params: { taskId: task.id },
    body: { remainingMinutes: 30 },
    version: task.version,
    key: "receipt",
  };
  await tasksService.updateRemainingEstimate(
    request.params.taskId,
    request.body,
    {
      version: request.version,
      key: request.key,
    },
  );
  db.members.find(
    (m) => m.projectId === "p-main" && m.userId === "u-lan",
  )!.endedAt = "2026-10-23T10:05:00.000Z";
  await expect(
    tasksService.updateRemainingEstimate(request.params.taskId, request.body, {
      version: request.version,
      key: request.key,
    }),
  ).rejects.toMatchObject({ status: 403 });
});
it("accepts an exact-deadline submission but counts later approval separately, with no timer-generated hours", async () => {
  await login("minh");
  let task = await tasksService.createTask(
    "p-main",
    {
      title: "Kiểm tra ranh giới hạn",
      description: null,
      acceptanceCriteria: "Có kết quả",
      priority: "NORMAL",
      dueAt: "2026-10-23T11:00:00.000Z",
      estimatedMinutes: 60,
    },
    {
      key: "boundary-task",
    },
  );
  task = await tasksService.assignTask(
    task.id,
    { assigneeId: "u-lan" },
    {
      version: task.version,
      key: "assign",
    },
  );
  await login("lan");
  task = await tasksService.startTask(task.id, {
    version: task.version,
    key: "start",
  });
  task = (
    await timeLogsService.createTimeLog(
      task.id,
      {
        workDate: "2026-10-23",
        minutes: 20,
        description: "Đối chiếu tiêu chí",
      },
      {
        version: task.version,
        key: "time",
      },
    )
  ).task;
  setClock(task.dueAt);
  await login("lan");
  expect((await tasksService.getTask(task.id)).isOverdue).toBe(false);
  const result = await submissionsService.createSubmission(
    task.id,
    { summary: "Hoàn tất", links: [], attachmentIds: [] },
    {
      version: task.version,
      key: "submit",
    },
  );
  expect(result.submission.submittedAt).toBe(result.submission.dueAtSnapshot);
  setClock("2026-10-23T12:10:00.000Z");
  await login("minh");
  const approved = await submissionsService.approveSubmission(
    task.id,
    result.submission.id,
    {},
    {
      version: result.submission.version,
      key: "approve",
    },
  );
  expect(approved.task.actualMinutes).toBe(20);
  const dash = await analyticsService.getDashboard({
    projectId: "p-main",
    from: "2026-10-23",
    to: "2026-10-23",
  });
  expect(dash.metrics.find((m) => m.code === "K08")?.value).toBe(0);
  expect(dash.metrics.find((m) => m.code === "K09")?.value).toBe(1);
});
it("does not rollback or duplicate a command if its notification delivery fails", async () => {
  await login("lan");
  const task = await tasksService.getTask("t-3");
  const request = {
    params: { taskId: task.id },
    version: task.version,
    key: "notice",
    body: { summary: "Hoàn tất tiêu chí", links: [], attachmentIds: [] },
    scenario: "notification-failed",
  };
  const one = await submissionsService.createSubmission(
    request.params.taskId,
    request.body,
    {
      version: request.version,
      key: request.key,
      scenario: request.scenario,
    },
  );
  const count = db.outbox.length;
  expect(db.outbox.at(-1)?.status).toBe("FAILED");
  expect(db.tasks.find((t) => t.id === task.id)?.status).toBe("PENDING_REVIEW");
  expect(
    (
      await submissionsService.createSubmission(
        request.params.taskId,
        request.body,
        {
          version: request.version,
          key: request.key,
          scenario: request.scenario,
        },
      )
    ).submission.id,
  ).toBe(one.submission.id);
  expect(db.outbox.length).toBe(count);
});
