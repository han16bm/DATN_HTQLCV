import {
  type ApproveSubmissionInput,
  type CreateSubmissionInput,
  type RequestSubmissionRevisionInput,
  type ReviewQueueQuery,
  type SubmissionQuery,
} from "@/features/submissions/types/submissions.types";
import type { User } from "@/mocks/db/database";
import { ApiError } from "@/types/api/error";
import { paginate } from "../utils/pagination";
import {
  can,
  db,
  entity,
  notify,
  now,
  submissionDTO,
  taskDTO,
  touch,
} from "./database";
import { requireProject } from "./projects.db";
import {
  requireActive,
  requireAssignee,
  requireTask,
  transition,
} from "./tasks.db";
import { requireVersion } from "./version";
function submissionFor(
  viewer: User,
  taskId: string,
  submissionId: string,
  review = false,
  expectedVersion: string | null = null,
) {
  const user = viewer;
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
        .map(submissionDTO),
      query,
    );
  },
  getSubmission(viewer: User, taskId: string, submissionId: string) {
    return submissionDTO(
      submissionFor(viewer, taskId, submissionId).submission,
    );
  },
  listReviewQueue(viewer: User, query: ReviewQueueQuery) {
    const user = viewer;
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
  },
  createSubmission(
    viewer: User,
    taskId: string,
    body: CreateSubmissionInput,
    expectedVersion: string | null,
  ) {
    const user = viewer;
    const task = requireTask(user, taskId);
    requireAssignee(user, task, "IN_PROGRESS");
    requireVersion(expectedVersion, task);
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
