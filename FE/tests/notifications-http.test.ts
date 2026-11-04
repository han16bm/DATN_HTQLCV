import { authService } from "@/features/auth/api/auth.service";
import { notificationsService } from "@/features/notifications/api/notifications.service";
import { submissionsService } from "@/features/submissions/api/submissions.service";
import { tasksService } from "@/features/tasks/api/tasks.service";
import { timeLogsService } from "@/features/time-logs/api/time-logs.service";
import { db, evaluateAlertRules } from "@/mocks/db";
import { resetMockState, server } from "@/mocks/node";
import { apiClient, registerRefresh, token } from "@/services/api-client";
import { afterAll, beforeAll, beforeEach, expect, it } from "vitest";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
beforeEach(() => {
  resetMockState();
  server.resetHandlers();
  token.set(null);
  registerRefresh(null);
});
const login = (username: string) =>
  authService.login({ username, password: "Mock@12345" });
async function assignment(scenario?: string) {
  await login("minh");
  const task = await tasksService.createTask(
    "p-main",
    {
      title: "Kiểm tra thông báo",
      acceptanceCriteria: "Đúng người nhận",
      priority: "NORMAL",
      dueAt: "2026-10-27T10:00:00.000Z",
      estimatedMinutes: 60,
    },
    { key: crypto.randomUUID() },
  );
  const options = { version: task.version, key: crypto.randomUUID(), scenario };
  const result = await tasksService.assignTask(
    task.id,
    { assigneeId: "u-lan" },
    options,
  );
  return { task: result, original: task, options };
}
it("returns an authenticated empty inbox and rejects anonymous access", async () => {
  await expect(notificationsService.list()).rejects.toMatchObject({
    status: 401,
  });
  await login("lan");
  expect((await notificationsService.list()).items).toEqual([]);
  expect(await notificationsService.summary()).toEqual({ unreadCount: 0 });
  await expect(
    apiClient.get("/notifications/summary", { params: { userId: "u-pm" } }),
  ).rejects.toMatchObject({ status: 422 });
});
it("delivers the actual assignment only to its recipient with a compact response", async () => {
  const { task } = await assignment();
  await login("lan");
  const result = await notificationsService.list();
  expect(result.pagination.total).toBe(1);
  expect(result.items[0]).toMatchObject({
    type: "TASK_ASSIGNED",
    href: `/tasks/${task.id}`,
    readAt: null,
  });
  expect(result.items[0].title).toContain(task.title);
  expect(Object.keys(result.items[0]).sort()).toEqual([
    "createdAt",
    "href",
    "id",
    "readAt",
    "title",
    "type",
  ]);
  expect(await notificationsService.summary()).toEqual({ unreadCount: 1 });
  await login("huy");
  expect((await notificationsService.list()).items).toEqual([]);
  await expect(
    notificationsService.markRead(result.items[0].id, {
      key: crypto.randomUUID(),
    }),
  ).rejects.toMatchObject({ status: 404 });
});
it("marks read once, decreases the count and safely replays the request", async () => {
  await assignment();
  await login("lan");
  const notice = (await notificationsService.list()).items[0];
  const options = { key: crypto.randomUUID() };
  const first = await notificationsService.markRead(notice.id, options);
  expect(first.readAt).not.toBeNull();
  expect(await notificationsService.markRead(notice.id, options)).toEqual(
    first,
  );
  expect(await notificationsService.summary()).toEqual({ unreadCount: 0 });
  expect((await notificationsService.list()).items[0].readAt).toBe(
    first.readAt,
  );
});
it("does not create a second notification when assignment is replayed", async () => {
  const { original, options } = await assignment();
  await tasksService.assignTask(original.id, { assigneeId: "u-lan" }, options);
  await login("lan");
  expect((await notificationsService.list()).pagination.total).toBe(1);
});
it("preserves the committed notification when external delivery fails", async () => {
  const { task } = await assignment("notification-failed");
  expect(db.outbox.find((notice) => notice.taskId === task.id)?.status).toBe(
    "FAILED",
  );
  await login("lan");
  expect((await notificationsService.list()).items[0].href).toBe(
    `/tasks/${task.id}`,
  );
});
it("sends review feedback to the original submitter and correct attempt", async () => {
  await login("minh");
  const submission = await submissionsService.getSubmission("t-4", "s-pending");
  await submissionsService.approveSubmission(
    "t-4",
    submission.id,
    { comment: "Đã kiểm tra" },
    { version: submission.version, key: crypto.randomUUID() },
  );
  await login("huy");
  expect((await notificationsService.list()).items).toContainEqual(
    expect.objectContaining({
      type: "RESULT_APPROVED",
      href: "/tasks/t-4/submissions/s-pending",
    }),
  );
});
it("notifies a plan change and rolls back a rejected command without another event", async () => {
  const { task } = await assignment();
  const changed = await tasksService.updateTask(
    task.id,
    { description: "Bổ sung nội dung", changeReason: "Làm rõ yêu cầu" },
    { version: task.version, key: crypto.randomUUID() },
  );
  const before = db.outbox.length;
  await expect(
    tasksService.updateTask(
      task.id,
      { description: "Bản cũ" },
      { version: task.version, key: crypto.randomUUID() },
    ),
  ).rejects.toMatchObject({ status: 412 });
  expect(db.outbox).toHaveLength(before);
  await login("lan");
  const list = await notificationsService.list();
  expect(list.items[0]).toMatchObject({
    type: "TASK_UPDATED",
    href: `/tasks/${changed.id}`,
  });
});
it("routes new results and requested changes to the correct recipient and attempt", async () => {
  const assigned = await assignment();
  await login("lan");
  const started = await tasksService.startTask(assigned.task.id, {
    version: assigned.task.version,
    key: crypto.randomUUID(),
  });
  const log = await timeLogsService.createTimeLog(
    started.id,
    { minutes: 60, workDate: "2026-10-23", description: "Thực hiện công việc" },
    { version: started.version, key: crypto.randomUUID() },
  );
  const result = await submissionsService.createSubmission(
    started.id,
    { summary: "Kết quả lần đầu", attachmentIds: [], links: [] },
    { version: log.task.version, key: crypto.randomUUID() },
  );
  await login("minh");
  const href = `/tasks/${started.id}/submissions/${result.submission.id}`;
  expect((await notificationsService.list()).items).toContainEqual(
    expect.objectContaining({ type: "RESULT_SUBMITTED", href }),
  );
  await submissionsService.requestSubmissionRevision(
    started.id,
    result.submission.id,
    { reason: "Chưa đầy đủ", requestedChanges: "Bổ sung tài liệu" },
    { version: result.submission.version, key: crypto.randomUUID() },
  );
  await login("lan");
  expect((await notificationsService.list()).items[0]).toMatchObject({
    type: "CHANGES_REQUESTED",
    href,
  });
});
it("paginates newest first before projection and GET does not generate events", async () => {
  const { task } = await assignment();
  const notice = db.outbox.find((item) => item.taskId === task.id)!;
  for (let index = 0; index < 24; index++)
    db.outbox.push({
      ...notice,
      id: `notice-${index}`,
      eventId: `event-${index}`,
    });
  await login("lan");
  const total = db.outbox.length;
  const first = await notificationsService.list({ page: 1, pageSize: 10 });
  const last = await notificationsService.list({ page: 3, pageSize: 10 });
  expect(first.pagination.total).toBe(25);
  expect(first.items[0].id).toBe("notice-23");
  expect(last.items).toHaveLength(5);
  await notificationsService.summary();
  expect(db.outbox).toHaveLength(total);
  await expect(
    apiClient.get("/notifications", { params: { page: 0 } }),
  ).rejects.toMatchObject({ status: 422 });
});
it("emits an alert event once and links to the actual alert", async () => {
  await login("minh");
  db.alerts.length = 0;
  evaluateAlertRules();
  const first = await notificationsService.list();
  expect(first.items.length).toBeGreaterThan(0);
  expect(
    first.items.every(
      (notice) =>
        notice.type === "ALERT_CREATED" &&
        db.alerts.some((alert) => notice.href === `/alerts/${alert.id}`),
    ),
  ).toBe(true);
  evaluateAlertRules();
  expect((await notificationsService.list()).pagination.total).toBe(
    first.pagination.total,
  );
});
