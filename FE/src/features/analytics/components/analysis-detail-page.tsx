"use client";

import { ActionButton } from "@/components/ui/action-button";
import { Notice } from "@/components/ui/notice";
import { Button } from "@/components/ui/button";
import { PageSkeleton, Spinner } from "@/components/ui/loading";
import { PageHeader, Panel } from "@/components/ui/page";
import { StatusLozenge } from "@/components/ui/lozenge";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { dateTime } from "@/lib/format";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCrumbLabel } from "@/lib/use-crumb-label";
import { useAnalysisTracking } from "../hooks/use-analysis-tracking";
import { useCreateAnalysisJobMutation } from "../hooks/use-analytics-mutations";
import { useGetAnalysisDetailQuery } from "../hooks/use-analytics-queries";
import { AnalysisExplanation } from "./analysis-explanation";
import { FeedbackPanel } from "./analysis-feedback-panel";
import { AnalysisSources } from "./analysis-sources";
const typeLabel: Record<string, string> = {
  RISK: "Nguy cơ trễ hạn",
  WORKLOAD: "Khối lượng công việc",
  BOTTLENECK: "Điểm nghẽn quy trình",
  SUMMARY: "Tổng hợp tiến độ",
  METRIC: "Chi tiết chỉ số",
};

export function AnalysisDetailPage({ analysisId }: { analysisId: string }) {
  return <AnalysisDetail key={analysisId} analysisId={analysisId} />;
}

function AnalysisDetail({ analysisId }: { analysisId: string }) {
  const query = useGetAnalysisDetailQuery(analysisId);
  const create = useCreateAnalysisJobMutation();
  const attempted = useRef(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [startError, setStartError] = useState<Error | null>(null);
  const detail = query.data;
  useCrumbLabel("analysis", analysisId, detail?.snapshot.title);
  const tracking = useAnalysisTracking(
    detail?.explanation.activeJobId ?? jobId,
  );
  useEffect(() => {
    if (
      detail?.explanation.status === "NOT_REQUESTED" &&
      detail.generation.allowed &&
      !attempted.current
    ) {
      attempted.current = true;
      void create
        .mutateAsync({ analysisId, generationMode: "REUSE_OR_CREATE" })
        .then((job) => setJobId(job.id))
        .catch((error) =>
          setStartError(
            error instanceof Error
              ? error
              : new Error("Chưa yêu cầu được diễn giải."),
          ),
        );
    }
  }, [
    analysisId,
    detail?.explanation.status,
    detail?.generation.allowed,
    create,
  ]);
  if (query.isError)
    return <QueryErrorState error={query.error} retry={query.refetch} />;
  if (!detail) return <PageSkeleton />;
  const { snapshot, explanation } = detail;
  return (
    <>
      <PageHeader
        title={snapshot.title}
        description={`${typeLabel[snapshot.analysisType]} · ${snapshot.scope.from} – ${snapshot.scope.to}`}
        actions={
          <>
            {detail.generation.allowed &&
              explanation.status !== "NOT_REQUESTED" && (
                <ActionButton
                  onAction={async () => {
                    const job = await create.mutateAsync({
                      analysisId,
                      generationMode: "REGENERATE",
                    });
                    setJobId(job.id);
                    setStartError(null);
                  }}
                >
                  Phân tích lại
                </ActionButton>
              )}
          </>
        }
      />
      <p className="mb-3 text-xs text-fg-subtle">
        Cập nhật {dateTime(snapshot.dataAsOf)} ·{" "}
        <StatusLozenge value={snapshot.quality.status} /> ·{" "}
        <StatusLozenge value={detail.freshness.status} />
      </p>
      {detail.freshness.status === "OUTDATED" && (
        <Notice tone="warning" className="mb-3">
          Dữ liệu đã thay đổi sau lần phân tích này.
          {detail.freshness.latestAnalysisId && (
            <>
              {" "}
              <Link
                className="font-medium text-selected-fg underline-offset-2 hover:underline"
                href={`/analytics/details/${detail.freshness.latestAnalysisId}`}
              >
                Xem dữ liệu mới
              </Link>
            </>
          )}
        </Notice>
      )}
      <div className="grid items-start gap-5 @min-[900px]/page:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <AnalysisSources snapshot={snapshot} />
        <div className="grid min-w-0 gap-5">
          <Panel
            title="Nhận định và đề xuất AI"
            actions={
              <div className="flex items-center gap-2">
                {explanation.lastSuccess && (
                  <span className="text-xs text-fg-subtle">
                    {explanation.lastSuccess.modelDisplayName}
                  </span>
                )}
                <StatusLozenge value={explanation.status} />
              </div>
            }
          >
            {startError && (
              <QueryErrorState
                error={startError}
                retry={() => {
                  setStartError(null);
                  return create
                    .mutateAsync({
                      analysisId,
                      generationMode: "REUSE_OR_CREATE",
                    })
                    .then((job) => setJobId(job.id))
                    .catch(setStartError);
                }}
              />
            )}
            {create.isPending && (
              <p
                role="status"
                className="m-0 inline-flex items-center gap-2 text-sm"
              >
                <Spinner />
                Đang tiếp nhận yêu cầu diễn giải…
              </p>
            )}
            {["QUEUED", "RUNNING"].includes(explanation.status) && (
              <p
                role="status"
                className="m-0 inline-flex items-center gap-2 text-sm"
              >
                <Spinner />
                Đang phân tích…
              </p>
            )}
            {(detail.explanation.activeJobId ?? jobId) && (
              <p>
                <Link
                  className="font-medium text-selected-fg underline-offset-2 hover:underline"
                  href={`/analytics/jobs/${detail.explanation.activeJobId ?? jobId}`}
                >
                  Xem tiến trình phân tích
                </Link>
              </p>
            )}
            {tracking.paused && (
              <Notice
                tone="warning"
                actions={
                  <Button onClick={tracking.resume}>Tiếp tục kiểm tra</Button>
                }
              >
                Phân tích đang mất nhiều thời gian hơn dự kiến.
              </Notice>
            )}
            {tracking.query.isError && (
              <QueryErrorState
                error={tracking.query.error}
                retry={tracking.resume}
              />
            )}
            {explanation.error && (
              <Notice tone="danger">
                {explanation.error.message}
                {explanation.error.retryAfterSeconds
                  ? ` Có thể thử lại sau ${explanation.error.retryAfterSeconds} giây.`
                  : ""}
              </Notice>
            )}
            <AnalysisExplanation
              snapshot={snapshot}
              value={explanation.lastSuccess}
            />
            {!explanation.lastSuccess && (
              <p className="whitespace-pre-wrap">{detail.systemSummary}</p>
            )}
          </Panel>
          {snapshot.analysisType === "BOTTLENECK" && (
            <FeedbackPanel value={detail} />
          )}
        </div>
      </div>
    </>
  );
}
