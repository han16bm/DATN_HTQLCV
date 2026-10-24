// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
import { normalizeQuery } from "@/lib/query/normalize-query";
import * as contracts from "./time-logs.contract";
export const timeLogsKeys = {
  all: ["time-logs"] as const,
  viewer: (viewerId: string) => ["time-logs", viewerId] as const,
  listTimeLogs: (
    viewerId: string,
    params: Record<string, string> = {},
    query: Record<string, unknown> = {},
  ) =>
    [
      "time-logs",
      viewerId,
      "listTimeLogs",
      params,
      normalizeQuery(contracts.listTimeLogsContract.query.parse(query)),
    ] as const,
};
