import { type z } from "zod";
import type { Page } from "@/types/common";
import type {
  allowIpAccessLogSchema,
  dismissIpAccessLogSchema,
  ipAccessLogQuerySchema,
  ipAccessLogSchema,
  createIpWhitelistEntrySchema,
  ipWhitelistEntrySchema,
  ipWhitelistSchema,
  updateIpWhitelistEntrySchema,
} from "../schemas/ip-whitelist.schema";
export type IpWhitelistDto = z.output<typeof ipWhitelistSchema>;
export type IpWhitelistEntryDto = z.output<typeof ipWhitelistEntrySchema>;
export type CreateIpWhitelistEntryInput = z.input<
  typeof createIpWhitelistEntrySchema
>;
export type UpdateIpWhitelistEntryInput = z.input<
  typeof updateIpWhitelistEntrySchema
>;
export type UpdateIpWhitelistEntryArgs = {
  entryId: string;
  payload: UpdateIpWhitelistEntryInput;
  version: number;
};
export type DeleteIpWhitelistEntryArgs = { entryId: string; version: number };
export type IpAccessLogDto = z.output<typeof ipAccessLogSchema>;
export type IpAccessLogList = Page<IpAccessLogDto>;
export type IpAccessLogQuery = z.input<typeof ipAccessLogQuerySchema>;
export type AllowIpAccessLogInput = z.input<typeof allowIpAccessLogSchema>;
export type DismissIpAccessLogInput = z.input<typeof dismissIpAccessLogSchema>;
export type ResolveIpAccessLogArgs<T> = {
  logId: string;
  payload: T;
  version: number;
};
