"use client";

import { ActionButton } from "@/components/ui/action-button";
import { Notice } from "@/components/ui/notice";
import { Button } from "@/components/ui/button";
import { PageSkeleton, Spinner } from "@/components/ui/loading";
import { PageHeader, Panel } from "@/components/ui/page";
import { StatusLozenge } from "@/components/ui/lozenge";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { dateTime, label } from "@/lib/format";
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

const blockedLabel: Record<string, string> = {
  SNAPSHOT_OUTDATED:
    "Dữ liệu đã thay đổi nên không tạo diễn giải mới cho bản này; hãy mở dữ liệu mới để phân tích.",
  INSUFFICIENT_DATA: "Chưa đủ dữ liệu để AI diễn giải bản phân tích này.",
  LLM_NOT_CONFIGURED:
    "Hệ thống chưa cấu hình dịch vụ AI. Số liệu và phần tổng hợp vẫn dùng được bình thường.",
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
  const retryAfter = detail?.generation.retryAfterSeconds;
  const { refetch } = query;
  useEffect(() => {
    if (!retryAfter) return;
    const timer = setTimeout(() => void refetch(), retryAfter * 1000);
    return () => clearTimeout(timer);
  }, [retryAfter, refetch]);
  if (query.isError)
    return <QueryErrorState error={query.error} retry={query.refetch} />;
  if (!detail) return <PageSkeleton />;
  const { snapshot, explanation } = detail;
  const lastSuccess = explanation.lastSuccess;
  const running = ["QUEUED", "RUNNING"].includes(explanation.status);
  const waiting =
    running ||
    create.isPending ||
    (explanation.status === "NOT_REQUESTED" && detail.generation.allowed);
  const { blockedReason } = detail.generation;
  const blockedText =
    blockedReason === "RATE_LIMITED"
      ? `Dịch vụ AI đang giới hạn lượt gọi; có thể phân tích lại sau khoảng ${detail.generation.retryAfterSeconds ?? 0} giây.`
      : blockedReason && blockedReason !== "ACTIVE_JOB"
        ? blockedLabel[blockedReason]
        : null;
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
      {snapshot.quality.missingFields.length > 0 && (
        <Notice tone="warning" className="mb-3">
          Còn thiếu dữ liệu:{" "}
          {snapshot.quality.missingFields.map((f) => label(f)).join(", ")}. Các
          chỉ số liên quan được để trống, không tính là 0.
        </Notice>
      )}
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
      <div className="grid items-start gap-5 @min-[56.25rem]/page:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <AnalysisSources snapshot={snapshot} />
        <div className="grid min-w-0 gap-5">
          <Panel title="Tổng hợp theo số liệu">
            <p className="m-0 text-sm leading-relaxed whitespace-pre-wrap text-fg">
              {detail.systemSummary}
            </p>
          </Panel>
          <Panel
            title="Nhận định và đề xuất AI"
            actions={
              <div className="flex items-center gap-2">
                {lastSuccess && (
                  <span className="text-xs text-fg-subtle">
                    {lastSuccess.modelDisplayName}
                  </span>
                )}
                <StatusLozenge value={explanation.status} />
              </div>
            }
          >
            <div className="grid gap-3">
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
              {running && (
                <p
                  role="status"
                  className="m-0 inline-flex items-center gap-2 text-sm"
                >
                  <Spinner />
                  {lastSuccess ? "Đang phân tích lại…" : "Đang phân tích…"}
                </p>
              )}
              {(detail.explanation.activeJobId ?? jobId) && (
                <p className="m-0">
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
                  {blockedReason === "RATE_LIMITED" && ` ${blockedText}`}
                </Notice>
              )}
              {blockedText && !explanation.error && !lastSuccess && (
                <p className="m-0 text-sm text-fg-subtle">{blockedText}</p>
              )}
              {lastSuccess && (running || explanation.status === "FAILED") && (
                <Notice tone="info" role="status">
                  Đang hiển thị lời diễn giải trước đó, tạo lúc{" "}
                  {dateTime(lastSuccess.generatedAt)}
                  {explanation.status === "FAILED"
                    ? ". Lượt phân tích lại chưa thành công."
                    : ". Nội dung sẽ được thay khi lượt phân tích lại hoàn tất."}
                </Notice>
              )}
              <AnalysisExplanation snapshot={snapshot} value={lastSuccess} />
              {!lastSuccess &&
                !waiting &&
                !explanation.error &&
                !startError &&
                !blockedText && (
                  <p className="m-0 text-sm text-fg-subtle">
                    Chưa có lời diễn giải AI cho bản dữ liệu này. Phần Tổng hợp
                    theo số liệu vẫn phản ánh đúng các chỉ số bên cạnh.
                  </p>
                )}
            </div>
          </Panel>
          {snapshot.analysisType === "BOTTLENECK" && (
            <FeedbackPanel value={detail} />
          )}
        </div>
      </div>
    </>
  );
}
