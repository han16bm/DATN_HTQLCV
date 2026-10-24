import { alertSchema } from "@/features/alerts/schemas/alerts.schema";
import { analysisSchema } from "@/features/analytics/schemas/analysis-detail.schema";
import {
  type AnalysisDto,
  type FeedbackDto,
  type JobDto,
} from "@/features/analytics/types/analytics.types";
import { attachmentSchema } from "@/features/attachments/schemas/attachments.schema";
import { type SessionDto } from "@/features/auth/types/auth.types";
import { teamSchema } from "@/features/organization/schemas/team.schema";
import { unitSchema } from "@/features/organization/schemas/unit.schema";
import { membershipSchema } from "@/features/project-members/schemas/project-members.schema";
import { projectSchema } from "@/features/projects/schemas/projects.schema";
import { reportSchema } from "@/features/reports/schemas/reports.schema";
import { type ReportPreviewDto } from "@/features/reports/types/reports.types";
import { submissionSchema } from "@/features/submissions/schemas/submissions.schema";
import { taskSchema } from "@/features/tasks/schemas/task.schema";
import { timeLogSchema } from "@/features/time-logs/schemas/time-logs.schema";
import { userSchema } from "@/features/users/schemas/user.schema";
import { auditSchema } from "@/lib/validation/common.schema";
import { type AuditDto } from "@/types/common";
import { z } from "zod";
import { createSeedData } from "../data/bootstrap.mock";
import { samplePDF } from "../data/evidence.mock";
import seed from "../data/seed.mock.json";
const userDomain = z.object(userSchema.shape).omit({ unit: true });
const projectDomain = z
  .object(projectSchema.shape)
  .omit({ owner: true, unit: true });
const memberDomain = z.object(membershipSchema.shape).omit({ user: true });
const taskDomain = z
  .object(taskSchema.shape)
  .omit({ assignee: true, project: true });
const logDomain = z.object(timeLogSchema.shape).omit({ user: true });
const submissionDomain = z
  .object(submissionSchema.shape)
  .omit({ submitter: true, reviewer: true });
const reportDomain = z.object(reportSchema.shape).omit({ author: true });
const alertDomain = z
  .object(alertSchema.shape)
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
  const units = z.array(unitSchema).parse(seed.units);
  const users = z.array(userDomain).parse(seed.users);
  const projects = z
    .array(projectDomain)
    .parse([...seed.projects, seed.planned]);
  const tasks = z.array(taskDomain).parse(seed.tasks);
  const fixtures = createSeedData(entity, now, tasks, projectPermissions);
  const members = z
    .array(memberDomain)
    .parse([...seed.members, fixtures.plannedOwner]);
  const timeLogs = z.array(logDomain).parse(seed.timeLogs);
  const submissions = z.array(submissionDomain).parse(fixtures.submissions);
  const reports = z.array(reportDomain).parse(fixtures.reports);
  const attachments = z.array(attachmentSchema).parse(fixtures.attachments);
  const audits = z.array(auditSchema).parse(fixtures.audits);
  const files = new Map<string, Blob>();
  for (const attachment of attachments) {
    const file = samplePDF();
    files.set(attachment.id, file);
    attachment.sizeBytes = file.size;
  }
  const details = new Map<string, AnalysisDto>();
  for (const item of fixtures.analysisDetails) {
    const detail = analysisSchema.parse(item);
    details.set(detail.snapshot.analysisId, detail);
  }
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
    teams: z.array(teamSchema).parse(seed.teams),
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
    snapshotIndex: new Map<string, string>(),
    snapshotProjects: new Map<string, string[]>(),
    jobs: new Map<string, JobDto>(),
    feedback: [] as FeedbackDto[],
    outbox: [] as {
      id: string;
      eventId: string;
      recipientId: string;
      status: "PENDING" | "SENT" | "FAILED";
      attemptCount: number;
    }[],
    passwords: new Map(users.map((u) => [u.id, fixtures.defaultPassword])),
    revoked: new Set<string>(),
    sessions: new Map<string, string>(),
    sessionExpiry: new Map<string, string>(),
    files,
    revision: 1,
    requiredReports: new Map<string, number>(),
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
  userSchema.parse({
    ...u,
    unit: {
      id: u.unitId,
      name: db.units.find((v) => v.id === u.unitId)?.name ?? "",
    },
  });
export const projectDTO = (p: (typeof db.projects)[number]) =>
  projectSchema.parse({
    ...p,
    owner: person(p.ownerId),
    unit: {
      id: p.unitId,
      name: db.units.find((u) => u.id === p.unitId)?.name ?? "",
    },
  });
export const memberDTO = (m: (typeof db.members)[number]) =>
  membershipSchema.parse({ ...m, user: person(m.userId) });
export const taskDTO = (t: Task) =>
  taskSchema.parse({
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
  timeLogSchema.parse({ ...l, user: person(l.userId) });
export const submissionDTO = (s: (typeof db.submissions)[number]) =>
  submissionSchema.parse({
    ...s,
    submitter: person(s.submittedBy),
    reviewer: s.reviewedBy ? person(s.reviewedBy) : null,
  });
export const reportDTO = (r: Report) =>
  reportSchema.parse({ ...r, author: person(r.authorId) });
export function sessionDTO(u: User): SessionDto {
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
  before: AuditDto["before"],
  after: AuditDto["after"],
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
): ReportPreviewDto {
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
