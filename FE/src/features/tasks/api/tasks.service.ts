import type { TasksApi } from "@/features/tasks/api/tasks.contract";
import {
  taskRowSchema,
  taskSchema,
} from "@/features/tasks/schemas/task.schema";
import {
  type AssignTaskInput,
  type CancelTaskInput,
  type CreateTaskInput,
  type PauseTaskInput,
  type TaskHistoryQuery,
  type TaskQuery,
  type UpdateRemainingEstimateInput,
  type UpdateTaskInput,
} from "@/features/tasks/types/tasks.types";
import { auditSchema, page } from "@/lib/validation/common.schema";
import type {
  MutationOptions,
  RequestOptions,
  VersionOptions,
} from "@/services/api-client";
import { apiClient, parseResponse } from "@/services/api-client";
export const tasksService: TasksApi = {
  listTasks(query: TaskQuery = {}, options: RequestOptions = {}) {
    return apiClient
      .get<unknown>("/tasks", { ...options, params: query })
      .then(parseResponse(page(taskRowSchema)));
  },
  getTask(taskId: string, options: RequestOptions = {}) {
    return apiClient
      .get<unknown>(`/tasks/${encodeURIComponent(taskId)}`, options)
      .then(parseResponse(taskSchema));
  },
  createTask(
    projectId: string,
    payload: CreateTaskInput,
    options: MutationOptions,
  ) {
    return apiClient
      .post<unknown>(
        `/projects/${encodeURIComponent(projectId)}/tasks`,
        payload,
        options,
      )
      .then(parseResponse(taskSchema));
  },
  updateTask(
    taskId: string,
    payload: UpdateTaskInput,
    options: VersionOptions,
  ) {
    return apiClient
      .patch<unknown>(`/tasks/${encodeURIComponent(taskId)}`, payload, options)
      .then(parseResponse(taskSchema));
  },
  assignTask(
    taskId: string,
    payload: AssignTaskInput,
    options: VersionOptions,
  ) {
    return apiClient
      .post<unknown>(
        `/tasks/${encodeURIComponent(taskId)}/assignments`,
        payload,
        options,
      )
      .then(parseResponse(taskSchema));
  },
  startTask(taskId: string, options: VersionOptions) {
    return apiClient
      .post<unknown>(`/tasks/${encodeURIComponent(taskId)}/start`, {}, options)
      .then(parseResponse(taskSchema));
  },
  pauseTask(taskId: string, payload: PauseTaskInput, options: VersionOptions) {
    return apiClient
      .post<unknown>(
        `/tasks/${encodeURIComponent(taskId)}/pause`,
        payload,
        options,
      )
      .then(parseResponse(taskSchema));
  },
  cancelTask(
    taskId: string,
    payload: CancelTaskInput,
    options: VersionOptions,
  ) {
    return apiClient
      .post<unknown>(
        `/tasks/${encodeURIComponent(taskId)}/cancel`,
        payload,
        options,
      )
      .then(parseResponse(taskSchema));
  },
  updateRemainingEstimate(
    taskId: string,
    payload: UpdateRemainingEstimateInput,
    options: VersionOptions,
  ) {
    return apiClient
      .patch<unknown>(
        `/tasks/${encodeURIComponent(taskId)}/remaining-estimate`,
        payload,
        options,
      )
      .then(parseResponse(taskSchema));
  },
  listTaskHistory(
    taskId: string,
    query: TaskHistoryQuery = {},
    options: RequestOptions = {},
  ) {
    return apiClient
      .get<unknown>(`/tasks/${encodeURIComponent(taskId)}/history`, {
        ...options,
        params: query,
      })
      .then(parseResponse(page(auditSchema)));
  },
};
