import { alertSchema } from "@/features/alerts/schemas/alerts.schema";
import type {
  NotificationDto,
  NotificationQuery,
  NotificationType,
} from "@/features/notifications/types/notifications.types";
import type {
  AlertDto,
  AlertQuery,
  AlertRow,
  UpdateAlertInput,
} from "@/features/alerts/types/alerts.types";
import { analysisSchema } from "@/features/analytics/schemas/analysis-detail.schema";
import {
  explanationStateSchema,
  llmExplanationSchema,
  recommendationSchema,
} from "@/features/analytics/schemas/analysis-explanation.schema";
import { jobErrorSchema } from "@/features/analytics/schemas/analysis-job.schema";
import { qualitySchema } from "@/features/analytics/schemas/analysis-meta.schema";
import {
  analysisSnapshotSchema,
  measureSchema,
} from "@/features/analytics/schemas/analysis-snapshot.schema";
import { analyticsQuerySchema } from "@/features/analytics/schemas/analytics-query.schema";
import { metricSchema } from "@/features/analytics/schemas/dashboard.schema";
import { riskItemSchema } from "@/features/analytics/schemas/risks.schema";
import type {
  AnalysisDto,
  AnalysisMetaDto,
  AnalyticsQuery,
  BottlenecksDto,
  ContextItemDto,
  CreateJobInput,
  DashboardDto,
  EvidenceDto,
  FeedbackDto,
  FeedbackInput,
  FilterOptionsQuery,
  JobDto,
  MeasureDto,
  MetricDto,
  RisksDto,
  SummaryDto,
  WorkloadDto,
} from "@/features/analytics/types/analytics.types";
import { attachmentSchema } from "@/features/attachments/schemas/attachments.schema";
import type {
  AttachmentDto,
  UploadAttachmentInput,
} from "@/features/attachments/types/attachments.types";
import type {
  LoginInput,
  PersonalProfileDto,
  SessionDto,
  UpdateProfileInput,
  ChangePasswordInput,
} from "@/features/auth/types/auth.types";
import { teamSchema } from "@/features/organization/schemas/team.schema";
import { unitSchema } from "@/features/organization/schemas/unit.schema";
import type {
  CreateTeamInput,
  CreateUnitInput,
  DeactivateTeamInput,
  DeactivateUnitInput,
  ReplaceTeamMembersInput,
  TeamDto,
  TeamQuery,
  TeamRow,
  UnitDto,
  UnitQuery,
  UnitRow,
  UpdateTeamInput,
  UpdateUnitInput,
} from "@/features/organization/types/organization.types";
import {
  membershipSchema,
  projectRoleSchema,
} from "@/features/project-members/schemas/project-members.schema";
import type {
  AddProjectMemberInput,
  EndProjectMembershipInput,
  MembershipDto,
  ProjectMemberQuery,
  UpdateProjectMemberRoleInput,
} from "@/features/project-members/types/project-members.types";
import { projectSchema } from "@/features/projects/schemas/projects.schema";
import type {
  CancelProjectInput,
  CreateProjectInput,
  ProjectDto,
  ProjectHistoryQuery,
  ProjectQuery,
  ProjectRow,
  UpdateProjectInput,
} from "@/features/projects/types/projects.types";
import { reportSchema } from "@/features/reports/schemas/reports.schema";
import type {
  CreateReportDraftInput,
  ReportDto,
  ReportPreviewDto,
  ReportPreviewQuery,
  ReportQuery,
  ReportRow,
  SubmitReportInput,
  UpdateReportDraftInput,
} from "@/features/reports/types/reports.types";
import { submissionSchema } from "@/features/submissions/schemas/submissions.schema";
import type {
  ApproveSubmissionInput,
  CreateSubmissionInput,
  RequestSubmissionRevisionInput,
  ReviewQueueQuery,
  ReviewRow,
  SubmissionDto,
  SubmissionQuery,
  SubmissionRow,
} from "@/features/submissions/types/submissions.types";
import {
  taskSchema,
  taskStatusSchema,
} from "@/features/tasks/schemas/task.schema";
import type {
  AssignTaskInput,
  CancelTaskInput,
  CreateTaskInput,
  PauseTaskInput,
  TaskDto,
  TaskHistoryQuery,
  TaskQuery,
  TaskRow,
  UpdateRemainingEstimateInput,
  UpdateTaskInput,
} from "@/features/tasks/types/tasks.types";
import { timeLogSchema } from "@/features/time-logs/schemas/time-logs.schema";
import type {
  CreateTimeLogInput,
  TimeLogDto,
  TimeLogQuery,
  UpdateTimeLogInput,
  VoidTimeLogInput,
} from "@/features/time-logs/types/time-logs.types";
import { userSchema } from "@/features/users/schemas/user.schema";
import type {
  LockUserInput,
  ResetUserPasswordInput,
  UnlockUserInput,
  UpdateUserPermissionsInput,
  UserDto,
  UserPermissionsDto,
  UserQuery,
  ProfileDto,
  UserRow,
} from "@/features/users/types/users.types";
import {
  featureCodeSchema,
  featureSchema,
} from "@/features/permissions/schemas/feature.schema";
import { permissionGroupSchema } from "@/features/permissions/schemas/permission-group.schema";
import type {
  CreatePermissionGroupInput,
  FeatureDto,
  PermissionGroupDto,
  PermissionGroupQuery,
  ReplacePermissionGroupMembersInput,
  UpdateFeatureInput,
  UpdatePermissionGroupInput,
} from "@/features/permissions/types/permissions.types";
import type {
  AuditLogDto,
  AuditLogQuery,
  AuditLogRow,
} from "@/features/audit-logs/types/audit-logs.types";
import {
  backgroundJobSchema,
  jobRunSchema,
} from "@/features/jobs/schemas/job.schema";
import type {
  BackgroundJobDto,
  JobRunDto,
  JobRunQuery,
  UpdateJobInput,
} from "@/features/jobs/types/jobs.types";
import {
  configDataTypeSchema,
  settingSchema,
} from "@/features/settings/schemas/setting.schema";
import type {
  CreateSettingInput,
  SettingDto,
  SettingQuery,
  UpdateSettingInput,
} from "@/features/settings/types/settings.types";
import { ipWhitelistEntrySchema } from "@/features/ip-whitelist/schemas/ip-whitelist.schema";
import type {
  CreateIpWhitelistEntryInput,
  IpWhitelistDto,
  IpWhitelistEntryDto,
  UpdateIpWhitelistEntryInput,
} from "@/features/ip-whitelist/types/ip-whitelist.types";
import {
  analysisSubjectSchema,
  auditSchema,
  permissionSchema,
} from "@/lib/validation/common.schema";
import { checkAnalysisData } from "@/lib/validation/contract-refinements";
import { idSchema } from "@/lib/validation/request.schema";
import { ApiError } from "@/types/api/error";
import { dateTime, hours, localDateTime, metricValue } from "@/lib/format";
import type {
  AnalysisRefDto,
  AnalysisSubjectDto,
  AuditDto,
  DomainActionDto,
  Permission,
} from "@/types/common";
import { z } from "zod";
import type {
  createUserSchema,
  updateUserSchema,
} from "@/features/users/schemas/user-form.schema";
import seed from "./data.json";

const stampModel = {
  createdBy: z.string().nullable(),
  updatedBy: z.string().nullable(),
};
const userModel = z
  .object(userSchema.shape)
  .omit({
    unit: true,
    avatarUrl: true,
    groups: true,
    teams: true,
    projects: true,
    createdBy: true,
    updatedBy: true,
  })
  .extend({
    ...stampModel,
    avatarId: idSchema.nullable().default(null),
    grantedFeatures: z.array(featureCodeSchema).default([]),
    revokedFeatures: z.array(featureCodeSchema).default([]),
  });
const groupModel = permissionGroupSchema
  .omit({ members: true, createdBy: true, updatedBy: true })
  .extend(stampModel);
const unitModel = unitSchema
  .omit({ createdBy: true, updatedBy: true })
  .extend(stampModel);
const teamModel = teamSchema
  .omit({ createdBy: true, updatedBy: true })
  .extend(stampModel);
const featureModel = featureSchema
  .omit({ updatedBy: true })
  .extend({ updatedBy: stampModel.updatedBy });
const jobModel = backgroundJobSchema
  .omit({ updatedBy: true })
  .extend({ updatedBy: stampModel.updatedBy });
const settingModel = settingSchema
  .omit({
    createdBy: true,
    updatedBy: true,
    known: true,
    requiresRestart: true,
    minValue: true,
    maxValue: true,
    allowedValues: true,
  })
  .extend(stampModel);
const ipEntryModel = ipWhitelistEntrySchema
  .omit({ createdBy: true, updatedBy: true })
  .extend(stampModel);
const jobRunModel = jobRunSchema
  .omit({ durationMs: true, triggeredBy: true })
  .extend({ triggeredBy: idSchema.nullable() });
const projectModel = z
  .object(projectSchema.shape)
  .omit({ owner: true, unit: true, createdBy: true, updatedBy: true })
  .extend({ unitId: idSchema, ...stampModel });
const memberModel = z
  .object(membershipSchema.shape)
  .omit({ user: true, createdBy: true, updatedBy: true })
  .extend({ projectId: idSchema, ...stampModel });
const taskModel = z
  .object(taskSchema.shape)
  .omit({
    assignee: true,
    project: true,
    actualMinutes: true,
    isOverdue: true,
    createdBy: true,
    updatedBy: true,
  })
  .extend({
    ...stampModel,
    updatedAt: z.iso.datetime(),
    statusChangedAt: z.iso.datetime(),
    completedAt: z.iso.datetime().nullable(),
  });
const logModel = z
  .object(timeLogSchema.shape)
  .omit({ user: true })
  .extend({ taskId: idSchema });
const submissionModel = z
  .object(submissionSchema.shape)
  .omit({ submitter: true, reviewer: true })
  .extend({ reviewedBy: z.string().nullable() });
const reportModel = z
  .object(reportSchema.shape)
  .omit({ author: true })
  .extend({ submittedAt: z.iso.datetime().nullable() });
const alertModel = z
  .object(alertSchema.shape)
  .omit({
    taskTitle: true,
    analysisRef: true,
    handler: true,
    canHandle: true,
    createdBy: true,
    updatedBy: true,
  })
  .extend({ handledBy: idSchema.nullable(), ...stampModel });
const attachmentModel = z.object(attachmentSchema.shape).extend({
  taskId: idSchema,
  uploadedBy: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
  mimeType: z.string().min(1, "Vui lòng nhập thông tin bắt buộc"),
});
const qualityModel = z
  .object(qualitySchema.shape)
  .extend({ missingFields: z.array(z.string()) });
const measureModel = z.object(measureSchema.shape).extend({
  basis: z.enum(["CURRENT", "PERIOD"]),
  missingFields: z.array(z.string()),
});
const errorModel = z.object(jobErrorSchema.shape).extend({
  code: z.enum([
    "LLM_NOT_CONFIGURED",
    "PROVIDER_TIMEOUT",
    "PROVIDER_RATE_LIMIT",
    "PROVIDER_UNAVAILABLE",
    "OUTPUT_INVALID",
    "REFUSED",
    "INSUFFICIENT_DATA",
  ]),
});
const llmModel = z.object(llmExplanationSchema.shape).extend({
  recommendations: z.array(
    z
      .object(recommendationSchema.shape)
      .extend({ evidenceIds: z.array(idSchema) }),
  ),
});
const explanationModel = z
  .object(explanationStateSchema.shape)
  .extend({ error: errorModel.nullable(), lastSuccess: llmModel.nullable() });
const snapshotModel = z.object(analysisSnapshotSchema.shape).extend({
  scope: analyticsQuerySchema,
  sourceRevision: z
    .string()
    .min(1, "Vui lòng nhập thông tin bắt buộc")
    .max(255),
  subject: analysisSubjectSchema,
  expiresAt: z.iso.datetime(),
  quality: qualityModel,
  metrics: z.array(measureModel),
});
type Quality = z.output<typeof qualityModel>;
type Measure = z.output<typeof measureModel>;
type AnalysisError = z.output<typeof errorModel>;
type Job = Omit<JobDto, "error"> & { error: AnalysisError | null };
type Feedback = FeedbackDto & { analysisId: string };
const analysisModel = z
  .object(analysisSchema.shape)
  .omit({ freshness: true, feedback: true })
  .extend({
    snapshot: snapshotModel,
    explanation: explanationModel,
  })
  .superRefine(checkAnalysisData);
const auditModel = auditSchema.omit({ actor: true }).extend({
  actorId: idSchema,
  entityType: z.string(),
  entityId: idSchema,
});
type Audit = z.output<typeof auditModel>;
const assignmentModel = z.object({
  taskId: idSchema,
  userId: idSchema,
  startedAt: z.iso.datetime(),
  endedAt: z.iso.datetime().nullable(),
});
type Task = z.output<typeof taskModel>;
export type User = z.output<typeof userModel>;
type Report = z.output<typeof reportModel>;
type Analysis = z.output<typeof analysisModel>;

const policy = seed.uploadPolicy;
const baseClock = seed.clock;
let clock = baseClock;
const now = () => clock;
const today = () =>
  new Date(new Date(clock).getTime() + 7 * 3600_000).toISOString().slice(0, 10);
const entity = (id = crypto.randomUUID()) => ({
  id,
  version: 1,
});
const accessPolicy = z
  .object({
    project: z.record(projectRoleSchema, z.array(permissionSchema)),
  })
  .parse(seed.permissionPolicy);
function createDatabase() {
  const users = z.array(userModel).parse(seed.users);
  const attachments = z.array(attachmentModel).parse(seed.attachments);
  return {
    rolePolicies: Object.fromEntries(
      (["MANAGER", "MEMBER"] as const).map((role) => [
        role,
        {
          permissions: [...accessPolicy.project[role]],
          version: 1,
          updatedAt: null as string | null,
          updatedBy: null as string | null,
        },
      ]),
    ) as Record<
      "MANAGER" | "MEMBER",
      {
        permissions: Permission[];
        version: number;
        updatedAt: string | null;
        updatedBy: string | null;
      }
    >,
    users,
    features: z.array(featureModel).parse(seed.features),
    permissionGroups: z.array(groupModel).parse(seed.permissionGroups),
    settings: z.array(settingModel).parse(seed.settings),
    ipWhitelist: z.array(ipEntryModel).parse(seed.ipWhitelist),
    ipAccessLogs: [] as {
      id: string;
      version: number;
      ip: string;
      scope: "ADMIN" | "SYSTEM";
      firstSeenAt: string;
      lastSeenAt: string;
      hitCount: number;
      blockedCount: number;
      lastUserId: string | null;
      lastUsername: string | null;
      lastPath: string;
      status: "PENDING" | "ALLOWED" | "DISMISSED";
      resolvedBy: string | null;
      resolvedAt: string | null;
      resolveNote: string | null;
    }[],
    backgroundJobs: z.array(jobModel).parse(seed.backgroundJobs),
    jobRuns: z.array(jobRunModel).parse(seed.jobRuns),
    units: z.array(unitModel).parse(seed.units),
    teams: z.array(teamModel).parse(seed.teams),
    projects: z.array(projectModel).parse(seed.projects),
    members: z.array(memberModel).parse(seed.members),
    tasks: z.array(taskModel).parse(seed.tasks),
    timeLogs: z.array(logModel).parse(seed.timeLogs),
    submissions: z.array(submissionModel).parse(seed.submissions),
    reports: z.array(reportModel).parse(seed.reports),
    attachments,
    audits: z.array(auditModel).parse(seed.audits),
    alerts: z.array(alertModel).parse(seed.alerts),
    assignments: z.array(assignmentModel).parse(seed.assignments),
    details: new Map(
      seed.analyses.map((item) => {
        const analysis = analysisModel.parse(item);
        return [analysis.snapshot.analysisId, analysis];
      }),
    ),
    files: new Map(
      attachments.map((file) => [
        file.id,
        new Blob([seed.fileContent], { type: file.mimeType }),
      ]),
    ),
    avatars: new Map<string, Blob>(),
    passwords: new Map(users.map((user) => [user.id, seed.password])),
    snapshotIndex: new Map<string, string>(),
    snapshotProjects: new Map<string, string[]>(),
    jobs: new Map<string, Job>(),
    feedback: [] as Feedback[],
    outbox: [] as {
      id: string;
      eventId: string;
      recipientId: string;
      type: NotificationType;
      taskId: string;
      submissionId?: string;
      alertId?: string;
      createdAt: string;
      readAt: string | null;
      status: "PENDING" | "SENT" | "FAILED";
      attemptCount: number;
    }[],
    revoked: new Set<string>(),
    sessions: new Map<string, string>(),
    sessionExpiry: new Map<string, string>(),
    revision: 1,
    requiredReports: new Map<string, number>(),
  };
}
export let db = createDatabase();
const timers = new Set<ReturnType<typeof setTimeout>>();
function schedule(fn: () => void, ms: number) {
  const timer = setTimeout(() => {
    timers.delete(timer);
    fn();
  }, ms);
  timers.add(timer);
}
export function resetDatabase(date?: string) {
  for (const t of timers) clearTimeout(t);
  timers.clear();
  clock = date ?? baseClock;
  db = createDatabase();
  if (!date) return;

  const deadline = new Date(`${today()}T00:00:00.000Z`);
  deadline.setUTCDate(deadline.getUTCDate() + seed.taskPolicy.dueInDays);
  const day = deadline.toISOString().slice(0, 10);
  for (const task of db.tasks) {
    if (
      ["COMPLETED", "CANCELLED"].includes(task.status) ||
      task.dueAt < baseClock
    )
      continue;
    const dueAt = `${day}${task.dueAt.slice(10)}`;
    const shift = Date.parse(dueAt) - Date.parse(task.dueAt);
    task.originalDueAt = new Date(
      Date.parse(task.originalDueAt) + shift,
    ).toISOString();
    task.dueAt = dueAt;
    const project = db.projects.find((item) => item.id === task.projectId)!;
    if (project.dueAt < dueAt) project.dueAt = dueAt;
  }
}
export function setClock(value: string) {
  const next = z.iso.datetime().parse(value);
  if (next !== clock) db.revision++;
  clock = next;
}
let stampActor = "SYSTEM";
const stamp = () => ({ createdBy: stampActor, updatedBy: stampActor });
const created = () => ({ createdAt: now(), updatedAt: now(), ...stamp() });
function asSystem<T>(run: () => T): T {
  const actor = stampActor;
  stampActor = "SYSTEM";
  try {
    return run();
  } finally {
    stampActor = actor;
  }
}
function touch(v: {
  version: number;
  updatedAt?: string;
  updatedBy?: string | null;
}) {
  v.version++;
  if ("updatedAt" in v) v.updatedAt = now();
  if ("updatedBy" in v) v.updatedBy = stampActor;
  db.revision++;
}
function effectiveFeatures(user: User): string[] {
  const active = db.features.filter((f) => !f.isGroup && f.isActive);
  if (user.isSysAdmin) return active.map((f) => f.code);
  const own = new Set([
    ...db.permissionGroups
      .filter((g) => g.status === "ACTIVE" && g.memberIds.includes(user.id))
      .flatMap((g) => g.features),
    ...user.grantedFeatures,
  ]);
  for (const code of user.revokedFeatures) own.delete(code);
  return active.filter((f) => own.has(f.code)).map((f) => f.code);
}
function systemPermissions(user: User): Permission[] {
  return effectiveFeatures(user).flatMap((code) => {
    const permission = permissionSchema.safeParse(code);
    return permission.success ? [permission.data] : [];
  });
}
function projectPermissions(user: User, projectId: string): Permission[] {
  const member = db.members.find(
    (m) => m.projectId === projectId && m.userId === user.id && !m.endedAt,
  );
  if (
    !member ||
    (member.projectRole !== "MEMBER" &&
      !systemPermissions(user).includes("PROJECT_CREATE"))
  )
    return [];
  return member.projectRole === "OWNER"
    ? accessPolicy.project.OWNER
    : db.rolePolicies[member.projectRole].permissions;
}
const readsEveryProject = (user: User) =>
  systemPermissions(user).includes("ANALYTICS_VIEW");
function can(user: User, action: Permission, projectId?: string) {
  if (!projectId) return systemPermissions(user).includes(action);
  return (
    (action === "ANALYTICS_VIEW" && readsEveryProject(user)) ||
    projectPermissions(user, projectId).includes(action)
  );
}
const inProject = (u: User, projectId: string) =>
  db.members.some(
    (m) => m.projectId === projectId && m.userId === u.id && !m.endedAt,
  );
