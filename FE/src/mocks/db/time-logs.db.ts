import {
  type CreateTimeLogInput,
  type TimeLogQuery,
  type UpdateTimeLogInput,
  type VoidTimeLogInput,
} from "@/features/time-logs/types/time-logs.types";
import type { User } from "@/mocks/db/database";
import { ApiError } from "@/types/api/error";
import { paginate } from "../utils/pagination";
import { audit, db, entity, logDTO, taskDTO, today, touch } from "./database";
import { requireAssignee, requireTask } from "./tasks.db";
import { requireVersion } from "./version";
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
    viewer: User,
    taskId: string,
    body: CreateTimeLogInput,
    expectedVersion: string | null,
  ) {
    const user = viewer;
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
    viewer: User,
    timeLogId: string,
    body: UpdateTimeLogInput,
    expectedVersion: string | null,
  ) {
    const user = viewer;
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
    const before = { minutes: log.minutes, workDate: log.workDate };
    Object.assign(log, patch);
    touch(log);
    touch(task);
    audit(user.id, "TASK", task.id, "Sửa giờ công", before, patch, reason);
    return { timeLog: logDTO(log), task: taskDTO(task) };
  },
  voidTimeLog(
    viewer: User,
    timeLogId: string,
    body: VoidTimeLogInput,
    expectedVersion: string | null,
  ) {
    const user = viewer;
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
