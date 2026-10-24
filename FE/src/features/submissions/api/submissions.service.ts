import type { SubmissionsApi } from "@/features/submissions/api/submissions.contract";
import {
  submissionResultSchema,
  submissionSchema,
} from "@/features/submissions/schemas/submissions.schema";
import {
  type ApproveSubmissionInput,
  type CreateSubmissionInput,
  type RequestSubmissionRevisionInput,
  type ReviewQueueQuery,
  type SubmissionQuery,
} from "@/features/submissions/types/submissions.types";
import { page } from "@/lib/validation/common.schema";
import { apiClient } from "@/services/api-client";
import type { RequestOptions, VersionOptions } from "@/services/api.types";
export const submissionsService: SubmissionsApi = {
  listSubmissions(
    taskId: string,
    query: SubmissionQuery = {},
    options: RequestOptions = {},
  ) {
    return apiClient.get(
      `/tasks/${encodeURIComponent(taskId)}/submissions`,
      page(submissionSchema),
      { ...options, query },
    );
  },
  getSubmission(
    taskId: string,
    submissionId: string,
    options: RequestOptions = {},
  ) {
    return apiClient.get(
      `/tasks/${encodeURIComponent(taskId)}/submissions/${encodeURIComponent(submissionId)}`,
      submissionSchema,
      options,
    );
  },
  createSubmission(
    taskId: string,
    payload: CreateSubmissionInput,
    options: VersionOptions,
  ) {
    return apiClient.post(
      `/tasks/${encodeURIComponent(taskId)}/submissions`,
      payload,
      submissionResultSchema,
      options,
    );
  },
  approveSubmission(
    taskId: string,
    submissionId: string,
    payload: ApproveSubmissionInput,
    options: VersionOptions,
  ) {
    return apiClient.post(
      `/tasks/${encodeURIComponent(taskId)}/submissions/${encodeURIComponent(submissionId)}/approve`,
      payload,
      submissionResultSchema,
      options,
    );
  },
  requestSubmissionRevision(
    taskId: string,
    submissionId: string,
    payload: RequestSubmissionRevisionInput,
    options: VersionOptions,
  ) {
    return apiClient.post(
      `/tasks/${encodeURIComponent(taskId)}/submissions/${encodeURIComponent(submissionId)}/request-revision`,
      payload,
      submissionResultSchema,
      options,
    );
  },
  listReviewQueue(query: ReviewQueueQuery = {}, options: RequestOptions = {}) {
    return apiClient.get(`/review-queue`, page(submissionSchema), {
      ...options,
      query,
    });
  },
};
