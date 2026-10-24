"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import type { Endpoint, ContractRequest } from "@/services/api-contract";
import { useSession } from "@/lib/auth/session-context";

export function useFeatureMutation<C extends Endpoint, Result>(
  contract: C,
  service: (request: ContractRequest<C>) => Promise<Result>,
) {
  const client = useQueryClient();
  const { session } = useSession();
  const attempt = useRef<{ fingerprint: string; key: string } | null>(null);
  return useMutation({
    mutationFn: (request: ContractRequest<C>) => {
      const fingerprint = JSON.stringify([
        contract.name,
        request.params,
        request.body,
        request.version,
      ]);
      if (attempt.current?.fingerprint !== fingerprint)
        attempt.current = { fingerprint, key: crypto.randomUUID() };
      return service({ ...request, key: request.key ?? attempt.current.key });
    },
    retry: false,
    onSuccess: async () => {
      attempt.current = null;
      await client.invalidateQueries({
        predicate: (q) =>
          q.queryKey[1] === (session?.user.id ?? "anonymous") &&
          (contract.invalidates.includes(String(q.queryKey[0])) ||
            (contract.name === "createAnalysisFeedback" &&
              q.queryKey[2] === "getAnalysisDetail")),
      });
    },
  });
}
