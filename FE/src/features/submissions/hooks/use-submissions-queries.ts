"use client";

import { useSession } from "@/lib/auth/session-context";
import type { QueryOptions } from "@/lib/query/use-query-access";
import { useQueryAccess } from "@/lib/query/use-query-access";
import { useQuery } from "@tanstack/react-query";
import { submissionsKeys } from "../api/submissions.keys";
import { submissionsService } from "../api/submissions.service";
import {
  reviewQueueQuerySchema,
  submissionQuerySchema,
} from "../schemas/submissions.schema";
import {
  type ReviewQueueQuery,
  type SubmissionQuery,
} from "../types/submissions.types";

export function useListSubmissionsQuery(
  taskId: string,
  query: SubmissionQuery = {},
) {
  const viewerId = useSession().session?.user.id;

  const filters = submissionQuerySchema.safeParse(query).data ?? query;
  const result = useQuery({
    queryKey: submissionsKeys.listSubmissions(viewerId, taskId, filters),
    queryFn: ({ signal }) =>
      submissionsService.listSubmissions(taskId, filters, { signal }),
    enabled: Boolean(viewerId && taskId),
    staleTime: 30000,
  });
  return useQueryAccess(result, "submissions");
}

export function useGetSubmissionQuery(taskId: string, submissionId: string) {
  const viewerId = useSession().session?.user.id;
  const result = useQuery({
    queryKey: submissionsKeys.getSubmission(viewerId, taskId, submissionId),
    queryFn: ({ signal }) =>
      submissionsService.getSubmission(taskId, submissionId, { signal }),
    enabled: Boolean(viewerId && taskId && submissionId),
    staleTime: 10000,
  });
  return useQueryAccess(result, "submissions");
}

export function useListReviewQueueQuery(
  query: ReviewQueueQuery = {},
  options: QueryOptions = {},
) {
  const viewerId = useSession().session?.user.id;

  const filters = reviewQueueQuerySchema.safeParse(query).data ?? query;
  const result = useQuery({
    queryKey: submissionsKeys.listReviewQueue(viewerId, filters),
    queryFn: ({ signal }) =>
      submissionsService.listReviewQueue(filters, { signal }),
    enabled: options.enabled !== false && Boolean(viewerId),
    staleTime: 30000,
  });
  return useQueryAccess(result, "submissions");
}
