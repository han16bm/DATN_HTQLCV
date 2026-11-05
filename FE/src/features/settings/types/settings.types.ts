import { type z } from "zod";
import type {
  createSettingSchema,
  settingQuerySchema,
  settingSchema,
  updateSettingSchema,
} from "../schemas/setting.schema";
export type SettingDto = z.output<typeof settingSchema>;
export type SettingQuery = z.input<typeof settingQuerySchema>;
export type CreateSettingInput = z.input<typeof createSettingSchema>;
export type UpdateSettingInput = z.input<typeof updateSettingSchema>;
export type UpdateSettingArgs = {
  settingId: string;
  payload: UpdateSettingInput;
  version: number;
};