function visibleTask(u: User, t: Task) {
  if (readsEveryProject(u)) return true;
  return (
    inProject(u, t.projectId) &&
    (projectPermissions(u, t.projectId).length > 0 ||
      t.assigneeId === u.id ||
      db.assignments.some((a) => a.taskId === t.id && a.userId === u.id))
  );
}
function audit(
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
function notify(
  recipientId: string,
  type: NotificationType,
  taskId: string,
  target: { submissionId?: string; alertId?: string } = {},
) {
  db.outbox.push({
    id: crypto.randomUUID(),
    eventId: crypto.randomUUID(),
    recipientId,
    type,
    taskId,
    ...target,
    createdAt: now(),
    readAt: null,
    status: "SENT",
    attemptCount: 1,
  });
}

const stampRef = (id: string | null) => (id ? actorRef(id) : null);
const stampRefs = (v: {
  createdBy: string | null;
  updatedBy: string | null;
}) => ({
  createdBy: stampRef(v.createdBy),
  updatedBy: stampRef(v.updatedBy),
});
const unitDTO = (unit: (typeof db.units)[number]): UnitDto => ({
  ...unit,
  ...stampRefs(unit),
});
const teamDTO = (team: (typeof db.teams)[number]): TeamDto => ({
  ...team,
  ...stampRefs(team),
});
const person = (id: string) => {
  const user = db.users.find((user) => user.id === id);
  if (!user) throw new Error("Missing person " + id);
  return { id, displayName: user.displayName };
};
const unitRef = (id: string) => ({
  id,
  name: db.units.find((unit) => unit.id === id)?.name ?? "",
});
const userGroups = (user: User) =>
  db.permissionGroups
    .filter((g) => g.status === "ACTIVE" && g.memberIds.includes(user.id))
    .map((g) => ({ id: g.id, label: g.name }));
const userRow = (user: User): UserRow => ({
  id: user.id,
  username: user.username,
  displayName: user.displayName,
  email: user.email,
  avatarUrl: user.avatarId ? `/api/avatars/${user.avatarId}` : null,
  unitId: user.unitId,
  isSysAdmin: user.isSysAdmin,
  groups: userGroups(user),
  status: user.status,
  unit: unitRef(user.unitId),
});
const affiliations = (userId: string) => {
  const projectIds = new Set(
    db.members
      .filter((member) => member.userId === userId && !member.endedAt)
      .map((member) => member.projectId),
  );
  return {
    teams: db.teams
      .filter(
        (team) => team.status === "ACTIVE" && team.memberIds.includes(userId),
      )
      .map(({ id, name }) => ({ id, name })),
    projects: db.projects
      .filter(
        (project) =>
          projectIds.has(project.id) &&
          ["PLANNED", "ACTIVE"].includes(project.status),
      )
      .map(({ id, name }) => ({ id, name })),
  };
};
const personalInfo = (user: User) => ({
  gender: user.gender,
  birthDate: user.birthDate,
  phone: user.phone,
  permanentAddress: user.permanentAddress,
  temporaryAddress: user.temporaryAddress,
});
const userDTO = (user: User): UserDto => ({
  ...userRow(user),
  ...personalInfo(user),
  ...affiliations(user.id),
  version: user.version,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  ...stampRefs(user),
});
const projectRow = (project: (typeof db.projects)[number]): ProjectRow => ({
  id: project.id,
  name: project.name,
  startDate: project.startDate,
  dueAt: project.dueAt,
  status: project.status,
  owner: person(project.ownerId),
  unit: unitRef(project.unitId),
});
const projectDTO = (project: (typeof db.projects)[number]): ProjectDto => ({
  ...projectRow(project),
  code: project.code,
  objective: project.objective,
  version: project.version,
  ownerId: project.ownerId,
  createdAt: project.createdAt,
  updatedAt: project.updatedAt,
  ...stampRefs(project),
});
const taskRow = (task: Task): TaskRow => ({
  id: task.id,
  title: task.title,
  status: task.status,
  priority: task.priority,
  dueAt: task.dueAt,
  firstStartedAt: task.firstStartedAt,
  isOverdue: isTaskOverdue(task),
  assignee: task.assigneeId ? person(task.assigneeId) : null,
  project: {
    id: task.projectId,
    name:
      db.projects.find((project) => project.id === task.projectId)?.name ?? "",
  },
});
const taskDTO = (task: Task): TaskDto => ({
  ...taskRow(task),
  version: task.version,
  projectId: task.projectId,
  createdAt: task.createdAt,
  description: task.description,
  acceptanceCriteria: task.acceptanceCriteria,
  estimatedMinutes: task.estimatedMinutes,
  originalDueAt: task.originalDueAt,
  originalEstimatedMinutes: task.originalEstimatedMinutes,
  remainingMinutes: task.remainingMinutes,
  assigneeId: task.assigneeId,
  actualMinutes: taskMinutes(task.id),
  latestSubmissionId: task.latestSubmissionId,
  updatedAt: task.updatedAt,
  ...stampRefs(task),
});
const memberDTO = (member: (typeof db.members)[number]): MembershipDto => ({
  id: member.id,
  version: member.version,
  userId: member.userId,
  projectRole: member.projectRole,
  endedAt: member.endedAt,
  user: person(member.userId),
  createdAt: member.createdAt,
  updatedAt: member.updatedAt,
  ...stampRefs(member),
});
const logDTO = (log: (typeof db.timeLogs)[number]): TimeLogDto => ({
  id: log.id,
  version: log.version,
  userId: log.userId,
  workDate: log.workDate,
  minutes: log.minutes,
  description: log.description,
  status: log.status,
  voidReason: log.voidReason,
  user: person(log.userId),
});
const submissionRow = (
  item: (typeof db.submissions)[number],
): SubmissionRow => ({
  id: item.id,
  sequence: item.sequence,
  submitter: person(item.submittedBy),
  submittedAt: item.submittedAt,
  status: item.status,
});
const reviewRow = (item: (typeof db.submissions)[number]): ReviewRow => ({
  id: item.id,
  taskId: item.taskId,
  taskTitle: db.tasks.find((task) => task.id === item.taskId)!.title,
  sequence: item.sequence,
  submitter: person(item.submittedBy),
  submittedAt: item.submittedAt,
  dueAtSnapshot: item.dueAtSnapshot,
});
const submissionDTO = (
  item: (typeof db.submissions)[number],
): SubmissionDto => ({
  ...submissionRow(item),
  version: item.version,
  taskId: item.taskId,
  submittedBy: item.submittedBy,
  summary: item.summary,
  links: item.links,
  attachmentIds: item.attachmentIds,
  dueAtSnapshot: item.dueAtSnapshot,
  actualMinutesSnapshot: item.actualMinutesSnapshot,
  reviewedAt: item.reviewedAt,
  reviewComment: item.reviewComment,
  requestedChanges: item.requestedChanges,
  reviewer: item.reviewedBy ? person(item.reviewedBy) : null,
});
const reportRow = (report: Report): ReportRow => ({
  id: report.id,
  project: {
    id: report.projectId,
    name: db.projects.find((project) => project.id === report.projectId)!.name,
  },
  periodType: report.periodType,
  periodStart: report.periodStart,
  status: report.status,
  author: person(report.authorId),
  totalMinutes: report.snapshot?.totalMinutes ?? null,
});
const reportDTO = (report: Report): ReportDto => ({
  id: report.id,
  version: report.version,
  projectId: report.projectId,
  authorId: report.authorId,
  periodType: report.periodType,
  periodStart: report.periodStart,
  status: report.status,
  achievements: report.achievements,
  blockers: report.blockers,
  nextPlan: report.nextPlan,
  selectedTaskIds: report.selectedTaskIds,
  zeroTimeReason: report.zeroTimeReason,
  snapshot: report.snapshot,
  author: person(report.authorId),
});
const teamRow = (team: (typeof db.teams)[number]): TeamRow => ({
  id: team.id,
  name: team.name,
  unit: unitRef(team.unitId),
  status: team.status,
  memberCount: team.memberIds.length,
});
const attachmentDTO = (
  item: (typeof db.attachments)[number],
): AttachmentDto => ({
  id: item.id,
  filename: item.filename,
  sizeBytes: item.sizeBytes,
  status: item.status,
});
function sessionDTO(user: User): SessionDto {
  return {
    user: {
      id: user.id,
      version: user.version,
      avatarUrl: user.avatarId ? `/api/avatars/${user.avatarId}` : null,
      displayName: user.displayName,
      username: user.username,
      email: user.email,
      unitId: user.unitId,
      unit: unitRef(user.unitId),
      isSysAdmin: user.isSysAdmin,
      groups: userGroups(user),
    },
    projectAccess: db.members
      .filter((member) => member.userId === user.id && !member.endedAt)
      .map((member) => ({
        projectId: member.projectId,
        permissions: projectPermissions(user, member.projectId),
      })),
    permissions: systemPermissions(user),
  };
}
const taskMinutes = (taskId: string) =>
  db.timeLogs
    .filter((log) => log.taskId === taskId && log.status === "ACTIVE")
    .reduce((sum, log) => sum + log.minutes, 0);
const isTaskOverdue = (task: Task) =>
  !["COMPLETED", "CANCELLED"].includes(task.status) && now() > task.dueAt;
const unitRow = (unit: (typeof db.units)[number]): UnitRow => ({
  id: unit.id,
  name: unit.name,
  status: unit.status,
});
function auditDTO(item: Audit): AuditDto {
  const keys =
    item.after && typeof item.after === "object" ? Object.keys(item.after) : [];
  const view = (value: Audit["before"]): AuditDto["before"] => {
    if (!value || typeof value !== "object" || Array.isArray(value))
      return value;
    return Object.fromEntries(
      keys
        .filter((key) => key in value)
        .map((key) =>
          ["userId", "ownerId", "assigneeId"].includes(key)
            ? [
                key.slice(0, -2),
                typeof value[key] === "string" ? person(value[key]) : null,
              ]
            : [key, value[key]],
        ),
    );
  };
  return {
    id: item.id,
    actor: person(item.actorId),
    action: item.action,
    at: item.at,
    before: view(item.before),
    after: view(item.after),
    reason: item.reason,
  };
}

function paginate<T>(items: T[], query: { page?: number; pageSize?: number }) {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;
  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    pagination: { page, pageSize, total: items.length },
  };
}

function requireVersion(
  expectedVersion: string | null,
  entity: { version: number },
) {
  if (!expectedVersion)
    throw new ApiError(428, "VERSION_REQUIRED", "Thiếu phiên bản dữ liệu.");
  if (expectedVersion !== `"${entity.version}"`)
    throw new ApiError(
      412,
      "VERSION_CONFLICT",
      "Dữ liệu đã được thay đổi. Giữ bản đang nhập và tải bản mới để đối chiếu.",
    );
}

