import {
  type AssignTaskInput,
  type CancelTaskInput,
  type CreateTaskInput,
  type PauseTaskInput,
  type TaskHistoryQuery,
  type TaskQuery,
  type UpdateRemainingEstimateInput,
  type UpdateTaskInput,
} from "@/features/tasks/types/tasks.types";
import type { Task, User } from "@/mocks/db/database";
import { ApiError } from "@/types/api/error";
import { paginate } from "../utils/pagination";
import {
  audit,
  db,
  entity,
  notify,
  now,
  taskDTO,
  touch,
  visibleTask,
} from "./database";
import { requireProject } from "./projects.db";
import { requireVersion } from "./version";
export function requireTask(user: User, id: string) {
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
export function requireActive(task: Task) {
  if (
    !db.projects.some((p) => p.id === task.projectId && p.status === "ACTIVE")
  )
    throw new ApiError(
      409,
      "PROJECT_NOT_ACTIVE",
      "Dự án chưa triển khai hoặc đã đóng.",
    );
}
export function requireEditable(task: Task) {
  requireActive(task);
  if (["PENDING_REVIEW", "COMPLETED", "CANCELLED"].includes(task.status))
    throw new ApiError(
      409,
      "TASK_READ_ONLY",
      "Trạng thái công việc hiện tại không cho phép sửa.",
    );
}
export function requireAssignee(
  user: User,
  task: Task,
  status: Task["status"],
) {
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
export function transition(
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
  listTasks(viewer: User, query: TaskQuery) {
    const user = viewer;
    const items = db.tasks
      .filter((t) => visibleTask(user, t))
      .map(taskDTO)
      .filter(
        (t) =>
          (!query.q || t.title.toLowerCase().includes(query.q.toLowerCase())) &&
          (!query.projectId || t.projectId === query.projectId) &&
          (!query.assigneeId || t.assigneeId === query.assigneeId) &&
          (!query.status || t.status === query.status) &&
          (!query.priority || t.priority === query.priority) &&
          (query.overdue === undefined || t.isOverdue === query.overdue) &&
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
    return paginate(items, query);
  },
  getTask(viewer: User, taskId: string) {
    return taskDTO(requireTask(viewer, taskId));
  },
  createTask(viewer: User, projectId: string, body: CreateTaskInput) {
    const user = viewer;
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
    const task = {
      ...entity(),
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
      cancelledAt: null,
      actualMinutes: 0,
      latestSubmissionId: null,
      isOverdue: false,
    };
    db.tasks.push(task);
    db.revision++;
    audit(user.id, "TASK", task.id, "Tạo công việc", null, {
      title: task.title,
    });
    return taskDTO(task);
  },
  updateTask(
    viewer: User,
    taskId: string,
    body: UpdateTaskInput,
    expectedVersion: string | null,
  ) {
    const user = viewer;
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
    const before = {
      title: task.title,
      dueAt: task.dueAt,
      estimatedMinutes: task.estimatedMinutes,
    };
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
    viewer: User,
    taskId: string,
    body: AssignTaskInput,
    expectedVersion: string | null,
  ) {
    const user = viewer;
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
      id: crypto.randomUUID(),
      taskId: task.id,
      userId: body.assigneeId,
      startedAt: now(),
      endedAt: null,
      reason: body.reason ?? null,
    });
    task.assigneeId = body.assigneeId;
    transition(user, task, "TODO", body.reason ?? null);
    notify(body.assigneeId);
    return taskDTO(task);
  },
  startTask(viewer: User, taskId: string, expectedVersion: string | null) {
    const user = viewer;
    const task = requireTask(user, taskId);
    requireAssignee(user, task, "TODO");
    requireVersion(expectedVersion, task);
    task.firstStartedAt ??= now();
    transition(user, task, "IN_PROGRESS");
    return taskDTO(task);
  },
  pauseTask(
    viewer: User,
    taskId: string,
    body: PauseTaskInput,
    expectedVersion: string | null,
  ) {
    const user = viewer;
    const task = requireTask(user, taskId);
    requireAssignee(user, task, "IN_PROGRESS");
    requireVersion(expectedVersion, task);
    transition(user, task, "TODO", body.reason);
    return taskDTO(task);
  },
  cancelTask(
    viewer: User,
    taskId: string,
    body: CancelTaskInput,
    expectedVersion: string | null,
  ) {
    const user = viewer;
    const task = requireTask(user, taskId);
    requireProject(user, task.projectId, "TASKS_MANAGE");
    requireEditable(task);
    requireVersion(expectedVersion, task);
    task.cancelledAt = now();
    for (const a of db.assignments.filter(
      (a) => a.taskId === task.id && !a.endedAt,
    ))
      a.endedAt = now();
    transition(user, task, "CANCELLED", body.reason);
    return taskDTO(task);
  },
  updateRemainingEstimate(
    viewer: User,
    taskId: string,
    body: UpdateRemainingEstimateInput,
    expectedVersion: string | null,
  ) {
    const user = viewer;
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
        .sort((a, b) => b.at.localeCompare(a.at)),
      query,
    );
  },
};
