"use client";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import type {
  Endpoint,
  ContractRequest,
  ContractResponse,
} from "@/services/api-contract";
import { useSession, hasPermission } from "@/lib/auth/session-context";
import { shouldRetryQuery } from "@/services/http-error";
export type FeatureQueryOptions = { enabled?: boolean; poll?: number | false };

export function useFeatureQuery<C extends Endpoint>(
  contract: C,
  request: ContractRequest<C>,
  service: (request: ContractRequest<C>) => Promise<ContractResponse<C>>,
  keyFactory: (
    viewerId: string,
    params: Record<string, string>,
    query: Record<string, unknown>,
  ) => readonly unknown[],
  options: FeatureQueryOptions,
) {
  const { session } = useSession();
  const parsed = contract.query.safeParse(request.query ?? {});
  const params = z
    .record(z.string(), z.string())
    .safeParse(contract.params.safeParse(request.params ?? {}).data);
  const query = z.record(z.string(), z.unknown()).safeParse(parsed.data);
  const projectId =
    params.data?.projectId ??
    (typeof query.data?.projectId === "string"
      ? query.data.projectId
      : undefined);
  const allowed =
    !contract.permission ||
    hasPermission(session, contract.permission, projectId);
  return useQuery<ContractResponse<C>, Error>({
    queryKey:
      parsed.success && params.success && query.success
        ? keyFactory(session?.user.id ?? "anonymous", params.data, query.data)
        : [
            contract.feature,
            session?.user.id ?? "anonymous",
            contract.name,
            "invalid-input",
          ],
    queryFn: ({ signal }) => service({ ...request, signal }),
    enabled:
      options.enabled !== false &&
      parsed.success &&
      params.success &&
      allowed &&
      (contract.feature === "auth" || Boolean(session)),
    staleTime: contract.name.startsWith("list")
      ? 30_000
      : contract.name === "getProjectClosureChecks"
        ? 0
        : 10_000,
    gcTime: 300_000,
    retry: shouldRetryQuery,
    refetchInterval: options.poll ?? false,
  });
}
