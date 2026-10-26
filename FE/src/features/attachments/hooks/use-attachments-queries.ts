"use client";

import { useSession } from "@/lib/auth/session-context";
import { useQueryAccess } from "@/lib/query/use-query-access";
import { useQuery } from "@tanstack/react-query";
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
