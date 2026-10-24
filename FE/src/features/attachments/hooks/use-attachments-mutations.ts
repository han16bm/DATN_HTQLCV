"use client";
import { attachmentsKeys } from "@/features/attachments/api/attachments.keys";
import { type UploadAttachmentInput } from "@/features/attachments/types/attachments.types";
import { useSession } from "@/lib/auth/session-context";
import { createRequestTickets } from "@/lib/query/mutation-requests";
import { useMutationAttempt } from "@/lib/query/use-mutation-attempt";
import { useAccessErrorHandler } from "@/lib/query/use-query-access";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { attachmentsService } from "../api/attachments.service";

export function useUploadAttachmentMutation() {
  const client = useQueryClient();
  const { session } = useSession();
  const viewerId = session?.user.id ?? "anonymous";
  const handleError = useAccessErrorHandler();
  const attempt = useMutationAttempt();
  const [requests] = useState(() =>
    createRequestTickets(async (input: UploadAttachmentInput) =>
      attachmentsService.uploadAttachment(input, {
        key: await attempt.keyFor(input),
      }),
    ),
  );
  const mutation = useMutation({
    mutationKey: ["attachments", viewerId, "uploadAttachment"],
    mutationFn: requests.execute,
    retry: false,
    onError: handleError,
    onSuccess: async () => {
      attempt.reset();
      await client.invalidateQueries({
        queryKey: attachmentsKeys.viewer(viewerId),
      });
    },
  });
  return {
    ...mutation,
    mutateAsync: (payload: UploadAttachmentInput) =>
      mutation.mutateAsync(requests.put(payload)),
    mutate: (payload: UploadAttachmentInput) => {
      void mutation.mutateAsync(requests.put(payload)).catch(() => {});
    },
  };
}
