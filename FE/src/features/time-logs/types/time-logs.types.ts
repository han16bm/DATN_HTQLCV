import type {
  createTimeLogSchema,
  timeLogChangeResultSchema,
  timeLogQuerySchema,
  timeLogSchema,
  updateTimeLogSchema,
} from "@/features/time-logs/schemas/time-logs.schema";
import type { reasonSchema } from "@/lib/validation/common.schema";
import { type Page } from "@/types/common";
import { type z } from "zod";
export type TimeLogDto = z.output<typeof timeLogSchema>;
export type TimeLogQuery = z.input<typeof timeLogQuerySchema>;
export type TimeLogList = Page<TimeLogDto>;
export type CreateTimeLogInput = z.input<typeof createTimeLogSchema>;
export type TimeLogChangeResult = z.output<typeof timeLogChangeResultSchema>;
export type CreateTimeLogArgs = {
  taskId: string;
  payload: CreateTimeLogInput;
  version: number;
};
export type UpdateTimeLogInput = z.input<typeof updateTimeLogSchema>;
export type UpdateTimeLogArgs = {
  timeLogId: string;
  payload: UpdateTimeLogInput;
  version: number;
};
export type VoidTimeLogInput = z.input<typeof reasonSchema>;
export type VoidTimeLogArgs = {
  timeLogId: string;
  payload: VoidTimeLogInput;
  version: number;
};
