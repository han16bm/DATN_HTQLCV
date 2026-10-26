"use client";

import { useSession } from "@/lib/auth/session-context";
import { createRequestTickets } from "@/lib/query/mutation-requests";
import { useIdempotentRequest } from "@/lib/query/use-idempotent-request";
import { useAccessErrorHandler } from "@/lib/query/use-query-access";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { attachmentsKeys } from "../api/attachments.keys";
import { attachmentsService } from "../api/attachments.service";
import { type UploadAttachmentInput } from "../types/attachments.types";

export function useUploadAttachmentMutation() {
  const client = useQueryClient();
  const viewerId = useSession().session?.user.id;
  const handleError = useAccessErrorHandler();
  const run = useIdempotentRequest();
  const [requests] = useState(() =>
    createRequestTickets((input: UploadAttachmentInput) =>
      run(input, (key) =>
        attachmentsService.uploadAttachment(input, {
          key,
        }),
      ),
    ),
  );
  const mutation = useMutation({
    mutationKey: [...attachmentsKeys.viewer(viewerId), "uploadAttachment"],
    mutationFn: requests.execute,
    onError: handleError,
    onSuccess: async () => {
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
