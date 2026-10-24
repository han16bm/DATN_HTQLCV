// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
"use client";
import {
  useFeatureQuery,
  type FeatureQueryOptions,
} from "@/lib/query/use-feature-query";
import type { ContractRequest } from "@/services/api-contract";
import * as contracts from "../api/users.contract";
import { usersService } from "../api/users.service";
import { usersKeys } from "../api/users.keys";
export function useListUsersQuery(
  request: ContractRequest<typeof contracts.listUsersContract>,
  options: FeatureQueryOptions = {},
) {
  return useFeatureQuery(
    contracts.listUsersContract,
    request,
    usersService.listUsers,
    usersKeys.listUsers,
    options,
  );
}
export function useGetUserQuery(
  request: ContractRequest<typeof contracts.getUserContract>,
  options: FeatureQueryOptions = {},
) {
  return useFeatureQuery(
    contracts.getUserContract,
    request,
    usersService.getUser,
    usersKeys.getUser,
    options,
  );
}
