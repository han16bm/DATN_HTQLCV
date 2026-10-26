import { page } from "@/lib/validation/common.schema";
import {
  type RequestOptions,
  type VersionOptions,
  apiClient,
} from "@/services/api-client";
import {
  timeLogChangeResultSchema,
  timeLogSchema,
} from "../schemas/time-logs.schema";
import type {
  CreateTimeLogInput,
  TimeLogChangeResult,
  TimeLogList,
  TimeLogQuery,
  UpdateTimeLogInput,
  VoidTimeLogInput,
} from "../types/time-logs.types";

export const timeLogsService = {
  async listTimeLogs(
    taskId: string,
    query: TimeLogQuery = {},
    options: RequestOptions = {},
  ) {
    const response = await apiClient.get<TimeLogList>(
      `/tasks/${encodeURIComponent(taskId)}/time-logs`,
      { ...options, params: query, schema: page(timeLogSchema) },
    );
    return response.data;
  },

  async createTimeLog(
    taskId: string,
    payload: CreateTimeLogInput,
    options: VersionOptions,
  ) {
    const response = await apiClient.post<TimeLogChangeResult>(
      `/tasks/${encodeURIComponent(taskId)}/time-logs`,
      payload,
      { ...options, schema: timeLogChangeResultSchema },
    );
    return response.data;
  },

  async updateTimeLog(
    timeLogId: string,
    payload: UpdateTimeLogInput,
    options: VersionOptions,
  ) {
    const response = await apiClient.patch<TimeLogChangeResult>(
      `/time-logs/${encodeURIComponent(timeLogId)}`,
      payload,
      { ...options, schema: timeLogChangeResultSchema },
    );
    return response.data;
  },

  async voidTimeLog(
    timeLogId: string,
    payload: VoidTimeLogInput,
    options: VersionOptions,
  ) {
    const response = await apiClient.post<TimeLogChangeResult>(
      `/time-logs/${encodeURIComponent(timeLogId)}/void`,
      payload,
      { ...options, schema: timeLogChangeResultSchema },
    );
    return response.data;
  },
};
