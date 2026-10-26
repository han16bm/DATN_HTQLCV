import { type Page } from "@/types/common";
import { type z } from "zod";
import type {
  alertQuerySchema,
  alertRowSchema,
  alertSchema,
  updateAlertSchema,
} from "../schemas/alerts.schema";
export type AlertDto = z.output<typeof alertSchema>;
export type AlertQuery = z.input<typeof alertQuerySchema>;
export type AlertRow = z.output<typeof alertRowSchema>;
export type AlertList = Page<AlertRow>;
export type UpdateAlertInput = z.input<typeof updateAlertSchema>;
export type UpdateAlertArgs = {
  alertId: string;
  payload: UpdateAlertInput;
  version: number;
};
