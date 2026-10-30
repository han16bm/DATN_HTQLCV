import type { ViewerId } from "@/types/common";
export const attachmentsKeys = {
  all: ["attachments"] as const,
  viewer: (viewerId: ViewerId) =>
    ["attachments", viewerId ?? "anonymous"] as const,
  getUploadPolicy: (viewerId: ViewerId) =>
    [...attachmentsKeys.viewer(viewerId), "getUploadPolicy"] as const,
  getContent: (viewerId: ViewerId, attachmentId: string) =>
    [...attachmentsKeys.viewer(viewerId), "getContent", attachmentId] as const,
  getAttachment: (viewerId: ViewerId, attachmentId: string) =>
    [
      ...attachmentsKeys.viewer(viewerId),
      "getAttachment",
      attachmentId,
    ] as const,
};
