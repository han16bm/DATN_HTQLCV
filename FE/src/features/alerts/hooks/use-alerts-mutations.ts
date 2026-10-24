// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
"use client";
import { useFeatureMutation } from "@/lib/query/use-feature-mutation";
import * as contracts from "../api/alerts.contract";
import { alertsService } from "../api/alerts.service";
export function useUpdateAlertMutation() {
  return useFeatureMutation(
    contracts.updateAlertContract,
    alertsService.updateAlert,
  );
}
