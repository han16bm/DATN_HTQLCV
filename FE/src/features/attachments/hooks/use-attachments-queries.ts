"use client";
import { useSession } from "@/lib/auth/session-context";
import type { QueryOptions } from "@/lib/query/use-query-access";
import { useQueryAccess } from "@/lib/query/use-query-access";
import { queryIdSchema } from "@/lib/validation/request.schema";
import { useQuery } from "@tanstack/react-query";
import { attachmentsKeys } from "../api/attachments.keys";
import { attachmentsService } from "../api/attachments.service";

export function useGetUploadPolicyQuery(options: QueryOptions = {}) {
  const { session } = useSession();
  const result = useQuery({
    queryKey: attachmentsKeys.getUploadPolicy(session?.user.id ?? "anonymous"),
    queryFn: ({ signal }) => attachmentsService.getUploadPolicy({ signal }),
    enabled: options.enabled !== false && Boolean(session),
    staleTime: 10000,
  });
  return useQueryAccess(result, "attachments");
}
export function useGetAttachmentQuery(
  attachmentId: string,
  options: QueryOptions = {},
) {
  const id = queryIdSchema.parse(attachmentId);
  const { session } = useSession();
  const result = useQuery({
    queryKey: attachmentsKeys.getAttachment(
      session?.user.id ?? "anonymous",
      id,
    ),
    queryFn: ({ signal }) => attachmentsService.getAttachment(id, { signal }),
    enabled: options.enabled !== false && Boolean(session) && Boolean(id),
    staleTime: 10000,
  });
  return useQueryAccess(result, "attachments");
}
