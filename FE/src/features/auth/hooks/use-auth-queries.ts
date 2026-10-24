// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
"use client";
import {
  useFeatureQuery,
  type FeatureQueryOptions,
} from "@/lib/query/use-feature-query";
import type { ContractRequest } from "@/services/api-contract";
import * as contracts from "../api/auth.contract";
import { authService } from "../api/auth.service";
import { authKeys } from "../api/auth.keys";
export function useGetSessionQuery(
  request: ContractRequest<typeof contracts.getSessionContract>,
  options: FeatureQueryOptions = {},
) {
  return useFeatureQuery(
    contracts.getSessionContract,
    request,
    authService.getSession,
    authKeys.getSession,
    options,
  );
}
