import * as c from "@/features/tasks/api/tasks.contract";
import { ApiError } from "@/types/api/error";
import {
  db,
  taskDTO,
  touch,
  now,
  entity,
  audit,
  notify,
  visibleTask,
} from "../db/database";
import {
  requireTask,
  requireProject,
  requireActive,
  requireEditable,
  requireAssignee,
  transition,
  paginate,
} from "../db/tasks.db";
import {
  authenticatedUser,
  createHandler,
  requireVersion,
} from "../utils/handler";

export const taskHandlers = [
  createHandler(c.listTasksContract, ({ request, query }) => {
    const user = authenticatedUser(request);
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
  }),
  createHandler(c.getTaskContract, ({ request, params }) =>
    taskDTO(requireTask(authenticatedUser(request), params.taskId)),
  ),
  createHandler(c.createTaskContract, ({ request, params, body }) => {
    const user = authenticatedUser(request),
      project = requireProject(user, params.projectId, "TASKS_MANAGE");
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
  }),
  createHandler(c.updateTaskContract, ({ request, params, body }) => {
    const user = authenticatedUser(request),
      task = requireTask(user, params.taskId);
    requireProject(user, task.projectId, "TASKS_MANAGE");
    requireEditable(task);
    requireVersion(request, task);
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
  }),
  createHandler(c.assignTaskContract, ({ request, params, body }) => {
    const user = authenticatedUser(request),
      task = requireTask(user, params.taskId);
    requireProject(user, task.projectId, "TASKS_MANAGE");
    requireEditable(task);
    requireVersion(request, task);
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
  }),
  createHandler(c.startTaskContract, ({ request, params }) => {
    const user = authenticatedUser(request),
      task = requireTask(user, params.taskId);
    requireAssignee(user, task, "TODO");
    requireVersion(request, task);
    task.firstStartedAt ??= now();
    transition(user, task, "IN_PROGRESS");
    return taskDTO(task);
  }),
  createHandler(c.pauseTaskContract, ({ request, params, body }) => {
    const user = authenticatedUser(request),
      task = requireTask(user, params.taskId);
    requireAssignee(user, task, "IN_PROGRESS");
    requireVersion(request, task);
    transition(user, task, "TODO", body.reason);
    return taskDTO(task);
  }),
  createHandler(c.cancelTaskContract, ({ request, params, body }) => {
    const user = authenticatedUser(request),
      task = requireTask(user, params.taskId);
    requireProject(user, task.projectId, "TASKS_MANAGE");
    requireEditable(task);
    requireVersion(request, task);
    task.cancelledAt = now();
    for (const a of db.assignments.filter(
      (a) => a.taskId === task.id && !a.endedAt,
    ))
      a.endedAt = now();
    transition(user, task, "CANCELLED", body.reason);
    return taskDTO(task);
  }),
  createHandler(
    c.updateRemainingEstimateContract,
    ({ request, params, body }) => {
      const user = authenticatedUser(request),
        task = requireTask(user, params.taskId);
      requireAssignee(user, task, "IN_PROGRESS");
      requireVersion(request, task);
      requireActive(task);
      task.remainingMinutes = body.remainingMinutes;
      touch(task);
      return taskDTO(task);
    },
  ),
  createHandler(c.listTaskHistoryContract, ({ request, params, query }) => {
    requireTask(authenticatedUser(request), params.taskId);
    return paginate(
      db.audits
        .filter((a) => a.entityType === "TASK" && a.entityId === params.taskId)
        .sort((a, b) => b.at.localeCompare(a.at)),
      query,
    );
  }),
];
