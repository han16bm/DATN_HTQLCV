import type { ViewerId } from "@/types/common";
import type { JobRunQuery } from "../types/jobs.types";
export const jobsKeys = {
  viewer: (viewerId: ViewerId) => ["jobs", viewerId ?? "anonymous"] as const,
  listJobs: (viewerId: ViewerId) =>
    [...jobsKeys.viewer(viewerId), "listJobs"] as const,
  listJobRuns: (viewerId: ViewerId, code: string, query: JobRunQuery) =>
    [...jobsKeys.viewer(viewerId), "listJobRuns", code, query] as const,
};
