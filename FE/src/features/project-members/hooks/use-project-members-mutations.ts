"use client";

import { authKeys } from "@/features/auth/api/auth.keys";
import { tasksKeys } from "@/features/tasks/api/tasks.keys";
import { useSession } from "@/lib/auth/session-context";
import { useIdempotentRequest } from "@/lib/query/use-idempotent-request";
import { useAccessErrorHandler } from "@/lib/query/use-query-access";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { projectMembersKeys } from "../api/project-members.keys";
import { projectMembersService } from "../api/project-members.service";
import {
  type AddProjectMemberArgs,
  type EndProjectMembershipArgs,
  type UpdateProjectMemberRoleArgs,
} from "../types/project-members.types";

export function useAddProjectMemberMutation() {
  const client = useQueryClient();
  const viewerId = useSession().session?.user.id;
  const handleError = useAccessErrorHandler();
  const run = useIdempotentRequest();
  return useMutation({
    mutationKey: [...projectMembersKeys.viewer(viewerId), "addProjectMember"],
    mutationFn: (input: AddProjectMemberArgs) =>
      run(input, (key) =>
        projectMembersService.addProjectMember(input.projectId, input.payload, {
          key,
        }),
      ),
    onError: handleError,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({
          queryKey: projectMembersKeys.viewer(viewerId),
        }),
        client.invalidateQueries({ queryKey: authKeys.viewer(viewerId) }),
      ]);
    },
  });
}

export function useUpdateProjectMemberRoleMutation() {
  const client = useQueryClient();
  const viewerId = useSession().session?.user.id;
  const handleError = useAccessErrorHandler();
  const run = useIdempotentRequest();
  return useMutation({
    mutationKey: [
      ...projectMembersKeys.viewer(viewerId),
      "updateProjectMemberRole",
    ],
    mutationFn: (input: UpdateProjectMemberRoleArgs) =>
      run(input, (key) =>
        projectMembersService.updateProjectMemberRole(
          input.projectId,
          input.membershipId,
          input.payload,
          { version: input.version, key },
        ),
      ),
    onError: handleError,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({
          queryKey: projectMembersKeys.viewer(viewerId),
        }),
        client.invalidateQueries({ queryKey: authKeys.viewer(viewerId) }),
      ]);
    },
  });
}

export function useEndProjectMembershipMutation() {
  const client = useQueryClient();
  const viewerId = useSession().session?.user.id;
  const handleError = useAccessErrorHandler();
  const run = useIdempotentRequest();
  return useMutation({
    mutationKey: [
      ...projectMembersKeys.viewer(viewerId),
      "endProjectMembership",
    ],
    mutationFn: (input: EndProjectMembershipArgs) =>
      run(input, (key) =>
        projectMembersService.endProjectMembership(
          input.projectId,
          input.membershipId,
          input.payload,
          { version: input.version, key },
        ),
      ),
    onError: handleError,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({
          queryKey: projectMembersKeys.viewer(viewerId),
        }),
        client.invalidateQueries({ queryKey: authKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: tasksKeys.viewer(viewerId) }),
      ]);
    },
  });
}
