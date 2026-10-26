import { alertSchema } from "@/features/alerts/schemas/alerts.schema";
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
  TeamQuery,
  TeamRow,
  UnitQuery,
  UnitRow,
  UpdateTeamInput,
  UpdateUnitInput,
} from "@/features/organization/types/organization.types";
import { membershipSchema } from "@/features/project-members/schemas/project-members.schema";
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
  CreateUserInput,
  LockUserInput,
  ResetUserPasswordInput,
  UnlockUserInput,
  UpdateUserInput,
  UserDto,
  UserQuery,
  ProfileDto,
  UserRow,
} from "@/features/users/types/users.types";
import {
  analysisSubjectSchema,
  auditSchema,
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
} from "@/types/common";
import { z } from "zod";
import seed from "./data.json";

// Dữ liệu và kiểu lưu trữ.
const userModel = z
  .object(userSchema.shape)
  .omit({ unit: true, avatarUrl: true })
  .extend({ avatarId: idSchema.nullable().default(null) });
const projectModel = z
  .object(projectSchema.shape)
  .omit({ owner: true, unit: true })
  .extend({ unitId: idSchema });
const memberModel = z
  .object(membershipSchema.shape)
  .omit({ user: true })
  .extend({ projectId: idSchema });
const taskModel = z
  .object(taskSchema.shape)
  .omit({
    assignee: true,
    project: true,
    actualMinutes: true,
    isOverdue: true,
  })
  .extend({
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
  .omit({ taskTitle: true, analysisRef: true });
const attachmentModel = z.object(attachmentSchema.shape).extend({
  taskId: idSchema,
  uploadedBy: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
  mimeType: z.string().min(1, "Vui lòng nhập thông tin bắt buộc"),
});
const qualityModel = z
  .object(qualitySchema.shape)
  .extend({ missingFields: z.array(z.string()) });
const measureModel = z
  .object(measureSchema.shape)
  .extend({ missingFields: z.array(z.string()) });
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

// DB trong bộ nhớ: khởi tạo, reset và quyền.
const policy = seed.uploadPolicy;
const baseClock = seed.clock;
let clock = baseClock;
export const now = () => clock;
const today = () =>
  new Date(new Date(clock).getTime() + 7 * 3600_000).toISOString().slice(0, 10);
const entity = (id = crypto.randomUUID()) => ({
  id,
  version: 1,
});
const projectActions = new Set([
  "PROJECT_MANAGE",
  "MEMBERS_MANAGE",
  "TASKS_MANAGE",
  "TASKS_REVIEW",
  "ANALYTICS_VIEW",
  "ALERTS_MANAGE",
]);
function createDatabase() {
  const users = z.array(userModel).parse(seed.users);
  const attachments = z.array(attachmentModel).parse(seed.attachments);
  return {
    users,
    units: z.array(unitSchema).parse(seed.units),
    teams: z.array(teamSchema).parse(seed.teams),
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
export function resetDatabase() {
  for (const t of timers) clearTimeout(t);
  timers.clear();
  clock = baseClock;
  db = createDatabase();
}
export function setClock(value: string) {
  const next = z.iso.datetime().parse(value);
  if (next !== clock) db.revision++;
  clock = next;
}
function touch(v: { version: number; updatedAt?: string }) {
  v.version++;
  if ("updatedAt" in v) v.updatedAt = now();
  db.revision++;
}
const manages = (user: User, projectId: string) =>
  user.systemRole === "MANAGER" &&
  db.members.some(
    (member) =>
      member.projectId === projectId &&
      member.userId === user.id &&
      !member.endedAt &&
      member.projectRole !== "MEMBER",
  );
function can(user: User, action: string, projectId?: string) {
  if (action === "USERS_MANAGE" || action === "ORGANIZATION_MANAGE")
    return user.systemRole === "ADMIN";
  if (action === "PROJECT_CREATE") return user.systemRole === "MANAGER";
  if (action === "ANALYTICS_VIEW" && user.systemRole === "ADMIN") return true;
  return projectActions.has(action) && !!projectId && manages(user, projectId);
}
const inProject = (u: User, projectId: string) =>
  db.members.some(
    (m) => m.projectId === projectId && m.userId === u.id && !m.endedAt,
  );
function visibleTask(u: User, t: Task) {
  if (u.systemRole === "ADMIN") return true;
  return (
    inProject(u, t.projectId) &&
    (manages(u, t.projectId) ||
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
function notify(recipientId: string) {
  db.outbox.push({
    id: crypto.randomUUID(),
    eventId: crypto.randomUUID(),
    recipientId,
    status: "SENT",
    attemptCount: 1,
  });
}

// Dữ liệu trả về cho giao diện.
const person = (id: string) => {
  const user = db.users.find((user) => user.id === id);
  if (!user) throw new Error("Missing person " + id);
  return { id, displayName: user.displayName };
};
const unitRef = (id: string) => ({
  id,
  name: db.units.find((unit) => unit.id === id)?.name ?? "",
});
const userRow = (user: User): UserRow => ({
  id: user.id,
  username: user.username,
  displayName: user.displayName,
  email: user.email,
  avatarUrl: user.avatarId ? `/api/avatars/${user.avatarId}` : null,
  unitId: user.unitId,
  systemRole: user.systemRole,
  status: user.status,
  unit: unitRef(user.unitId),
});
const userDTO = (user: User): UserDto => ({
  ...userRow(user),
  version: user.version,
  updatedAt: user.updatedAt,
});
const projectRow = (project: (typeof db.projects)[number]): ProjectRow => ({
  id: project.id,
  code: project.code,
  name: project.name,
  objective: project.objective,
  startDate: project.startDate,
  dueAt: project.dueAt,
  status: project.status,
  owner: person(project.ownerId),
  unit: unitRef(project.unitId),
});
const projectDTO = (project: (typeof db.projects)[number]): ProjectDto => ({
  ...projectRow(project),
  version: project.version,
  ownerId: project.ownerId,
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
});
const memberDTO = (member: (typeof db.members)[number]): MembershipDto => ({
  id: member.id,
  version: member.version,
  userId: member.userId,
  projectRole: member.projectRole,
  endedAt: member.endedAt,
  user: person(member.userId),
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
      systemRole: user.systemRole,
    },
    projectAccess: db.members
      .filter((member) => member.userId === user.id && !member.endedAt)
      .map((member) => ({
        projectId: member.projectId,
        projectRole: member.projectRole,
      })),
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

// Phân trang và phiên bản cập nhật.
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

// Đăng nhập và phiên.
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
  return { session: sessionDTO(user), accessToken, expiresAt };
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
  async updateProfile(
    viewer: User,
    body: UpdateProfileInput,
    expectedVersion: string | null,
  ) {
    requireVersion(expectedVersion, viewer);
    if (body.username !== undefined)
      unique(body.username, viewer.email, viewer.id);
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
      username: viewer.username,
      displayName: viewer.displayName,
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

// Đơn vị và nhóm.
function requireAdmin(
  user: User,
  action: "USERS_MANAGE" | "ORGANIZATION_MANAGE",
) {
  if (!can(user, action))
    throw new ApiError(
      403,
      "FORBIDDEN",
      "Bạn chưa được cấp quyền quản trị này.",
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
    user.systemRole === "ADMIN" &&
    user.status === "ACTIVE" &&
    db.users.filter((u) => u.systemRole === "ADMIN" && u.status === "ACTIVE")
      .length <= 1
  )
    throw new ApiError(
      409,
      "LAST_ADMIN",
      "Cần duy trì ít nhất một quản trị viên hoạt động.",
    );
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
    requireAdmin(viewer, "ORGANIZATION_MANAGE");
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
    return requireUnit(unitId);
  },
  createUnit(viewer: User, body: CreateUnitInput) {
    requireAdmin(viewer, "ORGANIZATION_MANAGE");
    validateUnitLinks(null, body.parentId, body.managerId);
    const unit = { ...entity(), ...body, status: "ACTIVE" as const };
    db.units.push(unit);
    audit(viewer.id, "UNIT", unit.id, "Tạo đơn vị", null, body);
    return unit;
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
    return unit;
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
    return unit;
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
    return team(teamId);
  },
  createTeam(viewer: User, body: CreateTeamInput) {
    requireAdmin(viewer, "ORGANIZATION_MANAGE");
    validateTeamMembers(body.unitId, body.memberIds);
    const value = { ...entity(), ...body, status: "ACTIVE" as const };
    db.teams.push(value);
    audit(viewer.id, "TEAM", value.id, "Tạo nhóm", null, body);
    return value;
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
    return value;
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
    return value;
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
    return value;
  },
};

// Người dùng.
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
      systemRole: user.systemRole,
      email: user.email,
    };
  },
  listUsers(viewer: User, query: UserQuery) {
    requireAdmin(viewer, "USERS_MANAGE");
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
            (!query.systemRole || u.systemRole === query.systemRole),
        )
        .map(userRow),
      query,
    );
  },
  getUser(viewer: User, userId: string) {
    requireAdmin(viewer, "USERS_MANAGE");
    return userDTO(requireUser(userId));
  },
  createUser(viewer: User, body: CreateUserInput) {
    requireAdmin(viewer, "USERS_MANAGE");
    activeUnit(body.unitId);
    unique(body.username, body.email);
    const { initialPassword, ...data } = body;
    const user = {
      ...entity(),
      updatedAt: now(),
      ...data,
      avatarId: null,
      status: "ACTIVE" as const,
    };
    db.users.push(user);
    db.passwords.set(user.id, initialPassword);
    audit(viewer.id, "USER", user.id, "Cấp tài khoản", null, {
      username: user.username,
      systemRole: user.systemRole,
      unitId: user.unitId,
    });
    return userDTO(user);
  },
  updateUser(
    viewer: User,
    userId: string,
    body: UpdateUserInput,
    expectedVersion: string | null,
  ) {
    requireAdmin(viewer, "USERS_MANAGE");
    const user = requireUser(userId);
    requireVersion(expectedVersion, user);
    const { reason, ...patch } = body;
    if (!Object.keys(patch).length)
      throw new ApiError(422, "EMPTY_PATCH", "Chưa có thông tin thay đổi.");
    if (patch.systemRole && patch.systemRole !== user.systemRole) {
      if (!reason)
        throw new ApiError(
          422,
          "REASON_REQUIRED",
          "Đổi vai trò cần có lý do.",
          [{ path: ["reason"], message: "Nhập lý do thay đổi vai trò." }],
        );
      if (viewer.id === user.id)
        throw new ApiError(
          403,
          "SELF_ROLE_CHANGE",
          "Không được tự thay đổi vai trò của mình.",
        );
      protectLastAdmin(user);
      if (
        user.systemRole === "MANAGER" &&
        db.members.some(
          (member) =>
            member.userId === user.id &&
            !member.endedAt &&
            member.projectRole !== "MEMBER" &&
            db.projects.some(
              (project) =>
                project.id === member.projectId &&
                ["PLANNED", "ACTIVE"].includes(project.status),
            ),
        )
      )
        throw new ApiError(
          409,
          "HANDOVER_REQUIRED",
          "Cần bàn giao vai trò quản lý dự án trước khi đổi vai trò hệ thống.",
        );
    }
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
      systemRole: user.systemRole,
      unitId: user.unitId,
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
};

// Dự án.
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
    owner.systemRole !== "MANAGER"
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
  if (role === "MANAGER" && user.systemRole !== "MANAGER")
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
function requireProject(user: User, id: string, action?: string) {
  const project = db.projects.find((p) => p.id === id);
  if (!project) throw new ApiError(404, "NOT_FOUND", "Không tìm thấy dự án.");
  if (
    (!inProject(user, id) && user.systemRole !== "ADMIN") ||
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
            (viewer.systemRole === "ADMIN" || inProject(viewer, p.id)) &&
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

// Thành viên dự án.
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

// Công việc.
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
    if (task.assigneeId) notify(task.assigneeId);
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
    notify(body.assigneeId);
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

// Nhật ký thời gian.
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

// Kết quả và nghiệm thu.
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
        .sort((a, b) => b.sequence - a.sequence)
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
    notify(db.projects.find((p) => p.id === task.projectId)!.ownerId);
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
    notify(submission.submittedBy);
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
    notify(submission.submittedBy);
    return { submission: submissionDTO(submission), task: taskDTO(task) };
  },
};

// Báo cáo.
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
  (actor.systemRole === "ADMIN" || inProject(actor, r.projectId)) &&
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

// Tệp đính kèm.
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

// Phân tích: phạm vi và số liệu.
type Scope = AnalyticsQuery;
const quality = (missingFields: string[] = []): Quality => ({
  status: missingFields.length ? "PARTIAL" : "SUFFICIENT",
  missingFields,
});
function analyticsScope(u: User, query: AnalyticsQuery) {
  const allowed = db.projects.filter((p) => can(u, "ANALYTICS_VIEW", p.id));
  if (!allowed.length && u.systemRole !== "ADMIN")
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
          u.systemRole === "ADMIN" &&
          db.units.some((unit) => unit.id === query.unitId)
        )))
  )
    throw new ApiError(403, "FORBIDDEN", "Bạn không có quyền xem phạm vi này.");
  const scope = {
    ...query,
    ...(!query.unitId && !query.projectId && u.systemRole !== "ADMIN"
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

// Snapshot phân tích và căn cứ.
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

// Dashboard.
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

// Nguy cơ trễ hạn.
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

// Khối lượng công việc.
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

// Điểm nghẽn.
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

// Tổng hợp phân tích.
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

// Job diễn giải và phản hồi.
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
    (!ids.length && actor.systemRole !== "ADMIN") ||
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

// Cảnh báo.
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
          previous.conditionActive = rule.active;
          previous.dataAsOf = now();
          touch(previous);
        }
        continue;
      }
      if (!rule.active) continue;
      db.alerts.push({
        ...entity(),
        createdAt: now(),
        projectId: task.projectId,
        taskId: task.id,
        type: rule.type,
        severity: "HIGH",
        status: "UNREAD",
        conditionActive: true,
        evidence: rule.evidence,
        dataAsOf: now(),
        methodVersion: "trial-rules-v1",
        resolutionNote: null,
        handledBy: null,
        handledAt: null,
      });
      db.revision++;
      const owner = db.projects.find((p) => p.id === task.projectId)?.ownerId;
      if (owner) notify(owner);
    }
  }
}
function scheduleAlertRules() {
  schedule(evaluateAlertRules, 50);
}
function requireAlert(actor: User, id: string, edit = false) {
  const item = db.alerts.find((a) => a.id === id);
  if (!item) throw new ApiError(404, "NOT_FOUND", "Không tìm thấy cảnh báo.");
  if (
    !can(actor, "ANALYTICS_VIEW", item.projectId) ||
    (edit && !can(actor, "ALERTS_MANAGE", item.projectId))
  )
    throw new ApiError(
      403,
      "FORBIDDEN",
      "Không có quyền xem hoặc xử lý cảnh báo trong dự án.",
    );
  return item;
}
export const alertsDb = {
  listAlerts(viewer: User, query: AlertQuery) {
    return paginate(
      db.alerts
        .filter(
          (a) =>
            can(viewer, "ANALYTICS_VIEW", a.projectId) &&
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

// API phân tích.
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
            viewer.systemRole === "ADMIN" &&
            db.units.some((unit) => unit.id === query.unitId)
          )))
    )
      throw new ApiError(403, "FORBIDDEN", "Không có quyền trong phạm vi lọc.");
    const unitIds =
      viewer.systemRole === "ADMIN"
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

// Kiểm tra quyền khi gửi lại yêu cầu.
export function authorizeReplay(
  operation: string,
  action: string | null,
  user: User,
  params: Record<string, string>,
  payload: Record<string, unknown>,
) {
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
  const scopedCan = (action: string) =>
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

// Hàng đợi cập nhật và rollback.
let queue = Promise.resolve();
export async function withMockTransaction<T>(
  execute: (commit: () => void) => Promise<T>,
  context: { feature: string; scenario: string | null },
): Promise<T> {
  const previous = queue;
  let release = () => {};
  queue = new Promise<void>((resolve) => {
    release = resolve;
  });
  await previous;
  const backup = structuredClone(db);
  let committed = false;
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
    release();
  }
}
