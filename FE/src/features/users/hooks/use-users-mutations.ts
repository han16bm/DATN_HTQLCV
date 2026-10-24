// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
"use client";
import { useFeatureMutation } from "@/lib/query/use-feature-mutation";
import * as contracts from "../api/users.contract";
import { usersService } from "../api/users.service";
export function useCreateUserMutation() {
  return useFeatureMutation(
    contracts.createUserContract,
    usersService.createUser,
  );
}
export function useUpdateUserMutation() {
  return useFeatureMutation(
    contracts.updateUserContract,
    usersService.updateUser,
  );
}
export function useLockUserMutation() {
  return useFeatureMutation(contracts.lockUserContract, usersService.lockUser);
}
export function useUnlockUserMutation() {
  return useFeatureMutation(
    contracts.unlockUserContract,
    usersService.unlockUser,
  );
}
export function useResetUserPasswordMutation() {
  return useFeatureMutation(
    contracts.resetUserPasswordContract,
    usersService.resetUserPassword,
  );
}
