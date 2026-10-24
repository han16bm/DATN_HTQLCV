import {
  type ApproveSubmissionInput,
  type CreateSubmissionInput,
  type RequestSubmissionRevisionInput,
  type ReviewQueueList,
  type ReviewQueueQuery,
  type SubmissionDto,
  type SubmissionList,
  type SubmissionQuery,
  type SubmissionResult,
} from "@/features/submissions/types/submissions.types";
import type { RequestOptions, VersionOptions } from "@/services/api-client";
export interface SubmissionsApi {
  listSubmissions(
    taskId: string,
    query?: SubmissionQuery,
    options?: RequestOptions,
  ): Promise<SubmissionList>;
  getSubmission(
    taskId: string,
    submissionId: string,
    options?: RequestOptions,
  ): Promise<SubmissionDto>;
  createSubmission(
    taskId: string,
    payload: CreateSubmissionInput,
    options: VersionOptions,
  ): Promise<SubmissionResult>;
  approveSubmission(
    taskId: string,
    submissionId: string,
    payload: ApproveSubmissionInput,
    options: VersionOptions,
  ): Promise<SubmissionResult>;
  requestSubmissionRevision(
    taskId: string,
    submissionId: string,
    payload: RequestSubmissionRevisionInput,
    options: VersionOptions,
  ): Promise<SubmissionResult>;
  listReviewQueue(
    query?: ReviewQueueQuery,
    options?: RequestOptions,
  ): Promise<ReviewQueueList>;
}
