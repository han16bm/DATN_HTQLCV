import type { TimeLogsApi } from "@/features/time-logs/api/time-logs.contract";
import {
  timeLogChangeResultSchema,
  timeLogSchema,
} from "@/features/time-logs/schemas/time-logs.schema";
import {
  type CreateTimeLogInput,
  type TimeLogQuery,
  type UpdateTimeLogInput,
  type VoidTimeLogInput,
} from "@/features/time-logs/types/time-logs.types";
import { page } from "@/lib/validation/common.schema";
import { apiClient } from "@/services/api-client";
import type { RequestOptions, VersionOptions } from "@/services/api.types";
export const timeLogsService: TimeLogsApi = {
  listTimeLogs(
    taskId: string,
    query: TimeLogQuery = {},
    options: RequestOptions = {},
  ) {
    return apiClient.get(
      `/tasks/${encodeURIComponent(taskId)}/time-logs`,
      page(timeLogSchema),
      { ...options, query },
    );
  },
  createTimeLog(
    taskId: string,
    payload: CreateTimeLogInput,
    options: VersionOptions,
  ) {
    return apiClient.post(
      `/tasks/${encodeURIComponent(taskId)}/time-logs`,
      payload,
      timeLogChangeResultSchema,
      options,
    );
  },
  updateTimeLog(
    timeLogId: string,
    payload: UpdateTimeLogInput,
    options: VersionOptions,
  ) {
    return apiClient.patch(
      `/time-logs/${encodeURIComponent(timeLogId)}`,
      payload,
      timeLogChangeResultSchema,
      options,
    );
  },
  voidTimeLog(
    timeLogId: string,
    payload: VoidTimeLogInput,
    options: VersionOptions,
  ) {
    return apiClient.post(
      `/time-logs/${encodeURIComponent(timeLogId)}/void`,
      payload,
      timeLogChangeResultSchema,
      options,
    );
  },
};
