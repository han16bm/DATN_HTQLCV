import { page } from "@/lib/validation/common.schema";
import {
  type MutationOptions,
  type RequestOptions,
  type VersionOptions,
  apiClient,
} from "@/services/api-client";
import { z } from "zod";
import { backgroundJobSchema, jobRunSchema } from "../schemas/job.schema";
import type {
  BackgroundJobDto,
  JobRunDto,
  JobRunList,
  JobRunQuery,
  UpdateJobInput,
} from "../types/jobs.types";

export const jobsService = {
  async listJobs(options: RequestOptions = {}) {
    const response = await apiClient.get<BackgroundJobDto[]>("/jobs", {
      ...options,
      schema: z.array(backgroundJobSchema),
    });
    return response.data;
  },

  async updateJob(
    code: string,
    payload: UpdateJobInput,
    options: VersionOptions,
  ) {
    const response = await apiClient.patch<BackgroundJobDto>(
      `/jobs/${encodeURIComponent(code)}`,
      payload,
      { ...options, schema: backgroundJobSchema },
    );
    return response.data;
  },

  async runJob(code: string, options: MutationOptions) {
    const response = await apiClient.post<JobRunDto>(
      `/jobs/${encodeURIComponent(code)}/run`,
      {},
      { ...options, schema: jobRunSchema },
    );
    return response.data;
  },

  async listJobRuns(
    code: string,
    query: JobRunQuery = {},
    options: RequestOptions = {},
  ) {
    const response = await apiClient.get<JobRunList>(
      `/jobs/${encodeURIComponent(code)}/runs`,
      { ...options, params: query, schema: page(jobRunSchema) },
    );
    return response.data;
  },
};
