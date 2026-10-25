import type { UserQuery } from "../types/users.types";
export const usersKeys = {
  all: ["users"] as const,
  viewer: (viewerId: string) => ["users", viewerId] as const,
  listUsers: (viewerId: string, query: UserQuery) =>
    ["users", viewerId, "listUsers", query] as const,
  getUser: (viewerId: string, userId: string) =>
    ["users", viewerId, "getUser", userId] as const,
  getProfile: (viewerId: string, userId: string) =>
    ["users", viewerId, "getProfile", userId] as const,
};
