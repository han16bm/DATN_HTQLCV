import { type Page } from "@/types/common";
import { type z } from "zod";
import type {
  backgroundJobSchema,
  jobRunQuerySchema,
  jobRunSchema,
  updateJobSchema,
} from "../schemas/job.schema";
export type BackgroundJobDto = z.output<typeof backgroundJobSchema>;
export type UpdateJobInput = z.input<typeof updateJobSchema>;
export type UpdateJobArgs = {
  code: string;
  payload: UpdateJobInput;
  version: number;
};
export type JobRunQuery = z.input<typeof jobRunQuerySchema>;
export type JobRunDto = z.output<typeof jobRunSchema>;
export type JobRunList = Page<JobRunDto>;
