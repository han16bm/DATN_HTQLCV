import type { ViewerId } from "@/types/common";
export const ipWhitelistKeys = {
  viewer: (viewerId: ViewerId) =>
    ["ip-whitelist", viewerId ?? "anonymous"] as const,
  getIpWhitelist: (viewerId: ViewerId) =>
    [...ipWhitelistKeys.viewer(viewerId), "getIpWhitelist"] as const,
};
