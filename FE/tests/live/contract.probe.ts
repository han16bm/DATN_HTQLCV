// Kiểm hợp đồng FE ↔ BE thật: gọi các service GET của FE (đúng code path của trình duyệt) vào gateway đang chạy,
// response phải parse được bằng schema Zod của FE. Chỉ đọc, không ghi dữ liệu.
// Chạy: npm run test:live (BE ở http://localhost:5000, đổi bằng LIVE_API_BASE_URL). Mật khẩu seed: LIVE_PASSWORD.
import { alertsService } from "@/features/alerts/api/alerts.service";
import { analyticsService } from "@/features/analytics/api/analytics.service";
import { attachmentsService } from "@/features/attachments/api/attachments.service";
import { auditLogsService } from "@/features/audit-logs/api/audit-logs.service";
import { authService } from "@/features/auth/api/auth.service";
import { ipWhitelistService } from "@/features/ip-whitelist/api/ip-whitelist.service";
import { jobsService } from "@/features/jobs/api/jobs.service";
import { notificationsService } from "@/features/notifications/api/notifications.service";
import { organizationService } from "@/features/organization/api/organization.service";
import { permissionsService } from "@/features/permissions/api/permissions.service";
import { projectMembersService } from "@/features/project-members/api/project-members.service";
import { projectsService } from "@/features/projects/api/projects.service";
import { reportsService } from "@/features/reports/api/reports.service";
import { settingsService } from "@/features/settings/api/settings.service";
import { submissionsService } from "@/features/submissions/api/submissions.service";
import { tasksService } from "@/features/tasks/api/tasks.service";
import { timeLogsService } from "@/features/time-logs/api/time-logs.service";
import { usersService } from "@/features/users/api/users.service";
import { apiClient, token } from "@/services/api-client";
import type { AxiosResponse } from "axios";
import { expect, it } from "vitest";

type Row = { user: string; call: string; result: string; detail?: string };
const rows: Row[] = [];
let lastIssues: string | undefined;

// Bắt chi tiết lỗi schema: interceptor gốc chỉ ném ContractError chung chung.
const handler = (
  apiClient.interceptors.response as unknown as {
    handlers: { fulfilled: (response: AxiosResponse) => unknown }[];
  }
).handlers[0];
const original = handler.fulfilled;
handler.fulfilled = (response) => {
  const schema = response.config.schema;
  if (schema && response.config.responseType !== "blob") {
    const parsed = schema.safeParse(response.data);
    if (!parsed.success)
      lastIssues = parsed.error.issues
        .slice(0, 6)
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join(" | ");
  }
  return original(response);
};

async function call<T>(user: string, label: string, fn: () => Promise<T>) {
  lastIssues = undefined;
  const started = Date.now();
  try {
    const data = await fn();
    rows.push({ user, call: label, result: "ok" });
    if (process.env.LIVE_VERBOSE)
      console.log(`${user} ${label} ok ${Date.now() - started}ms`);
    return data;
  } catch (error) {
    const e = error as {
      name?: string;
      status?: number;
      code?: string;
      message?: string;
    };
    rows.push({
      user,
      call: label,
      result:
        e.name === "ContractError" ? "SCHEMA" : String(e.status ?? e.name),
      detail: lastIssues ?? `${e.code ?? ""} ${e.message ?? ""}`.trim(),
    });
    if (process.env.LIVE_VERBOSE)
      console.log(
        `${user} ${label} ${rows.at(-1)!.result} ${Date.now() - started}ms`,
      );
    return undefined;
  }
}

const today = new Date().toISOString().slice(0, 10);
const monthAgo = new Date(Date.now() - 35 * 86400_000)
  .toISOString()
  .slice(0, 10);
const range = { from: monthAgo, to: today };

