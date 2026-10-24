import * as c from "@/features/submissions/api/submissions.contract";
import { ApiError } from "@/types/api/error";
import {
  db,
  now,
  entity,
  taskDTO,
  submissionDTO,
  touch,
  notify,
  can,
} from "../db/database";
import {
  requireTask,
  requireProject,
  requireAssignee,
  requireActive,
  transition,
  paginate,
} from "../db/tasks.db";
import {
  createHandler,
  authenticatedUser,
  requireVersion,
} from "../utils/handler";

function submissionFor(
  request: Request,
  taskId: string,
  submissionId: string,
  review = false,
) {
  const user = authenticatedUser(request),
    task = requireTask(user, taskId),
    submission = db.submissions.find(
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
    requireVersion(request, submission);
  }
  return { user, task, submission };
}
export const submissionHandlers = [
  createHandler(c.listSubmissionsContract, ({ request, params, query }) => {
    requireTask(authenticatedUser(request), params.taskId);
    return paginate(
      db.submissions
        .filter((s) => s.taskId === params.taskId)
        .sort((a, b) => b.sequence - a.sequence)
        .map(submissionDTO),
      query,
    );
  }),
  createHandler(c.getSubmissionContract, ({ request, params }) =>
    submissionDTO(
      submissionFor(request, params.taskId, params.submissionId).submission,
    ),
  ),
  createHandler(c.listReviewQueueContract, ({ request, query }) => {
    const user = authenticatedUser(request);
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
        .map(submissionDTO),
      query,
    );
  }),
  createHandler(c.createSubmissionContract, ({ request, params, body }) => {
    const user = authenticatedUser(request),
      task = requireTask(user, params.taskId);
    requireAssignee(user, task, "IN_PROGRESS");
    requireVersion(request, task);
    if (taskDTO(task).actualMinutes <= 0)
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
      actualMinutesSnapshot: taskDTO(task).actualMinutes,
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
  }),
  createHandler(c.approveSubmissionContract, ({ request, params, body }) => {
    const { user, task, submission } = submissionFor(
      request,
      params.taskId,
      params.submissionId,
      true,
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
  }),
  createHandler(
    c.requestSubmissionRevisionContract,
    ({ request, params, body }) => {
      const { user, task, submission } = submissionFor(
        request,
        params.taskId,
        params.submissionId,
        true,
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
  ),
];
