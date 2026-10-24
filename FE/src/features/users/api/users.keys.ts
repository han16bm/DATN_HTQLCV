// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
import { normalizeQuery } from "@/lib/query/normalize-query";
import * as contracts from "./users.contract";
export const usersKeys = {
  all: ["users"] as const,
  viewer: (viewerId: string) => ["users", viewerId] as const,
  listUsers: (
    viewerId: string,
    params: Record<string, string> = {},
    query: Record<string, unknown> = {},
  ) =>
    [
      "users",
      viewerId,
      "listUsers",
      params,
      normalizeQuery(contracts.listUsersContract.query.parse(query)),
    ] as const,
  getUser: (
    viewerId: string,
    params: Record<string, string> = {},
    query: Record<string, unknown> = {},
  ) =>
    [
      "users",
      viewerId,
      "getUser",
      params,
      normalizeQuery(contracts.getUserContract.query.parse(query)),
    ] as const,
};
