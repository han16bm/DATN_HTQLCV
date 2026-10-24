import {
  type AssignTaskInput,
  type CancelTaskInput,
  type CreateTaskInput,
  type PauseTaskInput,
  type TaskDto,
  type TaskHistoryList,
  type TaskHistoryQuery,
  type TaskList,
  type TaskQuery,
  type UpdateRemainingEstimateInput,
  type UpdateTaskInput,
} from "@/features/tasks/types/tasks.types";
import type {
  MutationOptions,
  RequestOptions,
  VersionOptions,
} from "@/services/api-client";
export interface TasksApi {
  listTasks(query?: TaskQuery, options?: RequestOptions): Promise<TaskList>;
  getTask(taskId: string, options?: RequestOptions): Promise<TaskDto>;
  createTask(
    projectId: string,
    payload: CreateTaskInput,
    options: MutationOptions,
  ): Promise<TaskDto>;
  updateTask(
    taskId: string,
    payload: UpdateTaskInput,
    options: VersionOptions,
  ): Promise<TaskDto>;
  assignTask(
    taskId: string,
    payload: AssignTaskInput,
    options: VersionOptions,
  ): Promise<TaskDto>;
  startTask(taskId: string, options: VersionOptions): Promise<TaskDto>;
  pauseTask(
    taskId: string,
    payload: PauseTaskInput,
    options: VersionOptions,
  ): Promise<TaskDto>;
  cancelTask(
    taskId: string,
    payload: CancelTaskInput,
    options: VersionOptions,
  ): Promise<TaskDto>;
  updateRemainingEstimate(
    taskId: string,
    payload: UpdateRemainingEstimateInput,
    options: VersionOptions,
  ): Promise<TaskDto>;
  listTaskHistory(
    taskId: string,
    query?: TaskHistoryQuery,
    options?: RequestOptions,
  ): Promise<TaskHistoryList>;
}
