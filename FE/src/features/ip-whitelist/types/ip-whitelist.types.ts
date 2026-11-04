import { type z } from "zod";
import type {
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
