import type { ViewerId } from "@/types/common";
import type { UserQuery } from "../types/users.types";
export const usersKeys = {
  all: ["users"] as const,
  viewer: (viewerId: ViewerId) => ["users", viewerId ?? "anonymous"] as const,
  listUsers: (viewerId: ViewerId, query: UserQuery) =>
    [...usersKeys.viewer(viewerId), "listUsers", query] as const,
  getUser: (viewerId: ViewerId, userId: string) =>
    [...usersKeys.viewer(viewerId), "getUser", userId] as const,
  getProfile: (viewerId: ViewerId, userId: string) =>
    [...usersKeys.viewer(viewerId), "getProfile", userId] as const,
};
