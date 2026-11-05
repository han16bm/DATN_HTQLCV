import type { ViewerId } from "@/types/common";
import type { IpAccessLogQuery } from "../types/ip-whitelist.types";
export const ipWhitelistKeys = {
  viewer: (viewerId: ViewerId) =>
    ["ip-whitelist", viewerId ?? "anonymous"] as const,
  getIpWhitelist: (viewerId: ViewerId) =>
    [...ipWhitelistKeys.viewer(viewerId), "getIpWhitelist"] as const,
  listIpAccessLogs: (viewerId: ViewerId, query: IpAccessLogQuery) =>
    [...ipWhitelistKeys.viewer(viewerId), "listIpAccessLogs", query] as const,
};
