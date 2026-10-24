import { z } from "zod";
import seed from "../data/seed.mock.json";
import * as d from "./model-contracts";

const userDomain = z.object(d.UsersUserSchema.shape).omit({ unit: true });
const projectDomain = z
  .object(d.ProjectsProjectSchema.shape)
  .omit({ owner: true, unit: true });
const memberDomain = z
  .object(d.MembersMembershipSchema.shape)
  .omit({ user: true });
const taskDomain = z
  .object(d.TasksTaskSchema.shape)
  .omit({ assignee: true, project: true });
const logDomain = z.object(d.LogsTimeLogSchema.shape).omit({ user: true });
const submissionDomain = z
  .object(d.SubmissionsSubmissionSchema.shape)
  .omit({ submitter: true, reviewer: true });
const reportDomain = z
  .object(d.ReportsReportSchema.shape)
  .omit({ author: true });
const alertDomain = z
  .object(d.AlertsAlertSchema.shape)
  .omit({ taskTitle: true, analysisRef: true });
export type Task = z.output<typeof taskDomain>;
export type Report = z.output<typeof reportDomain>;
export type User = z.output<typeof userDomain>;
const baseClock = seed.analysis.mockClock;
export let clock = baseClock;
export const now = () => clock;
export const today = () =>
  new Date(new Date(clock).getTime() + 7 * 3600_000).toISOString().slice(0, 10);
