// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
import { normalizeQuery } from "@/lib/query/normalize-query";
import * as contracts from "./attachments.contract";
export const attachmentsKeys = {
  all: ["attachments"] as const,
  viewer: (viewerId: string) => ["attachments", viewerId] as const,
  getUploadPolicy: (
    viewerId: string,
    params: Record<string, string> = {},
    query: Record<string, unknown> = {},
  ) =>
    [
      "attachments",
      viewerId,
      "getUploadPolicy",
      params,
      normalizeQuery(contracts.getUploadPolicyContract.query.parse(query)),
    ] as const,
  getAttachment: (
    viewerId: string,
    params: Record<string, string> = {},
    query: Record<string, unknown> = {},
  ) =>
    [
      "attachments",
      viewerId,
      "getAttachment",
      params,
      normalizeQuery(contracts.getAttachmentContract.query.parse(query)),
    ] as const,
};
