// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
import { normalizeQuery } from "@/lib/query/normalize-query";
import * as contracts from "./submissions.contract";
export const submissionsKeys = {
  all: ["submissions"] as const,
  viewer: (viewerId: string) => ["submissions", viewerId] as const,
  listSubmissions: (
    viewerId: string,
    params: Record<string, string> = {},
    query: Record<string, unknown> = {},
  ) =>
    [
      "submissions",
      viewerId,
      "listSubmissions",
      params,
      normalizeQuery(contracts.listSubmissionsContract.query.parse(query)),
    ] as const,
  getSubmission: (
    viewerId: string,
    params: Record<string, string> = {},
    query: Record<string, unknown> = {},
  ) =>
    [
      "submissions",
      viewerId,
      "getSubmission",
      params,
      normalizeQuery(contracts.getSubmissionContract.query.parse(query)),
    ] as const,
  listReviewQueue: (
    viewerId: string,
    params: Record<string, string> = {},
    query: Record<string, unknown> = {},
  ) =>
    [
      "submissions",
      viewerId,
      "listReviewQueue",
      params,
      normalizeQuery(contracts.listReviewQueueContract.query.parse(query)),
    ] as const,
};
