import type { SubmissionsApi } from "@/features/submissions/api/submissions.contract";
import {
  reviewRowSchema,
  submissionResultSchema,
  submissionRowSchema,
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
import type { RequestOptions, VersionOptions } from "@/services/api-client";
import { apiClient, parseResponse } from "@/services/api-client";
export const submissionsService: SubmissionsApi = {
  listSubmissions(
    taskId: string,
    query: SubmissionQuery = {},
    options: RequestOptions = {},
  ) {
    return apiClient
      .get<unknown>(`/tasks/${encodeURIComponent(taskId)}/submissions`, {
        ...options,
        params: query,
      })
      .then(parseResponse(page(submissionRowSchema)));
  },
  getSubmission(
    taskId: string,
    submissionId: string,
    options: RequestOptions = {},
  ) {
    return apiClient
      .get<unknown>(
        `/tasks/${encodeURIComponent(taskId)}/submissions/${encodeURIComponent(submissionId)}`,
        options,
      )
      .then(parseResponse(submissionSchema));
  },
  createSubmission(
    taskId: string,
    payload: CreateSubmissionInput,
    options: VersionOptions,
  ) {
    return apiClient
      .post<unknown>(
        `/tasks/${encodeURIComponent(taskId)}/submissions`,
        payload,
        options,
      )
      .then(parseResponse(submissionResultSchema));
  },
  approveSubmission(
    taskId: string,
    submissionId: string,
    payload: ApproveSubmissionInput,
    options: VersionOptions,
  ) {
    return apiClient
      .post<unknown>(
        `/tasks/${encodeURIComponent(taskId)}/submissions/${encodeURIComponent(submissionId)}/approve`,
        payload,
        options,
      )
      .then(parseResponse(submissionResultSchema));
  },
  requestSubmissionRevision(
    taskId: string,
    submissionId: string,
    payload: RequestSubmissionRevisionInput,
    options: VersionOptions,
  ) {
    return apiClient
      .post<unknown>(
        `/tasks/${encodeURIComponent(taskId)}/submissions/${encodeURIComponent(submissionId)}/request-revision`,
        payload,
        options,
      )
      .then(parseResponse(submissionResultSchema));
  },
  listReviewQueue(query: ReviewQueueQuery = {}, options: RequestOptions = {}) {
    return apiClient
      .get<unknown>("/review-queue", { ...options, params: query })
      .then(parseResponse(page(reviewRowSchema)));
  },
};
