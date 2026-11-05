import { page } from "@/lib/validation/common.schema";
import {
  type RequestOptions,
  type VersionOptions,
  apiClient,
} from "@/services/api-client";
import {
  reviewRowSchema,
  submissionResultSchema,
  submissionRowSchema,
  submissionSchema,
} from "../schemas/submissions.schema";
import type {
  ApproveSubmissionInput,
  CreateSubmissionInput,
  RequestSubmissionRevisionInput,
  ReviewQueueList,
  ReviewQueueQuery,
  SubmissionDto,
  SubmissionList,
  SubmissionQuery,
  SubmissionResult,
} from "../types/submissions.types";

export const submissionsService = {
  async listSubmissions(
    taskId: string,
    query: SubmissionQuery = {},
    options: RequestOptions = {},
  ) {
    const response = await apiClient.get<SubmissionList>(
      `/tasks/${encodeURIComponent(taskId)}/submissions`,
      { ...options, params: query, schema: page(submissionRowSchema) },
    );
    return response.data;
  },

  async getSubmission(
    taskId: string,
    submissionId: string,
    options: RequestOptions = {},
  ) {
    const response = await apiClient.get<SubmissionDto>(
      `/tasks/${encodeURIComponent(taskId)}/submissions/${encodeURIComponent(submissionId)}`,
      { ...options, schema: submissionSchema },
    );
    return response.data;
  },

  async createSubmission(
    taskId: string,
    payload: CreateSubmissionInput,
    options: VersionOptions,
  ) {
    const response = await apiClient.post<SubmissionResult>(
      `/tasks/${encodeURIComponent(taskId)}/submissions`,
      payload,
      { ...options, schema: submissionResultSchema },
    );
    return response.data;
  },

  async approveSubmission(
    taskId: string,
    submissionId: string,
    payload: ApproveSubmissionInput,
    options: VersionOptions,
  ) {
    const response = await apiClient.post<SubmissionResult>(
      `/tasks/${encodeURIComponent(taskId)}/submissions/${encodeURIComponent(submissionId)}/approve`,
      payload,
      { ...options, schema: submissionResultSchema },
    );
    return response.data;
  },

  async requestSubmissionRevision(
    taskId: string,
    submissionId: string,
    payload: RequestSubmissionRevisionInput,
    options: VersionOptions,
  ) {
    const response = await apiClient.post<SubmissionResult>(
      `/tasks/${encodeURIComponent(taskId)}/submissions/${encodeURIComponent(submissionId)}/request-revision`,
      payload,
      { ...options, schema: submissionResultSchema },
    );
    return response.data;
  },

  async listReviewQueue(
    query: ReviewQueueQuery = {},
    options: RequestOptions = {},
  ) {
    const response = await apiClient.get<ReviewQueueList>("/review-queue", {
      ...options,
      params: query,
      schema: page(reviewRowSchema),
    });
    return response.data;
  },
};
