import { attachmentsService } from "@/features/attachments/api/attachments.service";
import { authService } from "@/features/auth/api/auth.service";
import { reportsService } from "@/features/reports/api/reports.service";
import { submissionsService } from "@/features/submissions/api/submissions.service";
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
beforeEach(() => {
  server.resetHandlers();
  resetMockState();
  token.set(null);
  registerRefresh(null);
});
const login = (username: string) =>
  authService.login({ username, password: "Mock@12345" });
const period = {
  projectId: "p-main",
  periodType: "DAILY" as const,
  periodStart: "2026-10-21",
};
describe("reports and evidence through HTTP", () => {
  it("searches review tasks before pagination and preserves project access", async () => {
    await login("minh");
    const task = db.tasks.find((item) => item.id === "t-4")!;
    const submission = db.submissions.find((item) => item.id === "s-pending")!;
    for (const [id, title, projectId] of [
      ["review-ui", "Kiểm thử giao diện", "p-main"],
      ["review-hidden", "API ngoài dự án", "p-other"],
    ]) {
      db.tasks.push({ ...task, id, title, projectId, latestSubmissionId: id });
      db.submissions.push({ ...submission, id, taskId: id });
    }
    const matched = await submissionsService.listReviewQueue({
      q: "  API BÁO CÁO  ",
      projectId: "p-main",
      pageSize: 1,
    });
    expect(matched.items.map((item) => item.id)).toEqual(["s-pending"]);
    expect(matched.pagination.total).toBe(1);
    const other = await submissionsService.listReviewQueue({
      q: "giao diện",
      pageSize: 1,
    });
    expect(other.items.map((item) => item.id)).toEqual(["review-ui"]);
    expect(other.pagination.total).toBe(1);
    for (const query of [
      { q: "API ngoài" },
      { q: "API", projectId: "p-other" },
      { q: "Không có kết quả" },
    ]) {
      const result = await submissionsService.listReviewQueue(query);
      expect(result.items).toEqual([]);
      expect(result.pagination.total).toBe(0);
    }
  });
  it("uploads READY evidence, preserves bytes and prevents a different file from replaying the same key", async () => {
    await login("lan");
    const policy = await attachmentsService.getUploadPolicy();
    expect(policy.maxBytes).toBe(20 * 1024 * 1024);
    const file = new File(["First evidence"], "proof.txt", {
      type: "text/plain",
    });
    const req = { body: { taskId: "t-3", file }, key: "upload1" };
    const item = await attachmentsService.uploadAttachment(req.body, {
      key: req.key,
    });
    expect(item).toMatchObject({
      filename: "proof.txt",
      status: "READY",
    });
    expect(
      (
        await attachmentsService.uploadAttachment(req.body, {
          key: req.key,
        })
      ).id,
    ).toBe(item.id);
    expect(
      await (await attachmentsService.downloadAttachment(item.id)).text(),
    ).toBe("First evidence");
    await expect(
      attachmentsService.uploadAttachment(
        {
          taskId: "t-3",
          file: new File(["Other evidence"], "proof.txt", {
            type: "text/plain",
          }),
        },
        {
          key: req.key,
        },
      ),
    ).rejects.toMatchObject({ status: 409, code: "IDEMPOTENCY_CONFLICT" });
  });
  it("validates MIME/content and task scope; downloads seeded valid PDF", async () => {
    await login("lan");
    await expect(
      attachmentsService.uploadAttachment(
        {
          taskId: "t-3",
          file: new File(["fake"], "bad.pdf", { type: "application/pdf" }),
        },
        {
          key: "bad",
        },
      ),
    ).rejects.toMatchObject({ status: 422 });
    expect(
      (
        await (await attachmentsService.downloadAttachment("a-criteria")).text()
      ).startsWith("%PDF-1.4"),
    ).toBe(true);
    await login("other");
    await expect(
      attachmentsService.getAttachment("a-criteria"),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      attachmentsService.downloadAttachment("a-criteria"),
    ).rejects.toMatchObject({ status: 403, code: "FORBIDDEN" });
    await expect(
      attachmentsService.downloadAttachment("a-criteria", {
        scenario: "rate-limit",
      }),
    ).rejects.toMatchObject({ status: 429, code: "RATE_LIMITED" });
  });
  it("keeps drafts private and exposes an existing report ID for the same period", async () => {
    await login("lan");
    const r = await reportsService.createReportDraft(period, {
      key: "r1",
    });
    await expect(
      reportsService.createReportDraft(period, {
        key: "r2",
      }),
    ).rejects.toMatchObject({
      status: 409,
      details: { existingReportId: r.id },
    });
    await login("minh");
    await expect(reportsService.getReport(r.id)).rejects.toMatchObject({
      status: 403,
    });
    expect(
      (await reportsService.listReports({ status: "DRAFT" })).items,
    ).toHaveLength(0);
  });
  it("rejects future periods, non Monday weeks and unrelated tasks", async () => {
    await login("lan");
    for (const body of [
      { ...period, periodStart: "2026-10-24" },
      { ...period, periodType: "WEEKLY" as const, periodStart: "2026-10-21" },
      { ...period, selectedTaskIds: ["t-4"] },
    ])
      await expect(
        reportsService.createReportDraft(body, {
          key: crypto.randomUUID(),
        }),
      ).rejects.toMatchObject({ status: 422 });
    const preview = await reportsService.getReportPreview({
      ...period,
      periodType: "WEEKLY",
      periodStart: "2026-10-19",
    });
    expect(preview.partialPeriod).toBe(true);
    expect(preview.totalMinutes).toBe(
      db.timeLogs
        .filter(
          (l) =>
            l.userId === "u-lan" &&
            l.status === "ACTIVE" &&
            l.workDate >= "2026-10-19" &&
            l.workDate < "2026-10-26" &&
            db.tasks.some(
              (t) => t.id === l.taskId && t.projectId === period.projectId,
            ),
        )
        .reduce((sum, l) => sum + l.minutes, 0),
    );
  });
  it("includes Monday through Sunday and excludes the adjacent days from weekly previews", async () => {
    await login("lan");
    const log = db.timeLogs.find(
      (item) => item.userId === "u-lan" && item.taskId === "t-3",
    )!;
    db.timeLogs = ["2026-10-18", "2026-10-19", "2026-10-25", "2026-10-26"].map(
      (workDate, index) => ({
        ...log,
        id: `boundary-${index}`,
        workDate,
        minutes: 15 * 2 ** index,
        status: "ACTIVE",
      }),
    );
    const preview = await reportsService.getReportPreview({
      ...period,
      periodType: "WEEKLY",
      periodStart: "2026-10-19",
    });
    expect(preview.totalMinutes).toBe(90);
    expect(preview.items).toMatchObject([{ taskId: "t-3", minutes: 90 }]);
  });
  it("requires content and a zero-time explanation, then freezes a submitted snapshot", async () => {
    await login("lan");
    let r = await reportsService.createReportDraft(period, {
      key: "draft",
    });
    await expect(
      reportsService.submitReport(
        r.id,
        {},
        {
          version: r.version,
          key: "send0",
        },
      ),
    ).rejects.toMatchObject({ status: 422 });
    r = await reportsService.updateReportDraft(
      r.id,
      { achievements: "Đối chiếu tài liệu", nextPlan: "Thực hiện tiếp" },
      {
        version: r.version,
        key: "edit",
      },
    );
    await expect(
      reportsService.submitReport(
        r.id,
        {},
        {
          version: r.version,
          key: "send1",
        },
      ),
    ).rejects.toMatchObject({ status: 422, code: "ZERO_TIME_REASON_REQUIRED" });
    const sent = await reportsService.submitReport(
      r.id,
      { zeroTimeReason: "Ngày này chỉ rà soát, chưa ghi giờ." },
      {
        version: r.version,
        key: "send2",
      },
    );
    expect(sent.status).toBe("SUBMITTED");
    expect(sent.snapshot?.totalMinutes).toBe(0);
    await expect(
      reportsService.updateReportDraft(
        r.id,
        { blockers: "new" },
        {
          version: sent.version,
          key: "edit2",
        },
      ),
    ).rejects.toMatchObject({ status: 409 });
    await login("minh");
    expect((await reportsService.getReport(r.id)).snapshot).toEqual(
      sent.snapshot,
    );
  });
  it("does not double-count overlapping daily/weekly reports or change a submitted snapshot when logs change", async () => {
    await login("lan");
    const period = {
      projectId: "p-main",
      periodType: "DAILY" as const,
      periodStart: "2026-10-23",
    };
    const preview = await reportsService.getReportPreview(period);
    const r = await reportsService.getReport("r-draft");
    const count = db.timeLogs.length;
    const sent = await reportsService.submitReport(
      r.id,
      {},
      {
        version: r.version,
        key: "freeze",
      },
    );
    expect(sent.snapshot?.totalMinutes).toBe(preview.totalMinutes);
    const log = db.timeLogs.find(
      (l) => l.taskId === "t-3" && l.status === "ACTIVE",
    )!;
    log.minutes += 30;
    expect((await reportsService.getReport(r.id)).snapshot?.totalMinutes).toBe(
      preview.totalMinutes,
    );
    expect((await reportsService.getReportPreview(period)).totalMinutes).toBe(
      preview.totalMinutes + 30,
    );
    expect(db.timeLogs.length).toBe(count);
  });
  it("blocks self-review even when the submitter manages the project", async () => {
    db.users.find((user) => user.id === "u-huy")!.systemRole = "MANAGER";
    db.members.find(
      (m) => m.userId === "u-huy" && m.projectId === "p-main",
    )!.projectRole = "MANAGER";
    await login("huy");
    const s = db.submissions.find((s) => s.id === "s-pending")!;
    await expect(
      submissionsService.approveSubmission(
        s.taskId,
        s.id,
        {},
        {
          version: s.version,
          key: "self",
        },
      ),
    ).rejects.toMatchObject({ status: 403, code: "SELF_REVIEW" });
  });
});
