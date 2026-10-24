"use client";
import { authKeys } from "@/features/auth/api/auth.keys";
import { projectMembersKeys } from "@/features/project-members/api/project-members.keys";
import {
  type AddProjectMemberArgs,
  type EndProjectMembershipArgs,
  type UpdateProjectMemberPermissionsArgs,
} from "@/features/project-members/types/project-members.types";
import { tasksKeys } from "@/features/tasks/api/tasks.keys";
import { useSession } from "@/lib/auth/session-context";
import { useMutationAttempt } from "@/lib/query/use-mutation-attempt";
import { useAccessErrorHandler } from "@/lib/query/use-query-access";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { projectMembersService } from "../api/project-members.service";

export function useAddProjectMemberMutation() {
  const client = useQueryClient();
  const { session } = useSession();
  const viewerId = session?.user.id ?? "anonymous";
  const handleError = useAccessErrorHandler();
  const attempt = useMutationAttempt();
  return useMutation({
    mutationKey: ["project-members", viewerId, "addProjectMember"],
    mutationFn: async (input: AddProjectMemberArgs) =>
      projectMembersService.addProjectMember(input.projectId, input.payload, {
        key: await attempt.keyFor(input),
      }),
    retry: false,
    onError: handleError,
    onSuccess: async () => {
      attempt.reset();
      await Promise.all([
        client.invalidateQueries({
          queryKey: projectMembersKeys.viewer(viewerId),
        }),
        client.invalidateQueries({ queryKey: authKeys.viewer(viewerId) }),
      ]);
    },
  });
}
export function useUpdateProjectMemberPermissionsMutation() {
  const client = useQueryClient();
  const { session } = useSession();
  const viewerId = session?.user.id ?? "anonymous";
  const handleError = useAccessErrorHandler();
  const attempt = useMutationAttempt();
  return useMutation({
    mutationKey: [
      "project-members",
      viewerId,
      "updateProjectMemberPermissions",
    ],
    mutationFn: async (input: UpdateProjectMemberPermissionsArgs) =>
      projectMembersService.updateProjectMemberPermissions(
        input.projectId,
        input.membershipId,
        input.payload,
        { version: input.version, key: await attempt.keyFor(input) },
      ),
    retry: false,
    onError: handleError,
    onSuccess: async () => {
      attempt.reset();
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
  const { session } = useSession();
  const viewerId = session?.user.id ?? "anonymous";
  const handleError = useAccessErrorHandler();
  const attempt = useMutationAttempt();
  return useMutation({
    mutationKey: ["project-members", viewerId, "endProjectMembership"],
    mutationFn: async (input: EndProjectMembershipArgs) =>
      projectMembersService.endProjectMembership(
        input.projectId,
        input.membershipId,
        input.payload,
        { version: input.version, key: await attempt.keyFor(input) },
      ),
    retry: false,
    onError: handleError,
    onSuccess: async () => {
      attempt.reset();
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
