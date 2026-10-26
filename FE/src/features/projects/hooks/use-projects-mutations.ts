"use client";

import { analyticsKeys } from "@/features/analytics/api/analytics.keys";
import { authKeys } from "@/features/auth/api/auth.keys";
import { projectMembersKeys } from "@/features/project-members/api/project-members.keys";
import { reportsKeys } from "@/features/reports/api/reports.keys";
import { tasksKeys } from "@/features/tasks/api/tasks.keys";
import { useSession } from "@/lib/auth/session-context";
import { useIdempotentRequest } from "@/lib/query/use-idempotent-request";
import { useAccessErrorHandler } from "@/lib/query/use-query-access";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsKeys } from "../api/projects.keys";
import { projectsService } from "../api/projects.service";
import {
  type ActivateProjectArgs,
  type CancelProjectArgs,
  type CompleteProjectArgs,
  type CreateProjectInput,
  type UpdateProjectArgs,
} from "../types/projects.types";

export function useCreateProjectMutation() {
  const client = useQueryClient();
  const viewerId = useSession().session?.user.id;
  const handleError = useAccessErrorHandler();
  const run = useIdempotentRequest();
  return useMutation({
    mutationKey: [...projectsKeys.viewer(viewerId), "createProject"],
    mutationFn: (input: CreateProjectInput) =>
      run(input, (key) =>
        projectsService.createProject(input, {
          key,
        }),
      ),
    onError: handleError,
    onSuccess: async () => {
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
  const viewerId = useSession().session?.user.id;
  const handleError = useAccessErrorHandler();
  const run = useIdempotentRequest();
  return useMutation({
    mutationKey: [...projectsKeys.viewer(viewerId), "updateProject"],
    mutationFn: (input: UpdateProjectArgs) =>
      run(input, (key) =>
        projectsService.updateProject(input.projectId, input.payload, {
          version: input.version,
          key,
        }),
      ),
    onError: handleError,
    onSuccess: async () => {
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
  const viewerId = useSession().session?.user.id;
  const handleError = useAccessErrorHandler();
  const run = useIdempotentRequest();
  return useMutation({
    mutationKey: [...projectsKeys.viewer(viewerId), "activateProject"],
    mutationFn: (input: ActivateProjectArgs) =>
      run(input, (key) =>
        projectsService.activateProject(input.projectId, {
          version: input.version,
          key,
        }),
      ),
    onError: handleError,
    onSuccess: async () => {
      await client.invalidateQueries({
        queryKey: projectsKeys.viewer(viewerId),
      });
    },
  });
}

export function useCompleteProjectMutation() {
  const client = useQueryClient();
  const viewerId = useSession().session?.user.id;
  const handleError = useAccessErrorHandler();
  const run = useIdempotentRequest();
  return useMutation({
    mutationKey: [...projectsKeys.viewer(viewerId), "completeProject"],
    mutationFn: (input: CompleteProjectArgs) =>
      run(input, (key) =>
        projectsService.completeProject(input.projectId, {
          version: input.version,
          key,
        }),
      ),
    onError: handleError,
    onSuccess: async () => {
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
  const viewerId = useSession().session?.user.id;
  const handleError = useAccessErrorHandler();
  const run = useIdempotentRequest();
  return useMutation({
    mutationKey: [...projectsKeys.viewer(viewerId), "cancelProject"],
    mutationFn: (input: CancelProjectArgs) =>
      run(input, (key) =>
        projectsService.cancelProject(input.projectId, input.payload, {
          version: input.version,
          key,
        }),
      ),
    onError: handleError,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: projectsKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: tasksKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: reportsKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: analyticsKeys.viewer(viewerId) }),
      ]);
    },
  });
}
