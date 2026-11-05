"use client";

import { useSession } from "@/lib/auth/session-context";
import { useQueryAccess } from "@/lib/query/use-query-access";
import { useQueries, useQuery } from "@tanstack/react-query";
import { attachmentsKeys } from "../api/attachments.keys";
import { attachmentsService } from "../api/attachments.service";

export function useGetUploadPolicyQuery() {
  const viewerId = useSession().session?.user.id;
  const result = useQuery({
    queryKey: attachmentsKeys.getUploadPolicy(viewerId),
    queryFn: ({ signal }) => attachmentsService.getUploadPolicy({ signal }),
    enabled: Boolean(viewerId),
    staleTime: 10000,
  });
  return useQueryAccess(result, "attachments");
}

export function useGetAttachmentQuery(attachmentId: string) {
  const viewerId = useSession().session?.user.id;
  const result = useQuery({
    queryKey: attachmentsKeys.getAttachment(viewerId, attachmentId),
    queryFn: ({ signal }) =>
      attachmentsService.getAttachment(attachmentId, { signal }),
    enabled: Boolean(viewerId && attachmentId),
    staleTime: 10000,
  });
  return useQueryAccess(result, "attachments");
}

export function useGetAttachmentContentQuery(
  attachmentId: string,
  enabled: boolean,
) {
  const viewerId = useSession().session?.user.id;
  const result = useQuery({
    queryKey: attachmentsKeys.getContent(viewerId, attachmentId),
    queryFn: ({ signal }) =>
      attachmentsService.downloadAttachment(attachmentId, { signal }),
    enabled: enabled && Boolean(viewerId && attachmentId),
    staleTime: 60000,
    gcTime: 60000,
  });
  return useQueryAccess(result, "attachments");
}

export function useGetAttachmentsQuery(attachmentIds: string[]) {
  const viewerId = useSession().session?.user.id;
  return useQueries({
    queries: attachmentIds.map((attachmentId) => ({
      queryKey: attachmentsKeys.getAttachment(viewerId, attachmentId),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        attachmentsService.getAttachment(attachmentId, { signal }),
      enabled: Boolean(viewerId),
      staleTime: 10000,
    })),
  });
}