async function probe(user: string) {
  const session = await authService.login({
    username: user,
    password: process.env.LIVE_PASSWORD ?? "Mock@12345",
  });
  const u = (label: string) => label;
  await call(user, u("getSession"), () => authService.getSession());
  const users = await call(user, "listUsers", () =>
    usersService.listUsers({ pageSize: 50 }),
  );
  const someone =
    users?.items.find((x) => x.id !== session.user.id)?.id ?? session.user.id;
  await call(user, "getUser", () => usersService.getUser(someone));
  await call(user, "getProfile", () => usersService.getProfile(someone));
  await call(user, "listUserProjects", () =>
    usersService.listUserProjects(someone),
  );
  await call(user, "getUserPermissions", () =>
    usersService.getUserPermissions(someone),
  );

  const units = await call(user, "listUnits", () =>
    organizationService.listUnits({}),
  );
  if (units?.items[0])
    await call(user, "getUnit", () =>
      organizationService.getUnit(units.items[0].id),
    );
  const teams = await call(user, "listTeams", () =>
    organizationService.listTeams({}),
  );
  if (teams?.items[0])
    await call(user, "getTeam", () =>
      organizationService.getTeam(teams.items[0].id),
    );

  await call(user, "listFeatures", () => permissionsService.listFeatures());
  const groups = await call(user, "listPermissionGroups", () =>
    permissionsService.listPermissionGroups({}),
  );
  if (groups?.items[0])
    await call(user, "getPermissionGroup", () =>
      permissionsService.getPermissionGroup(groups.items[0].id),
    );
  await call(user, "listSettings", () => settingsService.listSettings({}));
  await call(user, "getIpWhitelist", () => ipWhitelistService.getIpWhitelist());
  await call(user, "listIpAccessLogs", () =>
    ipWhitelistService.listIpAccessLogs({}),
  );
  await call(user, "listProjectRolePolicies", () =>
    permissionsService.listProjectRolePolicies(),
  );
  const audits = await call(user, "listAuditLogs", () =>
    auditLogsService.listAuditLogs({}),
  );
  if (audits?.items[0])
    await call(user, "getAuditLog", () =>
      auditLogsService.getAuditLog(audits.items[0].id),
    );
  await call(user, "listEntityTypes", () => auditLogsService.listEntityTypes());
  const jobs = await call(user, "listJobs", () => jobsService.listJobs());
  if (jobs?.[0])
    await call(user, "listJobRuns", () =>
      jobsService.listJobRuns(jobs[0].code),
    );

  await call(user, "notifications.list", () => notificationsService.list({}));
  await call(user, "notifications.summary", () =>
    notificationsService.summary(),
  );

  const projects = await call(user, "listProjects", () =>
    projectsService.listProjects({ pageSize: 50 }),
  );
  const project = projects?.items[0];
  if (project) {
    await call(user, "getProject", () =>
      projectsService.getProject(project.id),
    );
    await call(user, "getProjectClosureChecks", () =>
      projectsService.getProjectClosureChecks(project.id),
    );
    await call(user, "listProjectHistory", () =>
      projectsService.listProjectHistory(project.id),
    );
    await call(user, "listProjectMembers", () =>
      projectMembersService.listProjectMembers(project.id),
    );
    await call(user, "getReportPreview", () =>
      reportsService.getReportPreview({
        projectId: project.id,
        periodType: "WEEKLY",
        periodStart: monthAgo,
      }),
    );
  }

  const tasks = await call(user, "listTasks", () =>
    tasksService.listTasks({ pageSize: 50 }),
  );
  for (const task of tasks?.items.slice(0, 3) ?? []) {
    await call(user, "getTask", () => tasksService.getTask(task.id));
    await call(user, "listTaskHistory", () =>
      tasksService.listTaskHistory(task.id),
    );
    await call(user, "listTimeLogs", () =>
      timeLogsService.listTimeLogs(task.id),
    );
    const subs = await call(user, "listSubmissions", () =>
      submissionsService.listSubmissions(task.id),
    );
    const sub = subs?.items[0];
    if (sub) {
      const detail = await call(user, "getSubmission", () =>
        submissionsService.getSubmission(task.id, sub.id),
      );
      for (const attachmentId of detail?.attachmentIds.slice(0, 1) ?? []) {
        await call(user, "getAttachment", () =>
          attachmentsService.getAttachment(attachmentId),
        );
        await call(user, "downloadAttachment", () =>
          attachmentsService.downloadAttachment(attachmentId),
        );
      }
    }
  }
  await call(user, "listReviewQueue", () =>
    submissionsService.listReviewQueue({}),
  );
  await call(user, "getUploadPolicy", () =>
    attachmentsService.getUploadPolicy(),
  );

  const reports = await call(user, "listReports", () =>
    reportsService.listReports({}),
  );
  if (reports?.items[0])
    await call(user, "getReport", () =>
      reportsService.getReport(reports.items[0].id),
    );

  const alerts = await call(user, "listAlerts", () =>
    alertsService.listAlerts({}),
  );
  if (alerts?.items[0])
    await call(user, "getAlert", () =>
      alertsService.getAlert(alerts.items[0].id),
    );

  await call(user, "getDashboard", () => analyticsService.getDashboard(range));
  await call(user, "getDeadlineRisks", () =>
    analyticsService.getDeadlineRisks(range),
  );
  await call(user, "getWorkload", () => analyticsService.getWorkload(range));
  await call(user, "getBottlenecks", () =>
    analyticsService.getBottlenecks(range),
  );
  const summary = await call(user, "getAnalysisSummary", () =>
    analyticsService.getAnalysisSummary(range),
  );
  if (summary) {
    await call(user, "getAnalysisDetail(overview)", () =>
      analyticsService.getAnalysisDetail(summary.overviewRef.analysisId),
    );
    for (const highlight of summary.highlights.slice(0, 1))
      await call(user, "getAnalysisDetail(highlight)", () =>
        analyticsService.getAnalysisDetail(highlight.analysisRef.analysisId),
      );
  }
  const risks = await call(user, "getDeadlineRisks(ref)", () =>
    analyticsService.getDeadlineRisks(range),
  );
  if (risks?.items[0])
    await call(user, "getAnalysisDetail(risk)", () =>
      analyticsService.getAnalysisDetail(risks.items[0].analysisRef.analysisId),
    );
  const workload = await call(user, "getWorkload(ref)", () =>
    analyticsService.getWorkload(range),
  );
  if (workload?.items[0])
    await call(user, "getAnalysisDetail(workload)", () =>
      analyticsService.getAnalysisDetail(
        workload.items[0].analysisRef.analysisId,
      ),
    );
  if (project) {
    await call(user, "getDashboard(project)", () =>
      analyticsService.getDashboard({ ...range, projectId: project.id }),
    );
    await call(user, "getAnalysisSummary(project)", () =>
      analyticsService.getAnalysisSummary({ ...range, projectId: project.id }),
    );
  }
  for (const kind of ["UNIT", "PROJECT", "TEAM", "PERSON"] as const)
    await call(user, `filterOptions ${kind}`, () =>
      analyticsService.listAnalyticsFilterOptions({ kind }),
    );
  token.set(null);
}

it("FE schemas parse every live GET response", async () => {
  for (const user of (process.env.LIVE_USERS ?? "admin,minh,lan").split(","))
    await probe(user);
  const bad = rows.filter(
    (r) => r.result === "SCHEMA" || r.result === "404" || /^5/.test(r.result),
  );
  console.log(
    rows
      .filter((r) => r.result !== "ok")
      .map(
        (r) =>
          `${r.user.padEnd(6)} ${r.call.padEnd(28)} ${r.result.padEnd(8)} ${r.detail ?? ""}`,
      )
      .join("\n") || "all ok",
  );
  console.log(
    `calls: ${rows.length}, ok: ${rows.filter((r) => r.result === "ok").length}, bad: ${bad.length}`,
  );
  expect(bad).toEqual([]);
});
