import type { ViewerId } from "@/types/common";
export const authKeys = {
  all: ["auth"] as const,
  viewer: (viewerId: ViewerId) => ["auth", viewerId ?? "anonymous"] as const,
  getSession: (viewerId: ViewerId) =>
    [...authKeys.viewer(viewerId), "getSession"] as const,
};
