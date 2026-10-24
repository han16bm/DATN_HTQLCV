// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
"use client";
import { useFeatureMutation } from "@/lib/query/use-feature-mutation";
import * as contracts from "../api/submissions.contract";
import { submissionsService } from "../api/submissions.service";
export function useCreateSubmissionMutation() {
  return useFeatureMutation(
    contracts.createSubmissionContract,
    submissionsService.createSubmission,
  );
}
export function useApproveSubmissionMutation() {
  return useFeatureMutation(
    contracts.approveSubmissionContract,
    submissionsService.approveSubmission,
  );
}
export function useRequestSubmissionRevisionMutation() {
  return useFeatureMutation(
    contracts.requestSubmissionRevisionContract,
    submissionsService.requestSubmissionRevision,
  );
}
