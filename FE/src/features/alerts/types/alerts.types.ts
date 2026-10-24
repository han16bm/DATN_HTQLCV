import type {
  alertQuerySchema,
  alertSchema,
  updateAlertSchema,
} from "@/features/alerts/schemas/alerts.schema";
import { type Page } from "@/types/common";
import { type z } from "zod";
export type AlertDto = z.output<typeof alertSchema>;
export type AlertQuery = z.input<typeof alertQuerySchema>;
export type AlertList = Page<AlertDto>;
export type UpdateAlertInput = z.input<typeof updateAlertSchema>;
export type UpdateAlertArgs = {
  alertId: string;
  payload: UpdateAlertInput;
  version: number;
};
