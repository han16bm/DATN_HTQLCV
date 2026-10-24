import type {
  approveSchema,
  createSubmissionSchema,
  reviewQueueQuerySchema,
  revisionSchema,
  submissionQuerySchema,
  submissionResultSchema,
  submissionSchema,
} from "@/features/submissions/schemas/submissions.schema";
import { type Page } from "@/types/common";
import { type z } from "zod";
export type SubmissionDto = z.output<typeof submissionSchema>;
export type SubmissionQuery = z.input<typeof submissionQuerySchema>;
export type SubmissionList = Page<SubmissionDto>;
export type CreateSubmissionInput = z.input<typeof createSubmissionSchema>;
export type SubmissionResult = z.output<typeof submissionResultSchema>;
export type CreateSubmissionArgs = {
  taskId: string;
  payload: CreateSubmissionInput;
  version: number;
};
export type ApproveSubmissionInput = z.input<typeof approveSchema>;
export type ApproveSubmissionArgs = {
  taskId: string;
  submissionId: string;
  payload: ApproveSubmissionInput;
  version: number;
};
export type RequestSubmissionRevisionInput = z.input<typeof revisionSchema>;
export type RequestSubmissionRevisionArgs = {
  taskId: string;
  submissionId: string;
  payload: RequestSubmissionRevisionInput;
  version: number;
};
export type ReviewQueueQuery = z.input<typeof reviewQueueQuerySchema>;
export type ReviewQueueList = Page<SubmissionDto>;
