"use client";
import { alertsKeys } from "@/features/alerts/api/alerts.keys";
import { analyticsKeys } from "@/features/analytics/api/analytics.keys";
import { projectsKeys } from "@/features/projects/api/projects.keys";
import { submissionsKeys } from "@/features/submissions/api/submissions.keys";
import {
  type ApproveSubmissionArgs,
  type CreateSubmissionArgs,
  type RequestSubmissionRevisionArgs,
} from "@/features/submissions/types/submissions.types";
import { tasksKeys } from "@/features/tasks/api/tasks.keys";
import { useSession } from "@/lib/auth/session-context";
import { useMutationAttempt } from "@/lib/query/use-mutation-attempt";
import { useAccessErrorHandler } from "@/lib/query/use-query-access";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submissionsService } from "../api/submissions.service";

export function useCreateSubmissionMutation() {
  const client = useQueryClient();
  const { session } = useSession();
  const viewerId = session?.user.id ?? "anonymous";
  const handleError = useAccessErrorHandler();
  const attempt = useMutationAttempt();
  return useMutation({
    mutationKey: ["submissions", viewerId, "createSubmission"],
    mutationFn: async (input: CreateSubmissionArgs) =>
      submissionsService.createSubmission(input.taskId, input.payload, {
        version: input.version,
        key: await attempt.keyFor(input),
      }),
    retry: false,
    onError: handleError,
    onSuccess: async () => {
      attempt.reset();
      await Promise.all([
        client.invalidateQueries({
          queryKey: submissionsKeys.viewer(viewerId),
        }),
        client.invalidateQueries({ queryKey: tasksKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: analyticsKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: alertsKeys.viewer(viewerId) }),
      ]);
    },
  });
}
export function useApproveSubmissionMutation() {
  const client = useQueryClient();
  const { session } = useSession();
  const viewerId = session?.user.id ?? "anonymous";
  const handleError = useAccessErrorHandler();
  const attempt = useMutationAttempt();
  return useMutation({
    mutationKey: ["submissions", viewerId, "approveSubmission"],
    mutationFn: async (input: ApproveSubmissionArgs) =>
      submissionsService.approveSubmission(
        input.taskId,
        input.submissionId,
        input.payload,
        { version: input.version, key: await attempt.keyFor(input) },
      ),
    retry: false,
    onError: handleError,
    onSuccess: async () => {
      attempt.reset();
      await Promise.all([
        client.invalidateQueries({
          queryKey: submissionsKeys.viewer(viewerId),
        }),
        client.invalidateQueries({ queryKey: tasksKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: projectsKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: analyticsKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: alertsKeys.viewer(viewerId) }),
      ]);
    },
  });
}
export function useRequestSubmissionRevisionMutation() {
  const client = useQueryClient();
  const { session } = useSession();
  const viewerId = session?.user.id ?? "anonymous";
  const handleError = useAccessErrorHandler();
  const attempt = useMutationAttempt();
  return useMutation({
    mutationKey: ["submissions", viewerId, "requestSubmissionRevision"],
    mutationFn: async (input: RequestSubmissionRevisionArgs) =>
      submissionsService.requestSubmissionRevision(
        input.taskId,
        input.submissionId,
        input.payload,
        { version: input.version, key: await attempt.keyFor(input) },
      ),
    retry: false,
    onError: handleError,
    onSuccess: async () => {
      attempt.reset();
      await Promise.all([
        client.invalidateQueries({
          queryKey: submissionsKeys.viewer(viewerId),
        }),
        client.invalidateQueries({ queryKey: tasksKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: analyticsKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: alertsKeys.viewer(viewerId) }),
      ]);
    },
  });
}
