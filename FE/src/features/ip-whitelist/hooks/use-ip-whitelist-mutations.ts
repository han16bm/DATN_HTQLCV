"use client";

import { useSession } from "@/lib/auth/session-context";
import { useIdempotentRequest } from "@/lib/query/use-idempotent-request";
import { useAccessErrorHandler } from "@/lib/query/use-query-access";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ipWhitelistKeys } from "../api/ip-whitelist.keys";
import { ipWhitelistService } from "../api/ip-whitelist.service";
import type {
  CreateIpWhitelistEntryInput,
  DeleteIpWhitelistEntryArgs,
  UpdateIpWhitelistEntryArgs,
} from "../types/ip-whitelist.types";

function useInvalidateWhitelist() {
  const client = useQueryClient();
  const viewerId = useSession().session?.user.id;
  return () =>
    client.invalidateQueries({ queryKey: ipWhitelistKeys.viewer(viewerId) });
}

export function useCreateIpWhitelistEntryMutation() {
  const viewerId = useSession().session?.user.id;
  const handleError = useAccessErrorHandler();
  const run = useIdempotentRequest();
  const onSuccess = useInvalidateWhitelist();
  return useMutation({
    mutationKey: [...ipWhitelistKeys.viewer(viewerId), "createEntry"],
    mutationFn: (input: CreateIpWhitelistEntryInput) =>
      run(input, (key) =>
        ipWhitelistService.createIpWhitelistEntry(input, { key }),
      ),
    onError: handleError,
    onSuccess,
  });
}

export function useUpdateIpWhitelistEntryMutation() {
  const viewerId = useSession().session?.user.id;
  const handleError = useAccessErrorHandler();
  const run = useIdempotentRequest();
  const onSuccess = useInvalidateWhitelist();
  return useMutation({
    mutationKey: [...ipWhitelistKeys.viewer(viewerId), "updateEntry"],
    mutationFn: (input: UpdateIpWhitelistEntryArgs) =>
      run(input, (key) =>
        ipWhitelistService.updateIpWhitelistEntry(
          input.entryId,
          input.payload,
          { version: input.version, key },
        ),
      ),
    onError: handleError,
    onSuccess,
  });
}

export function useDeleteIpWhitelistEntryMutation() {
  const viewerId = useSession().session?.user.id;
  const handleError = useAccessErrorHandler();
  const run = useIdempotentRequest();
  const onSuccess = useInvalidateWhitelist();
  return useMutation({
    mutationKey: [...ipWhitelistKeys.viewer(viewerId), "deleteEntry"],
    mutationFn: (input: DeleteIpWhitelistEntryArgs) =>
      run(input, (key) =>
        ipWhitelistService.deleteIpWhitelistEntry(input.entryId, {
          version: input.version,
          key,
        }),
      ),
    onError: handleError,
    onSuccess,
  });
}
