"use client";

import { useSession } from "@/lib/auth/session-context";
import { useQueryAccess } from "@/lib/query/use-query-access";
import { useQuery } from "@tanstack/react-query";
import { jobsKeys } from "../api/jobs.keys";
import { jobsService } from "../api/jobs.service";
import { jobRunQuerySchema } from "../schemas/job.schema";
import type { JobRunQuery } from "../types/jobs.types";

export function useListJobsQuery() {
  const viewerId = useSession().session?.user.id;
  const result = useQuery({
    queryKey: jobsKeys.listJobs(viewerId),
    queryFn: ({ signal }) => jobsService.listJobs({ signal }),
    enabled: Boolean(viewerId),
    staleTime: 10000,
  });
  return useQueryAccess(result, "jobs");
}

export function useListJobRunsQuery(code: string, query: JobRunQuery = {}) {
  const viewerId = useSession().session?.user.id;
  const filters = jobRunQuerySchema.safeParse(query).data ?? query;
  const result = useQuery({
    queryKey: jobsKeys.listJobRuns(viewerId, code, filters),
    queryFn: ({ signal }) => jobsService.listJobRuns(code, filters, { signal }),
    enabled: Boolean(viewerId && code),
    staleTime: 10000,
  });
  return useQueryAccess(result, "jobs");
}
