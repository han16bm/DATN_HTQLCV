import {
  type ReviewQueueQuery,
  type SubmissionQuery,
} from "@/features/submissions/types/submissions.types";
export const submissionsKeys = {
  all: ["submissions"] as const,
  viewer: (viewerId: string) => ["submissions", viewerId] as const,
  listSubmissions: (viewerId: string, taskId: string, query: SubmissionQuery) =>
    ["submissions", viewerId, "listSubmissions", taskId, query] as const,
  getSubmission: (viewerId: string, taskId: string, submissionId: string) =>
    ["submissions", viewerId, "getSubmission", taskId, submissionId] as const,
  listReviewQueue: (viewerId: string, query: ReviewQueueQuery) =>
    ["submissions", viewerId, "listReviewQueue", query] as const,
};
