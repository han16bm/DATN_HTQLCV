"use client";

import { ActionButton } from "@/components/ui/action-button";
import { KeyValue, KeyValueList } from "@/components/patterns/key-value";
import { Notice } from "@/components/ui/notice";
import { Button } from "@/components/ui/button";
import { PageSkeleton, Spinner } from "@/components/ui/loading";
import { ButtonLink, PageHeader, Panel } from "@/components/ui/page";
import { StatusLozenge } from "@/components/ui/lozenge";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { dateTime } from "@/lib/format";
import { useCrumbLabel } from "@/lib/use-crumb-label";
import { useRouter } from "next/navigation";
import { useAnalysisTracking } from "../hooks/use-analysis-tracking";
import { useCreateAnalysisJobMutation } from "../hooks/use-analytics-mutations";
import { useGetAnalysisDetailQuery } from "../hooks/use-analytics-queries";
function duration(from: string, to: string | null) {
  if (!to) return "Đang xử lý";
  const seconds = Math.max(
    0,
    Math.round((Date.parse(to) - Date.parse(from)) / 1000),
  );
  const minutes = Math.floor(seconds / 60);
  return minutes > 0
    ? `${minutes} phút ${seconds % 60} giây`
    : `${seconds} giây`;
}

export function AnalysisJobPage({ jobId }: { jobId: string }) {
  return <JobContent key={jobId} jobId={jobId} />;
}

function JobContent({ jobId }: { jobId: string }) {
  const tracking = useAnalysisTracking(jobId);
  const job = tracking.query.data;
  const detail = useGetAnalysisDetailQuery(job?.analysisId ?? "");
  useCrumbLabel(
    "job",
    jobId,
    detail.data && `Tiến trình · ${detail.data.snapshot.title}`,
  );
  const create = useCreateAnalysisJobMutation();
  const router = useRouter();
  if (tracking.query.isError)
    return (
      <QueryErrorState error={tracking.query.error} retry={tracking.resume} />
    );
  if (!job) return <PageSkeleton />;
  return (
    <>
      <PageHeader
        title="Tiến trình AI phân tích"
        description={detail.data?.snapshot.title}
      />
      <Panel className="max-w-[880px]">
        <div className="actions flex flex-wrap items-center gap-2">
          {["QUEUED", "RUNNING"].includes(job.status) && !tracking.paused && (
            <Spinner label="Đang phân tích" />
          )}
          <StatusLozenge value={job.status} />
        </div>
        <KeyValueList>
          <KeyValue label="Tiếp nhận lúc">{dateTime(job.createdAt)}</KeyValue>
          <KeyValue label="Kết thúc lúc">{dateTime(job.completedAt)}</KeyValue>
          <KeyValue label="Thời gian xử lý">
            {duration(job.createdAt, job.completedAt)}
          </KeyValue>
          <KeyValue label="Kỳ và mốc dữ liệu">
            {detail.data?.snapshot.scope.from} –{" "}
            {detail.data?.snapshot.scope.to} ·{" "}
            {dateTime(detail.data?.snapshot.dataAsOf)}
          </KeyValue>
        </KeyValueList>
        {job.error && (
          <Notice tone="danger">
            {job.error.message}
            {job.error.code && (
              <span className="mt-1 block text-xs text-fg-subtle">
                Mã lỗi: <code>{job.error.code}</code>
              </span>
            )}
          </Notice>
        )}
        {tracking.paused && (
          <Notice
            tone="warning"
            actions={
              <Button onClick={tracking.resume}>Tiếp tục kiểm tra</Button>
            }
          >
            Đã tạm dừng theo dõi.
          </Notice>
        )}
        <div className="actions flex flex-wrap items-center gap-2 mt-4">
          <ButtonLink href={`/analytics/details/${job.analysisId}`}>
            Mở thông số và lời phân tích
          </ButtonLink>
          {job.status === "FAILED" &&
            job.error?.retryable &&
            detail.data?.generation.allowed && (
              <ActionButton
                onAction={async () => {
                  const next = await create.mutateAsync({
                    analysisId: job.analysisId,
                    generationMode: "REGENERATE",
                  });
                  router.push(`/analytics/jobs/${next.id}`);
                }}
              >
                Thử phân tích lại
              </ActionButton>
            )}
        </div>
        {detail.isError && <QueryErrorState error={detail.error} />}
      </Panel>
    </>
  );
}
