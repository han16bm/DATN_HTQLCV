import type { reasonSchema } from "@/lib/validation/common.schema";
import { type AuditDto, type Page } from "@/types/common";
import { type z } from "zod";
import type {
  assignTaskSchema,
  createTaskSchema,
  remainingSchema,
  updateTaskSchema,
} from "../schemas/task-form.schema";
import type {
  taskHistoryQuerySchema,
  taskQuerySchema,
  taskRowSchema,
  taskSchema,
} from "../schemas/task.schema";
export type TaskDto = z.output<typeof taskSchema>;
export type TaskQuery = z.input<typeof taskQuerySchema>;
export type TaskRow = z.output<typeof taskRowSchema>;
export type TaskList = Page<TaskRow>;
export type CreateTaskInput = z.input<typeof createTaskSchema>;
export type CreateTaskArgs = {
  projectId: string;
  payload: CreateTaskInput;
};
export type UpdateTaskInput = z.input<typeof updateTaskSchema>;
export type UpdateTaskArgs = {
  taskId: string;
  payload: UpdateTaskInput;
  version: number;
};
export type AssignTaskInput = z.input<typeof assignTaskSchema>;
export type AssignTaskArgs = {
  taskId: string;
  payload: AssignTaskInput;
  version: number;
};
export type StartTaskArgs = { taskId: string; version: number };
export type PauseTaskInput = z.input<typeof reasonSchema>;
export type PauseTaskArgs = {
  taskId: string;
  payload: PauseTaskInput;
  version: number;
};
export type CancelTaskInput = z.input<typeof reasonSchema>;
export type CancelTaskArgs = {
  taskId: string;
  payload: CancelTaskInput;
  version: number;
};
export type UpdateRemainingEstimateInput = z.input<typeof remainingSchema>;
export type UpdateRemainingEstimateArgs = {
  taskId: string;
  payload: UpdateRemainingEstimateInput;
  version: number;
};
export type TaskHistoryQuery = z.input<typeof taskHistoryQuerySchema>;
export type TaskHistoryList = Page<AuditDto>;
