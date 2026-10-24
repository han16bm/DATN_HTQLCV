import * as c from "@/features/time-logs/api/time-logs.contract";
import { ApiError } from "@/types/api/error";
import {
  db,
  entity,
  today,
  taskDTO,
  logDTO,
  touch,
  audit,
} from "../db/database";
import { requireTask, requireAssignee, paginate } from "../db/tasks.db";
import {
  createHandler,
  authenticatedUser,
  requireVersion,
} from "../utils/handler";

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
export const timeLogHandlers = [
  createHandler(c.listTimeLogsContract, ({ request, params, query }) => {
    requireTask(authenticatedUser(request), params.taskId);
    return paginate(
      db.timeLogs.filter((l) => l.taskId === params.taskId).map(logDTO),
      query,
    );
  }),
  createHandler(c.createTimeLogContract, ({ request, params, body }) => {
    const user = authenticatedUser(request),
      task = requireTask(user, params.taskId);
    requireAssignee(user, task, "IN_PROGRESS");
    requireVersion(request, task);
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
  }),
  createHandler(c.updateTimeLogContract, ({ request, params, body }) => {
    const user = authenticatedUser(request),
      log = db.timeLogs.find((l) => l.id === params.timeLogId);
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
    requireVersion(request, log);
    const { reason, ...patch } = body;
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
  }),
  createHandler(c.voidTimeLogContract, ({ request, params, body }) => {
    const user = authenticatedUser(request),
      log = db.timeLogs.find((l) => l.id === params.timeLogId);
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
    requireVersion(request, log);
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
  }),
];
