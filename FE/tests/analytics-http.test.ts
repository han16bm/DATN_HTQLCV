import { alertsService } from "@/features/alerts/api/alerts.service";
import { analyticsService } from "@/features/analytics/api/analytics.service";
import { authService } from "@/features/auth/api/auth.service";
import { metricValue } from "@/lib/format";
import { reportsService } from "@/features/reports/api/reports.service";
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
// ANALYTICS_VIEW ở phạm vi hệ thống do backend cấp qua nhóm quyền, không theo role.
const grantSystemAnalytics = (userId: string) =>
  db.permissionGroups
    .find((group) => group.features.includes("ANALYTICS_VIEW"))!
    .memberIds.push(userId);
const scope = { projectId: "p-main", from: "2026-10-01", to: "2026-10-23" };
const waitJob = () => new Promise((resolve) => setTimeout(resolve, 1650));
describe("analytics snapshots, jobs and alerts over HTTP", () => {
  it("derives analytics dates, empty trends and alert scopes from the current source clock", async () => {
    const current = "2027-02-10T03:30:00.000Z";
    setClock(current);
    await login();
    const period = {
      projectId: "p-main",
      from: "2027-02-01",
      to: "2027-02-10",
    };
    const dashboard = await analyticsService.getDashboard(period);
    expect(dashboard.metadata.dataAsOf).toBe(current);
    expect(dashboard.trend).toEqual([]);
    const detail = await analyticsService.getAnalysisDetail(
      dashboard.overviewRef.analysisId,
    );
    expect(detail.snapshot.dataAsOf).toBe(current);
    const stored = db.details.get(detail.snapshot.analysisId)!;
    expect(Date.parse(stored.snapshot.expiresAt)).toBeGreaterThan(
      Date.parse(current),
    );
    const alert = await alertsService.getAlert("alert-1");
    const source = await analyticsService.getAnalysisDetail(
      alert.analysisRef!.analysisId,
    );
    expect(source.snapshot.scope).toEqual(period);
    setClock("2027-02-10T03:35:00.000Z");
    const next = await analyticsService.getDashboard(period);
    expect(next.metadata.dataAsOf).toBe("2027-02-10T03:35:00.000Z");
    expect(next.overviewRef.analysisId).not.toBe(detail.snapshot.analysisId);
    expect(
      (await analyticsService.getAnalysisDetail(detail.snapshot.analysisId))
        .freshness,
    ).toEqual({
      status: "OUTDATED",
      latestAnalysisId: next.overviewRef.analysisId,
    });
  });
  it("denies an account administrator analytics and project data until ANALYTICS_VIEW is granted", async () => {
    const session = await login("admin");
    expect(session.user.systemRole).toBe("ADMIN");
    expect(session.permissions).toEqual([
      "USERS_MANAGE",
      "ORGANIZATION_MANAGE",
    ]);
    expect(session.projectAccess).toEqual([]);
    await expect(
      analyticsService.getDashboard({ from: scope.from, to: scope.to }),
    ).rejects.toMatchObject({ status: 403 });
    expect(
      (await analyticsService.listAnalyticsFilterOptions({ kind: "PROJECT" }))
        .items,
    ).toEqual([]);
  });
  it("gives a system-wide ANALYTICS_VIEW holder a global dashboard with unit filters and read-only drilldowns", async () => {
    grantSystemAnalytics("u-admin");
    const session = await login("admin");
    expect(session.permissions).toContain("ANALYTICS_VIEW");
    expect(session.permissions).not.toContain("TASKS_REVIEW");
    const query = { from: scope.from, to: scope.to };
    const all = await analyticsService.getDashboard(query);
    expect(
      all.projectComparisons.map((project) => project.projectId).sort(),
    ).toEqual(db.projects.map((project) => project.id).sort());
    expect(all.totalTasks).toBe(db.tasks.length);
    const units = await analyticsService.listAnalyticsFilterOptions({
      kind: "UNIT",
    });
    expect(units.items.map((unit) => unit.id).sort()).toEqual([
      "unit-product",
      "unit-tech",
    ]);
    const tech = await analyticsService.getDashboard({
      ...query,
      unitId: "unit-tech",
    });
    expect(tech.projectComparisons.map((project) => project.projectId)).toEqual(
      ["p-other"],
    );
    expect(tech.totalTasks).toBe(
      db.tasks.filter((task) => task.projectId === "p-other").length,
    );
    const detail = await analyticsService.getAnalysisDetail(
      tech.overviewRef.analysisId,
    );
    expect(detail.snapshot.analysisId).toBe(tech.overviewRef.analysisId);
    expect(detail.feedback.canSubmit).toBe(false);
    await expect(
      reportsService.createReportDraft(
        { projectId: "p-main", periodType: "DAILY", periodStart: "2026-10-21" },
        { key: "admin-report-denied" },
      ),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      alertsService.updateAlert(
        "alert-1",
        { status: "READ" },
        { version: 1, key: "admin-alert-denied" },
      ),
    ).rejects.toMatchObject({ status: 403 });
    await login("minh");
    await expect(
      analyticsService.getDashboard({ ...query, unitId: "unit-tech" }),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      analyticsService.getAnalysisDetail(tech.overviewRef.analysisId),
    ).rejects.toMatchObject({ status: 403 });
  });
  it("returns an empty dashboard for an existing unit without projects", async () => {
    grantSystemAnalytics("u-admin");
    await login("admin");
    db.units.push({
      id: "unit-empty",
      name: "Đơn vị mới",
      version: 1,
      status: "ACTIVE",
      parentId: null,
      managerId: null,
    });
    const query = { from: scope.from, to: scope.to, unitId: "unit-empty" };
    const dashboard = await analyticsService.getDashboard(query);
    expect(dashboard.totalTasks).toBe(0);
    expect(dashboard.projectComparisons).toEqual([]);
    expect(
      (
        await analyticsService.listAnalyticsFilterOptions({
          kind: "PROJECT",
          unitId: query.unitId,
        })
      ).items,
    ).toEqual([]);
    expect(
      (
        await analyticsService.getAnalysisDetail(
          dashboard.overviewRef.analysisId,
        )
      ).snapshot.analysisId,
    ).toBe(dashboard.overviewRef.analysisId);
    await expect(
      analyticsService.getDashboard({ ...query, unitId: "missing-unit" }),
    ).rejects.toMatchObject({ status: 403 });
  });
  it("returns all 16 KPIs, typed missing capacity and stable refs without creating jobs", async () => {
    await login();
    const a = await analyticsService.getDashboard(scope);
    const b = await analyticsService.getDashboard(scope);
    expect(a.metrics.map((m) => m.code)).toHaveLength(16);
    expect(new Set(a.metrics.map((m) => m.code)).size).toBe(16);
    expect(a.overviewRef).toEqual(b.overviewRef);
    expect(db.jobs.size).toBe(0);
    expect(Object.keys(a.metadata).sort()).toEqual(["dataAsOf", "quality"]);
    const count = a.metrics.find((metric) => metric.code === "K01")!;
    const detail = await analyticsService.getAnalysisDetail(
      count.analysisRef.analysisId,
    );
    expect(detail.systemSummary).toMatch(/việc\./);
    expect(detail.systemSummary).not.toMatch(/TASK|COUNT|MINUTE/);
    expect(detail.snapshot.metrics[0].formula).toContain(
      "không tính công việc đã hủy",
    );
    expect(detail.snapshot.metrics[0].formula).not.toContain("K01");
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
    for (const metric of detail.snapshot.metrics) {
      expect(detail.explanation.lastSuccess?.findings[0].text).toContain(
        `${metric.label}: ${metricValue(metric.value, metric.unit)}`,
      );
    }
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
    grantSystemAnalytics("u-admin");
    await authService.login({ username: "admin", password: "Mock@12345" });
    expect(
      (await analyticsService.getAnalysisDetail(id)).feedback.canSubmit,
    ).toBe(false);
    expect(detail.feedback.canSubmit).toBe(true);
    await login();
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
  it("denies old analysis/job access after project role loss and expires snapshots", async () => {
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
    )!.projectRole = "MEMBER";
    await expect(analyticsService.getAnalysisDetail(id)).rejects.toMatchObject({
      status: 403,
    });
    await expect(analyticsService.getAnalysisJob(job.id)).rejects.toMatchObject(
      { status: 403 },
    );
    db.members.find(
      (m) => m.userId === "u-pm" && m.projectId === "p-main",
    )!.projectRole = "OWNER";
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
