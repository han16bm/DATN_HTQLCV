import {
  type CreateTimeLogInput,
  type TimeLogChangeResult,
  type TimeLogList,
  type TimeLogQuery,
  type UpdateTimeLogInput,
  type VoidTimeLogInput,
} from "@/features/time-logs/types/time-logs.types";
import type { RequestOptions, VersionOptions } from "@/services/api-client";
export interface TimeLogsApi {
  listTimeLogs(
    taskId: string,
    query?: TimeLogQuery,
    options?: RequestOptions,
  ): Promise<TimeLogList>;
  createTimeLog(
    taskId: string,
    payload: CreateTimeLogInput,
    options: VersionOptions,
  ): Promise<TimeLogChangeResult>;
  updateTimeLog(
    timeLogId: string,
    payload: UpdateTimeLogInput,
    options: VersionOptions,
  ): Promise<TimeLogChangeResult>;
  voidTimeLog(
    timeLogId: string,
    payload: VoidTimeLogInput,
    options: VersionOptions,
  ): Promise<TimeLogChangeResult>;
}
