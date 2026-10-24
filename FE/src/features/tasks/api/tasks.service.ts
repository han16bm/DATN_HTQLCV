import type { TasksApi } from "@/features/tasks/api/tasks.contract";
import { taskSchema } from "@/features/tasks/schemas/task.schema";
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
import { apiClient } from "@/services/api-client";
import type {
  MutationOptions,
  RequestOptions,
  VersionOptions,
} from "@/services/api.types";
export const tasksService: TasksApi = {
  listTasks(query: TaskQuery = {}, options: RequestOptions = {}) {
    return apiClient.get(`/tasks`, page(taskSchema), {
      ...options,
      query,
    });
  },
  getTask(taskId: string, options: RequestOptions = {}) {
    return apiClient.get(
      `/tasks/${encodeURIComponent(taskId)}`,
      taskSchema,
      options,
    );
  },
  createTask(
    projectId: string,
    payload: CreateTaskInput,
    options: MutationOptions,
  ) {
    return apiClient.post(
      `/projects/${encodeURIComponent(projectId)}/tasks`,
      payload,
      taskSchema,
      options,
    );
  },
  updateTask(
    taskId: string,
    payload: UpdateTaskInput,
    options: VersionOptions,
  ) {
    return apiClient.patch(
      `/tasks/${encodeURIComponent(taskId)}`,
      payload,
      taskSchema,
      options,
    );
  },
  assignTask(
    taskId: string,
    payload: AssignTaskInput,
    options: VersionOptions,
  ) {
    return apiClient.post(
      `/tasks/${encodeURIComponent(taskId)}/assignments`,
      payload,
      taskSchema,
      options,
    );
  },
  startTask(taskId: string, options: VersionOptions) {
    return apiClient.post(
      `/tasks/${encodeURIComponent(taskId)}/start`,
      {},
      taskSchema,
      options,
    );
  },
  pauseTask(taskId: string, payload: PauseTaskInput, options: VersionOptions) {
    return apiClient.post(
      `/tasks/${encodeURIComponent(taskId)}/pause`,
      payload,
      taskSchema,
      options,
    );
  },
  cancelTask(
    taskId: string,
    payload: CancelTaskInput,
    options: VersionOptions,
  ) {
    return apiClient.post(
      `/tasks/${encodeURIComponent(taskId)}/cancel`,
      payload,
      taskSchema,
      options,
    );
  },
  updateRemainingEstimate(
    taskId: string,
    payload: UpdateRemainingEstimateInput,
    options: VersionOptions,
  ) {
    return apiClient.patch(
      `/tasks/${encodeURIComponent(taskId)}/remaining-estimate`,
      payload,
      taskSchema,
      options,
    );
  },
  listTaskHistory(
    taskId: string,
    query: TaskHistoryQuery = {},
    options: RequestOptions = {},
  ) {
    return apiClient.get(
      `/tasks/${encodeURIComponent(taskId)}/history`,
      page(auditSchema),
      { ...options, query },
    );
  },
};
