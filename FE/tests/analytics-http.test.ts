import { alertsService } from "@/features/alerts/api/alerts.service";
import { analyticsService } from "@/features/analytics/api/analytics.service";
import { authService } from "@/features/auth/api/auth.service";
import { db, evaluateAlertRules, setClock } from "@/mocks/db";
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
const login = (username = "minh") =>
  authService.login({ username, password: "Mock@12345" });
const scope = { projectId: "p-main", from: "2026-10-01", to: "2026-10-23" };
const waitJob = () => new Promise((resolve) => setTimeout(resolve, 1650));
describe("analytics snapshots, jobs and alerts over HTTP", () => {
  it("returns all 16 KPIs, typed missing capacity and stable refs without creating jobs", async () => {
    await login();
    const a = await analyticsService.getDashboard(scope);
    const b = await analyticsService.getDashboard(scope);
    expect(a.metrics.map((m) => m.code)).toHaveLength(16);
    expect(new Set(a.metrics.map((m) => m.code)).size).toBe(16);
    expect(a.overviewRef).toEqual(b.overviewRef);
    expect(db.jobs.size).toBe(0);
    expect(a.metrics.find((m) => m.code === "K13")?.value).toBeNull();
    expect(a.metrics.find((m) => m.code === "K14")?.value).toBeNull();
    const workload = await analyticsService.getWorkload(scope);
    expect(
      workload.items.every(
        (i) => i.capacityMinutes === null && i.utilizationRate === null,
      ),
    ).toBe(true);
  });
  it("filters historical hours by the log author after handover, and K07 uses the lifetime cohort", async () => {
    await login();
    const task = db.tasks.find((t) => t.id === "t-3")!;
    task.assigneeId = "u-huy";
    const result = await analyticsService.getDashboard({
      ...scope,
      assigneeId: "u-lan",
    });
    expect(result.metrics.find((m) => m.code === "K06")!.value! * 60).toBe(
      db.timeLogs
        .filter((l) => l.userId === "u-lan" && l.status === "ACTIVE")
        .reduce((s, l) => s + l.minutes, 0),
    );
    const narrow = await analyticsService.getDashboard({
      ...scope,
      from: "2026-10-23",
      to: "2026-10-23",
    });
    expect(narrow.timeVariance.actualMinutes).toBeGreaterThanOrEqual(
      narrow.metrics.find((m) => m.code === "K06")!.value! * 60,
    );
  });
  it("enforces scope for analytics and lookup without using admin endpoints", async () => {
    await login();
    const projects = await analyticsService.listAnalyticsFilterOptions({
      kind: "PROJECT",
    });
    expect(projects.items.some((p) => p.id === "p-main")).toBe(true);
    await expect(
      analyticsService.getDashboard({ ...scope, projectId: "p-outside" }),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      analyticsService.getDashboard({ ...scope, from: "2026-10-25" }),
    ).rejects.toMatchObject({ status: 422 });
    await login("lan");
    await expect(analyticsService.getDashboard(scope)).rejects.toMatchObject({
      status: 403,
    });
  });
  it("coalesces a UNIT snapshot job, progresses independently of GET and preserves its initial receipt", async () => {
    await login();
    const a = await analyticsService.getDashboard({
      from: scope.from,
      to: scope.to,
    });
    const id = a.overviewRef.analysisId;
    const [one, two] = await Promise.all([
      analyticsService.createAnalysisJob(
        { analysisId: id },
        {
          key: "job1",
        },
      ),
      analyticsService.createAnalysisJob(
        { analysisId: id },
        {
          key: "job2",
        },
      ),
    ]);
    expect(one.id).toBe(two.id);
    expect(one.status).toBe("QUEUED");
    expect(db.jobs.size).toBe(1);
    expect((await analyticsService.getAnalysisJob(one.id)).status).toBe(
      "QUEUED",
    );
    await waitJob();
    expect(db.jobs.get(one.id)?.status).toBe("SUCCEEDED");
    const detail = await analyticsService.getAnalysisDetail(id);
    expect(detail.explanation.status).toBe("READY");
    expect(detail.explanation.lastSuccess?.snapshotId).toBe(detail.snapshot.id);
    expect(
      (
        await analyticsService.createAnalysisJob(
          { analysisId: id },
          {
            key: "job1",
          },
        )
      ).status,
    ).toBe("QUEUED");
    expect(
      (
        await analyticsService.createAnalysisJob(
          { analysisId: id },
          {
            key: "job3",
          },
        )
      ).status,
    ).toBe("SUCCEEDED");
  });
  it("keeps the successful explanation when regenerate returns a typed provider/output failure", async () => {
    await login();
    const a = await analyticsService.getDashboard(scope);
    const id = a.overviewRef.analysisId;
    await analyticsService.createAnalysisJob(
      { analysisId: id },
      {
        key: "good",
      },
    );
    await waitJob();
    const good = await analyticsService.getAnalysisDetail(id);
    const job = await analyticsService.createAnalysisJob(
      { analysisId: id, generationMode: "REGENERATE" },
      {
        key: "bad",
        scenario: "llm-invalid",
      },
    );
    await waitJob();
    expect(await analyticsService.getAnalysisJob(job.id)).toMatchObject({
      status: "FAILED",
      error: { retryable: true },
    });
    expect(db.jobs.get(job.id)?.error?.code).toBe("OUTPUT_INVALID");
    const failed = await analyticsService.getAnalysisDetail(id);
    expect(failed.snapshot).toEqual(good.snapshot);
    expect(failed.explanation.status).toBe("FAILED");
    expect(failed.explanation.lastSuccess).toEqual(
      good.explanation.lastSuccess,
    );
  });
  it("appends bottleneck feedback without altering tasks, alerts or the snapshot; blocks stale feedback", async () => {
    await login();
    const a = await analyticsService.getBottlenecks(scope);
    const id = a.items[0].analysisRef.analysisId;
    const request = {
      params: { analysisId: id },
      body: {
        verdict: "CONFIRMED" as const,
        comment: "Cần xử lý hàng chờ nghiệm thu.",
      },
      key: "feedback",
    };
    const tasks = structuredClone(db.tasks);
    const alerts = structuredClone(db.alerts);
    const detail = await analyticsService.getAnalysisDetail(id);
    const one = await analyticsService.createAnalysisFeedback(
      request.params.analysisId,
      request.body,
      {
        key: request.key,
      },
    );
    const two = await analyticsService.createAnalysisFeedback(
      request.params.analysisId,
      request.body,
      {
        key: request.key,
      },
    );
    expect(one).toEqual(two);
    expect(db.feedback).toHaveLength(1);
    expect(db.tasks).toEqual(tasks);
    expect(db.alerts).toEqual(alerts);
    expect(
      (await analyticsService.getAnalysisDetail(id)).feedback.latest,
    ).toEqual(one);
    const stored = db.details.get(id)!;
    expect(stored).not.toHaveProperty("freshness");
    expect(stored).not.toHaveProperty("feedback");
    const member = db.members.find(
      (item) => item.userId === "u-pm" && item.projectId === "p-main",
    )!;
    const permissions = member.permissions;
    member.permissions = permissions.filter(
      (value) => value !== "ALERTS_MANAGE",
    );
    expect(
      (await analyticsService.getAnalysisDetail(id)).feedback.canSubmit,
    ).toBe(false);
    expect(detail.feedback.canSubmit).toBe(true);
    member.permissions = permissions;
    db.revision++;
    const stale = await analyticsService.getAnalysisDetail(id);
    expect(stale.snapshot).toEqual(detail.snapshot);
    expect(stale.freshness.status).toBe("OUTDATED");
    await expect(
      analyticsService.createAnalysisFeedback(
        request.params.analysisId,
        request.body,
        {
          key: "late",
        },
      ),
    ).rejects.toMatchObject({ status: 409 });
  });
  it("denies old analysis/job access after permission loss and expires snapshots", async () => {
    await login();
    const a = await analyticsService.getDashboard(scope);
    const id = a.overviewRef.analysisId;
    const job = await analyticsService.createAnalysisJob(
      { analysisId: id },
      {
        key: "queued",
      },
    );
    db.members.find(
      (m) => m.userId === "u-pm" && m.projectId === "p-main",
    )!.permissions = [];
    await expect(analyticsService.getAnalysisDetail(id)).rejects.toMatchObject({
      status: 403,
    });
    await expect(analyticsService.getAnalysisJob(job.id)).rejects.toMatchObject(
      { status: 403 },
    );
    db.members.find(
      (m) => m.userId === "u-pm" && m.projectId === "p-main",
    )!.permissions = ["ANALYTICS_VIEW"];
    setClock("2026-12-01T00:00:00.000Z");
    await login();
    await expect(analyticsService.getAnalysisDetail(id)).rejects.toMatchObject({
      status: 410,
    });
  });
  it("requires an alert resolution note and keeps conditionActive separate from human resolution", async () => {
    await login();
    const alert = await alertsService.getAlert("alert-1");
    const task = structuredClone(db.tasks.find((t) => t.id === alert.taskId));
    await expect(
      alertsService.updateAlert(
        alert.id,
        { status: "RESOLVED" },
        {
          version: alert.version,
          key: "empty-note",
        },
      ),
    ).rejects.toMatchObject({ status: 422 });
    const updated = await alertsService.updateAlert(
      alert.id,
      {
        status: "RESOLVED",
        resolutionNote: "Đã lên lịch đối chiếu kết quả.",
      },
      {
        version: alert.version,
        key: "resolved",
      },
    );
    expect(updated.conditionActive).toBe(true);
    expect(updated.handledBy).toBe("u-pm");
    expect(db.tasks.find((t) => t.id === alert.taskId)).toEqual(task);
    await expect(
      alertsService.updateAlert(
        alert.id,
        { status: "READ" },
        {
          version: alert.version,
          key: "stale",
        },
      ),
    ).rejects.toMatchObject({ status: 412 });
  });
  it("evaluates alert conditions independently and deduplicates repeated scheduler ticks; GET does not run rules", async () => {
    await login();
    const count = db.alerts.length;
    await alertsService.listAlerts({});
    expect(db.alerts.length).toBe(count);
    evaluateAlertRules();
    const after = db.alerts.length;
    const outbox = db.outbox.length;
    evaluateAlertRules();
    expect(db.alerts.length).toBe(after);
    expect(db.outbox.length).toBe(outbox);
    const task = db.tasks.find((t) => t.id === "t-4")!;
    task.status = "COMPLETED";
    evaluateAlertRules();
    expect(db.alerts.find((a) => a.id === "alert-1")?.conditionActive).toBe(
      false,
    );
  });
});