export const entity = (id = crypto.randomUUID()) => ({
  id,
  version: 1,
  createdAt: now(),
  updatedAt: now(),
});
export const projectPermissions = [
  "PROJECT_MANAGE",
  "MEMBERS_MANAGE",
  "TASKS_MANAGE",
  "TASKS_REVIEW",
  "ANALYTICS_VIEW",
  "ALERTS_MANAGE",
] as const;
function createDatabase() {
  const units = z.array(d.OrganizationUnitSchema).parse(seed.units);
  const users = z.array(userDomain).parse(seed.users);
  const projects = z
    .array(projectDomain)
    .parse([...seed.projects, seed.planned]);
  const members = z.array(memberDomain).parse(seed.members);
  members.push(
    memberDomain.parse({
      ...entity("m-pm-planned"),
      projectId: "p-planned",
      userId: "u-pm",
      projectRole: "OWNER",
      permissions: [...projectPermissions],
      joinedAt: now(),
      endedAt: null,
    }),
  );
  const tasks = z.array(taskDomain).parse(seed.tasks);
  const timeLogs = z.array(logDomain).parse(seed.timeLogs);
  const submissions = z.array(submissionDomain).parse(seed.submissions);
  const reports = z.array(reportDomain).parse([
    {
      ...entity("r-draft"),
      projectId: "p-main",
      authorId: "u-lan",
      periodType: "DAILY",
      periodStart: "2026-10-23",
      achievements: "Hoàn thiện luồng giao việc và các trạng thái xử lý.",
      blockers: "",
      nextPlan: "Đối chiếu tiêu chí nghiệm thu và nộp kết quả.",
      selectedTaskIds: ["t-3"],
      status: "DRAFT",
      zeroTimeReason: null,
      snapshot: null,
      submittedAt: null,
    },
    {
      ...entity("r-submitted"),
      projectId: "p-main",
      authorId: "u-lan",
      periodType: "DAILY",
      periodStart: "2026-10-22",
      achievements: "Hoàn thành chuẩn hóa biểu mẫu.",
      blockers: "",
      nextPlan: "Tiếp tục thiết kế luồng giao việc.",
      selectedTaskIds: ["t-5"],
      status: "SUBMITTED",
      zeroTimeReason: null,
      submittedAt: "2026-10-22T10:00:00.000Z",
      snapshot: {
        projectId: "p-main",
        periodType: "DAILY",
        periodStart: "2026-10-22",
        periodEndExclusive: "2026-10-22T17:00:00.000Z",
        dataAsOf: "2026-10-22T10:00:00.000Z",
        totalMinutes: 60,
        items: [
          {
            taskId: "t-5",
            title: "Chuẩn hóa biểu mẫu",
            status: "COMPLETED",
            minutes: 60,
          },
        ],
        partialPeriod: false,
      },
    },
  ]);
  const attachments = z.array(d.AttachmentsAttachmentSchema).parse([
    {
      ...entity("a-flow"),
      taskId: "t-4",
      uploadedBy: "u-huy",
      filename: "flow.pdf",
      mimeType: "application/pdf",
      sizeBytes: 590,
      status: "READY",
    },
    {
      ...entity("a-criteria"),
      taskId: "t-3",
      uploadedBy: "u-lan",
      filename: "criteria.pdf",
      mimeType: "application/pdf",
      sizeBytes: 590,
      status: "READY",
    },
  ]);
  const pending = submissions.find((s) => s.id === "s-pending");
  if (pending) pending.attachmentIds = ["a-flow"];
  const details = new Map<string, d.AnalyticsAnalysisDetailDTO>();
  for (const item of seed.analysis.analysisDetails) {
    const detail = d.AnalyticsAnalysisDetailSchema.parse({
      ...item,
      systemSummary:
        "Số liệu được tổng hợp từ công việc, nhật ký và các lần nộp trong phạm vi đã chọn.",
      feedback: {
        latest: null,
        canSubmit: item.snapshot.analysisType === "BOTTLENECK",
      },
    });
    details.set(detail.snapshot.analysisId, detail);
  }
  const audits: d.TasksAuditDTO[] = tasks
    .filter((t) => t.projectId === "p-main")
    .map((t) => ({
      id: `audit-${t.id}`,
      entityType: "TASK",
      entityId: t.id,
      actorId: "u-pm",
      action: "Tạo công việc",
      at: t.createdAt,
      before: null,
      after: { title: t.title },
      reason: null,
    }));
  for (const [action, at] of [
    ["Phân công cho Trần Lan", "2026-10-22T01:00:00.000Z"],
    ["Bắt đầu thực hiện", "2026-10-22T02:00:00.000Z"],
    ["Ghi nhận 180 phút", "2026-10-23T09:00:00.000Z"],
  ])
    audits.push({
      id: crypto.randomUUID(),
      entityType: "TASK",
      entityId: "t-3",
      actorId: action.includes("Phân") ? "u-pm" : "u-lan",
      action,
      at,
      before: null,
      after: null,
      reason: null,
    });
  audits.push({
    id: "audit-p-main",
    entityType: "PROJECT",
    entityId: "p-main",
    actorId: "u-pm",
    action: "Triển khai dự án",
    at: "2026-10-01T02:00:00.000Z",
    before: { status: "PLANNED" },
    after: { status: "ACTIVE" },
    reason: null,
  });
  return {
    users,
    units,
    projects,
    members,
    tasks,
    timeLogs,
    submissions,
    reports,
    attachments,
    audits,
    teams: z.array(d.OrganizationTeamSchema).parse(seed.teams),
    alerts: z.array(alertDomain).parse(seed.alerts),
    assignments: z
      .array(
        z.object({
          id: z.string(),
          taskId: z.string(),
          userId: z.string(),
          startedAt: z.iso.datetime(),
          endedAt: z.iso.datetime().nullable(),
          reason: z.string().nullable(),
        }),
      )
      .parse(seed.assignments),
    details,
    jobs: new Map<string, d.AnalyticsAnalysisJobDTO>(),
    feedback: [] as d.AnalyticsAnalysisFeedbackDTO[],
    outbox: [] as {
      id: string;
      eventId: string;
      recipientId: string;
      status: "PENDING" | "SENT" | "FAILED";
      attemptCount: number;
    }[],
    passwords: new Map(users.map((u) => [u.id, "Mock@12345"])),
    revoked: new Set<string>(),
    files: new Map<string, Blob>(),
    revision: 1,
  };
}
export let db = createDatabase();
const timers = new Set<ReturnType<typeof setTimeout>>();
export function schedule(fn: () => void, ms: number) {
  const timer = setTimeout(() => {
    timers.delete(timer);
    fn();
  }, ms);
  timers.add(timer);
}
export function resetDatabase() {
  for (const t of timers) clearTimeout(t);
  timers.clear();
  clock = baseClock;
  db = createDatabase();
}
export function setClock(value: string) {
  clock = z.iso.datetime().parse(value);
}
export function restoreDatabase(value: typeof db) {
  db = value;
}
export function touch(v: { version: number; updatedAt: string }) {
  v.version++;
  v.updatedAt = now();
  db.revision++;
}
export const person = (id: string) => {
  const u = db.users.find((u) => u.id === id);
  if (!u) throw new Error(`Missing person ${id}`);
  return { id, displayName: u.displayName };
};
export const userDTO = (u: User) =>
  d.UsersUserSchema.parse({
    ...u,
    unit: {
      id: u.unitId,
      name: db.units.find((v) => v.id === u.unitId)?.name ?? "",
    },
  });
export const projectDTO = (p: (typeof db.projects)[number]) =>
  d.ProjectsProjectSchema.parse({
    ...p,
    owner: person(p.ownerId),
    unit: {
      id: p.unitId,
      name: db.units.find((u) => u.id === p.unitId)?.name ?? "",
    },
  });
export const memberDTO = (m: (typeof db.members)[number]) =>
  d.MembersMembershipSchema.parse({ ...m, user: person(m.userId) });
