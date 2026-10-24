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
import type { RequestOptions, VersionOptions } from "@/services/api-client";
import { apiClient, parseResponse } from "@/services/api-client";
export const timeLogsService: TimeLogsApi = {
  listTimeLogs(
    taskId: string,
    query: TimeLogQuery = {},
    options: RequestOptions = {},
  ) {
    return apiClient
      .get<unknown>(`/tasks/${encodeURIComponent(taskId)}/time-logs`, {
        ...options,
        params: query,
      })
      .then(parseResponse(page(timeLogSchema)));
  },
  createTimeLog(
    taskId: string,
    payload: CreateTimeLogInput,
    options: VersionOptions,
  ) {
    return apiClient
      .post<unknown>(
        `/tasks/${encodeURIComponent(taskId)}/time-logs`,
        payload,
        options,
      )
      .then(parseResponse(timeLogChangeResultSchema));
  },
  updateTimeLog(
    timeLogId: string,
    payload: UpdateTimeLogInput,
    options: VersionOptions,
  ) {
    return apiClient
      .patch<unknown>(
        `/time-logs/${encodeURIComponent(timeLogId)}`,
        payload,
        options,
      )
      .then(parseResponse(timeLogChangeResultSchema));
  },
  voidTimeLog(
    timeLogId: string,
    payload: VoidTimeLogInput,
    options: VersionOptions,
  ) {
    return apiClient
      .post<unknown>(
        `/time-logs/${encodeURIComponent(timeLogId)}/void`,
        payload,
        options,
      )
      .then(parseResponse(timeLogChangeResultSchema));
  },
};
