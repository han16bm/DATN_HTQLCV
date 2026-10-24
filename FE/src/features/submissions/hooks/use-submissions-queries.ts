// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
"use client";
import {
  useFeatureQuery,
  type FeatureQueryOptions,
} from "@/lib/query/use-feature-query";
import type { ContractRequest } from "@/services/api-contract";
import * as contracts from "../api/submissions.contract";
import { submissionsService } from "../api/submissions.service";
import { submissionsKeys } from "../api/submissions.keys";
export function useListSubmissionsQuery(
  request: ContractRequest<typeof contracts.listSubmissionsContract>,
  options: FeatureQueryOptions = {},
) {
  return useFeatureQuery(
    contracts.listSubmissionsContract,
    request,
    submissionsService.listSubmissions,
    submissionsKeys.listSubmissions,
    options,
  );
}
export function useGetSubmissionQuery(
  request: ContractRequest<typeof contracts.getSubmissionContract>,
  options: FeatureQueryOptions = {},
) {
  return useFeatureQuery(
    contracts.getSubmissionContract,
    request,
    submissionsService.getSubmission,
    submissionsKeys.getSubmission,
    options,
  );
}
export function useListReviewQueueQuery(
  request: ContractRequest<typeof contracts.listReviewQueueContract>,
  options: FeatureQueryOptions = {},
) {
  return useFeatureQuery(
    contracts.listReviewQueueContract,
    request,
    submissionsService.listReviewQueue,
    submissionsKeys.listReviewQueue,
    options,
  );
}
