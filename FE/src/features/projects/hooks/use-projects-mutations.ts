"use client";
import { analyticsKeys } from "@/features/analytics/api/analytics.keys";
import { authKeys } from "@/features/auth/api/auth.keys";
import { projectMembersKeys } from "@/features/project-members/api/project-members.keys";
import { projectsKeys } from "@/features/projects/api/projects.keys";
import {
  type ActivateProjectArgs,
  type CancelProjectArgs,
  type CompleteProjectArgs,
  type CreateProjectInput,
  type UpdateProjectArgs,
} from "@/features/projects/types/projects.types";
import { reportsKeys } from "@/features/reports/api/reports.keys";
import { tasksKeys } from "@/features/tasks/api/tasks.keys";
import { useSession } from "@/lib/auth/session-context";
import { useMutationAttempt } from "@/lib/query/use-mutation-attempt";
import { useAccessErrorHandler } from "@/lib/query/use-query-access";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsService } from "../api/projects.service";

export function useCreateProjectMutation() {
  const client = useQueryClient();
  const { session } = useSession();
  const viewerId = session?.user.id ?? "anonymous";
  const handleError = useAccessErrorHandler();
  const attempt = useMutationAttempt();
  return useMutation({
    mutationKey: ["projects", viewerId, "createProject"],
    mutationFn: async (input: CreateProjectInput) =>
      projectsService.createProject(input, {
        key: await attempt.keyFor(input),
      }),
    retry: false,
    onError: handleError,
    onSuccess: async () => {
      attempt.reset();
      await Promise.all([
        client.invalidateQueries({ queryKey: projectsKeys.viewer(viewerId) }),
        client.invalidateQueries({
          queryKey: projectMembersKeys.viewer(viewerId),
        }),
        client.invalidateQueries({ queryKey: authKeys.viewer(viewerId) }),
      ]);
    },
  });
}
export function useUpdateProjectMutation() {
  const client = useQueryClient();
  const { session } = useSession();
  const viewerId = session?.user.id ?? "anonymous";
  const handleError = useAccessErrorHandler();
  const attempt = useMutationAttempt();
  return useMutation({
    mutationKey: ["projects", viewerId, "updateProject"],
    mutationFn: async (input: UpdateProjectArgs) =>
      projectsService.updateProject(input.projectId, input.payload, {
        version: input.version,
        key: await attempt.keyFor(input),
      }),
    retry: false,
    onError: handleError,
    onSuccess: async () => {
      attempt.reset();
      await Promise.all([
        client.invalidateQueries({ queryKey: projectsKeys.viewer(viewerId) }),
        client.invalidateQueries({
          queryKey: projectMembersKeys.viewer(viewerId),
        }),
        client.invalidateQueries({ queryKey: authKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: analyticsKeys.viewer(viewerId) }),
      ]);
    },
  });
}
export function useActivateProjectMutation() {
  const client = useQueryClient();
  const { session } = useSession();
  const viewerId = session?.user.id ?? "anonymous";
  const handleError = useAccessErrorHandler();
  const attempt = useMutationAttempt();
  return useMutation({
    mutationKey: ["projects", viewerId, "activateProject"],
    mutationFn: async (input: ActivateProjectArgs) =>
      projectsService.activateProject(input.projectId, {
        version: input.version,
        key: await attempt.keyFor(input),
      }),
    retry: false,
    onError: handleError,
    onSuccess: async () => {
      attempt.reset();
      await client.invalidateQueries({
        queryKey: projectsKeys.viewer(viewerId),
      });
    },
  });
}
export function useCompleteProjectMutation() {
  const client = useQueryClient();
  const { session } = useSession();
  const viewerId = session?.user.id ?? "anonymous";
  const handleError = useAccessErrorHandler();
  const attempt = useMutationAttempt();
  return useMutation({
    mutationKey: ["projects", viewerId, "completeProject"],
    mutationFn: async (input: CompleteProjectArgs) =>
      projectsService.completeProject(input.projectId, {
        version: input.version,
        key: await attempt.keyFor(input),
      }),
    retry: false,
    onError: handleError,
    onSuccess: async () => {
      attempt.reset();
      await Promise.all([
        client.invalidateQueries({ queryKey: projectsKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: tasksKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: reportsKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: analyticsKeys.viewer(viewerId) }),
      ]);
    },
  });
}
export function useCancelProjectMutation() {
  const client = useQueryClient();
  const { session } = useSession();
  const viewerId = session?.user.id ?? "anonymous";
  const handleError = useAccessErrorHandler();
  const attempt = useMutationAttempt();
  return useMutation({
    mutationKey: ["projects", viewerId, "cancelProject"],
    mutationFn: async (input: CancelProjectArgs) =>
      projectsService.cancelProject(input.projectId, input.payload, {
        version: input.version,
        key: await attempt.keyFor(input),
      }),
    retry: false,
    onError: handleError,
    onSuccess: async () => {
      attempt.reset();
      await Promise.all([
        client.invalidateQueries({ queryKey: projectsKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: tasksKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: reportsKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: analyticsKeys.viewer(viewerId) }),
      ]);
    },
  });
}
