"use client";
import { PermissionGate } from "@/components/layout/permission-gate";
import { ActionButton } from "@/components/ui/action-button";
import { Badge, Loading, PageHeader, Panel } from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { FeedbackPanel } from "@/features/analytics/components/analysis-feedback-panel";
import { dateTime } from "@/lib/format";
import { confirmDiscard } from "@/lib/forms/confirm-discard";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAnalysisTracking } from "../hooks/use-analysis-tracking";
import { useCreateAnalysisJobMutation } from "../hooks/use-analytics-mutations";
import { useGetAnalysisDetailQuery } from "../hooks/use-analytics-queries";
import { AnalysisExplanation } from "./analysis-explanation";
import { metricValue } from "./analysis-links";
import { AnalysisSources } from "./analysis-sources";
const typeLabel: Record<string, string> = {
  RISK: "Nguy cơ trễ hạn",
  WORKLOAD: "Khối lượng công việc",
  BOTTLENECK: "Điểm nghẽn quy trình",
  SUMMARY: "Tổng hợp tiến độ",
  METRIC: "Chi tiết chỉ số",
};

export function AnalysisDetailPage({ analysisId }: { analysisId: string }) {
  return (
    <PermissionGate permission="ANALYTICS_VIEW">
      <AnalysisDetail key={analysisId} analysisId={analysisId} />
    </PermissionGate>
  );
}

function AnalysisDetail({ analysisId }: { analysisId: string }) {
  const query = useGetAnalysisDetailQuery(analysisId);
  const create = useCreateAnalysisJobMutation();
  const attempted = useRef(false);
  const router = useRouter();
  const [jobId, setJobId] = useState<string | null>(null);
  const [startError, setStartError] = useState<Error | null>(null);
  const detail = query.data;
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
    return (
      <QueryErrorState error={query.error} retry={() => void query.refetch()} />
    );
  if (!detail) return <Loading />;
  const { snapshot, explanation } = detail;
  return (
    <>
      <PageHeader
        title={snapshot.title}
        description={`${typeLabel[snapshot.analysisType]} · ${snapshot.scope.from} – ${snapshot.scope.to}`}
        actions={
          <>
            <button
              onClick={() => {
                if (confirmDiscard()) router.back();
              }}
            >
              Quay lại
            </button>
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
      <p className="metadata">
        Dữ liệu đến {dateTime(snapshot.dataAsOf)} · Giờ Việt Nam ·{" "}
        <Badge value={snapshot.quality.status} /> ·{" "}
        <Badge value={detail.freshness.status} />
      </p>
      {detail.freshness.status === "OUTDATED" && (
        <p className="notice">
          Đang xem bản dữ liệu cũ. Các thông số và lời diễn giải vẫn thuộc cùng
          mốc.
          {detail.freshness.latestAnalysisId && (
            <>
              {" "}
              <Link
                className="text-link"
                href={`/analytics/details/${detail.freshness.latestAnalysisId}`}
              >
                Xem dữ liệu mới
              </Link>
            </>
          )}
        </p>
      )}
      <div className="metric-grid">
        {snapshot.metrics.slice(0, 4).map((m) => (
          <Panel key={m.id}>
            <p className="muted">{m.label}</p>
            <p className="metric-value">{metricValue(m.value, m.unit)}</p>
            <p className="small muted">
              {m.basis === "CURRENT"
                ? "Tại thời điểm dữ liệu"
                : "Trong kỳ đã chọn"}
            </p>
          </Panel>
        ))}
      </div>
      <div className="analysis-columns">
        <AnalysisSources snapshot={snapshot} summary={detail.systemSummary} />
        <div className="analysis-ai">
          <Panel title="AI phân tích">
            <p className="metadata">
              <Badge value={explanation.status} />
            </p>
            {startError && (
              <QueryErrorState
                error={startError}
                retry={() => {
                  setStartError(null);
                  void create
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
              <p role="status">Đang tiếp nhận yêu cầu diễn giải…</p>
            )}
            {["QUEUED", "RUNNING"].includes(explanation.status) && (
              <p role="status">
                AI đang phân tích. Thông số và căn cứ vẫn có thể đọc ngay.
              </p>
            )}
            {(detail.explanation.activeJobId ?? jobId) && (
              <p>
                <Link
                  className="text-link"
                  href={`/analytics/jobs/${detail.explanation.activeJobId ?? jobId}`}
                >
                  Xem tiến trình phân tích
                </Link>
              </p>
            )}
            {tracking.paused && (
              <p className="notice">
                Đã tạm dừng theo dõi sau 2 phút. Tiến trình trên máy chủ vẫn giữ
                trạng thái thực.{" "}
                <button onClick={tracking.resume}>Tiếp tục kiểm tra</button>
              </p>
            )}
            {tracking.query.isError && (
              <QueryErrorState
                error={tracking.query.error}
                retry={tracking.resume}
              />
            )}
            {explanation.error && (
              <p className="notice error">
                {explanation.error.message}
                {explanation.error.retryAfterSeconds
                  ? ` Có thể thử lại sau ${explanation.error.retryAfterSeconds} giây.`
                  : ""}
              </p>
            )}
            <AnalysisExplanation
              snapshot={snapshot}
              value={explanation.lastSuccess}
            />
          </Panel>
          {snapshot.analysisType === "BOTTLENECK" && (
            <FeedbackPanel value={detail} />
          )}
        </div>
      </div>
    </>
  );
}
