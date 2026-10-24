import { ApiError } from "@/types/api/error";
import {
  db,
  can,
  visibleTask,
  type Task,
  type User,
  touch,
  audit,
  now,
} from "./database";

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
export function requireProject(user: User, id: string, permission?: string) {
  const project = db.projects.find((p) => p.id === id);
  if (!project) throw new ApiError(404, "NOT_FOUND", "Không tìm thấy dự án.");
  if (
    !db.members.some(
      (m) => m.projectId === id && m.userId === user.id && !m.endedAt,
    ) ||
    (permission && !can(user, permission, id))
  )
    throw new ApiError(
      403,
      "FORBIDDEN",
      "Bạn không có quyền thực hiện trong dự án.",
    );
  return project;
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
export function paginate<T>(
  items: T[],
  query: { page?: number; pageSize?: number },
) {
  const page = query.page ?? 1,
    pageSize = query.pageSize ?? 20;
  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    pagination: { page, pageSize, total: items.length },
  };
}
