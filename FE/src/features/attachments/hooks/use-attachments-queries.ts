// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
"use client";
import {
  useFeatureQuery,
  type FeatureQueryOptions,
} from "@/lib/query/use-feature-query";
import type { ContractRequest } from "@/services/api-contract";
import * as contracts from "../api/attachments.contract";
import { attachmentsService } from "../api/attachments.service";
import { attachmentsKeys } from "../api/attachments.keys";
export function useGetUploadPolicyQuery(
  request: ContractRequest<typeof contracts.getUploadPolicyContract>,
  options: FeatureQueryOptions = {},
) {
  return useFeatureQuery(
    contracts.getUploadPolicyContract,
    request,
    attachmentsService.getUploadPolicy,
    attachmentsKeys.getUploadPolicy,
    options,
  );
}
export function useGetAttachmentQuery(
  request: ContractRequest<typeof contracts.getAttachmentContract>,
  options: FeatureQueryOptions = {},
) {
  return useFeatureQuery(
    contracts.getAttachmentContract,
    request,
    attachmentsService.getAttachment,
    attachmentsKeys.getAttachment,
    options,
  );
}
