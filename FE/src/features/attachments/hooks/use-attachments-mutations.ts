// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
"use client";
import { useFeatureMutation } from "@/lib/query/use-feature-mutation";
import * as contracts from "../api/attachments.contract";
import { attachmentsService } from "../api/attachments.service";
export function useUploadAttachmentMutation() {
  return useFeatureMutation(
    contracts.uploadAttachmentContract,
    attachmentsService.uploadAttachment,
  );
}
export function useDownloadAttachmentMutation() {
  return useFeatureMutation(
    contracts.downloadAttachmentContract,
    attachmentsService.downloadAttachment,
  );
}
