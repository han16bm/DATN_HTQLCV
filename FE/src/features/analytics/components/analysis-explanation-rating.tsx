"use client";

import { Button } from "@/components/ui/button";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { useRateAnalysisExplanationMutation } from "../hooks/use-analytics-mutations";
import type { AnalysisDto } from "../types/analytics.types";

export function ExplanationRating({ value }: { value: AnalysisDto }) {
  const mutation = useRateAnalysisExplanationMutation();
  if (!value.explanationRating.canSubmit) return null;
  const mine = value.explanationRating.mine;
  const pending = mutation.isPending
    ? mutation.variables?.payload.helpful
    : undefined;
  const rate = (helpful: boolean) =>
    mutation.mutate(
      { analysisId: value.snapshot.analysisId, payload: { helpful } },
      { onSuccess: () => toast.success("Đã ghi nhận đánh giá.") },
    );
  return (
    <div className="grid gap-1">
      <div
        role="group"
        aria-label="Đánh giá lời diễn giải AI"
        className="flex flex-wrap items-center gap-2"
      >
        <span className="text-xs text-fg-subtle">
          Lời diễn giải này có hữu ích không?
        </span>
        <Button
          size="sm"
          selected={mine === true}
          loading={pending === true}
          disabled={mutation.isPending}
          onClick={() => rate(true)}
        >
          <ThumbsUp className="size-3.5" aria-hidden="true" />
          Hữu ích
        </Button>
        <Button
          size="sm"
          selected={mine === false}
          loading={pending === false}
          disabled={mutation.isPending}
          onClick={() => rate(false)}
        >
          <ThumbsDown className="size-3.5" aria-hidden="true" />
          Chưa hữu ích
        </Button>
      </div>
      {mutation.error && (
        <p role="alert" className="m-0 text-sm text-danger-fg">
          {mutation.error.message}
        </p>
      )}
    </div>
  );
}
