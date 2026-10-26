import { auditSchema, page } from "@/lib/validation/common.schema";
import {
  type MutationOptions,
  type RequestOptions,
  type VersionOptions,
  apiClient,
} from "@/services/api-client";
import { taskRowSchema, taskSchema } from "../schemas/task.schema";
import type {
  AssignTaskInput,
  CancelTaskInput,
  CreateTaskInput,
  PauseTaskInput,
  TaskDto,
  TaskHistoryList,
  TaskHistoryQuery,
  TaskList,
  TaskQuery,
  UpdateRemainingEstimateInput,
  UpdateTaskInput,
} from "../types/tasks.types";

export const tasksService = {
  async listTasks(query: TaskQuery = {}, options: RequestOptions = {}) {
    const response = await apiClient.get<TaskList>("/tasks", {
      ...options,
      params: query,
      schema: page(taskRowSchema),
    });
    return response.data;
  },

  async getTask(taskId: string, options: RequestOptions = {}) {
    const response = await apiClient.get<TaskDto>(
      `/tasks/${encodeURIComponent(taskId)}`,
      { ...options, schema: taskSchema },
    );
    return response.data;
  },

  async createTask(
    projectId: string,
    payload: CreateTaskInput,
    options: MutationOptions,
  ) {
    const response = await apiClient.post<TaskDto>(
      `/projects/${encodeURIComponent(projectId)}/tasks`,
      payload,
      { ...options, schema: taskSchema },
    );
    return response.data;
  },

  async updateTask(
    taskId: string,
    payload: UpdateTaskInput,
    options: VersionOptions,
  ) {
    const response = await apiClient.patch<TaskDto>(
      `/tasks/${encodeURIComponent(taskId)}`,
      payload,
      { ...options, schema: taskSchema },
    );
    return response.data;
  },

  async assignTask(
    taskId: string,
    payload: AssignTaskInput,
    options: VersionOptions,
  ) {
    const response = await apiClient.post<TaskDto>(
      `/tasks/${encodeURIComponent(taskId)}/assignments`,
      payload,
      { ...options, schema: taskSchema },
    );
    return response.data;
  },

  async startTask(taskId: string, options: VersionOptions) {
    const response = await apiClient.post<TaskDto>(
      `/tasks/${encodeURIComponent(taskId)}/start`,
      {},
      { ...options, schema: taskSchema },
    );
    return response.data;
  },

  async pauseTask(
    taskId: string,
    payload: PauseTaskInput,
    options: VersionOptions,
  ) {
    const response = await apiClient.post<TaskDto>(
      `/tasks/${encodeURIComponent(taskId)}/pause`,
      payload,
      { ...options, schema: taskSchema },
    );
    return response.data;
  },

  async cancelTask(
    taskId: string,
    payload: CancelTaskInput,
    options: VersionOptions,
  ) {
    const response = await apiClient.post<TaskDto>(
      `/tasks/${encodeURIComponent(taskId)}/cancel`,
      payload,
      { ...options, schema: taskSchema },
    );
    return response.data;
  },

  async updateRemainingEstimate(
    taskId: string,
    payload: UpdateRemainingEstimateInput,
    options: VersionOptions,
  ) {
    const response = await apiClient.patch<TaskDto>(
      `/tasks/${encodeURIComponent(taskId)}/remaining-estimate`,
      payload,
      { ...options, schema: taskSchema },
    );
    return response.data;
  },

  async listTaskHistory(
    taskId: string,
    query: TaskHistoryQuery = {},
    options: RequestOptions = {},
  ) {
    const response = await apiClient.get<TaskHistoryList>(
      `/tasks/${encodeURIComponent(taskId)}/history`,
      { ...options, params: query, schema: page(auditSchema) },
    );
    return response.data;
  },
};
