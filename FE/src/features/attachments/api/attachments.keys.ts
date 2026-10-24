export const attachmentsKeys = {
  all: ["attachments"] as const,
  viewer: (viewerId: string) => ["attachments", viewerId] as const,
  getUploadPolicy: (viewerId: string) =>
    ["attachments", viewerId, "getUploadPolicy"] as const,
  getAttachment: (viewerId: string, attachmentId: string) =>
    ["attachments", viewerId, "getAttachment", attachmentId] as const,
};
