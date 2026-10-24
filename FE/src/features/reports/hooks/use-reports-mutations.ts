// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
"use client";
import { useFeatureMutation } from "@/lib/query/use-feature-mutation";
import * as contracts from "../api/reports.contract";
import { reportsService } from "../api/reports.service";
export function useCreateReportDraftMutation() {
  return useFeatureMutation(
    contracts.createReportDraftContract,
    reportsService.createReportDraft,
  );
}
export function useUpdateReportDraftMutation() {
  return useFeatureMutation(
    contracts.updateReportDraftContract,
    reportsService.updateReportDraft,
  );
}
export function useRefreshReportDraftMutation() {
  return useFeatureMutation(
    contracts.refreshReportDraftContract,
    reportsService.refreshReportDraft,
  );
}
export function useSubmitReportMutation() {
  return useFeatureMutation(
    contracts.submitReportContract,
    reportsService.submitReport,
  );
}