export function sessionUser(accessToken: string | undefined): User {
  const userId = accessToken ? db.sessions.get(accessToken) : undefined;
  const user = db.users.find((u) => u.id === userId);
  if (
    !user ||
    db.revoked.has(accessToken ?? "") ||
    (db.sessionExpiry.get(accessToken ?? "") ?? "") <= now()
  )
    throw new ApiError(401, "UNAUTHORIZED", "Phiên đăng nhập đã hết hạn.");
  if (user.status === "LOCKED")
    throw new ApiError(403, "ACCOUNT_LOCKED", "Tài khoản đang bị khóa.");
  return user;
}
function issueSession(user: User) {
  const accessToken = `mock-${user.id}-${crypto.randomUUID()}`;
  const expiresAt = new Date(Date.parse(now()) + 3600_000).toISOString();
  db.sessions.set(accessToken, user.id);
  db.sessionExpiry.set(accessToken, expiresAt);
  db.revoked.delete(`mock-${user.id}`);
  return { session: sessionDTO(user), accessToken };
}
export const authDb = {
  login(body: LoginInput) {
    const user = db.users.find((u) => u.username === body.username);
    if (!user || db.passwords.get(user.id) !== body.password)
      throw new ApiError(
        401,
        "INVALID_CREDENTIALS",
        "Tên đăng nhập hoặc mật khẩu chưa đúng.",
      );
    if (user.status === "LOCKED")
      throw new ApiError(403, "ACCOUNT_LOCKED", "Tài khoản đang bị khóa.");
    return issueSession(user);
  },
  refresh(refreshUserId: string | undefined) {
    const user = db.users.find(
      (u) => u.id === refreshUserId && u.status === "ACTIVE",
    );
    if (!user || db.revoked.has(`mock-${user.id}`))
      throw new ApiError(401, "UNAUTHORIZED", "Phiên đăng nhập đã hết hạn.");
    return issueSession(user);
  },
  getSession(accessToken: string | undefined) {
    return sessionDTO(sessionUser(accessToken));
  },
  getProfile(viewer: User): PersonalProfileDto {
    const user = userDTO(viewer);
    return {
      version: user.version,
      createdAt: user.createdAt,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      isSysAdmin: user.isSysAdmin,
      groups: user.groups,
      createdBy: user.createdBy,
      updatedBy: user.updatedBy,
      ...personalInfo(viewer),
      ...affiliations(viewer.id),
      unit: unitRef(viewer.unitId).name,
    };
  },
  async updateProfile(
    viewer: User,
    body: UpdateProfileInput,
    expectedVersion: string | null,
  ) {
    requireVersion(expectedVersion, viewer);
    const { avatar, ...data } = body;
    if (avatar) {
      const bytes = new Uint8Array(await avatar.slice(0, 12).arrayBuffer());
      const valid =
        (avatar.type === "image/png" &&
          [137, 80, 78, 71, 13, 10, 26, 10].every(
            (byte, i) => bytes[i] === byte,
          )) ||
        (avatar.type === "image/jpeg" &&
          bytes[0] === 255 &&
          bytes[1] === 216 &&
          bytes[2] === 255) ||
        (avatar.type === "image/webp" &&
          new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" &&
          new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP");
      if (!valid)
        throw new ApiError(
          422,
          "INVALID_AVATAR",
          "Tệp đã chọn không phải ảnh hợp lệ.",
          [
            {
              path: ["avatar"],
              message: "Vui lòng chọn ảnh JPG, PNG hoặc WebP hợp lệ.",
            },
          ],
        );
    }
    const before = {
      displayName: viewer.displayName,
      ...personalInfo(viewer),
    };
    if (avatar) {
      if (viewer.avatarId) db.avatars.delete(viewer.avatarId);
      viewer.avatarId = crypto.randomUUID();
      db.avatars.set(viewer.avatarId, avatar);
    }
    Object.assign(viewer, data);
    touch(viewer);
    audit(viewer.id, "USER", viewer.id, "Cập nhật hồ sơ cá nhân", before, data);
    return sessionDTO(viewer);
  },
  changePassword(viewer: User, body: ChangePasswordInput) {
    if (db.passwords.get(viewer.id) !== body.currentPassword)
      throw new ApiError(
        422,
        "WRONG_PASSWORD",
        "Mật khẩu hiện tại chưa đúng.",
        [
          {
            path: ["currentPassword"],
            message: "Mật khẩu hiện tại chưa đúng.",
          },
        ],
      );
    db.passwords.set(viewer.id, body.newPassword);
    audit(viewer.id, "USER", viewer.id, "Đổi mật khẩu", null, null);
    return { ok: true as const };
  },
  getAvatar(avatarId: string) {
    const file = db.avatars.get(avatarId);
    if (!file)
      throw new ApiError(
        404,
        "AVATAR_NOT_FOUND",
        "Không tìm thấy ảnh đại diện.",
      );
    return file;
  },
  logout(accessToken: string | undefined) {
    const user = sessionUser(accessToken);
    if (accessToken) {
      db.sessions.delete(accessToken);
      db.sessionExpiry.delete(accessToken);
      db.revoked.add(accessToken);
    }
    db.revoked.add(`mock-${user.id}`);
    return { ok: true as const };
  },
};

const currentIp = () => seed.currentIp;
function ipv4(value: string) {
  const parts = value.split(".").map(Number);
  return parts.reduce((sum, part) => sum * 256 + part, 0);
}
function ipMatches(ip: string, cidr: string) {
  const [network, bits] = cidr.split("/");
  if (ip.includes(":") || network.includes(":"))
    return ip === network && (!bits || bits === "128");
  const size = 32 - Number(bits ?? 32);
  const block = 2 ** size;
  return Math.floor(ipv4(ip) / block) === Math.floor(ipv4(network) / block);
}
const whitelistKey = "Security:AdminIpWhitelistEnabled";
const whitelistSetting = () =>
  ["Identity.Api", "Global"]
    .map((service) =>
      db.settings.find(
        (s) =>
          s.key === whitelistKey && s.serviceType === service && s.isActive,
      ),
    )
    .find(Boolean);
const whitelistEnabled = () => whitelistSetting()?.value === "true";
const ipAllowed = (entries: { cidr: string; isActive: boolean }[]) =>
  entries.some((entry) => entry.isActive && ipMatches(currentIp(), entry.cidr));
function requireAdmin(user: User, ...actions: Permission[]) {
  if (!actions.some((action) => can(user, action)))
    throw new ApiError(
      403,
      "FORBIDDEN",
      "Bạn chưa được cấp quyền quản trị này.",
    );
  if (whitelistEnabled() && !ipAllowed(db.ipWhitelist)) {
    recordBlockedIp(user);
    throw new ApiError(
      403,
      "IP_NOT_ALLOWED",
      "Địa chỉ IP của bạn không được phép truy cập khu quản trị.",
      [],
      { ip: currentIp() },
    );
  }
}
function recordBlockedIp(user: User) {
  const ip = currentIp();
  let log = db.ipAccessLogs.find(
    (l) => l.ip === ip && l.scope === "ADMIN" && l.status === "PENDING",
  );
  if (!log) {
    log = {
      ...entity(),
      ip,
      scope: "ADMIN",
      firstSeenAt: now(),
      lastSeenAt: now(),
      hitCount: 0,
      blockedCount: 0,
      lastUserId: null,
      lastUsername: null,
      lastPath: "/api/admin",
      status: "PENDING",
      resolvedBy: null,
      resolvedAt: null,
      resolveNote: null,
    };
    db.ipAccessLogs.push(log);
  }
  log.hitCount++;
  log.blockedCount++;
  log.lastSeenAt = now();
  log.lastUserId = user.id;
  log.lastUsername = user.username;
}
function protectCurrentIp(
  enabled: boolean,
  entries: { cidr: string; isActive: boolean }[],
) {
  if (enabled && !ipAllowed(entries))
    throw new ApiError(
      422,
      "BUSINESS_RULE",
      `Thao tác này sẽ chặn chính IP hiện tại của bạn (${currentIp()}).`,
    );
}

function requireUnit(id: string) {
  const unit = db.units.find((u) => u.id === id);
  if (!unit)
    throw new ApiError(404, "UNIT_NOT_FOUND", "Không tìm thấy đơn vị.");
  return unit;
}
function activeUnit(id: string) {
  const unit = requireUnit(id);
  if (unit.status !== "ACTIVE")
    throw new ApiError(422, "UNIT_INACTIVE", "Đơn vị đã ngừng sử dụng.");
  return unit;
}
function requireUser(id: string) {
  const user = db.users.find((u) => u.id === id);
  if (!user)
    throw new ApiError(404, "USER_NOT_FOUND", "Không tìm thấy tài khoản.");
  return user;
}
function validateUnitLinks(
  id: string | null,
  parentId: string | null,
  managerId: string | null,
) {
  if (managerId && requireUser(managerId).status !== "ACTIVE")
    throw new ApiError(
      422,
      "MANAGER_INACTIVE",
      "Người quản lý cần có tài khoản hoạt động.",
    );
  const visited = new Set<string>();
  let cursor = parentId;
  while (cursor) {
    if (cursor === id || visited.has(cursor))
      throw new ApiError(
        422,
        "UNIT_CYCLE",
        "Đơn vị cấp trên tạo thành chu trình.",
      );
    visited.add(cursor);
    cursor = activeUnit(cursor).parentId;
  }
}
function validateTeamMembers(unitId: string, memberIds: string[]) {
  activeUnit(unitId);
  if (new Set(memberIds).size !== memberIds.length)
    throw new ApiError(
      422,
      "DUPLICATE_MEMBER",
      "Thành viên trong nhóm không được trùng.",
    );
  for (const id of memberIds) {
    const user = requireUser(id);
    if (user.unitId !== unitId || user.status !== "ACTIVE")
      throw new ApiError(
        422,
        "INVALID_TEAM_MEMBER",
        "Thành viên phải hoạt động và thuộc cùng đơn vị.",
      );
  }
}
function protectLastAdmin(user: User) {
  if (
    user.isSysAdmin &&
    user.status === "ACTIVE" &&
    db.users.filter((u) => u.isSysAdmin && u.status === "ACTIVE").length <= 1
  )
    throw new ApiError(
      422,
      "BUSINESS_RULE",
      "Cần duy trì ít nhất một tài khoản quản trị tối cao đang hoạt động.",
    );
}
function requireGrantable(actor: User, codes: string[]) {
  if (actor.isSysAdmin) return;
  const own = effectiveFeatures(actor);
  if (codes.some((code) => !own.includes(code)))
    throw new ApiError(
      403,
      "FORBIDDEN",
      "Bạn chỉ được cấp những quyền mà chính bạn đang có.",
    );
}
function requireFeatureCodes(codes: string[], path: string) {
  const known = db.features.filter((f) => !f.isGroup).map((f) => f.code);
  const unknown = codes.filter((code) => !known.includes(code));
  if (unknown.length)
    throw new ApiError(422, "VALIDATION_ERROR", "Mã quyền không tồn tại.", [
      {
        path: [path],
        message: `Mã quyền không tồn tại: ${unknown.join(", ")}.`,
      },
    ]);
}
function requireGroup(id: string) {
  const group = db.permissionGroups.find((g) => g.id === id);
  if (!group)
    throw new ApiError(404, "NOT_FOUND", "Không tìm thấy nhóm quyền.");
  return group;
}
function setUserGroups(user: User, groupIds: string[]) {
  for (const group of db.permissionGroups) {
    const member = group.memberIds.includes(user.id);
    if (member === groupIds.includes(group.id)) continue;
    group.memberIds = member
      ? group.memberIds.filter((id) => id !== user.id)
      : [...group.memberIds, user.id];
    touch(group);
  }
}
function revokeUserSessions(id: string) {
  for (const [accessToken, userId] of db.sessions)
    if (userId === id) {
      db.sessions.delete(accessToken);
      db.sessionExpiry.delete(accessToken);
      db.revoked.add(accessToken);
    }
  db.revoked.add(`mock-${id}`);
}
function team(id: string) {
  const value = db.teams.find((t) => t.id === id);
  if (!value) throw new ApiError(404, "NOT_FOUND", "Không tìm thấy nhóm.");
  return value;
}
export const organizationDb = {
  listUnits(viewer: User, query: UnitQuery) {
    requireAdmin(viewer, "ORGANIZATION_MANAGE", "USERS_MANAGE");
    return paginate(
      db.units
        .filter(
          (u) =>
            (!query.q ||
              u.name.toLowerCase().includes(query.q.toLowerCase())) &&
            (!query.status || u.status === query.status),
        )
        .map(unitRow),
      query,
    );
  },
  getUnit(viewer: User, unitId: string) {
    requireAdmin(viewer, "ORGANIZATION_MANAGE");
    return unitDTO(requireUnit(unitId));
  },
  createUnit(viewer: User, body: CreateUnitInput) {
    requireAdmin(viewer, "ORGANIZATION_MANAGE");
    validateUnitLinks(null, body.parentId, body.managerId);
    const unit = {
      ...entity(),
      ...body,
      status: "ACTIVE" as const,
      ...created(),
    };
    db.units.push(unit);
    audit(viewer.id, "UNIT", unit.id, "Tạo đơn vị", null, body);
    return unitDTO(unit);
  },
  updateUnit(
    viewer: User,
    unitId: string,
    body: UpdateUnitInput,
    expectedVersion: string | null,
  ) {
    requireAdmin(viewer, "ORGANIZATION_MANAGE");
    const unit = requireUnit(unitId);
    requireVersion(expectedVersion, unit);
    if (unit.status !== "ACTIVE")
      throw new ApiError(409, "INACTIVE", "Đơn vị đã ngừng sử dụng.");
    const { reason, ...patch } = body;
    if (!Object.keys(patch).length)
      throw new ApiError(422, "EMPTY_PATCH", "Chưa có thông tin thay đổi.");
    validateUnitLinks(
      unit.id,
      patch.parentId === undefined ? unit.parentId : patch.parentId,
      patch.managerId === undefined ? unit.managerId : patch.managerId,
    );
    const before = {
      name: unit.name,
      parentId: unit.parentId,
      managerId: unit.managerId,
    };
    Object.assign(unit, patch);
    touch(unit);
    audit(viewer.id, "UNIT", unit.id, "Cập nhật đơn vị", before, patch, reason);
    return unitDTO(unit);
  },
  deactivateUnit(
    viewer: User,
    unitId: string,
    body: DeactivateUnitInput,
    expectedVersion: string | null,
  ) {
    requireAdmin(viewer, "ORGANIZATION_MANAGE");
    const unit = requireUnit(unitId);
    requireVersion(expectedVersion, unit);
    if (unit.status !== "ACTIVE")
      throw new ApiError(409, "INACTIVE", "Đơn vị đã ngừng sử dụng.");
    if (
      db.units.some((u) => u.parentId === unit.id && u.status === "ACTIVE") ||
      db.users.some((u) => u.unitId === unit.id && u.status === "ACTIVE") ||
      db.teams.some((t) => t.unitId === unit.id && t.status === "ACTIVE") ||
      db.projects.some(
        (p) => p.unitId === unit.id && ["PLANNED", "ACTIVE"].includes(p.status),
      )
    )
      throw new ApiError(
        409,
        "UNIT_IN_USE",
        "Đơn vị còn đơn vị con, nhân sự, nhóm hoặc dự án hoạt động.",
      );
    unit.status = "INACTIVE";
    touch(unit);
    audit(
      viewer.id,
      "UNIT",
      unit.id,
      "Ngừng sử dụng đơn vị",
      { status: "ACTIVE" },
      { status: "INACTIVE" },
      body.reason,
    );
    return unitDTO(unit);
  },
  listTeams(viewer: User, query: TeamQuery) {
    requireAdmin(viewer, "ORGANIZATION_MANAGE");
    return paginate(
      db.teams
        .filter(
          (t) =>
            (!query.unitId || t.unitId === query.unitId) &&
            (!query.q || t.name.toLowerCase().includes(query.q.toLowerCase())),
        )
        .map(teamRow),
      query,
    );
  },
  getTeam(viewer: User, teamId: string) {
    requireAdmin(viewer, "ORGANIZATION_MANAGE");
    return teamDTO(team(teamId));
  },
  createTeam(viewer: User, body: CreateTeamInput) {
    requireAdmin(viewer, "ORGANIZATION_MANAGE");
    validateTeamMembers(body.unitId, body.memberIds);
    const value = {
      ...entity(),
      ...body,
      status: "ACTIVE" as const,
      ...created(),
    };
    db.teams.push(value);
    audit(viewer.id, "TEAM", value.id, "Tạo nhóm", null, body);
    return teamDTO(value);
  },
  updateTeam(
    viewer: User,
    teamId: string,
    body: UpdateTeamInput,
    expectedVersion: string | null,
  ) {
    requireAdmin(viewer, "ORGANIZATION_MANAGE");
    const value = team(teamId);
    requireVersion(expectedVersion, value);
    if (value.status !== "ACTIVE")
      throw new ApiError(409, "INACTIVE", "Nhóm đã ngừng sử dụng.");
    const { reason, ...patch } = body;
    if (!Object.keys(patch).length)
      throw new ApiError(422, "EMPTY_PATCH", "Chưa có thông tin thay đổi.");
    validateTeamMembers(patch.unitId ?? value.unitId, value.memberIds);
    const before = { name: value.name, unitId: value.unitId };
    Object.assign(value, patch);
    touch(value);
    audit(viewer.id, "TEAM", value.id, "Cập nhật nhóm", before, patch, reason);
    return teamDTO(value);
  },
  replaceTeamMembers(
    viewer: User,
    teamId: string,
    body: ReplaceTeamMembersInput,
    expectedVersion: string | null,
  ) {
    requireAdmin(viewer, "ORGANIZATION_MANAGE");
    const value = team(teamId);
    requireVersion(expectedVersion, value);
    if (value.status !== "ACTIVE")
      throw new ApiError(409, "INACTIVE", "Nhóm đã ngừng sử dụng.");
    validateTeamMembers(value.unitId, body.memberIds);
    const before = [...value.memberIds];
    value.memberIds = body.memberIds;
    touch(value);
    audit(
      viewer.id,
      "TEAM",
      value.id,
      "Thay thành viên nhóm",
      { memberIds: before },
      { memberIds: value.memberIds },
      body.reason,
    );
    return teamDTO(value);
  },
  deactivateTeam(
    viewer: User,
    teamId: string,
    body: DeactivateTeamInput,
    expectedVersion: string | null,
  ) {
    requireAdmin(viewer, "ORGANIZATION_MANAGE");
    const value = team(teamId);
    requireVersion(expectedVersion, value);
    if (value.status !== "ACTIVE")
      throw new ApiError(409, "INACTIVE", "Nhóm đã ngừng sử dụng.");
    activeUnit(value.unitId);
    value.status = "INACTIVE";
    touch(value);
    audit(
      viewer.id,
      "TEAM",
      value.id,
      "Ngừng sử dụng nhóm",
      { status: "ACTIVE" },
      { status: "INACTIVE" },
      body.reason,
    );
    return teamDTO(value);
  },
};

function unique(username: string, email: string, except?: string) {
  if (db.users.some((u) => u.id !== except && u.username === username))
    throw new ApiError(
      409,
      "DUPLICATE_USERNAME",
      "Tên đăng nhập đã được sử dụng.",
      [{ path: ["username"], message: "Tên đăng nhập đã tồn tại." }],
    );
  if (
    db.users.some(
      (u) => u.id !== except && u.email.toLowerCase() === email.toLowerCase(),
    )
  )
    throw new ApiError(409, "DUPLICATE_EMAIL", "Email đã được sử dụng.", [
      { path: ["email"], message: "Email đã tồn tại." },
    ]);
}
export const usersDb = {
  getProfile(userId: string): ProfileDto {
    const user = requireUser(userId);
    if (user.status !== "ACTIVE")
      throw new ApiError(
        404,
        "PROFILE_NOT_FOUND",
        "Hồ sơ này hiện không khả dụng.",
      );
    return {
      id: user.id,
      displayName: user.displayName,
      avatarUrl: user.avatarId ? `/api/avatars/${user.avatarId}` : null,
      unit: unitRef(user.unitId).name,
      groups: userGroups(user).map((group) => group.label),
      email: user.email,
    };
  },
  listUsers(viewer: User, query: UserQuery) {
    requireAdmin(
      viewer,
      "USERS_MANAGE",
      "ORGANIZATION_MANAGE",
      "PERMISSIONS_MANAGE",
    );
    return paginate(
      db.users
        .filter(
          (u) =>
            (!query.q ||
              `${u.username} ${u.displayName} ${u.email}`
                .toLowerCase()
                .includes(query.q.toLowerCase())) &&
            (!query.unitId || u.unitId === query.unitId) &&
            (!query.status || u.status === query.status) &&
            (query.isSysAdmin === undefined ||
              u.isSysAdmin === query.isSysAdmin) &&
            (!query.groupId ||
              db.permissionGroups.some(
                (g) => g.id === query.groupId && g.memberIds.includes(u.id),
              )),
        )
        .map(userRow),
      query,
    );
  },
  getUser(viewer: User, userId: string) {
    requireAdmin(viewer, "USERS_MANAGE");
    return userDTO(requireUser(userId));
  },
  createUser(viewer: User, body: z.output<typeof createUserSchema>) {
    requireAdmin(viewer, "USERS_MANAGE");
    activeUnit(body.unitId);
    unique(body.username, body.email);
    const { initialPassword, groupIds = [], ...data } = body;
    const groups = groupIds.map(requireGroup);
    if (groups.some((g) => g.status !== "ACTIVE"))
      throw new ApiError(
        422,
        "BUSINESS_RULE",
        "Chỉ được chọn nhóm quyền đang hoạt động.",
      );
    requireGrantable(
      viewer,
      groups.flatMap((g) => g.features),
    );
    const user: User = {
      ...entity(),
      gender: null,
      birthDate: null,
      phone: null,
      permanentAddress: null,
      temporaryAddress: null,
      ...data,
      avatarId: null,
      isSysAdmin: false,
      grantedFeatures: [],
      revokedFeatures: [],
      status: "ACTIVE" as const,
      ...created(),
    };
    db.users.push(user);
    db.passwords.set(user.id, initialPassword);
    setUserGroups(user, groupIds);
    audit(viewer.id, "USER", user.id, "Cấp tài khoản", null, {
      username: user.username,
      groupIds,
      unitId: user.unitId,
    });
    return userDTO(user);
  },
  updateUser(
    viewer: User,
    userId: string,
    body: z.output<typeof updateUserSchema>,
    expectedVersion: string | null,
  ) {
    requireAdmin(viewer, "USERS_MANAGE");
    const user = requireUser(userId);
    requireVersion(expectedVersion, user);
    const { reason, ...patch } = body;
    if (!Object.keys(patch).length)
      throw new ApiError(422, "EMPTY_PATCH", "Chưa có thông tin thay đổi.");
    if (patch.unitId && patch.unitId !== user.unitId) {
      activeUnit(patch.unitId);
      if (
        db.teams.some(
          (t) => t.status === "ACTIVE" && t.memberIds.includes(user.id),
        ) ||
        db.tasks.some(
          (t) =>
            t.assigneeId === user.id &&
            !["COMPLETED", "CANCELLED"].includes(t.status),
        )
      )
        throw new ApiError(
          409,
          "HANDOVER_REQUIRED",
          "Cần xử lý nhóm và bàn giao công việc trước khi chuyển đơn vị.",
        );
    }
    unique(user.username, patch.email ?? user.email, user.id);
    const before = {
      displayName: user.displayName,
      email: user.email,
      unitId: user.unitId,
      ...personalInfo(user),
    };
    Object.assign(user, patch);
    touch(user);
    audit(
      viewer.id,
      "USER",
      user.id,
      "Cập nhật tài khoản",
      before,
      patch,
      reason ?? null,
    );
    return userDTO(user);
  },
  lockUser(
    viewer: User,
    userId: string,
    body: LockUserInput,
    expectedVersion: string | null,
  ) {
    requireAdmin(viewer, "USERS_MANAGE");
    const user = requireUser(userId);
    requireVersion(expectedVersion, user);
    protectLastAdmin(user);
    if (user.id === viewer.id)
      throw new ApiError(403, "SELF_LOCK", "Không được tự khóa tài khoản.");
    if (user.status === "LOCKED")
      throw new ApiError(409, "ALREADY_LOCKED", "Tài khoản đã được khóa.");
    const ownsActive = db.projects.some(
      (p) => p.ownerId === user.id && ["PLANNED", "ACTIVE"].includes(p.status),
    );
    const hasTasks = db.tasks.some(
      (t) =>
        t.assigneeId === user.id &&
        !["COMPLETED", "CANCELLED"].includes(t.status),
    );
    if (body.mode === "NORMAL" && (ownsActive || hasTasks))
      throw new ApiError(
        409,
        "HANDOVER_REQUIRED",
        "Cần bàn giao công việc và trách nhiệm dự án trước khi khóa thông thường.",
      );
    user.status = "LOCKED";
    revokeUserSessions(user.id);
    touch(user);
    audit(
      viewer.id,
      "USER",
      user.id,
      "Khóa tài khoản",
      { status: "ACTIVE" },
      { status: "LOCKED", mode: body.mode },
      body.reason,
    );
    return userDTO(user);
  },
  unlockUser(
    viewer: User,
    userId: string,
    body: UnlockUserInput,
    expectedVersion: string | null,
  ) {
    requireAdmin(viewer, "USERS_MANAGE");
    const user = requireUser(userId);
    requireVersion(expectedVersion, user);
    if (user.status !== "LOCKED")
      throw new ApiError(409, "NOT_LOCKED", "Tài khoản đang hoạt động.");
    user.status = "ACTIVE";
    touch(user);
    audit(
      viewer.id,
      "USER",
      user.id,
      "Mở khóa",
      { status: "LOCKED" },
      { status: "ACTIVE" },
      body.reason,
    );
    return userDTO(user);
  },
  resetUserPassword(
    viewer: User,
    userId: string,
    body: ResetUserPasswordInput,
    expectedVersion: string | null,
  ) {
    requireAdmin(viewer, "USERS_MANAGE");
    const user = requireUser(userId);
    requireVersion(expectedVersion, user);
    db.passwords.set(user.id, body.temporaryPassword);
    revokeUserSessions(user.id);
    touch(user);
    audit(
      viewer.id,
      "USER",
      user.id,
      "Cấp lại mật khẩu",
      null,
      { sessionsRevoked: true },
      body.reason,
    );
    return { ok: true };
  },
  revokeUserSessions(viewer: User, userId: string, body: { reason: string }) {
    requireAdmin(viewer, "USERS_MANAGE");
    const user = requireUser(userId);
    if (user.id === viewer.id)
      throw new ApiError(
        422,
        "BUSINESS_RULE",
        "Không thu hồi phiên của chính mình, hãy dùng Đăng xuất.",
      );
    revokeUserSessions(user.id);
    audit(
      viewer.id,
      "USER",
      user.id,
      "Thu hồi phiên đăng nhập",
      null,
      { sessionsRevoked: true },
      body.reason,
    );
    return { ok: true as const };
  },
  listUserProjects(viewer: User, userId: string) {
    requireAdmin(viewer, "USERS_MANAGE", "PERMISSIONS_MANAGE");
    const user = requireUser(userId);
    return db.members
      .filter((m) => m.userId === user.id)
      .map((m) => {
        const project = db.projects.find((p) => p.id === m.projectId)!;
        return {
          membershipId: m.id,
          project: { id: project.id, name: project.name },
          projectVersion: project.version,
          projectStatus: project.status,
          projectRole: m.projectRole,
          isOwner: project.ownerId === user.id,
          permissions: m.endedAt ? [] : projectPermissions(user, project.id),
          startedAt: m.createdAt,
          endedAt: m.endedAt,
        };
      })
      .sort((a, b) =>
        a.endedAt || b.endedAt
          ? (a.endedAt ? 1 : 0) - (b.endedAt ? 1 : 0) ||
            (b.endedAt ?? "").localeCompare(a.endedAt ?? "")
          : a.project.name.localeCompare(b.project.name),
      );
  },
  getUserPermissions(viewer: User, userId: string): UserPermissionsDto {
    requireAdmin(viewer, "PERMISSIONS_MANAGE");
    const user = requireUser(userId);
    return {
      userId: user.id,
      version: user.version,
      isSysAdmin: user.isSysAdmin,
      groups: db.permissionGroups
        .filter((g) => g.memberIds.includes(user.id))
        .map((g) => ({ id: g.id, label: g.name })),
      grantedFeatures: user.grantedFeatures,
      revokedFeatures: user.revokedFeatures,
      effective: effectiveFeatures(user),
    };
  },
  updateUserPermissions(
    viewer: User,
    userId: string,
    body: UpdateUserPermissionsInput,
    expectedVersion: string | null,
  ) {
    requireAdmin(viewer, "PERMISSIONS_MANAGE");
    const user = requireUser(userId);
    requireVersion(expectedVersion, user);
    requireFeatureCodes(body.grantedFeatures, "grantedFeatures");
    requireFeatureCodes(body.revokedFeatures, "revokedFeatures");
    const groups = body.groupIds.map(requireGroup);
    if (body.isSysAdmin !== user.isSysAdmin) {
      if (!viewer.isSysAdmin)
        throw new ApiError(
          403,
          "FORBIDDEN",
          "Chỉ quản trị tối cao mới được đổi cờ quản trị tối cao.",
        );
      if (!body.isSysAdmin) protectLastAdmin(user);
    }
    requireGrantable(viewer, [
      ...groups
        .filter((g) => !g.memberIds.includes(user.id))
        .flatMap((g) => g.features),
      ...body.grantedFeatures.filter(
        (code) => !user.grantedFeatures.includes(code),
      ),
    ]);
    const before = usersDb.getUserPermissions(viewer, userId);
    user.isSysAdmin = body.isSysAdmin;
    user.grantedFeatures = body.grantedFeatures;
    user.revokedFeatures = body.revokedFeatures;
    setUserGroups(user, body.groupIds);
    touch(user);
    audit(
      viewer.id,
      "USER",
      user.id,
      "Cập nhật phân quyền",
      {
        isSysAdmin: before.isSysAdmin,
        groupIds: before.groups.map((g) => g.id),
        grantedFeatures: before.grantedFeatures,
        revokedFeatures: before.revokedFeatures,
      },
      {
        isSysAdmin: body.isSysAdmin,
        groupIds: body.groupIds,
        grantedFeatures: body.grantedFeatures,
        revokedFeatures: body.revokedFeatures,
      },
      body.reason,
    );
    return usersDb.getUserPermissions(viewer, userId);
  },
};

const groupDTO = (
  group: (typeof db.permissionGroups)[number],
): PermissionGroupDto => ({
  ...group,
  ...stampRefs(group),
  members: group.memberIds.map((id) => ({
    id,
    label: person(id).displayName,
  })),
});
function requireFeature(code: string) {
  const feature = db.features.find((f) => f.code === code);
  if (!feature)
    throw new ApiError(404, "NOT_FOUND", "Không tìm thấy mã chức năng.");
  return feature;
}
function validateMembers(memberIds: string[]) {
  if (new Set(memberIds).size !== memberIds.length)
    throw new ApiError(422, "VALIDATION_ERROR", "Thành viên bị trùng.", [
      {
        path: ["memberIds"],
        message: "Thành viên trong nhóm không được trùng.",
      },
    ]);
  memberIds.forEach(requireUser);
}
const featureDTO = (feature: (typeof db.features)[number]): FeatureDto => ({
  ...feature,
  updatedBy: stampRef(feature.updatedBy),
});
const projectPermissionOrder: Permission[] = [
  "PROJECT_MANAGE",
  "MEMBERS_MANAGE",
  "TASKS_MANAGE",
  "TASKS_REVIEW",
  "ANALYTICS_VIEW",
  "ALERTS_MANAGE",
];
function rolePolicyDTO(role: "OWNER" | "MANAGER" | "MEMBER") {
  const row = role === "OWNER" ? null : db.rolePolicies[role];
  return {
    role,
    permissions: row ? row.permissions : accessPolicy.project.OWNER,
    editable: role !== "OWNER",
    version: row?.version ?? 1,
    updatedAt: row?.updatedAt ?? null,
    updatedBy: row?.updatedBy ? stampRef(row.updatedBy) : null,
  };
}
export const permissionsDb = {
  listProjectRolePolicies(viewer: User) {
    requireAdmin(viewer, "PERMISSIONS_MANAGE", "USERS_MANAGE");
    return (["OWNER", "MANAGER", "MEMBER"] as const).map(rolePolicyDTO);
  },
  updateProjectRolePolicy(
    viewer: User,
    role: "OWNER" | "MANAGER" | "MEMBER",
    body: { permissions: Permission[]; reason: string },
    expectedVersion: string | null,
  ) {
    requireAdmin(viewer, "PERMISSIONS_MANAGE");
    if (role === "OWNER")
      throw new ApiError(
        422,
        "ROLE_LOCKED",
        "Chủ dự án luôn có đủ quyền trong dự án của mình.",
      );
    const row = db.rolePolicies[role];
    requireVersion(expectedVersion, row);
    const before = { permissions: row.permissions };
    row.permissions = projectPermissionOrder.filter((code) =>
      body.permissions.includes(code),
    );
    row.version++;
    row.updatedAt = now();
    row.updatedBy = viewer.id;
    audit(
      viewer.id,
      "ProjectRolePolicy",
      role,
      "Cập nhật quyền vai trò dự án",
      before,
      { permissions: row.permissions },
      body.reason,
    );
    return rolePolicyDTO(role);
  },
  listFeatures(viewer: User): FeatureDto[] {
    requireAdmin(viewer, "PERMISSIONS_MANAGE");
    return db.features
      .toSorted((a, b) => a.sortOrder - b.sortOrder)
      .map(featureDTO);
  },
  updateFeature(
    viewer: User,
    code: string,
    body: UpdateFeatureInput,
    expectedVersion: string | null,
  ): FeatureDto {
    requireAdmin(viewer, "PERMISSIONS_MANAGE");
    const feature = requireFeature(code);
    requireVersion(expectedVersion, feature);
    if (feature.isGroup)
      throw new ApiError(
        422,
        "BUSINESS_RULE",
        "Chỉ bật/tắt được mã quyền, không phải node nhóm.",
      );
    if (feature.code === "PERMISSIONS_MANAGE" && !body.isActive)
      throw new ApiError(
        422,
        "BUSINESS_RULE",
        "Không được tắt mã quản lý phân quyền.",
      );
    const before = { isActive: feature.isActive };
    feature.isActive = body.isActive;
    touch(feature);
    audit(
      viewer.id,
      "Feature",
      feature.code,
      body.isActive ? "Bật mã chức năng" : "Tắt mã chức năng",
      before,
      { isActive: feature.isActive },
      body.reason,
    );
    return featureDTO(feature);
  },
  listPermissionGroups(viewer: User, query: PermissionGroupQuery) {
    requireAdmin(viewer, "PERMISSIONS_MANAGE", "USERS_MANAGE");
    const q = query.q?.toLowerCase();
    return paginate(
      db.permissionGroups
        .filter(
          (g) =>
            (!q || `${g.code} ${g.name}`.toLowerCase().includes(q)) &&
            (!query.status || g.status === query.status),
        )
        .map(groupDTO),
      query,
    );
  },
  getPermissionGroup(viewer: User, groupId: string) {
    requireAdmin(viewer, "PERMISSIONS_MANAGE");
    return groupDTO(requireGroup(groupId));
  },
  createPermissionGroup(viewer: User, body: CreatePermissionGroupInput) {
    requireAdmin(viewer, "PERMISSIONS_MANAGE");
    if (db.permissionGroups.some((g) => g.code === body.code))
      throw new ApiError(409, "CONFLICT", "Mã nhóm quyền đã tồn tại.", [
        { path: ["code"], message: "Mã nhóm quyền đã tồn tại." },
      ]);
    requireFeatureCodes(body.features, "features");
    validateMembers(body.memberIds);
    requireGrantable(viewer, body.features);
    const group = {
      ...entity(),
      createdAt: now(),
      updatedAt: now(),
      code: body.code,
      name: body.name,
      description: body.description ?? null,
      features: body.features,
      memberIds: body.memberIds,
      status: "ACTIVE" as const,
      isSystem: false,
      ...stamp(),
    };
    db.permissionGroups.push(group);
    audit(viewer.id, "PermissionGroup", group.id, "Tạo nhóm quyền", null, body);
    return groupDTO(group);
  },
  updatePermissionGroup(
    viewer: User,
    groupId: string,
    body: UpdatePermissionGroupInput,
    expectedVersion: string | null,
  ) {
    requireAdmin(viewer, "PERMISSIONS_MANAGE");
    const group = requireGroup(groupId);
    requireVersion(expectedVersion, group);
    const { reason, ...patch } = body;
    if (!Object.keys(patch).length)
      throw new ApiError(422, "EMPTY_PATCH", "Chưa có thông tin thay đổi.");
    if (patch.features) {
      requireFeatureCodes(patch.features, "features");
      requireGrantable(
        viewer,
        patch.features.filter((code) => !group.features.includes(code)),
      );
    }
    const before = {
      name: group.name,
      description: group.description,
      features: group.features,
    };
    Object.assign(group, patch);
    touch(group);
    audit(
      viewer.id,
      "PermissionGroup",
      group.id,
      "Cập nhật nhóm quyền",
      before,
      patch,
      reason ?? null,
    );
    return groupDTO(group);
  },
  replacePermissionGroupMembers(
    viewer: User,
    groupId: string,
    body: ReplacePermissionGroupMembersInput,
    expectedVersion: string | null,
  ) {
    requireAdmin(viewer, "PERMISSIONS_MANAGE");
    const group = requireGroup(groupId);
    requireVersion(expectedVersion, group);
    validateMembers(body.memberIds);
    if (body.memberIds.some((id) => !group.memberIds.includes(id)))
      requireGrantable(viewer, group.features);
    const before = { memberIds: group.memberIds };
    group.memberIds = body.memberIds;
    touch(group);
    audit(
      viewer.id,
      "PermissionGroup",
      group.id,
      "Thay thành viên nhóm quyền",
      before,
      { memberIds: group.memberIds },
      body.reason ?? null,
    );
    return groupDTO(group);
  },
  setPermissionGroupStatus(
    viewer: User,
    groupId: string,
    active: boolean,
    reason: string,
    expectedVersion: string | null,
  ) {
    requireAdmin(viewer, "PERMISSIONS_MANAGE");
    const group = requireGroup(groupId);
    requireVersion(expectedVersion, group);
    const status = active ? "ACTIVE" : "INACTIVE";
    if (group.status === status)
      throw new ApiError(
        422,
        "BUSINESS_RULE",
        active ? "Nhóm quyền đang hoạt động." : "Nhóm quyền đã ngừng sử dụng.",
      );
    if (!active && group.isSystem)
      throw new ApiError(
        422,
        "BUSINESS_RULE",
        "Không được ngừng sử dụng nhóm quyền hệ thống.",
      );
    if (active) requireGrantable(viewer, group.features);
    const before = { status: group.status };
    group.status = status;
    touch(group);
    audit(
      viewer.id,
      "PermissionGroup",
      group.id,
      active ? "Kích hoạt nhóm quyền" : "Ngừng sử dụng nhóm quyền",
      before,
      { status },
      reason,
    );
    return groupDTO(group);
  },
};

const actorRef = (id: string) => ({
  id,
  label:
    id === "SYSTEM"
      ? "Hệ thống"
      : (db.users.find((u) => u.id === id)?.displayName ?? id),
});
const auditRow = (item: Audit): AuditLogRow => ({
  id: item.id,
  at: item.at,
  entityType: item.entityType,
  entityId: item.entityId,
  action: item.action,
  actor: actorRef(item.actorId),
  reason: item.reason,
});
export const auditLogsDb = {
  listAuditLogs(viewer: User, query: AuditLogQuery) {
    requireAdmin(viewer, "AUDIT_VIEW");
    const q = query.q?.toLowerCase();
    return paginate(
      db.audits
        .filter(
          (a) =>
            (!q ||
              `${a.entityId} ${a.action} ${a.reason ?? ""}`
                .toLowerCase()
                .includes(q)) &&
            (!query.entityType || a.entityType === query.entityType) &&
            (!query.actorId || a.actorId === query.actorId) &&
            (!query.action || a.action === query.action) &&
            (!query.from || a.at >= query.from) &&
            (!query.to || a.at <= query.to),
        )
        .toSorted((a, b) => b.at.localeCompare(a.at))
        .map(auditRow),
      query,
    );
  },
  getAuditLog(viewer: User, auditLogId: string): AuditLogDto {
    requireAdmin(viewer, "AUDIT_VIEW");
    const item = db.audits.find((a) => a.id === auditLogId);
    if (!item) throw new ApiError(404, "NOT_FOUND", "Không tìm thấy nhật ký.");
    return { ...auditRow(item), before: item.before, after: item.after };
  },
  listEntityTypes(viewer: User) {
    requireAdmin(viewer, "AUDIT_VIEW");
    return [...new Set(db.audits.map((a) => a.entityType))].sort();
  },
};

function requireJob(code: string) {
  const job = db.backgroundJobs.find((j) => j.code === code);
  if (!job) throw new ApiError(404, "NOT_FOUND", "Không tìm thấy job nền.");
  return job;
}
const runDTO = (run: (typeof db.jobRuns)[number]): JobRunDto => ({
  ...run,
  durationMs: run.finishedAt
    ? Date.parse(run.finishedAt) - Date.parse(run.startedAt)
    : null,
  triggeredBy: run.triggeredBy ? actorRef(run.triggeredBy) : null,
});
const jobDTO = (job: (typeof db.backgroundJobs)[number]): BackgroundJobDto => ({
  ...job,
  updatedBy: stampRef(job.updatedBy),
});
export const jobsDb = {
  listJobs(viewer: User): BackgroundJobDto[] {
    requireAdmin(viewer, "JOBS_MANAGE");
    return db.backgroundJobs.map(jobDTO);
  },
  updateJob(
    viewer: User,
    code: string,
    body: UpdateJobInput,
    expectedVersion: string | null,
  ): BackgroundJobDto {
    requireAdmin(viewer, "JOBS_MANAGE");
    const job = requireJob(code);
    requireVersion(expectedVersion, job);
    const { reason, ...patch } = body;
    if (!Object.keys(patch).length)
      throw new ApiError(422, "EMPTY_PATCH", "Chưa có thông tin thay đổi.");
    const before = {
      isEnabled: job.isEnabled,
      intervalMinutes: job.intervalMinutes,
    };
    Object.assign(job, patch);
    job.nextRunAt =
      job.isEnabled && job.lastRunAt
        ? new Date(
            Date.parse(job.lastRunAt) + job.intervalMinutes * 60000,
          ).toISOString()
        : job.isEnabled
          ? now()
          : null;
    touch(job);
    audit(
      viewer.id,
      "BackgroundJob",
      job.code,
      "Cập nhật job nền",
      before,
      patch,
      reason ?? null,
    );
    return jobDTO(job);
  },
  runJob(viewer: User, code: string): JobRunDto {
    requireAdmin(viewer, "JOBS_MANAGE");
    const job = requireJob(code);
    if (job.lastStatus === "RUNNING")
      throw new ApiError(409, "CONFLICT", "Job đang chạy.");
    const summary = asSystem(evaluateAlertRules);
    const run = {
      id: crypto.randomUUID(),
      jobCode: job.code,
      startedAt: now(),
      finishedAt: now(),
      status: "SUCCEEDED" as const,
      trigger: "MANUAL" as const,
      triggeredBy: viewer.id,
      summary,
      error: null,
    };
    db.jobRuns.push(run);
    const runs = db.jobRuns.filter((r) => r.jobCode === job.code);
    if (runs.length > 200)
      db.jobRuns = db.jobRuns.filter((r) => !runs.slice(0, -200).includes(r));
    job.lastRunAt = run.startedAt;
    job.lastStatus = run.status;
    job.nextRunAt = new Date(
      Date.parse(now()) + job.intervalMinutes * 60000,
    ).toISOString();
    db.revision++;
    return runDTO(run);
  },
  listJobRuns(viewer: User, code: string, query: JobRunQuery) {
    requireAdmin(viewer, "JOBS_MANAGE");
    requireJob(code);
    return paginate(
      db.jobRuns
        .filter(
          (r) =>
            r.jobCode === code && (!query.status || r.status === query.status),
        )
        .toSorted((a, b) => b.startedAt.localeCompare(a.startedAt))
        .map(runDTO),
      query,
    );
  },
};

const configCatalog = z
  .record(
    z.string(),
    z.object({
      dataType: configDataTypeSchema,
      requiresRestart: z.boolean().optional(),
      minValue: z.number().optional(),
      maxValue: z.number().optional(),
      allowedValues: z.array(z.string()).optional(),
    }),
  )
  .parse(seed.configPolicy.catalog);
type ConfigRule = (typeof configCatalog)[string];
const settingDTO = (item: (typeof db.settings)[number]): SettingDto => {
  const rule = configCatalog[item.key];
  return {
    ...item,
    known: Boolean(rule),
    requiresRestart: rule?.requiresRestart ?? false,
    minValue: rule?.minValue ?? null,
    maxValue: rule?.maxValue ?? null,
    allowedValues: rule?.allowedValues ?? null,
    ...stampRefs(item),
  };
};
function settingError(path: "key" | "value", message: string) {
  return new ApiError(422, "VALIDATION_ERROR", message, [
    { path: [path], message },
  ]);
}
function validateSettingValue(
  key: string,
  dataType: ConfigRule["dataType"],
  value: string,
) {
  const rule = configCatalog[key];
  if (dataType === "BOOL" && !["true", "false"].includes(value))
    throw settingError("value", "Giá trị phải là true hoặc false.");
  if (dataType === "INT") {
    if (!/^-?\d+$/.test(value))
      throw settingError("value", "Giá trị phải là số nguyên.");
    const number = Number(value);
    if (
      (rule?.minValue !== undefined && number < rule.minValue) ||
      (rule?.maxValue !== undefined && number > rule.maxValue)
    )
      throw settingError(
        "value",
        `Giá trị phải từ ${rule.minValue ?? "—"} đến ${rule.maxValue ?? "—"}.`,
      );
  }
  if (rule?.allowedValues && !rule.allowedValues.includes(value))
    throw settingError(
      "value",
      `Giá trị phải là một trong: ${rule.allowedValues.join(", ")}.`,
    );
}
export const settingsDb = {
  listSettings(viewer: User, query: SettingQuery) {
    requireAdmin(viewer, "SETTINGS_MANAGE");
    const q = query.q?.toLowerCase();
    return db.settings
      .filter(
        (s) =>
          (!query.serviceType || s.serviceType === query.serviceType) &&
          (!query.group || s.group === query.group) &&
          (!q || s.key.toLowerCase().includes(q)),
      )
      .toSorted((a, b) =>
        `${a.serviceType}|${a.group}|${a.key}`.localeCompare(
          `${b.serviceType}|${b.group}|${b.key}`,
        ),
      )
      .map(settingDTO);
  },
  createSetting(viewer: User, body: CreateSettingInput) {
    requireAdmin(viewer, "SETTINGS_MANAGE");
    const policy = seed.configPolicy;
    if (
      new RegExp(policy.forbiddenKey, "i").test(body.key) ||
      policy.forbiddenPrefixes.some((prefix) => body.key.startsWith(prefix))
    )
      throw settingError("key", "Không được lưu secret hoặc cấu hình hạ tầng.");
    if (
      db.settings.some(
        (s) => s.key === body.key && s.serviceType === body.serviceType,
      )
    )
      throw new ApiError(409, "CONFLICT", "Cấu hình đã tồn tại.", [
        { path: ["key"], message: "Key đã tồn tại cho service này." },
      ]);
    const rule = configCatalog[body.key];
    if (rule && rule.dataType !== body.dataType)
      throw new ApiError(422, "VALIDATION_ERROR", "Sai kiểu dữ liệu.", [
        { path: ["dataType"], message: `Key này có kiểu ${rule.dataType}.` },
      ]);
    const value = body.value.trim();
    validateSettingValue(body.key, body.dataType, value);
    const item = {
      ...entity(),
      key: body.key,
      serviceType: body.serviceType,
      group: body.group,
      name: body.name,
      description: body.description ?? null,
      dataType: body.dataType,
      value,
      isActive: true,
      createdAt: now(),
      updatedAt: now(),
      ...stamp(),
    };
    if (item.key === whitelistKey && item.isActive)
      protectCurrentIp(value === "true", db.ipWhitelist);
    db.settings.push(item);
    audit(viewer.id, "SystemConfig", item.id, "Thêm cấu hình", null, body);
    return settingDTO(item);
  },
  updateSetting(
    viewer: User,
    settingId: string,
    body: UpdateSettingInput,
    expectedVersion: string | null,
  ) {
    requireAdmin(viewer, "SETTINGS_MANAGE");
    const item = db.settings.find((s) => s.id === settingId);
    if (!item) throw new ApiError(404, "NOT_FOUND", "Không tìm thấy cấu hình.");
    requireVersion(expectedVersion, item);
    const { reason, ...patch } = body;
    if (!Object.keys(patch).length)
      throw new ApiError(422, "EMPTY_PATCH", "Chưa có thông tin thay đổi.");
    if (patch.value !== undefined) {
      patch.value = patch.value.trim();
      validateSettingValue(item.key, item.dataType, patch.value);
    }
    const rule = configCatalog[item.key];
    if (
      patch.isActive === false &&
      rule?.requiresRestart &&
      item.group === "JWT"
    )
      throw new ApiError(
        422,
        "BUSINESS_RULE",
        "Không được tắt cấu hình JWT cần khởi động lại.",
      );
    if (item.key === whitelistKey) {
      const next = { ...item, ...patch };
      protectCurrentIp(next.isActive && next.value === "true", db.ipWhitelist);
    }
    const before = {
      value: item.value,
      name: item.name,
      description: item.description,
      isActive: item.isActive,
    };
    Object.assign(item, patch);
    touch(item);
    audit(
      viewer.id,
      "SystemConfig",
      item.id,
      "Cập nhật cấu hình",
      before,
      patch,
      reason,
    );
    return settingDTO(item);
  },
};

const ipEntryDTO = (
  item: (typeof db.ipWhitelist)[number],
): IpWhitelistEntryDto => ({
  ...item,
  ...stampRefs(item),
});
const ipLogDTO = ({
  lastUserId,
  resolvedBy,
  ...log
}: (typeof db.ipAccessLogs)[number]) => ({
  ...log,
  lastUser: lastUserId ? stampRef(lastUserId) : null,
  resolvedBy: resolvedBy ? stampRef(resolvedBy) : null,
});
function requireIpLog(id: string) {
  const log = db.ipAccessLogs.find((l) => l.id === id);
  if (!log)
    throw new ApiError(404, "NOT_FOUND", "Không tìm thấy nhật ký truy cập.");
  return log;
}
function requireIpEntry(id: string) {
  const item = db.ipWhitelist.find((e) => e.id === id);
  if (!item) throw new ApiError(404, "NOT_FOUND", "Không tìm thấy địa chỉ IP.");
  return item;
}
export const ipWhitelistDb = {
  getIpWhitelist(viewer: User): IpWhitelistDto {
    requireAdmin(viewer, "SETTINGS_MANAGE");
    const setting = whitelistSetting();
    if (!setting)
      throw new ApiError(404, "NOT_FOUND", "Chưa có cấu hình IP whitelist.");
    return {
      enabled: setting.value === "true",
      settingId: setting.id,
      settingVersion: setting.version,
      currentIp: currentIp(),
      entries: db.ipWhitelist.map(ipEntryDTO),
    };
  },
  listIpAccessLogs(
    viewer: User,
    query: {
      page?: number;
      pageSize?: number;
      q?: string;
      status?: string;
      scope?: string;
    },
  ) {
    requireAdmin(viewer, "SETTINGS_MANAGE");
    const q = query.q?.toLowerCase();
    return paginate(
      db.ipAccessLogs
        .filter(
          (l) =>
            (!query.status || l.status === query.status) &&
            (!query.scope || l.scope === query.scope) &&
            (!q ||
              l.ip.includes(q) ||
              (l.lastUsername ?? "").toLowerCase().includes(q)),
        )
        .toSorted((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt))
        .map(ipLogDTO),
      query,
    );
  },
  allowIpAccessLog(
    viewer: User,
    logId: string,
    body: { cidr?: string; description?: string | null; reason: string },
    expectedVersion: string | null,
  ) {
    requireAdmin(viewer, "SETTINGS_MANAGE");
    const log = requireIpLog(logId);
    requireVersion(expectedVersion, log);
    if (log.status === "ALLOWED")
      throw new ApiError(409, "CONFLICT", "IP này đã được cho phép.");
    const cidr = body.cidr?.trim() || log.ip;
    if (!ipMatches(log.ip, cidr.includes("/") ? cidr : `${cidr}/32`))
      throw new ApiError(
        422,
        "VALIDATION",
        `Địa chỉ IP/CIDR phải hợp lệ và bao gồm IP ${log.ip}.`,
        [{ path: ["cidr"], message: `Phải bao gồm IP ${log.ip}.` }],
      );
    log.status = "ALLOWED";
    log.resolvedBy = viewer.id;
    log.resolvedAt = now();
    log.resolveNote = body.reason;
    log.version++;
    const entry = ipWhitelistDb.createIpWhitelistEntry(viewer, {
      cidr,
      description:
        body.description ??
        `Cho phép từ nhật ký truy cập${log.lastUsername ? ` · ${log.lastUsername}` : ""}`,
    });
    return { log: ipLogDTO(log), entry };
  },
  dismissIpAccessLog(
    viewer: User,
    logId: string,
    body: { reason: string },
    expectedVersion: string | null,
  ) {
    requireAdmin(viewer, "SETTINGS_MANAGE");
    const log = requireIpLog(logId);
    requireVersion(expectedVersion, log);
    if (log.status !== "PENDING")
      throw new ApiError(409, "CONFLICT", "Nhật ký này đã được xử lý.");
    log.status = "DISMISSED";
    log.resolvedBy = viewer.id;
    log.resolvedAt = now();
    log.resolveNote = body.reason;
    log.version++;
    return ipLogDTO(log);
  },
  createIpWhitelistEntry(viewer: User, body: CreateIpWhitelistEntryInput) {
    requireAdmin(viewer, "SETTINGS_MANAGE");
    const item = {
      ...entity(),
      cidr: body.cidr,
      description: body.description ?? null,
      isActive: true,
      createdAt: now(),
      updatedAt: now(),
      ...stamp(),
    };
    db.ipWhitelist.push(item);
    audit(
      viewer.id,
      "IpWhitelistEntry",
      item.id,
      "Thêm IP whitelist",
      null,
      body,
    );
    return ipEntryDTO(item);
  },
  updateIpWhitelistEntry(
    viewer: User,
    entryId: string,
    body: UpdateIpWhitelistEntryInput,
    expectedVersion: string | null,
  ) {
    requireAdmin(viewer, "SETTINGS_MANAGE");
    const item = requireIpEntry(entryId);
    requireVersion(expectedVersion, item);
    const { reason, ...patch } = body;
    if (!Object.keys(patch).length)
      throw new ApiError(422, "EMPTY_PATCH", "Chưa có thông tin thay đổi.");
    protectCurrentIp(
      whitelistEnabled(),
      db.ipWhitelist.map((e) => (e === item ? { ...e, ...patch } : e)),
    );
    const before = {
      cidr: item.cidr,
      description: item.description,
      isActive: item.isActive,
    };
    Object.assign(item, patch);
    touch(item);
    audit(
      viewer.id,
      "IpWhitelistEntry",
      item.id,
      "Cập nhật IP whitelist",
      before,
      patch,
      reason ?? null,
    );
    return ipEntryDTO(item);
  },
  deleteIpWhitelistEntry(
    viewer: User,
    entryId: string,
    expectedVersion: string | null,
  ) {
    requireAdmin(viewer, "SETTINGS_MANAGE");
    const item = requireIpEntry(entryId);
    requireVersion(expectedVersion, item);
    protectCurrentIp(
      whitelistEnabled(),
      db.ipWhitelist.filter((e) => e !== item),
    );
    db.ipWhitelist = db.ipWhitelist.filter((e) => e !== item);
    db.revision++;
    audit(
      viewer.id,
      "IpWhitelistEntry",
      item.id,
      "Xóa IP whitelist",
      { cidr: item.cidr, isActive: item.isActive },
      null,
    );
    return { ok: true as const };
  },
};

function projectEditable(project: (typeof db.projects)[number]) {
  if (!["PLANNED", "ACTIVE"].includes(project.status))
    throw new ApiError(
      409,
      "PROJECT_READ_ONLY",
      "Dự án đã đóng, chỉ được tra cứu.",
    );
}
function validateProjectPlan(
  unitId: string,
  ownerId: string,
  startDate: string,
  dueAt: string,
  requireFuture = true,
) {
  activeUnit(unitId);
  const owner = requireUser(ownerId);
  if (
    owner.status !== "ACTIVE" ||
    owner.unitId !== unitId ||
    !can(owner, "PROJECT_CREATE")
  )
    throw new ApiError(
      422,
      "INVALID_OWNER",
      "Người phụ trách phải là Leader/PM đang hoạt động trong đơn vị.",
    );
  if (
    (requireFuture && dueAt <= now()) ||
    startDate >
      new Date(Date.parse(dueAt) + 7 * 3600000).toISOString().slice(0, 10)
  )
    throw new ApiError(
      422,
      "INVALID_PLAN",
      "Hạn phải ở tương lai và không trước ngày bắt đầu.",
    );
}
function ensureOwner(projectId: string, ownerId: string) {
  const member = db.members.find(
    (m) => m.projectId === projectId && m.userId === ownerId && !m.endedAt,
  );
  if (member) {
    member.projectRole = "OWNER";
    touch(member);
  } else
    db.members.push({
      ...entity(),
      projectId,
      userId: ownerId,
      projectRole: "OWNER",
      endedAt: null,
      createdAt: now(),
      updatedAt: now(),
      ...stamp(),
    });
}
function closureChecks(projectId: string) {
  const tasks = db.tasks.filter((t) => t.projectId === projectId);
  const openTaskCount = tasks.filter((t) =>
    ["NEW", "TODO", "IN_PROGRESS"].includes(t.status),
  ).length;
  const pendingReviewCount = tasks.filter(
    (t) => t.status === "PENDING_REVIEW",
  ).length;
  const pendingReportCount =
    db.reports.filter((r) => r.projectId === projectId && r.status === "DRAFT")
      .length + (db.requiredReports.get(projectId) ?? 0);
  return {
    openTaskCount,
    pendingReviewCount,
    pendingReportCount,
    canClose: openTaskCount + pendingReviewCount + pendingReportCount === 0,
  };
}
function requireClosure(projectId: string) {
  const checks = closureChecks(projectId);
  if (!checks.canClose)
    throw new ApiError(
      409,
      "PROJECT_HAS_PENDING_WORK",
      "Cần xử lý công việc mở, kết quả chờ nghiệm thu và báo cáo còn thiếu trước khi đóng.",
      [],
      checks,
    );
}
function validateMemberRole(user: User, role: "MANAGER" | "MEMBER") {
  if (role === "MANAGER" && !can(user, "PROJECT_CREATE"))
    throw new ApiError(
      422,
      "INVALID_PROJECT_ROLE",
      "Vai trò quản lý dự án chỉ dành cho tài khoản Leader/PM.",
      [
        {
          path: ["projectRole"],
          message: "Tài khoản này chưa có vai trò Leader/PM.",
        },
      ],
    );
}
function requireProject(user: User, id: string, action?: Permission) {
  const project = db.projects.find((p) => p.id === id);
  if (!project) throw new ApiError(404, "NOT_FOUND", "Không tìm thấy dự án.");
  if (
    (!inProject(user, id) && !readsEveryProject(user)) ||
    (action && !can(user, action, id))
  )
    throw new ApiError(
      403,
      "FORBIDDEN",
      "Bạn không có quyền thực hiện trong dự án.",
    );
  return project;
}
export const projectsDb = {
  listProjects(viewer: User, query: ProjectQuery) {
    return paginate(
      db.projects
        .filter(
          (p) =>
            (readsEveryProject(viewer) || inProject(viewer, p.id)) &&
            (!query.q ||
              `${p.code} ${p.name}`
                .toLowerCase()
                .includes(query.q.toLowerCase())) &&
            (!query.status || p.status === query.status) &&
            (!query.unitId || p.unitId === query.unitId),
        )
        .map(projectRow),
      query,
    );
  },
  getProject(viewer: User, projectId: string) {
    return projectDTO(requireProject(viewer, projectId));
  },
  createProject(viewer: User, body: CreateProjectInput) {
    if (!can(viewer, "PROJECT_CREATE") || body.unitId !== viewer.unitId)
      throw new ApiError(
        403,
        "FORBIDDEN",
        "Không được tạo dự án ngoài đơn vị được cấp quyền.",
      );
    if (db.projects.some((p) => p.code === body.code))
      throw new ApiError(409, "DUPLICATE_CODE", "Mã dự án đã tồn tại.", [
        { path: ["code"], message: "Mã dự án đã tồn tại." },
      ]);
    validateProjectPlan(body.unitId, body.ownerId, body.startDate, body.dueAt);
    const project = {
      ...entity(),
      ...body,
      status: "PLANNED" as const,
      ...created(),
    };
    db.projects.push(project);
    ensureOwner(project.id, project.ownerId);
    audit(viewer.id, "PROJECT", project.id, "Tạo dự án", null, {
      code: project.code,
      name: project.name,
    });
    return projectDTO(project);
  },
  updateProject(
    viewer: User,
    projectId: string,
    body: UpdateProjectInput,
    expectedVersion: string | null,
  ) {
    const project = requireProject(viewer, projectId, "PROJECT_MANAGE");
    requireVersion(expectedVersion, project);
    projectEditable(project);
    const { changeReason, ...patch } = body;
    if (!Object.keys(patch).length)
      throw new ApiError(422, "EMPTY_PATCH", "Chưa có thay đổi kế hoạch.");
    validateProjectPlan(
      project.unitId,
      patch.ownerId ?? project.ownerId,
      patch.startDate ?? project.startDate,
      patch.dueAt ?? project.dueAt,
      Boolean(patch.dueAt && patch.dueAt !== project.dueAt),
    );
    if (
      patch.dueAt &&
      db.tasks.some(
        (t) =>
          t.projectId === project.id &&
          t.status !== "CANCELLED" &&
          t.dueAt > patch.dueAt!,
      )
    )
      throw new ApiError(
        422,
        "TASK_DUE_EXCEEDS_PROJECT",
        "Không rút hạn dự án xuống trước hạn công việc.",
      );
    const before = {
      name: project.name,
      objective: project.objective,
      ownerId: project.ownerId,
      startDate: project.startDate,
      dueAt: project.dueAt,
    };
    if (patch.ownerId && patch.ownerId !== project.ownerId) {
      if (viewer.id !== project.ownerId)
        throw new ApiError(
          403,
          "FORBIDDEN",
          "Chỉ chủ dự án hiện tại được bàn giao dự án.",
        );
      const previous = db.members.find(
        (m) =>
          m.projectId === project.id &&
          m.userId === project.ownerId &&
          !m.endedAt,
      );
      if (previous) {
        previous.projectRole = "MANAGER";
        touch(previous);
      }
      ensureOwner(project.id, patch.ownerId);
    }
    Object.assign(project, patch);
    touch(project);
    audit(
      viewer.id,
      "PROJECT",
      project.id,
      "Điều chỉnh kế hoạch",
      before,
      patch,
      changeReason,
    );
    return projectDTO(project);
  },
  transferProjectOwner(
    viewer: User,
    projectId: string,
    body: { newOwnerId: string; reason: string },
    expectedVersion: string | null,
  ) {
    if (!viewer.isSysAdmin && !can(viewer, "USERS_MANAGE"))
      throw new ApiError(
        403,
        "FORBIDDEN",
        "Chỉ quản trị tài khoản được bàn giao dự án thay chủ dự án.",
      );
    const project = db.projects.find((p) => p.id === projectId);
    if (!project) throw new ApiError(404, "NOT_FOUND", "Không tìm thấy dự án.");
    requireVersion(expectedVersion, project);
    if (["COMPLETED", "CANCELLED"].includes(project.status))
      throw new ApiError(409, "CONFLICT", "Dự án đã đóng, không cần bàn giao.");
    if (body.newOwnerId === project.ownerId)
      throw new ApiError(422, "INVALID_OWNER", "Người nhận đang là chủ dự án.");
    const owner = requireUser(body.newOwnerId);
    if (
      owner.status !== "ACTIVE" ||
      owner.unitId !== project.unitId ||
      !can(owner, "PROJECT_CREATE")
    )
      throw new ApiError(
        422,
        "INVALID_OWNER",
        "Người phụ trách phải là Leader/PM đang hoạt động trong đơn vị.",
      );
    const before = { ownerId: project.ownerId };
    const previous = db.members.find(
      (m) =>
        m.projectId === project.id &&
        m.userId === project.ownerId &&
        !m.endedAt,
    );
    if (previous) {
      previous.projectRole = "MANAGER";
      touch(previous);
    }
    ensureOwner(project.id, owner.id);
    project.ownerId = owner.id;
    touch(project);
    audit(
      viewer.id,
      "PROJECT",
      project.id,
      "Bàn giao chủ dự án",
      before,
      { ownerId: owner.id },
      body.reason,
    );
    return projectDTO(project);
  },
  activateProject(
    viewer: User,
    projectId: string,
    expectedVersion: string | null,
  ) {
    const project = requireProject(viewer, projectId, "PROJECT_MANAGE");
    requireVersion(expectedVersion, project);
    if (project.status !== "PLANNED")
      throw new ApiError(
        409,
        "INVALID_PROJECT_STATE",
        "Chỉ triển khai dự án đang ở trạng thái dự kiến.",
      );
    validateProjectPlan(
      project.unitId,
      project.ownerId,
      project.startDate,
      project.dueAt,
    );
    project.status = "ACTIVE";
    touch(project);
    audit(
      viewer.id,
      "PROJECT",
      project.id,
      "Triển khai dự án",
      { status: "PLANNED" },
      { status: "ACTIVE" },
    );
    return projectDTO(project);
  },
  getProjectClosureChecks(viewer: User, projectId: string) {
    requireProject(viewer, projectId, "PROJECT_MANAGE");
    return closureChecks(projectId);
  },
  completeProject(
    viewer: User,
    projectId: string,
    expectedVersion: string | null,
  ) {
    const project = requireProject(viewer, projectId, "PROJECT_MANAGE");
    requireVersion(expectedVersion, project);
    if (project.status !== "ACTIVE")
      throw new ApiError(
        409,
        "INVALID_PROJECT_STATE",
        "Chỉ kết thúc dự án đang triển khai.",
      );
    requireClosure(project.id);
    project.status = "COMPLETED";
    touch(project);
    audit(
      viewer.id,
      "PROJECT",
      project.id,
      "Kết thúc dự án",
      { status: "ACTIVE" },
      { status: "COMPLETED" },
    );
    return projectDTO(project);
  },
  cancelProject(
    viewer: User,
    projectId: string,
    body: CancelProjectInput,
    expectedVersion: string | null,
  ) {
    const project = requireProject(viewer, projectId, "PROJECT_MANAGE");
    requireVersion(expectedVersion, project);
    projectEditable(project);
    requireClosure(project.id);
    const before = project.status;
    project.status = "CANCELLED";
    touch(project);
    audit(
      viewer.id,
      "PROJECT",
      project.id,
      "Hủy dự án",
      { status: before },
      { status: "CANCELLED" },
      body.reason,
    );
    return projectDTO(project);
  },
  listProjectHistory(
    viewer: User,
    projectId: string,
    query: ProjectHistoryQuery,
  ) {
    requireProject(viewer, projectId);
    return paginate(
      db.audits
        .filter((a) => a.entityType === "PROJECT" && a.entityId === projectId)
        .sort((a, b) => b.at.localeCompare(a.at))
        .map(auditDTO),
      query,
    );
  },
};

function membership(projectId: string, id: string) {
  const value = db.members.find(
    (m) => m.projectId === projectId && m.id === id,
  );
  if (!value)
    throw new ApiError(
      404,
      "MEMBERSHIP_NOT_FOUND",
      "Không tìm thấy tư cách thành viên.",
    );
  return value;
}
export const projectMembersDb = {
  listProjectMembers(
    viewer: User,
    projectId: string,
    query: ProjectMemberQuery,
  ) {
    requireProject(viewer, projectId);
    return paginate(
      db.members
        .filter(
          (m) =>
            m.projectId === projectId &&
            (!query.q ||
              memberDTO(m)
                .user.displayName.toLowerCase()
                .includes(query.q.toLowerCase())),
        )
        .map(memberDTO),
      query,
    );
  },
  addProjectMember(
    viewer: User,
    projectId: string,
    body: AddProjectMemberInput,
  ) {
    const project = requireProject(viewer, projectId, "MEMBERS_MANAGE");
    projectEditable(project);
    const user = requireUser(body.userId);
    if (user.status !== "ACTIVE")
      throw new ApiError(
        422,
        "USER_INACTIVE",
        "Người được thêm phải có tài khoản hoạt động.",
      );
    if (
      db.members.some(
        (m) =>
          m.projectId === project.id && m.userId === body.userId && !m.endedAt,
      )
    )
      throw new ApiError(
        409,
        "ALREADY_MEMBER",
        "Người này đang là thành viên dự án.",
      );
    validateMemberRole(user, body.projectRole);
    const value = {
      ...entity(),
      projectId: project.id,
      ...body,
      endedAt: null,
      createdAt: now(),
      updatedAt: now(),
      ...stamp(),
    };
    db.members.push(value);
    audit(viewer.id, "PROJECT", project.id, "Thêm thành viên", null, {
      userId: value.userId,
      projectRole: value.projectRole,
    });
    return memberDTO(value);
  },
  updateProjectMemberRole(
    viewer: User,
    projectId: string,
    membershipId: string,
    body: UpdateProjectMemberRoleInput,
    expectedVersion: string | null,
  ) {
    const project = requireProject(viewer, projectId, "MEMBERS_MANAGE");
    projectEditable(project);
    const value = membership(project.id, membershipId);
    requireVersion(expectedVersion, value);
    if (value.projectRole === "OWNER")
      throw new ApiError(
        409,
        "OWNER_MANAGED_BY_PLAN",
        "Đổi người phụ trách tại màn điều chỉnh dự án.",
      );
    if (value.endedAt)
      throw new ApiError(
        409,
        "MEMBERSHIP_ENDED",
        "Thành viên đã kết thúc tư cách.",
      );
    validateMemberRole(requireUser(value.userId), body.projectRole);
    const before = { projectRole: value.projectRole };
    value.projectRole = body.projectRole;
    touch(value);
    audit(
      viewer.id,
      "PROJECT",
      project.id,
      "Thay đổi vai trò thành viên",
      before,
      {
        userId: value.userId,
        projectRole: value.projectRole,
      },
      body.reason,
    );
    return memberDTO(value);
  },
  endProjectMembership(
    viewer: User,
    projectId: string,
    membershipId: string,
    body: EndProjectMembershipInput,
    expectedVersion: string | null,
  ) {
    const project = requireProject(viewer, projectId, "MEMBERS_MANAGE");
    projectEditable(project);
    const value = membership(project.id, membershipId);
    requireVersion(expectedVersion, value);
    if (value.userId === project.ownerId || value.projectRole === "OWNER")
      throw new ApiError(
        409,
        "OWNER_REQUIRED",
        "Không được kết thúc người phụ trách hiện tại.",
      );
    if (value.endedAt)
      throw new ApiError(
        409,
        "MEMBERSHIP_ENDED",
        "Tư cách thành viên đã kết thúc.",
      );
    if (
      db.tasks.some(
        (t) =>
          t.projectId === project.id &&
          t.assigneeId === value.userId &&
          !["COMPLETED", "CANCELLED"].includes(t.status),
      )
    )
      throw new ApiError(
        409,
        "HANDOVER_REQUIRED",
        "Bàn giao công việc mở trước khi kết thúc tư cách.",
      );
    value.endedAt = now();
    touch(value);
    audit(
      viewer.id,
      "PROJECT",
      project.id,
      "Kết thúc thành viên",
      { userId: value.userId, endedAt: null },
      { userId: value.userId, endedAt: value.endedAt },
      body.reason,
    );
    return memberDTO(value);
  },
};

function requireTask(user: User, id: string) {
  const task = db.tasks.find((t) => t.id === id);
  if (!task) throw new ApiError(404, "NOT_FOUND", "Không tìm thấy công việc.");
  if (!visibleTask(user, task))
    throw new ApiError(
      403,
      "FORBIDDEN",
      "Bạn không có quyền xem công việc này.",
    );
  return task;
}
function requireActive(task: Task) {
  if (
    !db.projects.some((p) => p.id === task.projectId && p.status === "ACTIVE")
  )
    throw new ApiError(
      409,
      "PROJECT_NOT_ACTIVE",
      "Dự án chưa triển khai hoặc đã đóng.",
    );
}
function requireEditable(task: Task) {
  requireActive(task);
  if (["PENDING_REVIEW", "COMPLETED", "CANCELLED"].includes(task.status))
    throw new ApiError(
      409,
      "TASK_READ_ONLY",
      "Trạng thái công việc hiện tại không cho phép sửa.",
    );
}
function requireAssignee(user: User, task: Task, status: Task["status"]) {
  requireActive(task);
  if (task.assigneeId !== user.id)
    throw new ApiError(
      403,
      "NOT_ASSIGNEE",
      "Chỉ người nhận hiện tại được thực hiện.",
    );
  if (task.status !== status)
    throw new ApiError(
      409,
      "INVALID_TASK_STATE",
      "Trạng thái công việc không phù hợp.",
    );
}
function transition(
  user: User,
  task: Task,
  status: Task["status"],
  reason: string | null = null,
) {
  const before = task.status;
  task.status = status;
  task.statusChangedAt = now();
  touch(task);
  audit(
    user.id,
    "TASK",
    task.id,
    `${before} → ${status}`,
    { status: before },
    { status },
    reason,
  );
}
export const tasksDb = {
  listTasks(user: User, query: TaskQuery) {
    const items = db.tasks
      .filter((t) => visibleTask(user, t))
      .filter(
        (t) =>
          (!query.q || t.title.toLowerCase().includes(query.q.toLowerCase())) &&
          (!query.projectId || t.projectId === query.projectId) &&
          (!query.assigneeId || t.assigneeId === query.assigneeId) &&
          (!query.status || t.status === query.status) &&
          (!query.priority || t.priority === query.priority) &&
          (query.overdue === undefined || isTaskOverdue(t) === query.overdue) &&
          (!query.dueFrom || t.dueAt >= query.dueFrom) &&
          (!query.dueTo || t.dueAt <= query.dueTo),
      );
    const sort = query.sort ?? "dueAt";
    items.sort(
      (a, b) =>
        (sort.includes("updatedAt")
          ? a.updatedAt.localeCompare(b.updatedAt)
          : a.dueAt.localeCompare(b.dueAt)) * (sort.startsWith("-") ? -1 : 1),
    );
    return paginate(items.map(taskRow), query);
  },
  getTask(viewer: User, taskId: string) {
    return taskDTO(requireTask(viewer, taskId));
  },
  createTask(user: User, projectId: string, body: CreateTaskInput) {
    const project = requireProject(user, projectId, "TASKS_MANAGE");
    if (project.status !== "ACTIVE")
      throw new ApiError(
        409,
        "PROJECT_NOT_ACTIVE",
        "Dự án chưa triển khai hoặc đã đóng.",
      );
    if (body.dueAt <= now() || body.dueAt > project.dueAt)
      throw new ApiError(
        422,
        "INVALID_DEADLINE",
        "Hạn phải ở tương lai và không vượt hạn dự án.",
        [{ path: ["dueAt"], message: "Kiểm tra lại hạn hoàn thành." }],
      );
    const task: Task = {
      ...entity(),
      ...stamp(),
      createdAt: now(),
      updatedAt: now(),
      projectId: project.id,
      ...body,
      description: body.description ?? null,
      originalDueAt: body.dueAt,
      originalEstimatedMinutes: body.estimatedMinutes,
      remainingMinutes: null,
      assigneeId: null,
      status: "NEW" as const,
      statusChangedAt: now(),
      firstStartedAt: null,
      completedAt: null,
      latestSubmissionId: null,
    };
    db.tasks.push(task);
    db.revision++;
    audit(user.id, "TASK", task.id, "Tạo công việc", null, {
      title: task.title,
    });
    return taskDTO(task);
  },
  updateTask(
    user: User,
    taskId: string,
    body: UpdateTaskInput,
    expectedVersion: string | null,
  ) {
    const task = requireTask(user, taskId);
    requireProject(user, task.projectId, "TASKS_MANAGE");
    requireEditable(task);
    requireVersion(expectedVersion, task);
    if (!Object.keys(body).some((k) => k !== "changeReason"))
      throw new ApiError(422, "EMPTY_PATCH", "Chưa có thông tin thay đổi.");
    if (
      task.assigneeId &&
      ((body.dueAt && body.dueAt !== task.dueAt) ||
        (body.estimatedMinutes &&
          body.estimatedMinutes !== task.estimatedMinutes)) &&
      !body.changeReason
    )
      throw new ApiError(
        422,
        "REASON_REQUIRED",
        "Cần lý do thay đổi kế hoạch.",
      );
    const project = db.projects.find((p) => p.id === task.projectId)!;
    if (body.dueAt && (body.dueAt <= now() || body.dueAt > project.dueAt))
      throw new ApiError(
        422,
        "INVALID_DEADLINE",
        "Hạn không phù hợp kế hoạch dự án.",
      );
    const { changeReason, ...patch } = body;
    const before = Object.fromEntries(
      Object.keys(patch).map((key) => [key, task[key as keyof typeof patch]]),
    );
    Object.assign(task, patch);
    touch(task);
    audit(
      user.id,
      "TASK",
      task.id,
      "Điều chỉnh công việc",
      before,
      patch,
      changeReason ?? null,
    );
    if (task.assigneeId) notify(task.assigneeId, "TASK_UPDATED", task.id);
    return taskDTO(task);
  },
  assignTask(
    user: User,
    taskId: string,
    body: AssignTaskInput,
    expectedVersion: string | null,
  ) {
    const task = requireTask(user, taskId);
    requireProject(user, task.projectId, "TASKS_MANAGE");
    requireEditable(task);
    requireVersion(expectedVersion, task);
    if (
      !db.members.some(
        (m) =>
          m.projectId === task.projectId &&
          m.userId === body.assigneeId &&
          !m.endedAt,
      ) ||
      !db.users.some((u) => u.id === body.assigneeId && u.status === "ACTIVE")
    )
      throw new ApiError(
        422,
        "ASSIGNEE_NOT_MEMBER",
        "Người nhận phải là thành viên hoạt động của dự án.",
      );
    if (task.assigneeId === body.assigneeId)
      throw new ApiError(
        409,
        "ALREADY_ASSIGNED",
        "Công việc đã được giao cho người này.",
      );
    if (task.assigneeId && !body.reason)
      throw new ApiError(
        422,
        "REASON_REQUIRED",
        "Vui lòng nhập lý do bàn giao.",
      );
    for (const a of db.assignments.filter(
      (a) => a.taskId === task.id && !a.endedAt,
    ))
      a.endedAt = now();
    db.assignments.push({
      taskId: task.id,
      userId: body.assigneeId,
      startedAt: now(),
      endedAt: null,
    });
    task.assigneeId = body.assigneeId;
    transition(user, task, "TODO", body.reason ?? null);
    notify(body.assigneeId, "TASK_ASSIGNED", task.id);
    return taskDTO(task);
  },
  startTask(user: User, taskId: string, expectedVersion: string | null) {
    const task = requireTask(user, taskId);
    requireAssignee(user, task, "TODO");
    requireVersion(expectedVersion, task);
    task.firstStartedAt ??= now();
    transition(user, task, "IN_PROGRESS");
    return taskDTO(task);
  },
  pauseTask(
    user: User,
    taskId: string,
    body: PauseTaskInput,
    expectedVersion: string | null,
  ) {
    const task = requireTask(user, taskId);
    requireAssignee(user, task, "IN_PROGRESS");
    requireVersion(expectedVersion, task);
    transition(user, task, "TODO", body.reason);
    return taskDTO(task);
  },
  cancelTask(
    user: User,
    taskId: string,
    body: CancelTaskInput,
    expectedVersion: string | null,
  ) {
    const task = requireTask(user, taskId);
    requireProject(user, task.projectId, "TASKS_MANAGE");
    requireEditable(task);
    requireVersion(expectedVersion, task);
    for (const a of db.assignments.filter(
      (a) => a.taskId === task.id && !a.endedAt,
    ))
      a.endedAt = now();
    transition(user, task, "CANCELLED", body.reason);
    return taskDTO(task);
  },
  updateRemainingEstimate(
    user: User,
    taskId: string,
    body: UpdateRemainingEstimateInput,
    expectedVersion: string | null,
  ) {
    const task = requireTask(user, taskId);
    requireAssignee(user, task, "IN_PROGRESS");
    requireVersion(expectedVersion, task);
    requireActive(task);
    task.remainingMinutes = body.remainingMinutes;
    touch(task);
    return taskDTO(task);
  },
  listTaskHistory(viewer: User, taskId: string, query: TaskHistoryQuery) {
    requireTask(viewer, taskId);
    return paginate(
      db.audits
        .filter((a) => a.entityType === "TASK" && a.entityId === taskId)
        .sort((a, b) => b.at.localeCompare(a.at))
        .map(auditDTO),
      query,
    );
  },
};

function validateLog(
  userId: string,
  taskId: string,
  workDate: string,
  minutes: number,
  exclude?: string,
) {
  const task = db.tasks.find((t) => t.id === taskId)!;
  if (
    workDate > today() ||
    (task.firstStartedAt &&
      workDate <
        new Date(Date.parse(task.firstStartedAt) + 7 * 3600000)
          .toISOString()
          .slice(0, 10))
  )
    throw new ApiError(
      422,
      "INVALID_WORK_DATE",
      "Ngày làm việc không thuộc thời gian thực hiện.",
    );
  const assignment = db.assignments.some(
    (a) =>
      a.taskId === taskId &&
      a.userId === userId &&
      workDate >=
        new Date(Date.parse(a.startedAt) + 7 * 3600000)
          .toISOString()
          .slice(0, 10) &&
      (!a.endedAt ||
        workDate <=
          new Date(Date.parse(a.endedAt) + 7 * 3600000)
            .toISOString()
            .slice(0, 10)),
  );
  if (!assignment)
    throw new ApiError(
      422,
      "OUTSIDE_ASSIGNMENT",
      "Ngày làm việc không thuộc phân công của bạn.",
    );
  const total = db.timeLogs
    .filter(
      (l) =>
        l.userId === userId &&
        l.workDate === workDate &&
        l.status === "ACTIVE" &&
        l.id !== exclude,
    )
    .reduce((s, l) => s + l.minutes, 0);
  if (total + minutes > 1440)
    throw new ApiError(
      422,
      "DAILY_LIMIT",
      "Tổng thời gian trên mọi công việc không được vượt 1.440 phút/ngày.",
      [{ path: ["minutes"], message: "Tổng thời gian vượt 1.440 phút/ngày." }],
    );
}
export const timeLogsDb = {
  listTimeLogs(viewer: User, taskId: string, query: TimeLogQuery) {
    requireTask(viewer, taskId);
    return paginate(
      db.timeLogs.filter((l) => l.taskId === taskId).map(logDTO),
      query,
    );
  },
  createTimeLog(
    user: User,
    taskId: string,
    body: CreateTimeLogInput,
    expectedVersion: string | null,
  ) {
    const task = requireTask(user, taskId);
    requireAssignee(user, task, "IN_PROGRESS");
    requireVersion(expectedVersion, task);
    validateLog(user.id, task.id, body.workDate, body.minutes);
    const log = {
      ...entity(),
      taskId: task.id,
      userId: user.id,
      ...body,
      status: "ACTIVE" as const,
      voidReason: null,
    };
    db.timeLogs.push(log);
    touch(task);
    audit(user.id, "TASK", task.id, "Ghi giờ công", null, {
      minutes: log.minutes,
      workDate: log.workDate,
    });
    return { timeLog: logDTO(log), task: taskDTO(task) };
  },
  updateTimeLog(
    user: User,
    timeLogId: string,
    body: UpdateTimeLogInput,
    expectedVersion: string | null,
  ) {
    const log = db.timeLogs.find((l) => l.id === timeLogId);
    if (!log) throw new ApiError(404, "NOT_FOUND", "Không tìm thấy nhật ký.");
    const task = requireTask(user, log.taskId);
    requireAssignee(user, task, "IN_PROGRESS");
    if (log.userId !== user.id)
      throw new ApiError(
        403,
        "FORBIDDEN",
        "Bạn chỉ được sửa nhật ký của mình.",
      );
    if (log.status !== "ACTIVE")
      throw new ApiError(409, "LOG_VOID", "Nhật ký đã bị loại.");
    requireVersion(expectedVersion, log);
    const { reason, ...patch } = body;
    if (!Object.keys(patch).length)
      throw new ApiError(
        422,
        "EMPTY_PATCH",
        "Chưa có thông tin nhật ký thay đổi.",
      );
    validateLog(
      user.id,
      task.id,
      patch.workDate ?? log.workDate,
      patch.minutes ?? log.minutes,
      log.id,
    );
    const before = Object.fromEntries(
      Object.keys(patch).map((key) => [key, log[key as keyof typeof patch]]),
    );
    Object.assign(log, patch);
    touch(log);
    touch(task);
    audit(user.id, "TASK", task.id, "Sửa giờ công", before, patch, reason);
    return { timeLog: logDTO(log), task: taskDTO(task) };
  },
  voidTimeLog(
    user: User,
    timeLogId: string,
    body: VoidTimeLogInput,
    expectedVersion: string | null,
  ) {
    const log = db.timeLogs.find((l) => l.id === timeLogId);
    if (!log) throw new ApiError(404, "NOT_FOUND", "Không tìm thấy nhật ký.");
    const task = requireTask(user, log.taskId);
    requireAssignee(user, task, "IN_PROGRESS");
    if (log.userId !== user.id)
      throw new ApiError(
        403,
        "FORBIDDEN",
        "Bạn chỉ được loại nhật ký của mình.",
      );
    if (log.status !== "ACTIVE")
      throw new ApiError(409, "LOG_VOID", "Nhật ký đã bị loại.");
    requireVersion(expectedVersion, log);
    log.status = "VOID";
    log.voidReason = body.reason;
    touch(log);
    touch(task);
    audit(
      user.id,
      "TASK",
      task.id,
      "Loại nhật ký khỏi tổng",
      { minutes: log.minutes },
      { status: "VOID" },
      body.reason,
    );
    return { timeLog: logDTO(log), task: taskDTO(task) };
  },
};

function submissionFor(
  user: User,
  taskId: string,
  submissionId: string,
  review = false,
  expectedVersion: string | null = null,
) {
  const task = requireTask(user, taskId);
  const submission = db.submissions.find(
    (s) => s.id === submissionId && s.taskId === task.id,
  );
  if (!submission)
    throw new ApiError(404, "NOT_FOUND", "Không tìm thấy lần nộp.");
  if (review) {
    requireProject(user, task.projectId, "TASKS_REVIEW");
    requireActive(task);
    if (submission.submittedBy === user.id)
      throw new ApiError(403, "SELF_REVIEW", "Người xét phải khác người nộp.");
    if (
      task.status !== "PENDING_REVIEW" ||
      submission.id !== task.latestSubmissionId ||
      submission.status !== "PENDING"
    )
      throw new ApiError(
        409,
        "ALREADY_REVIEWED",
        "Chỉ xét lần nộp mới nhất đang chờ.",
      );
    requireVersion(expectedVersion, submission);
  }
  return { user, task, submission };
}
export const submissionsDb = {
  listSubmissions(viewer: User, taskId: string, query: SubmissionQuery) {
    requireTask(viewer, taskId);
    return paginate(
      db.submissions
        .filter((s) => s.taskId === taskId)
        .sort((a, b) =>
          query.sort === "sequence"
            ? a.sequence - b.sequence
            : b.sequence - a.sequence,
        )
        .map(submissionRow),
      query,
    );
  },
  getSubmission(viewer: User, taskId: string, submissionId: string) {
    return submissionDTO(
      submissionFor(viewer, taskId, submissionId).submission,
    );
  },
  listReviewQueue(user: User, query: ReviewQueueQuery) {
    return paginate(
      db.submissions
        .filter(
          (s) =>
            s.status === "PENDING" &&
            s.submittedBy !== user.id &&
            db.tasks.some(
              (t) =>
                t.id === s.taskId &&
                t.latestSubmissionId === s.id &&
                can(user, "TASKS_REVIEW", t.projectId) &&
                (!query.q ||
                  t.title.toLowerCase().includes(query.q.toLowerCase())) &&
                (!query.projectId || query.projectId === t.projectId),
            ),
        )
        .map(reviewRow),
      query,
    );
  },
  createSubmission(
    user: User,
    taskId: string,
    body: CreateSubmissionInput,
    expectedVersion: string | null,
  ) {
    const task = requireTask(user, taskId);
    requireAssignee(user, task, "IN_PROGRESS");
    requireVersion(expectedVersion, task);
    const minutes = taskMinutes(task.id);
    if (minutes <= 0)
      throw new ApiError(
        422,
        "TIME_REQUIRED",
        "Cần có giờ công hợp lệ trước khi nộp.",
      );
    if (
      body.attachmentIds.length > 10 ||
      body.attachmentIds.some(
        (id) =>
          !db.attachments.some(
            (a) =>
              a.id === id &&
              a.taskId === task.id &&
              a.uploadedBy === user.id &&
              a.status === "READY",
          ),
      )
    )
      throw new ApiError(
        422,
        "ATTACHMENT_NOT_READY",
        "Tệp minh chứng chưa sẵn sàng hoặc không thuộc công việc.",
      );
    if (
      db.submissions.some((s) => s.taskId === task.id && s.status === "PENDING")
    )
      throw new ApiError(409, "PENDING_EXISTS", "Đã có kết quả chờ xét.");
    const submission = {
      ...entity(),
      taskId: task.id,
      sequence: db.submissions.filter((s) => s.taskId === task.id).length + 1,
      submittedBy: user.id,
      submittedAt: now(),
      ...body,
      dueAtSnapshot: task.dueAt,
      actualMinutesSnapshot: minutes,
      status: "PENDING" as const,
      reviewedBy: null,
      reviewedAt: null,
      reviewComment: null,
      requestedChanges: null,
    };
    db.submissions.push(submission);
    task.latestSubmissionId = submission.id;
    transition(user, task, "PENDING_REVIEW");
    notify(
      db.projects.find((p) => p.id === task.projectId)!.ownerId,
      "RESULT_SUBMITTED",
      task.id,
      { submissionId: submission.id },
    );
    return { submission: submissionDTO(submission), task: taskDTO(task) };
  },
  approveSubmission(
    viewer: User,
    taskId: string,
    submissionId: string,
    body: ApproveSubmissionInput,
    expectedVersion: string | null,
  ) {
    const { user, task, submission } = submissionFor(
      viewer,
      taskId,
      submissionId,
      true,
      expectedVersion,
    );
    submission.status = "ACCEPTED";
    submission.reviewedBy = user.id;
    submission.reviewedAt = now();
    submission.reviewComment = body.comment ?? null;
    touch(submission);
    task.completedAt = now();
    transition(user, task, "COMPLETED");
    for (const a of db.assignments.filter(
      (a) => a.taskId === task.id && !a.endedAt,
    ))
      a.endedAt = now();
    notify(submission.submittedBy, "RESULT_APPROVED", task.id, {
      submissionId,
    });
    return { submission: submissionDTO(submission), task: taskDTO(task) };
  },
  requestSubmissionRevision(
    viewer: User,
    taskId: string,
    submissionId: string,
    body: RequestSubmissionRevisionInput,
    expectedVersion: string | null,
  ) {
    const { user, task, submission } = submissionFor(
      viewer,
      taskId,
      submissionId,
      true,
      expectedVersion,
    );
    submission.status = "REVISION_REQUESTED";
    submission.reviewedBy = user.id;
    submission.reviewedAt = now();
    submission.reviewComment = body.reason;
    submission.requestedChanges = body.requestedChanges;
    touch(submission);
    transition(user, task, "IN_PROGRESS", body.reason);
    notify(submission.submittedBy, "CHANGES_REQUESTED", task.id, {
      submissionId,
    });
    return { submission: submissionDTO(submission), task: taskDTO(task) };
  },
};

function activeProject(actor: User, id: string) {
  const project = requireProject(actor, id);
  if (!inProject(actor, id))
    throw new ApiError(
      403,
      "FORBIDDEN",
      "Chỉ thành viên dự án được lập báo cáo cá nhân.",
    );
  if (project.status !== "ACTIVE")
    throw new ApiError(
      409,
      "PROJECT_NOT_ACTIVE",
      "Chỉ lập báo cáo trong dự án đang triển khai.",
    );
}
function validPeriod(periodType: Report["periodType"], start: string) {
  if (
    start > today() ||
    (periodType === "WEEKLY" &&
      new Date(`${start}T00:00:00+07:00`).getUTCDay() !== 0)
  )
    throw new ApiError(
      422,
      "INVALID_PERIOD",
      "Kỳ không ở tương lai; tuần bắt đầu thứ Hai theo giờ Việt Nam.",
    );
}
const canRead = (actor: User, r: Report) =>
  (readsEveryProject(actor) || inProject(actor, r.projectId)) &&
  (r.authorId === actor.id ||
    (r.status === "SUBMITTED" &&
      (can(actor, "PROJECT_MANAGE", r.projectId) ||
        can(actor, "TASKS_MANAGE", r.projectId) ||
        can(actor, "ANALYTICS_VIEW", r.projectId))));
function requireReport(actor: User, id: string, edit = false) {
  const r = db.reports.find((r) => r.id === id);
  if (!r) throw new ApiError(404, "NOT_FOUND", "Không tìm thấy báo cáo.");
  if (!canRead(actor, r) || (edit && r.authorId !== actor.id))
    throw new ApiError(
      403,
      "FORBIDDEN",
      "Bản nháp chỉ dành cho tác giả; bản gửi cần quyền xem trong dự án.",
    );
  if (edit) {
    activeProject(actor, r.projectId);
    if (r.status !== "DRAFT")
      throw new ApiError(
        409,
        "REPORT_IMMUTABLE",
        "Báo cáo đã gửi không được sửa hoặc gửi lại.",
      );
  }
  return r;
}
function selectedValid(preview: ReportPreviewDto, ids: string[]) {
  const valid = preview.items.map((i) => i.taskId);
  if (new Set(ids).size !== ids.length || ids.some((id) => !valid.includes(id)))
    throw new ApiError(
      422,
      "INVALID_RELATED_TASK",
      "Công việc phải có nhật ký của tác giả trong đúng dự án và kỳ.",
    );
}
function reportPreview(
  r: Pick<Report, "projectId" | "periodType" | "periodStart" | "authorId">,
): ReportPreviewDto {
  const end = new Date(`${r.periodStart}T00:00:00+07:00`);
  end.setUTCDate(end.getUTCDate() + (r.periodType === "DAILY" ? 1 : 7));
  const logs = db.timeLogs.filter(
    (l) =>
      l.userId === r.authorId &&
      l.status === "ACTIVE" &&
      l.workDate >= r.periodStart &&
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
    dataAsOf: now(),
    totalMinutes: items.reduce((s, i) => s + i.minutes, 0),
    items,
    partialPeriod: end.toISOString() > now(),
  };
}
export const reportsDb = {
  listReports(viewer: User, query: ReportQuery) {
    if (query.from && query.to && query.from > query.to)
      throw new ApiError(
        422,
        "INVALID_RANGE",
        "Ngày bắt đầu không được sau ngày kết thúc.",
      );
    return paginate(
      db.reports
        .filter(
          (r) =>
            canRead(viewer, r) &&
            (!query.projectId || r.projectId === query.projectId) &&
            (!query.authorId || r.authorId === query.authorId) &&
            (!query.periodType || r.periodType === query.periodType) &&
            (!query.status || r.status === query.status) &&
            (!query.from || r.periodStart >= query.from) &&
            (!query.to || r.periodStart <= query.to) &&
            (!query.q ||
              `${r.achievements} ${r.periodStart}`
                .toLowerCase()
                .includes(query.q.toLowerCase())),
        )
        .sort((a, b) => b.periodStart.localeCompare(a.periodStart))
        .map(reportRow),
      query,
    );
  },
  getReportPreview(viewer: User, query: ReportPreviewQuery) {
    activeProject(viewer, query.projectId);
    validPeriod(query.periodType, query.periodStart);
    return reportPreview({ ...query, authorId: viewer.id });
  },
  getReport(viewer: User, reportId: string) {
    return reportDTO(requireReport(viewer, reportId));
  },
  createReportDraft(viewer: User, body: CreateReportDraftInput) {
    activeProject(viewer, body.projectId);
    validPeriod(body.periodType, body.periodStart);
    const existing = db.reports.find(
      (r) =>
        r.authorId === viewer.id &&
        r.projectId === body.projectId &&
        r.periodType === body.periodType &&
        r.periodStart === body.periodStart,
    );
    if (existing)
      throw new ApiError(
        409,
        "REPORT_EXISTS",
        "Đã có báo cáo cho kỳ này.",
        [],
        { existingReportId: existing.id },
      );
    selectedValid(
      reportPreview({ ...body, authorId: viewer.id }),
      body.selectedTaskIds ?? [],
    );
    const r: Report = {
      ...entity(),
      ...body,
      authorId: viewer.id,
      status: "DRAFT",
      achievements: body.achievements ?? "",
      blockers: body.blockers ?? "",
      nextPlan: body.nextPlan ?? "",
      selectedTaskIds: body.selectedTaskIds ?? [],
      zeroTimeReason: null,
      submittedAt: null,
      snapshot: null,
    };
    db.reports.push(r);
    return reportDTO(r);
  },
  updateReportDraft(
    viewer: User,
    reportId: string,
    body: UpdateReportDraftInput,
    expectedVersion: string | null,
  ) {
    const r = requireReport(viewer, reportId, true);
    requireVersion(expectedVersion, r);
    if (!Object.keys(body).length)
      throw new ApiError(422, "EMPTY_PATCH", "Chưa có nội dung thay đổi.");
    if (body.selectedTaskIds)
      selectedValid(reportPreview(r), body.selectedTaskIds);
    Object.assign(r, body);
    touch(r);
    return reportDTO(r);
  },
  refreshReportDraft(
    viewer: User,
    reportId: string,
    expectedVersion: string | null,
  ) {
    const r = requireReport(viewer, reportId, true);
    requireVersion(expectedVersion, r);
    return reportPreview(r);
  },
  submitReport(
    viewer: User,
    reportId: string,
    body: SubmitReportInput,
    expectedVersion: string | null,
  ) {
    const r = requireReport(viewer, reportId, true);
    requireVersion(expectedVersion, r);
    if (!r.achievements.trim() || !r.nextPlan.trim())
      throw new ApiError(
        422,
        "REPORT_CONTENT_REQUIRED",
        "Kết quả thực hiện và kế hoạch tiếp theo là bắt buộc khi gửi.",
      );
    const preview = reportPreview(r);
    selectedValid(preview, r.selectedTaskIds);
    const reason = body.zeroTimeReason ?? r.zeroTimeReason;
    if (preview.totalMinutes === 0 && !reason?.trim())
      throw new ApiError(
        422,
        "ZERO_TIME_REASON_REQUIRED",
        "Cần giải thích khi tổng giờ công bằng 0.",
        [
          {
            path: ["zeroTimeReason"],
            message: "Vui lòng giải thích kỳ không có giờ công.",
          },
        ],
      );
    r.snapshot = structuredClone(preview);
    r.status = "SUBMITTED";
    r.submittedAt = now();
    r.zeroTimeReason = preview.totalMinutes === 0 ? reason : null;
    touch(r);
    audit(
      viewer.id,
      "REPORT",
      r.id,
      "Gửi báo cáo",
      { status: "DRAFT" },
      { status: "SUBMITTED", totalMinutes: preview.totalMinutes },
    );
    return reportDTO(r);
  },
};

function attachmentFor(viewer: User, id: string) {
  const item = db.attachments.find((a) => a.id === id);
  if (!item)
    throw new ApiError(404, "NOT_FOUND", "Không tìm thấy tệp minh chứng.");
  requireTask(viewer, item.taskId);
  if (item.status !== "READY")
    throw new ApiError(409, "FILE_NOT_READY", "Tệp chưa sẵn sàng để tải.");
  return item;
}
export const attachmentsDb = {
  getUploadPolicy() {
    return policy;
  },
  async uploadAttachment(viewer: User, body: UploadAttachmentInput) {
    const task = requireTask(viewer, body.taskId);
    requireAssignee(viewer, task, "IN_PROGRESS");
    if (
      !body.file.size ||
      body.file.size > policy.maxBytes ||
      !policy.allowedMimeTypes.includes(body.file.type)
    )
      throw new ApiError(
        422,
        "INVALID_FILE",
        "Tệp phải đúng định dạng cho phép và không vượt 20 MiB.",
      );
    const bytes = new Uint8Array(await body.file.slice(0, 8).arrayBuffer());
    const prefix = new TextDecoder().decode(bytes);
    const valid =
      body.file.type === "application/pdf"
        ? prefix.startsWith("%PDF-")
        : body.file.type === "image/png"
          ? bytes[0] === 137 && prefix.slice(1, 4) === "PNG"
          : body.file.type === "image/jpeg"
            ? bytes[0] === 255 && bytes[1] === 216
            : body.file.type.includes("wordprocessingml")
              ? prefix.startsWith("PK")
              : !bytes.includes(0);
    if (!valid)
      throw new ApiError(
        422,
        "FILE_TYPE_MISMATCH",
        "Nội dung tệp không khớp định dạng đã khai báo.",
      );
    const file = body.file;
    const filename = file instanceof File ? file.name : "evidence";
    const attachment = {
      id: crypto.randomUUID(),
      taskId: task.id,
      uploadedBy: viewer.id,
      filename: filename.replace(/[\r\n/\\]/g, "_"),
      mimeType: file.type,
      sizeBytes: file.size,
      status: "READY" as const,
    };
    db.attachments.push(attachment);
    db.files.set(attachment.id, file);
    return attachmentDTO(attachment);
  },
  getAttachment(viewer: User, attachmentId: string) {
    return attachmentDTO(attachmentFor(viewer, attachmentId));
  },
  downloadAttachment(viewer: User, attachmentId: string) {
    const item = attachmentFor(viewer, attachmentId);
    const file = db.files.get(item.id);
    if (!file)
      throw new ApiError(
        404,
        "FILE_CONTENT_MISSING",
        "Không tìm thấy nội dung tệp.",
      );
    return { file, attachment: item };
  },
};

type Scope = AnalyticsQuery;
const quality = (missingFields: string[] = []): Quality => ({
  status: missingFields.length ? "PARTIAL" : "SUFFICIENT",
  missingFields,
});
function analyticsScope(u: User, query: AnalyticsQuery) {
  const allowed = db.projects.filter((p) => can(u, "ANALYTICS_VIEW", p.id));
  if (!allowed.length && !readsEveryProject(u))
    throw new ApiError(
      403,
      "FORBIDDEN",
      "Bạn chưa được cấp quyền phân tích trong dự án nào.",
    );
  if (
    query.from > query.to ||
    Date.parse(query.to) - Date.parse(query.from) > 366 * 86400000
  )
    throw new ApiError(
      422,
      "INVALID_RANGE",
      "Chọn khoảng ngày hợp lệ, tối đa 366 ngày.",
    );
  const projects = allowed.filter(
    (p) =>
      (!query.projectId || p.id === query.projectId) &&
      (!query.unitId || p.unitId === query.unitId) &&
      (!query.ownerId || p.ownerId === query.ownerId),
  );
  if (
    !projects.length &&
    (query.projectId ||
      (query.unitId &&
        !(
          readsEveryProject(u) &&
          db.units.some((unit) => unit.id === query.unitId)
        )))
  )
    throw new ApiError(403, "FORBIDDEN", "Bạn không có quyền xem phạm vi này.");
  const scope = {
    ...query,
    ...(!query.unitId && !query.projectId && !readsEveryProject(u)
      ? { unitId: u.unitId }
      : {}),
  };
  const team = query.teamId
    ? db.teams.find((t) => t.id === query.teamId)
    : null;
  if (query.teamId && (!team || (scope.unitId && team.unitId !== scope.unitId)))
    throw new ApiError(403, "FORBIDDEN", "Nhóm nằm ngoài phạm vi.");
  const people = team?.memberIds ?? null;
  const cohort = db.tasks.filter(
    (t) =>
      projects.some((p) => p.id === t.projectId) &&
      (!scope.unitId ||
        db.projects.some(
          (p) => p.id === t.projectId && p.unitId === scope.unitId,
        )) &&
      (!query.status || t.status === query.status) &&
      (!query.priority || t.priority === query.priority),
  );
  const tasks = cohort.filter(
    (t) =>
      (!query.assigneeId || t.assigneeId === query.assigneeId) &&
      (!people || (t.assigneeId && people.includes(t.assigneeId))),
  );
  return {
    scope,
    tasks,
    projects: projects.filter(
      (p) => !scope.unitId || p.unitId === scope.unitId,
    ),
    people,
    cohort,
  };
}
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
const mean = (values: number[]) =>
  values.length ? sum(values) / values.length : null;
const ratio = (a: number, b: number) => (b ? (a / b) * 100 : null);
const action = (
  target: DomainActionDto["target"],
  taskId: string | null = null,
  submissionId: string | null = null,
): DomainActionDto => ({
  target,
  taskId,
  submissionId,
  reportId: null,
});
function meta(missing: string[] = []): AnalysisMetaDto {
  return {
    dataAsOf: now(),
    quality: quality(missing),
  };
}

function snapshotRef(
  u: User,
  scope: Scope,
  type: Analysis["snapshot"]["analysisType"],
  subject: AnalysisSubjectDto,
  title: string,
  metrics: Measure[],
  evidence: EvidenceDto[],
  summary: string,
  context: ContextItemDto[] = [],
  missing: string[] = [],
): AnalysisRefDto {
  const index = `${db.revision}|${u.id}|${JSON.stringify(scope)}|${JSON.stringify(subject)}|${type}`;
  let detail = db.details.get(db.snapshotIndex.get(index) ?? "");
  if (!detail) {
    const id = `an-${crypto.randomUUID()}`;
    const snapshotId = `snap-${crypto.randomUUID()}`;
    detail = analysisModel.parse({
      snapshot: {
        id: snapshotId,
        analysisId: id,
        sourceRevision: `source-${db.revision}-${crypto.randomUUID()}`,
        analysisType: type,
        title,
        subject,
        scope,
        dataAsOf: now(),
        expiresAt: new Date(
          Date.parse(now()) + seed.analysisPolicy.retentionDays * 86400000,
        ).toISOString(),
        quality:
          metrics.length && metrics.every((m) => m.value === null)
            ? {
                ...quality(
                  missing.length
                    ? missing
                    : metrics.flatMap((m) => m.missingFields),
                ),
                status: "INSUFFICIENT",
              }
            : quality(
                missing.length
                  ? missing
                  : metrics.flatMap((m) => m.missingFields),
              ),
        metrics,
        context,
        evidence,
        series: [],
      },
      explanation: {
        status: "NOT_REQUESTED",
        lastSuccess: null,
        activeJobId: null,
        error: null,
      },
      generation: {
        allowed: !(metrics.length && metrics.every((m) => m.value === null)),
      },
      systemSummary: summary,
    });
    db.details.set(id, detail);
    db.snapshotIndex.set(index, id);
    db.snapshotProjects.set(
      id,
      db.projects
        .filter(
          (p) =>
            (!scope.projectId || p.id === scope.projectId) &&
            (!scope.unitId || p.unitId === scope.unitId) &&
            can(u, "ANALYTICS_VIEW", p.id),
        )
        .map((p) => p.id),
    );
  }
  return { analysisId: detail.snapshot.analysisId };
}
function measure(
  code: string,
  label: string,
  value: number | null,
  unit: MeasureDto["unit"],
  formula: string,
): Measure {
  return {
    id: `m-${code}`,
    label,
    value,
    unit,
    basis: "CURRENT",
    formula,
    missingFields: value === null ? ["source"] : [],
  };
}
function taskAnalysis(
  u: User,
  scope: Scope,
  t: Task,
  type: "RISK" | "BOTTLENECK",
) {
  const task = taskDTO(t);
  const pending = db.submissions.find(
    (s) => s.id === t.latestSubmissionId && s.status === "PENDING",
  );
  const overdue = task.isOverdue
    ? Math.max(0, (Date.parse(now()) - Date.parse(t.dueAt)) / 60000)
    : 0;
  const wait = pending
    ? Math.max(0, (Date.parse(now()) - Date.parse(pending.submittedAt)) / 60000)
    : 0;
  const evidence: EvidenceDto[] = [
    {
      id: "e-task",
      label: `Hạn hoàn thành: ${dateTime(t.dueAt)}`,
      observedAt: now(),
      action: action("TASK_DETAIL", t.id),
    },
  ];
  if (pending)
    evidence.push({
      id: "e-submission",
      label: "Lần nộp mới nhất đang chờ nghiệm thu",
      observedAt: pending.submittedAt,
      action: action("SUBMISSION_REVIEW", t.id, pending.id),
    });
  const metrics = [
    measure(
      "OVERDUE",
      "Thời gian quá hạn",
      overdue,
      "MINUTE",
      "Thời gian công việc đã trễ so với hạn hoàn thành.",
    ),
    measure(
      "WAIT",
      "Chờ nghiệm thu",
      wait,
      "MINUTE",
      "Thời gian đã chờ kể từ khi nộp kết quả để nghiệm thu.",
    ),
    measure(
      "ACTUAL",
      "Giờ công thực tế",
      task.actualMinutes,
      "MINUTE",
      "Thời gian làm việc thực tế đã ghi nhận, không tính nhật ký đã loại.",
    ),
    measure(
      "REVISIONS",
      "Số lần yêu cầu sửa",
      db.submissions.filter(
        (s) => s.taskId === t.id && s.status === "REVISION_REQUESTED",
      ).length,
      "COUNT",
      "Số lần kết quả công việc được yêu cầu chỉnh sửa.",
    ),
  ];
  const summary = `${t.title}: ${task.isOverdue ? "công việc đã quá hạn nhưng chưa hoàn thành" : "công việc chưa quá hạn"}. Thời gian làm việc đã ghi nhận là ${hours(task.actualMinutes)}. ${pending ? "Kết quả đang chờ nghiệm thu; thời gian chờ không được tính là giờ làm việc." : "Cần xem lại kế hoạch và tiến độ trước khi quyết định điều chỉnh."}`;
  return snapshotRef(
    u,
    scope,
    type,
    { kind: "TASK", taskId: t.id },
    t.title,
    metrics,
    evidence,
    summary,
    [
      {
        key: "assignee",
        label: "Người thực hiện",
        value: task.assignee?.displayName ?? "Chưa phân công",
        valueType: "TEXT",
      },
      {
        key: "status",
        label: "Trạng thái",
        value: t.status,
        valueType: "TEXT",
      },
      { key: "due", label: "Hạn hoàn thành", value: t.dueAt, valueType: "UTC" },
    ],
  );
}

function dashboard(u: User, query: AnalyticsQuery): DashboardDto {
  const { scope, tasks, projects, cohort, people } = analyticsScope(u, query);
  const valid = tasks.filter((t) => t.status !== "CANCELLED");
  const open = valid.filter((t) => t.status !== "COMPLETED");
  const completed = valid.filter((t) => t.status === "COMPLETED");
  const logs = db.timeLogs.filter(
    (l) =>
      l.status === "ACTIVE" &&
      cohort.some((t) => t.id === l.taskId) &&
      l.workDate >= scope.from &&
      l.workDate <= scope.to &&
      (!scope.assigneeId || l.userId === scope.assigneeId) &&
      (!people || people.includes(l.userId)),
  );
  const period = (value: string | null) =>
    value &&
    new Date(Date.parse(value) + 7 * 3600000).toISOString().slice(0, 10) >=
      scope.from &&
    new Date(Date.parse(value) + 7 * 3600000).toISOString().slice(0, 10) <=
      scope.to;
  const submissions = db.submissions.filter(
    (s) =>
      cohort.some((t) => t.id === s.taskId) &&
      period(s.submittedAt) &&
      (!scope.assigneeId || s.submittedBy === scope.assigneeId) &&
      (!people || people.includes(s.submittedBy)),
  );
  const reports = db.reports.filter(
    (r) =>
      projects.some((p) => p.id === r.projectId) &&
      r.status === "SUBMITTED" &&
      period(r.submittedAt) &&
      (!scope.assigneeId || r.authorId === scope.assigneeId) &&
      (!people || people.includes(r.authorId)),
  );
  const overdue = open.filter((t) => t.dueAt < now()).length;
  const actual = sum(logs.map((l) => l.minutes));
  const estimates = sum(valid.map((t) => t.estimatedMinutes));
  const original = sum(valid.map((t) => t.originalEstimatedMinutes));
  const cohortActual = sum(
    db.timeLogs
      .filter(
        (l) => l.status === "ACTIVE" && valid.some((t) => t.id === l.taskId),
      )
      .map((l) => l.minutes),
  );
  const reviewed = db.submissions.filter(
    (s) =>
      cohort.some((t) => t.id === s.taskId) &&
      period(s.reviewedAt) &&
      (!scope.assigneeId || s.submittedBy === scope.assigneeId) &&
      (!people || people.includes(s.submittedBy)),
  );
  const currentWorking = tasks.filter((t) =>
    ["TODO", "IN_PROGRESS"].includes(t.status),
  );
  const spec: [
    string,
    string,
    number | null,
    MetricDto["unit"],
    MetricDto["basis"],
    number | null,
  ][] = [
    ["K01", "Công việc theo dõi", valid.length, "TASK", "CURRENT", null],
    [
      "K02",
      "Hoàn thành trong kỳ",
      completed.filter((t) => period(t.completedAt)).length,
      "TASK",
      "PERIOD",
      null,
    ],
    [
      "K03",
      "Tỷ lệ hoàn thành",
      ratio(completed.length, valid.length),
      "PERCENT",
      "CURRENT",
      valid.length,
    ],
    ["K04", "Công việc quá hạn", overdue, "TASK", "CURRENT", null],
    [
      "K05",
      "Tỷ lệ quá hạn",
      ratio(overdue, open.length),
      "PERCENT",
      "CURRENT",
      open.length,
    ],
    ["K06", "Giờ công trong kỳ", actual / 60, "HOUR", "PERIOD", null],
    [
      "K07",
      "Chênh lệch so với ước lượng hiện tại",
      cohortActual - estimates,
      "MINUTE",
      "CURRENT",
      null,
    ],
    [
      "K08",
      "Lần nộp muộn",
      submissions.filter((s) => s.submittedAt > s.dueAtSnapshot).length,
      "COUNT",
      "PERIOD",
      null,
    ],
    [
      "K09",
      "Nghiệm thu trễ hạn",
      reviewed.filter(
        (s) =>
          s.status === "ACCEPTED" &&
          s.reviewedAt &&
          s.reviewedAt > s.dueAtSnapshot,
      ).length,
      "TASK",
      "PERIOD",
      null,
    ],
    [
      "K10",
      "Chờ nghiệm thu trung bình",
      mean(
        submissions.map(
          (s) =>
            (Date.parse(s.reviewedAt ?? now()) - Date.parse(s.submittedAt)) /
            60000,
        ),
      ),
      "MINUTE",
      "PERIOD",
      submissions.length,
    ],
    [
      "K11",
      "Yêu cầu chỉnh sửa",
      reviewed.filter(
        (s) => s.status === "REVISION_REQUESTED" && period(s.reviewedAt),
      ).length,
      "COUNT",
      "PERIOD",
      null,
    ],
    [
      "K12",
      "Công việc đang nhận",
      currentWorking.length,
      "TASK",
      "CURRENT",
      null,
    ],
    ["K13", "Thời gian có thể làm việc", null, "MINUTE", "PERIOD", null],
    ["K14", "Mức độ bận", null, "PERCENT", "PERIOD", null],
    [
      "K15",
      "Thời gian ở bước xử lý hiện tại",
      mean(
        open.map(
          (t) => (Date.parse(now()) - Date.parse(t.statusChangedAt)) / 60000,
        ),
      ),
      "MINUTE",
      "CURRENT",
      open.length,
    ],
    ["K16", "Báo cáo đã gửi", reports.length, "REPORT", "PERIOD", null],
  ];
  const metrics = spec.map(([code, label, value, unit, basis, denominator]) => {
    const m = measure(
      code,
      label,
      value,
      unit === "REPORT" ? "COUNT" : unit,
      seed.metricFormulas[code as keyof typeof seed.metricFormulas],
    );
    m.basis = basis;
    m.missingFields =
      value === null
        ? [code === "K13" || code === "K14" ? "workingCalendar" : "denominator"]
        : [];
    return metricSchema.parse({
      code,
      label,
      value,
      unit,
      basis,
      denominator,
      analysisRef: snapshotRef(
        u,
        scope,
        "METRIC",
        { kind: "METRIC", metricCode: code },
        label,
        [m],
        [],
        value === null
          ? "Chưa đủ dữ liệu để tính chỉ số."
          : `${label}: ${metricValue(value, unit)}.`,
      ),
    });
  });
  const overviewRef = snapshotRef(
    u,
    scope,
    "SUMMARY",
    scope.projectId
      ? { kind: "PROJECT", projectId: scope.projectId }
      : { kind: "UNIT", unitId: scope.unitId ?? u.unitId },
    "Tổng hợp tiến độ",
    metrics.map((m) => ({
      ...measure(
        m.code,
        m.label,
        m.value,
        m.unit === "REPORT" ? "COUNT" : m.unit,
        seed.metricFormulas[m.code],
      ),
      basis: m.basis,
    })),
    [],
    `Đang theo dõi ${valid.length} công việc trong ${projects.length} dự án, trong đó ${completed.length} việc đã hoàn thành và ${overdue} việc đã quá hạn. Thời gian làm việc đã ghi nhận trong kỳ là ${hours(actual)}.`,
  );
  const timeliness = (items: typeof submissions) => ({
    onTimeCount: items.filter((s) => s.submittedAt <= s.dueAtSnapshot).length,
    lateCount: items.filter((s) => s.submittedAt > s.dueAtSnapshot).length,
    denominator: items.length,
  });
  return {
    metadata: meta(["workingCalendar", "reportingSchedule"]),
    totalTasks: tasks.length,
    byStatus: taskStatusSchema.options.map((status) => ({
      status,
      count: tasks.filter((t) => t.status === status).length,
    })),
    metrics,
    timeVariance: {
      actualMinutes: cohortActual,
      currentEstimateMinutes: estimates,
      originalEstimateMinutes: original,
      deltaCurrentMinutes: cohortActual - estimates,
      deltaOriginalMinutes: cohortActual - original,
    },
    submissionTimeliness: timeliness(submissions),
    reporting: {
      submittedDaily: reports.filter((r) => r.periodType === "DAILY").length,
      submittedWeekly: reports.filter((r) => r.periodType === "WEEKLY").length,
    },
    trend: [
      ...new Set(
        logs
          .map((l) => l.workDate)
          .concat(
            submissions.map((s) =>
              new Date(Date.parse(s.submittedAt) + 7 * 3600000)
                .toISOString()
                .slice(0, 10),
            ),
          )
          .concat(
            completed.flatMap((t) =>
              t.completedAt
                ? [
                    new Date(Date.parse(t.completedAt) + 7 * 3600000)
                      .toISOString()
                      .slice(0, 10),
                  ]
                : [],
            ),
          ),
      ),
    ]
      .filter((date) => date >= scope.from && date <= scope.to)
      .sort()
      .map((date) => ({
        date,
        completedCount: completed.filter(
          (t) =>
            t.completedAt &&
            new Date(Date.parse(t.completedAt) + 7 * 3600000)
              .toISOString()
              .startsWith(date),
        ).length,
        submissionCount: submissions.filter((s) =>
          new Date(Date.parse(s.submittedAt) + 7 * 3600000)
            .toISOString()
            .startsWith(date),
        ).length,
      })),
    projectComparisons: projects.map((p) => {
      const pts = tasks.filter(
        (t) => t.projectId === p.id && t.status !== "CANCELLED",
      );
      return {
        projectId: p.id,
        projectName: p.name,
        validTaskCount: pts.length,
        completionRate: ratio(
          pts.filter((t) => t.status === "COMPLETED").length,
          pts.length,
        ),
        overdueCount: pts.filter((t) => isTaskOverdue(t)).length,
        actualMinutes: sum(
          logs
            .filter((l) => pts.some((t) => t.id === l.taskId))
            .map((l) => l.minutes),
        ),
        analysisRef: snapshotRef(
          u,
          { ...scope, projectId: p.id },
          "SUMMARY",
          { kind: "PROJECT", projectId: p.id },
          p.name,
          [],
          [],
          `${p.name} đang theo dõi ${pts.length} công việc, không tính việc đã hủy.`,
        ),
      };
    }),
    overviewRef,
  };
}

function risks(u: User, query: AnalyticsQuery): RisksDto {
  const { scope, tasks, projects } = analyticsScope(u, query);
  const items = tasks
    .filter((t) => !["COMPLETED", "CANCELLED"].includes(t.status))
    .map((t) => {
      const overdue = isTaskOverdue(t);
      const nearReview =
        !overdue &&
        t.status === "PENDING_REVIEW" &&
        Date.parse(now()) - Date.parse(t.statusChangedAt) >= 24 * 3600000 &&
        Date.parse(t.dueAt) - Date.parse(now()) <= 48 * 3600000;
      return riskItemSchema.parse({
        taskId: t.id,
        taskTitle: t.title,
        assignee: t.assigneeId ? person(t.assigneeId) : null,
        category: overdue
          ? "OVERDUE"
          : nearReview
            ? "AT_RISK"
            : t.remainingMinutes === null
              ? "INSUFFICIENT_DATA"
              : "NO_SIGNAL",
        evidence: [
          overdue
            ? "Công việc đã quá hạn nhưng chưa hoàn thành."
            : nearReview
              ? "Đã chờ nghiệm thu ít nhất 24 giờ và còn nhiều nhất 48 giờ là đến hạn. Đây là ngưỡng theo dõi thử nghiệm."
              : "Cần xem thêm tiến độ và báo cáo để đánh giá khả năng hoàn thành đúng hạn.",
        ],
        quality: quality(
          t.remainingMinutes === null ? ["remainingMinutes"] : [],
        ),
        analysisRef: taskAnalysis(u, scope, t, "RISK"),
      });
    });
  return {
    metadata: meta(),
    items,
    projects: projects.map((p) => {
      const rows = items.filter((i) =>
        tasks.some((t) => t.id === i.taskId && t.projectId === p.id),
      );
      return {
        projectName: p.name,
        riskLevel: rows.some((r) => r.category === "OVERDUE")
          ? "HIGH"
          : rows.some((r) => r.category === "AT_RISK")
            ? "MEDIUM"
            : !rows.length ||
                rows.some((r) => r.category === "INSUFFICIENT_DATA")
              ? "UNKNOWN"
              : "LOW",
        overdueCount: rows.filter((r) => r.category === "OVERDUE").length,
        atRiskCount: rows.filter((r) => r.category === "AT_RISK").length,
        insufficientDataCount: rows.filter(
          (r) => r.category === "INSUFFICIENT_DATA",
        ).length,
        evidence: [
          "Mức nguy cơ dựa trên tình trạng các công việc trong dự án.",
        ],
        analysisRef: snapshotRef(
          u,
          { ...scope, projectId: p.id },
          "RISK",
          { kind: "PROJECT", projectId: p.id },
          p.name,
          [
            measure(
              "OVERDUE",
              "Công việc quá hạn",
              rows.filter((r) => r.category === "OVERDUE").length,
              "TASK",
              "Số công việc đã quá hạn nhưng chưa hoàn thành.",
            ),
          ],
          [],
          `Dự án có ${rows.filter((r) => r.category === "OVERDUE").length} công việc quá hạn.`,
        ),
      };
    }),
  };
}

function workload(u: User, query: AnalyticsQuery): WorkloadDto {
  const { scope, tasks, projects, people } = analyticsScope(u, query);
  const ids = [
    ...new Set(
      db.members
        .filter(
          (m) =>
            !m.endedAt &&
            projects.some((p) => p.id === m.projectId) &&
            (!people || people.includes(m.userId)) &&
            (!scope.assigneeId || scope.assigneeId === m.userId),
        )
        .map((m) => m.userId),
    ),
  ];
  return {
    metadata: meta(["workingCalendar"]),
    items: ids.map((id) => {
      const current = tasks.filter(
        (t) =>
          t.assigneeId === id && ["TODO", "IN_PROGRESS"].includes(t.status),
      );
      const remaining = current.some((t) => t.remainingMinutes === null)
        ? null
        : sum(current.map((t) => t.remainingMinutes ?? 0));
      return {
        userId: id,
        person: person(id),
        openTaskCount: current.length,
        pendingReviewCount: tasks.filter(
          (t) => t.assigneeId === id && t.status === "PENDING_REVIEW",
        ).length,
        originalEstimateMinutes: sum(
          current.map((t) => t.originalEstimatedMinutes),
        ),
        currentEstimateMinutes: sum(current.map((t) => t.estimatedMinutes)),
        remainingMinutes: remaining,
        capacityMinutes: null,
        utilizationRate: null,
        analysisRef: snapshotRef(
          u,
          scope,
          "WORKLOAD",
          { kind: "PERSON", userId: id },
          person(id).displayName,
          [
            measure(
              "OPEN",
              "Việc đang nhận",
              current.length,
              "TASK",
              "Số công việc được giao và đang chờ làm hoặc đang thực hiện.",
            ),
            measure(
              "REMAINING",
              "Thời gian cần để làm xong",
              remaining,
              "MINUTE",
              "Thời gian ước tính để làm xong các công việc đang nhận, theo cập nhật mới nhất của người thực hiện.",
            ),
            measure(
              "CAPACITY",
              "Thời gian có thể làm việc",
              null,
              "MINUTE",
              "Thời gian có thể dành cho công việc sau khi đã tính thời gian nghỉ và các công việc khác đã có kế hoạch.",
            ),
          ],
          [],
          `${person(id).displayName} đang nhận ${current.length} công việc. Chưa có lịch làm việc nên chưa xác định được có đang nhận quá nhiều việc hay không.`,
          [],
          ["workingCalendar"],
        ),
      };
    }),
  };
}

function bottlenecks(u: User, query: AnalyticsQuery): BottlenecksDto {
  const { scope, tasks } = analyticsScope(u, query);
  return {
    metadata: meta(),
    items: tasks
      .filter(
        (t) =>
          (t.status === "PENDING_REVIEW" &&
            Date.parse(now()) - Date.parse(t.statusChangedAt) >=
              24 * 3600000) ||
          (["TODO", "IN_PROGRESS"].includes(t.status) &&
            (Date.parse(now()) - Date.parse(t.statusChangedAt) >=
              48 * 3600000 ||
              db.submissions.filter(
                (s) => s.taskId === t.id && s.status === "REVISION_REQUESTED",
              ).length >= 3)),
      )
      .map((t) => ({
        taskId: t.id,
        taskTitle: t.title,
        stage: z
          .enum(["TODO", "IN_PROGRESS", "PENDING_REVIEW"])
          .parse(t.status),
        elapsedMinutes:
          (Date.parse(now()) - Date.parse(t.statusChangedAt)) / 60000,
        revisionCount: db.submissions.filter(
          (s) => s.taskId === t.id && s.status === "REVISION_REQUESTED",
        ).length,
        calendarBasis: "CONTINUOUS",
        evidence: [
          "Thời gian công việc đã ở bước xử lý hiện tại, bao gồm cả lúc chờ và ngoài giờ làm việc. Đây không phải giờ làm việc thực tế.",
        ],
        assignee: t.assigneeId ? person(t.assigneeId) : null,
        analysisRef: taskAnalysis(u, scope, t, "BOTTLENECK"),
      })),
  };
}

function summary(u: User, query: AnalyticsQuery): SummaryDto {
  const dash = dashboard(u, query);
  const b = bottlenecks(u, query);
  return {
    metadata: dash.metadata,
    overviewRef: dash.overviewRef,
    summaryText: db.details.get(dash.overviewRef.analysisId)!.systemSummary,
    metrics: db.details.get(dash.overviewRef.analysisId)!.snapshot.metrics,
    highlights: b.items.map((i) => ({
      title: i.taskTitle,
      description: i.evidence.join(" "),
      severity: "MEDIUM",
      analysisRef: i.analysisRef,
    })),
  };
}

function analysisProjectIds(id: string) {
  const detail = db.details.get(id);
  return (
    db.snapshotProjects.get(id) ??
    (detail?.snapshot.scope.projectId ? [detail.snapshot.scope.projectId] : [])
  );
}
function requireAnalysis(actor: User, id: string) {
  const detail = db.details.get(id);
  if (!detail)
    throw new ApiError(404, "NOT_FOUND", "Không tìm thấy bản phân tích.");
  const ids = analysisProjectIds(id);
  if (
    (!ids.length && !readsEveryProject(actor)) ||
    ids.some((projectId) => !can(actor, "ANALYTICS_VIEW", projectId))
  )
    throw new ApiError(
      403,
      "FORBIDDEN",
      "Bạn không còn quyền xem toàn bộ phạm vi của bản phân tích này.",
    );
  if (detail.snapshot.expiresAt <= now())
    throw new ApiError(
      410,
      "SNAPSHOT_EXPIRED",
      "Bản phân tích đã hết thời gian lưu. Mở trang tổng quan để lấy bản mới.",
    );
  return detail;
}
function detailDTO(actor: User, id: string): AnalysisDto {
  const original = requireAnalysis(actor, id);
  const s = original.snapshot;
  const revision = /^source-(\d+)-/.exec(s.sourceRevision)?.[1];
  const outdated = revision
    ? Number(revision) !== db.revision
    : db.revision !== 1;
  let latest: string | null = null;
  if (outdated) {
    if (s.analysisType === "RISK") risks(actor, s.scope);
    else if (s.analysisType === "WORKLOAD") workload(actor, s.scope);
    else if (s.analysisType === "BOTTLENECK") bottlenecks(actor, s.scope);
    else dashboard(actor, s.scope);
    const indexPrefix = `${db.revision}|${actor.id}|${JSON.stringify(s.scope)}|${JSON.stringify(s.subject)}|${s.analysisType}`;
    latest = db.snapshotIndex.get(indexPrefix) ?? null;
  }
  const value: AnalysisDto = {
    ...structuredClone(original),
    freshness: {
      status: outdated ? "OUTDATED" : "CURRENT",
      latestAnalysisId: latest,
    },
    feedback: {
      latest: db.feedback.filter((f) => f.analysisId === id).at(-1) ?? null,
      canSubmit:
        !outdated &&
        s.analysisType === "BOTTLENECK" &&
        analysisProjectIds(id).every((p) => can(actor, "ALERTS_MANAGE", p)),
    },
  };
  value.generation = {
    allowed:
      original.generation.allowed &&
      !outdated &&
      !value.explanation.activeJobId,
  };
  return value;
}
function createJob(
  actor: User,
  id: string,
  mode: "REUSE_OR_CREATE" | "REGENERATE",
  scenario: string | null,
) {
  const detail = requireAnalysis(actor, id);
  const existing = [...db.jobs.values()]
    .filter((j) => j.analysisId === id)
    .at(-1);
  if (
    existing &&
    (existing.status === "RUNNING" ||
      existing.status === "QUEUED" ||
      (mode === "REUSE_OR_CREATE" && existing.status === "SUCCEEDED"))
  )
    return existing;
  const current = detailDTO(actor, id);
  if (!current.generation.allowed)
    throw new ApiError(
      409,
      "GENERATION_BLOCKED",
      "Không thể yêu cầu diễn giải cho bản dữ liệu này.",
      [],
    );
  if (mode === "REUSE_OR_CREATE" && detail.explanation.lastSuccess) {
    const job: Job = {
      id: crypto.randomUUID(),
      analysisId: id,
      status: "SUCCEEDED",
      createdAt: now(),
      completedAt: now(),
      pollAfterMs: 0,
      error: null,
    };
    db.jobs.set(job.id, job);
    return job;
  }
  const job: Job = {
    id: crypto.randomUUID(),
    analysisId: id,
    status: "QUEUED",
    createdAt: now(),
    completedAt: null,
    pollAfterMs: 2000,
    error: null,
  };
  db.jobs.set(job.id, job);
  detail.explanation.status = "QUEUED";
  detail.explanation.activeJobId = job.id;
  detail.explanation.error = null;
  schedule(() => {
    const active = db.jobs.get(job.id);
    const target = db.details.get(id);
    if (!active || !target) return;
    active.status = "RUNNING";
    target.explanation.status = "RUNNING";
  }, 300);
  schedule(() => {
    const active = db.jobs.get(job.id);
    const target = db.details.get(id);
    if (!active || !target) return;
    const failures: Record<string, AnalysisError["code"]> = {
      "llm-timeout": "PROVIDER_TIMEOUT",
      "llm-rate-limit": "PROVIDER_RATE_LIMIT",
      "llm-unavailable": "PROVIDER_UNAVAILABLE",
      "llm-invalid": "OUTPUT_INVALID",
      "llm-refused": "REFUSED",
      "llm-not-configured": "LLM_NOT_CONFIGURED",
    };
    active.completedAt = now();
    active.pollAfterMs = 0;
    target.explanation.activeJobId = null;
    const code = failures[scenario ?? ""];
    if (code) {
      const error: AnalysisError = {
        code,
        message:
          "Chưa thể tạo diễn giải. Số liệu và căn cứ vẫn được giữ nguyên.",
        retryable: !["LLM_NOT_CONFIGURED", "REFUSED"].includes(code),
        retryAfterSeconds: code === "PROVIDER_RATE_LIMIT" ? 10 : null,
      };
      active.status = "FAILED";
      active.error = error;
      target.explanation.status =
        code === "LLM_NOT_CONFIGURED" ? "UNAVAILABLE" : "FAILED";
      target.explanation.error = error;
      if (code === "LLM_NOT_CONFIGURED") target.generation = { allowed: false };
      return;
    }
    try {
      const snapshot = target.snapshot;
      const explanation = llmModel.parse({
        analysisId: id,
        snapshotId: snapshot.id,
        generatedAt: now(),
        modelDisplayName: "AI mô phỏng",
        summary: target.systemSummary,
        findings: [
          {
            id: "finding-1",
            title: "Tình hình hiện tại",
            text: snapshot.metrics.length
              ? snapshot.metrics
                  .map(
                    (metric) =>
                      `${metric.label}: ${metricValue(metric.value, metric.unit)}`,
                  )
                  .join("; ")
              : target.systemSummary,
            metricIds: snapshot.metrics.map((m) => m.id),
            evidenceIds: snapshot.evidence.map((e) => e.id),
          },
        ],
        recommendations: snapshot.evidence
          .filter((e) => e.action)
          .slice(0, 2)
          .map((e, i) => ({
            id: `recommendation-${i}`,
            title: "Xem thông tin liên quan",
            text: e.label,
            evidenceIds: [e.id],
            action: e.action,
          })),
        limitations: [
          "Kết quả phân tích cần được đối chiếu với tiến độ và báo cáo thực tế.",
          ...(snapshot.quality.missingFields.length
            ? [
                "Nguồn dữ liệu còn thiếu; chưa đủ căn cứ kết luận quá tải hoặc hiệu suất cá nhân.",
              ]
            : []),
        ],
      });
      const checked = analysisModel.parse({
        ...target,
        explanation: {
          status: "READY",
          lastSuccess: explanation,
          activeJobId: null,
          error: null,
        },
      });
      target.explanation = checked.explanation;
      active.status = "SUCCEEDED";
    } catch {
      active.status = "FAILED";
      active.error = {
        code: "OUTPUT_INVALID",
        message: "Nội dung diễn giải không khớp dữ liệu nguồn.",
        retryable: true,
        retryAfterSeconds: null,
      };
      target.explanation.status = "FAILED";
      target.explanation.error = active.error;
    }
  }, 1500);
  return job;
}
function feedback(actor: User, id: string, body: FeedbackInput) {
  const detail = detailDTO(actor, id);
  if (!detail.feedback.canSubmit)
    throw new ApiError(
      detail.freshness.status === "OUTDATED" ? 409 : 403,
      "FEEDBACK_NOT_ALLOWED",
      "Không được phản hồi bản phân tích này trong quyền hoặc phiên bản hiện tại.",
    );
  const item: Feedback = {
    analysisId: id,
    ...body,
    actor: person(actor.id),
    createdAt: now(),
  };
  db.feedback.push(item);
  return item;
}

function alertRow(a: (typeof db.alerts)[number]): AlertRow {
  return {
    id: a.id,
    type: a.type,
    taskTitle: db.tasks.find((t) => t.id === a.taskId)?.title ?? null,
    severity: a.severity,
    status: a.status,
    conditionActive: a.conditionActive,
  };
}
function alertDTO(a: (typeof db.alerts)[number], u: User): AlertDto {
  const task = db.tasks.find((t) => t.id === a.taskId);
  const today = localDateTime(now()).slice(0, 10);
  return {
    ...a,
    ...stampRefs(a),
    handler: a.handledBy ? person(a.handledBy) : null,
    canHandle: u.isSysAdmin || alertRecipient(u, a),
    taskTitle: task?.title ?? null,
    analysisRef: task
      ? taskAnalysis(
          u,
          { projectId: a.projectId, from: `${today.slice(0, 8)}01`, to: today },
          task,
          a.type === "BOTTLENECK" ? "BOTTLENECK" : "RISK",
        )
      : null,
  };
}

export function evaluateAlertRules() {
  const summary = { created: 0, updated: 0, deactivated: 0 };
  for (const task of db.tasks) {
    const open = !["COMPLETED", "CANCELLED"].includes(task.status);
    const rules = [
      {
        type: "OVERDUE" as const,
        active: open && now() > task.dueAt,
        evidence: ["Công việc còn mở sau hạn hoàn thành."],
      },
      {
        type: "BOTTLENECK" as const,
        active:
          task.status === "PENDING_REVIEW" &&
          Date.parse(now()) - Date.parse(task.statusChangedAt) >= 24 * 3600000,
        evidence: [
          "Kết quả chờ nghiệm thu từ 24 giờ liên tục; thời gian này không cộng giờ công.",
        ],
      },
    ];
    for (const rule of rules) {
      const previous = db.alerts.find(
        (a) => a.taskId === task.id && a.type === rule.type,
      );
      if (previous) {
        if (previous.conditionActive !== rule.active) {
          summary[rule.active ? "updated" : "deactivated"]++;
          previous.conditionActive = rule.active;
          previous.dataAsOf = now();
          touch(previous);
        }
        continue;
      }
      if (!rule.active) continue;
      const alert = {
        ...entity(),
        createdAt: now(),
        projectId: task.projectId,
        taskId: task.id,
        ...stamp(),
        updatedAt: now(),
        type: rule.type,
        severity: "HIGH" as const,
        status: "UNREAD" as const,
        conditionActive: true,
        evidence: rule.evidence,
        dataAsOf: now(),
        methodVersion: seed.analysisPolicy.ruleVersion,
        resolutionNote: null,
        handledBy: null,
        handledAt: null,
      };
      db.alerts.push(alert);
      db.revision++;
      summary.created++;
      const owner = db.projects.find((p) => p.id === task.projectId)?.ownerId;
      if (owner) notify(owner, "ALERT_CREATED", task.id, { alertId: alert.id });
    }
  }
  return summary;
}
function scheduleAlertRules() {
  schedule(() => asSystem(evaluateAlertRules), 50);
}
function alertRecipient(u: User, a: (typeof db.alerts)[number]) {
  return (
    projectPermissions(u, a.projectId).includes("ALERTS_MANAGE") ||
    db.tasks.some((t) => t.id === a.taskId && t.assigneeId === u.id)
  );
}
const alertVisible = (u: User, a: (typeof db.alerts)[number]) =>
  readsEveryProject(u) || alertRecipient(u, a);
function requireAlert(actor: User, id: string, edit = false) {
  const item = db.alerts.find((a) => a.id === id);
  if (!item || !alertVisible(actor, item))
    throw new ApiError(404, "NOT_FOUND", "Không tìm thấy cảnh báo.");
  if (edit && !actor.isSysAdmin && !alertRecipient(actor, item))
    throw new ApiError(
      403,
      "FORBIDDEN",
      "Chỉ người được giao công việc hoặc quản lý dự án mới được xử lý cảnh báo này.",
    );
  return item;
}
export const alertsDb = {
  listAlerts(viewer: User, query: AlertQuery) {
    return paginate(
      db.alerts
        .filter(
          (a) =>
            alertVisible(viewer, a) &&
            (!query.projectId || a.projectId === query.projectId) &&
            (!query.status || a.status === query.status) &&
            (!query.severity || a.severity === query.severity) &&
            (!query.q ||
              `${a.type} ${db.tasks.find((t) => t.id === a.taskId)?.title ?? ""}`
                .toLowerCase()
                .includes(query.q.toLowerCase())),
        )
        .map(alertRow),
      query,
    );
  },
  getAlert(viewer: User, alertId: string) {
    return alertDTO(requireAlert(viewer, alertId), viewer);
  },
  updateAlert(
    viewer: User,
    alertId: string,
    body: UpdateAlertInput,
    expectedVersion: string | null,
  ) {
    const item = requireAlert(viewer, alertId, true);
    requireVersion(expectedVersion, item);
    if (body.status !== "READ" && !body.resolutionNote?.trim())
      throw new ApiError(
        422,
        "RESOLUTION_NOTE_REQUIRED",
        "Cần ghi hướng xử lý hoặc lý do.",
        [
          {
            path: ["resolutionNote"],
            message: "Trạng thái này cần hướng xử lý hoặc lý do.",
          },
        ],
      );
    const before = { status: item.status, resolutionNote: item.resolutionNote };
    item.status = body.status;
    item.resolutionNote = body.resolutionNote ?? null;
    item.handledBy = viewer.id;
    item.handledAt = now();
    touch(item);
    audit(viewer.id, "ALERT", item.id, "Xử lý cảnh báo", before, {
      status: item.status,
      resolutionNote: item.resolutionNote,
    });
    return alertDTO(item, viewer);
  },
};

export const analyticsDb = {
  getDashboard: dashboard,
  getDeadlineRisks: risks,
  getWorkload: workload,
  getBottlenecks: bottlenecks,
  getAnalysisSummary: summary,
  createAnalysisJob(
    viewer: User,
    body: CreateJobInput,
    scenario: string | null,
  ) {
    return createJob(
      viewer,
      body.analysisId,
      body.generationMode ?? "REUSE_OR_CREATE",
      scenario,
    );
  },
  getAnalysisJob(viewer: User, jobId: string) {
    const job = db.jobs.get(jobId);
    if (!job)
      throw new ApiError(404, "NOT_FOUND", "Không tìm thấy tiến trình.");
    requireAnalysis(viewer, job.analysisId);
    return job;
  },
  getAnalysisDetail: detailDTO,
  createAnalysisFeedback: feedback,
  listAnalyticsFilterOptions(viewer: User, query: FilterOptionsQuery) {
    const projects = db.projects.filter(
      (p) =>
        can(viewer, "ANALYTICS_VIEW", p.id) &&
        (!query.unitId || p.unitId === query.unitId) &&
        (!query.projectId || p.id === query.projectId),
    );
    if (
      !projects.length &&
      (query.projectId ||
        (query.unitId &&
          !(
            readsEveryProject(viewer) &&
            db.units.some((unit) => unit.id === query.unitId)
          )))
    )
      throw new ApiError(403, "FORBIDDEN", "Không có quyền trong phạm vi lọc.");
    const unitIds = readsEveryProject(viewer)
      ? db.units
          .filter((unit) => !query.unitId || unit.id === query.unitId)
          .map((unit) => unit.id)
      : projects.map((p) => p.unitId);
    const memberIds = db.members
      .filter((m) => !m.endedAt && projects.some((p) => p.id === m.projectId))
      .map((m) => m.userId);
    const teams = db.teams.filter(
      (t) => unitIds.includes(t.unitId) && t.status === "ACTIVE",
    );
    if (query.teamId && !teams.some((t) => t.id === query.teamId))
      throw new ApiError(403, "FORBIDDEN", "Nhóm nằm ngoài phạm vi.");
    const team = query.teamId
      ? teams.find((t) => t.id === query.teamId)
      : undefined;
    const items =
      query.kind === "UNIT"
        ? db.units
            .filter((u) => unitIds.includes(u.id))
            .map((u) => ({ id: u.id, name: u.name }))
        : query.kind === "PROJECT"
          ? projects.map((p) => ({ id: p.id, name: p.name }))
          : query.kind === "TEAM"
            ? teams.map((t) => ({ id: t.id, name: t.name }))
            : db.users
                .filter(
                  (u) =>
                    memberIds.includes(u.id) &&
                    (!team || team.memberIds.includes(u.id)),
                )
                .map((u) => ({ id: u.id, name: u.displayName }));
    return paginate(
      items.filter(
        (i) => !query.q || i.name.toLowerCase().includes(query.q.toLowerCase()),
      ),
      query,
    );
  },
};

const notificationText: Record<NotificationType, string> = {
  TASK_ASSIGNED: "Bạn được giao công việc",
  TASK_UPDATED: "Kế hoạch công việc đã thay đổi",
  RESULT_SUBMITTED: "Có kết quả mới cần nghiệm thu",
  RESULT_APPROVED: "Kết quả đã được chấp nhận",
  CHANGES_REQUESTED: "Kết quả cần chỉnh sửa",
  ALERT_CREATED: "Có cảnh báo mới cho công việc",
};
function visibleNotifications(user: User) {
  return db.outbox.filter((notice) => {
    if (notice.recipientId !== user.id) return false;
    const task = db.tasks.find((item) => item.id === notice.taskId);
    return Boolean(
      task &&
      visibleTask(user, task) &&
      (!notice.alertId || can(user, "ANALYTICS_VIEW", task.projectId)),
    );
  });
}
function requireNotification(user: User, id: string) {
  const notice = visibleNotifications(user).find((item) => item.id === id);
  if (!notice)
    throw new ApiError(404, "NOT_FOUND", "Không tìm thấy thông báo.");
  return notice;
}
function notificationDTO(notice: (typeof db.outbox)[number]): NotificationDto {
  const task = db.tasks.find((item) => item.id === notice.taskId)!;
  return {
    id: notice.id,
    type: notice.type,
    title: `${notificationText[notice.type]}: ${task.title}`,
    href: notice.alertId
      ? `/alerts/${notice.alertId}`
      : `/tasks/${task.id}${notice.submissionId ? `/submissions/${notice.submissionId}` : ""}`,
    createdAt: notice.createdAt,
    readAt: notice.readAt,
  };
}
export const notificationsDb = {
  list(user: User, query: NotificationQuery) {
    const items = visibleNotifications(user)
      .reverse()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return paginate(items.map(notificationDTO), query);
  },
  summary(user: User) {
    return {
      unreadCount: visibleNotifications(user).filter((notice) => !notice.readAt)
        .length,
    };
  },
  markRead(user: User, id: string) {
    const notice = requireNotification(user, id);
    notice.readAt ??= now();
    return { id: notice.id, readAt: notice.readAt };
  },
};

export function authorizeReplay(
  operation: string,
  action: Permission | null,
  user: User,
  params: Record<string, string>,
  payload: Record<string, unknown>,
) {
  if (params.notificationId) requireNotification(user, params.notificationId);
  let projectId =
    typeof params.projectId === "string" ? params.projectId : undefined;
  if (!projectId && typeof params.taskId === "string")
    projectId = db.tasks.find((t) => t.id === params.taskId)?.projectId;
  if (!projectId && typeof params.timeLogId === "string") {
    const log = db.timeLogs.find((l) => l.id === params.timeLogId);
    projectId = db.tasks.find((t) => t.id === log?.taskId)?.projectId;
  }
  if (!projectId && typeof params.alertId === "string")
    projectId = db.alerts.find((a) => a.id === params.alertId)?.projectId;
  const analysisId = params.analysisId ?? payload.analysisId;
  if (typeof analysisId === "string") requireAnalysis(user, analysisId);
  const taskId =
    typeof params.taskId === "string"
      ? params.taskId
      : typeof payload.taskId === "string"
        ? payload.taskId
        : typeof params.timeLogId === "string"
          ? db.timeLogs.find((l) => l.id === params.timeLogId)?.taskId
          : undefined;
  const task = taskId ? db.tasks.find((t) => t.id === taskId) : undefined;
  if (
    task &&
    (!visibleTask(user, task) || (!action && task.assigneeId !== user.id))
  )
    throw new ApiError(
      403,
      "FORBIDDEN",
      "Bạn không còn quyền thực hiện trên công việc này.",
    );
  if (typeof params.reportId === "string") {
    const report = db.reports.find((r) => r.id === params.reportId);
    if (
      report &&
      (!inProject(user, report.projectId) || report.authorId !== user.id)
    )
      throw new ApiError(
        403,
        "FORBIDDEN",
        "Bạn không còn quyền thao tác báo cáo này.",
      );
  }
  if (!projectId && typeof analysisId === "string")
    projectId = db.details.get(analysisId)?.snapshot.scope.projectId;
  const analysisProjects =
    typeof analysisId === "string" ? analysisProjectIds(analysisId) : [];
  const scopedCan = (action: Permission) =>
    analysisProjects.length
      ? analysisProjects.every((id) => can(user, action, id))
      : can(user, action, projectId);
  if (action && !scopedCan(action))
    throw new ApiError(
      403,
      "FORBIDDEN",
      "Quyền thực hiện thao tác không còn hiệu lực.",
    );
  if (
    operation === "createAnalysisFeedback" &&
    (!scopedCan("ANALYTICS_VIEW") || !scopedCan("ALERTS_MANAGE"))
  )
    throw new ApiError(
      403,
      "FORBIDDEN",
      "Bạn không có quyền phản hồi nhận định này.",
    );
}

let queue = Promise.resolve();
export async function withMockTransaction<T>(
  execute: (commit: () => void) => Promise<T>,
  context: { feature: string; scenario: string | null; actor: string },
): Promise<T> {
  const previous = queue;
  let release = () => {};
  queue = new Promise<void>((resolve) => {
    release = resolve;
  });
  await previous;
  const backup = structuredClone(db);
  let committed = false;
  stampActor = context.actor;
  try {
    const result = await execute(() => {
      committed = true;
    });
    if (committed) {
      if (context.scenario === "notification-failed") {
        for (const notice of db.outbox.slice(backup.outbox.length)) {
          notice.status = "FAILED";
          notice.attemptCount = 1;
        }
      }
      if (
        [
          "tasks",
          "time-logs",
          "submissions",
          "reports",
          "projects",
          "project-members",
        ].includes(context.feature)
      )
        scheduleAlertRules();
    }
    return result;
  } catch (error) {
    db = backup;
    throw error;
  } finally {
    stampActor = "SYSTEM";
    release();
  }
}
