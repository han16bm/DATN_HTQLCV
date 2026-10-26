"use client";

import { alertsKeys } from "@/features/alerts/api/alerts.keys";
import { analyticsKeys } from "@/features/analytics/api/analytics.keys";
import { projectsKeys } from "@/features/projects/api/projects.keys";
import { tasksKeys } from "@/features/tasks/api/tasks.keys";
import { useSession } from "@/lib/auth/session-context";
import { useIdempotentRequest } from "@/lib/query/use-idempotent-request";
import { useAccessErrorHandler } from "@/lib/query/use-query-access";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submissionsKeys } from "../api/submissions.keys";
import { submissionsService } from "../api/submissions.service";
import {
  type ApproveSubmissionArgs,
  type CreateSubmissionArgs,
  type RequestSubmissionRevisionArgs,
} from "../types/submissions.types";

export function useCreateSubmissionMutation() {
  const client = useQueryClient();
  const viewerId = useSession().session?.user.id;
  const handleError = useAccessErrorHandler();
  const run = useIdempotentRequest();
  return useMutation({
    mutationKey: [...submissionsKeys.viewer(viewerId), "createSubmission"],
    mutationFn: (input: CreateSubmissionArgs) =>
      run(input, (key) =>
        submissionsService.createSubmission(input.taskId, input.payload, {
          version: input.version,
          key,
        }),
      ),
    onError: handleError,
    onSuccess: async () => {
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
  const viewerId = useSession().session?.user.id;
  const handleError = useAccessErrorHandler();
  const run = useIdempotentRequest();
  return useMutation({
    mutationKey: [...submissionsKeys.viewer(viewerId), "approveSubmission"],
    mutationFn: (input: ApproveSubmissionArgs) =>
      run(input, (key) =>
        submissionsService.approveSubmission(
          input.taskId,
          input.submissionId,
          input.payload,
          { version: input.version, key },
        ),
      ),
    onError: handleError,
    onSuccess: async () => {
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
  const viewerId = useSession().session?.user.id;
  const handleError = useAccessErrorHandler();
  const run = useIdempotentRequest();
  return useMutation({
    mutationKey: [
      ...submissionsKeys.viewer(viewerId),
      "requestSubmissionRevision",
    ],
    mutationFn: (input: RequestSubmissionRevisionArgs) =>
      run(input, (key) =>
        submissionsService.requestSubmissionRevision(
          input.taskId,
          input.submissionId,
          input.payload,
          { version: input.version, key },
        ),
      ),
    onError: handleError,
    onSuccess: async () => {
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