export const taskDTO = (t: Task) =>
  d.TasksTaskSchema.parse({
    ...t,
    actualMinutes: db.timeLogs
      .filter((l) => l.taskId === t.id && l.status === "ACTIVE")
      .reduce((s, l) => s + l.minutes, 0),
    isOverdue:
      !["COMPLETED", "CANCELLED"].includes(t.status) && now() > t.dueAt,
    assignee: t.assigneeId ? person(t.assigneeId) : null,
    project: {
      id: t.projectId,
      name: db.projects.find((p) => p.id === t.projectId)?.name ?? "",
    },
  });
export const logDTO = (l: (typeof db.timeLogs)[number]) =>
  d.LogsTimeLogSchema.parse({ ...l, user: person(l.userId) });
export const submissionDTO = (s: (typeof db.submissions)[number]) =>
  d.SubmissionsSubmissionSchema.parse({
    ...s,
    submitter: person(s.submittedBy),
    reviewer: s.reviewedBy ? person(s.reviewedBy) : null,
  });
export const reportDTO = (r: Report) =>
  d.ReportsReportSchema.parse({ ...r, author: person(r.authorId) });
export function sessionDTO(u: User): d.AuthSessionDTO {
  return {
    user: userDTO(u),
    systemPermissions:
      u.systemRole === "ADMIN"
        ? ["USERS_MANAGE", "ORGANIZATION_MANAGE"]
        : u.systemRole === "MANAGER"
          ? ["PROJECT_CREATE"]
          : [],
    projectAccess: db.members
      .filter((m) => m.userId === u.id && !m.endedAt)
      .map((m) => ({
        projectId: m.projectId,
        membershipId: m.id,
        permissions: m.permissions,
      })),
  };
}
export const can = (u: User, permission: string, projectId?: string) =>
  projectId
    ? db.members.some(
        (m) =>
          m.projectId === projectId &&
          m.userId === u.id &&
          !m.endedAt &&
          m.permissions.some((p) => p === permission),
      )
    : sessionDTO(u).systemPermissions.some((p) => p === permission);
export const inProject = (u: User, projectId: string) =>
  db.members.some(
    (m) => m.projectId === projectId && m.userId === u.id && !m.endedAt,
  );
export function visibleTask(u: User, t: Task) {
  return (
    inProject(u, t.projectId) &&
    (can(u, "TASKS_MANAGE", t.projectId) ||
      can(u, "TASKS_REVIEW", t.projectId) ||
      can(u, "ANALYTICS_VIEW", t.projectId) ||
      t.assigneeId === u.id ||
      db.assignments.some((a) => a.taskId === t.id && a.userId === u.id))
  );
}
export function audit(
  actorId: string,
  entityType: string,
  entityId: string,
  action: string,
  before: d.TasksAuditDTO["before"],
  after: d.TasksAuditDTO["after"],
  reason: string | null = null,
) {
  db.audits.push({
    id: crypto.randomUUID(),
    actorId,
    entityType,
    entityId,
    action,
    at: now(),
    before,
    after,
    reason,
  });
}
export function notify(recipientId: string) {
  db.outbox.push({
    id: crypto.randomUUID(),
    eventId: crypto.randomUUID(),
    recipientId,
    status: "SENT",
    attemptCount: 1,
  });
}
export function reportPreview(
  r: Pick<Report, "projectId" | "periodType" | "periodStart" | "authorId">,
): d.ReportsReportPreviewDTO {
  const end = new Date(`${r.periodStart}T00:00:00+07:00`);
  end.setUTCDate(end.getUTCDate() + (r.periodType === "DAILY" ? 1 : 7));
  const logs = db.timeLogs.filter(
    (l) =>
      l.userId === r.authorId &&
      l.status === "ACTIVE" &&
      l.workDate >= r.periodStart &&
      `${l.workDate}T00:00:00+07:00` &&
      new Date(`${l.workDate}T00:00:00+07:00`) < end &&
      db.tasks.some((t) => t.id === l.taskId && t.projectId === r.projectId),
  );
  const items = [...new Set(logs.map((l) => l.taskId))].map((id) => {
    const t = db.tasks.find((t) => t.id === id)!;
    return {
      taskId: id,
      title: t.title,
      status: t.status,
      minutes: logs
        .filter((l) => l.taskId === id)
        .reduce((a, l) => a + l.minutes, 0),
    };
  });
  return {
    projectId: r.projectId,
    periodType: r.periodType,
    periodStart: r.periodStart,
    periodEndExclusive: end.toISOString(),
    dataAsOf: now(),
    totalMinutes: items.reduce((s, i) => s + i.minutes, 0),
    items,
    partialPeriod: end.toISOString() > now(),
  };
}
