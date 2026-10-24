// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
"use client";
import { useFeatureMutation } from "@/lib/query/use-feature-mutation";
import * as contracts from "../api/auth.contract";
import { authService } from "../api/auth.service";
export function useLoginMutation() {
  return useFeatureMutation(contracts.loginContract, authService.login);
}
export function useLogoutMutation() {
  return useFeatureMutation(contracts.logoutContract, authService.logout);
}
