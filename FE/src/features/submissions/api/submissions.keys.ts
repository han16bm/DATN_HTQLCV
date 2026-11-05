import type { ViewerId } from "@/types/common";
import {
  type ReviewQueueQuery,
  type SubmissionQuery,
} from "../types/submissions.types";
export const submissionsKeys = {
  all: ["submissions"] as const,
  viewer: (viewerId: ViewerId) =>
    ["submissions", viewerId ?? "anonymous"] as const,
  listSubmissions: (
    viewerId: ViewerId,
    taskId: string,
    query: SubmissionQuery,
  ) =>
    [
      ...submissionsKeys.viewer(viewerId),
      "listSubmissions",
      taskId,
      query,
    ] as const,
  getSubmission: (viewerId: ViewerId, taskId: string, submissionId: string) =>
    [
      ...submissionsKeys.viewer(viewerId),
      "getSubmission",
      taskId,
      submissionId,
    ] as const,
  listReviewQueue: (viewerId: ViewerId, query: ReviewQueueQuery) =>
    [...submissionsKeys.viewer(viewerId), "listReviewQueue", query] as const,
};
