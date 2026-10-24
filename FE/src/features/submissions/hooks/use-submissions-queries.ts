"use client";
import {
  reviewQueueQuerySchema,
  submissionQuerySchema,
} from "@/features/submissions/schemas/submissions.schema";
import {
  type ReviewQueueQuery,
  type SubmissionQuery,
} from "@/features/submissions/types/submissions.types";
import { hasPermission, useSession } from "@/lib/auth/session-context";
import type { QueryOptions } from "@/lib/query/use-query-access";
import { useQueryAccess } from "@/lib/query/use-query-access";
import { idSchema } from "@/lib/validation/request.schema";
import { useQuery } from "@tanstack/react-query";
import { submissionsKeys } from "../api/submissions.keys";
import { submissionsService } from "../api/submissions.service";

export function useListSubmissionsQuery(
  taskId: string,
  query: SubmissionQuery = {},
  options: QueryOptions = {},
) {
  const { session } = useSession();
  const parsed = submissionQuerySchema.safeParse(query);
  const filters = parsed.success ? parsed.data : query;
  const result = useQuery({
    queryKey: parsed.success
      ? submissionsKeys.listSubmissions(
          session?.user.id ?? "anonymous",
          taskId,
          filters,
        )
      : [
          "submissions",
          session?.user.id ?? "anonymous",
          "listSubmissions",
          "invalid-query",
        ],
    queryFn: ({ signal }) =>
      submissionsService.listSubmissions(taskId, filters, { signal }),
    enabled:
      options.enabled !== false &&
      Boolean(session) &&
      parsed.success &&
      idSchema.safeParse(taskId).success,
    staleTime: 30000,
  });
  return useQueryAccess(result, "submissions");
}
export function useGetSubmissionQuery(
  taskId: string,
  submissionId: string,
  options: QueryOptions = {},
) {
  const { session } = useSession();
  const result = useQuery({
    queryKey: submissionsKeys.getSubmission(
      session?.user.id ?? "anonymous",
      taskId,
      submissionId,
    ),
    queryFn: ({ signal }) =>
      submissionsService.getSubmission(taskId, submissionId, { signal }),
    enabled:
      options.enabled !== false &&
      Boolean(session) &&
      idSchema.safeParse(taskId).success &&
      idSchema.safeParse(submissionId).success,
    staleTime: 10000,
  });
  return useQueryAccess(result, "submissions");
}
export function useListReviewQueueQuery(
  query: ReviewQueueQuery = {},
  options: QueryOptions = {},
) {
  const { session } = useSession();
  const parsed = reviewQueueQuerySchema.safeParse(query);
  const filters = parsed.success ? parsed.data : query;
  const result = useQuery({
    queryKey: parsed.success
      ? submissionsKeys.listReviewQueue(
          session?.user.id ?? "anonymous",
          filters,
        )
      : [
          "submissions",
          session?.user.id ?? "anonymous",
          "listReviewQueue",
          "invalid-query",
        ],
    queryFn: ({ signal }) =>
      submissionsService.listReviewQueue(filters, { signal }),
    enabled:
      options.enabled !== false &&
      Boolean(session) &&
      parsed.success &&
      hasPermission(session, "TASKS_REVIEW", query.projectId),
    staleTime: 30000,
  });
  return useQueryAccess(result, "submissions");
}
