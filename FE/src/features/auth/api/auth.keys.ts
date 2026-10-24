// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
import { normalizeQuery } from "@/lib/query/normalize-query";
import * as contracts from "./auth.contract";
export const authKeys = {
  all: ["auth"] as const,
  viewer: (viewerId: string) => ["auth", viewerId] as const,
  getSession: (
    viewerId: string,
    params: Record<string, string> = {},
    query: Record<string, unknown> = {},
  ) =>
    [
      "auth",
      viewerId,
      "getSession",
      params,
      normalizeQuery(contracts.getSessionContract.query.parse(query)),
    ] as const,
};
