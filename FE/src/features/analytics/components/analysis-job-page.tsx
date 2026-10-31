"use client";

import { ActionButton } from "@/components/ui/action-button";
import { PageSkeleton, Spinner } from "@/components/ui/loading";
import { Badge, ButtonLink, PageHeader, Panel } from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { dateTime } from "@/lib/format";
import { useCrumbLabel } from "@/lib/use-crumb-label";
import { useRouter } from "next/navigation";
import { useAnalysisTracking } from "../hooks/use-analysis-tracking";
import { useCreateAnalysisJobMutation } from "../hooks/use-analytics-mutations";
import { useGetAnalysisDetailQuery } from "../hooks/use-analytics-queries";
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
      <Panel className="record-card">
        <div className="actions">
          {["QUEUED", "RUNNING"].includes(job.status) && !tracking.paused && (
            <Spinner label="Đang phân tích" />
          )}
          <Badge value={job.status} />
        </div>
        <dl>
          <div>
            <dt>Tiếp nhận lúc</dt>
            <dd>{dateTime(job.createdAt)}</dd>
          </div>
          <div>
            <dt>Kết thúc lúc</dt>
            <dd>{dateTime(job.completedAt)}</dd>
          </div>
          <div>
            <dt>Kỳ và mốc dữ liệu</dt>
            <dd>
              {detail.data?.snapshot.scope.from} –{" "}
              {detail.data?.snapshot.scope.to} ·{" "}
              {dateTime(detail.data?.snapshot.dataAsOf)}
            </dd>
          </div>
        </dl>
        {job.error && <p className="notice error">{job.error.message}</p>}
        {tracking.paused && (
          <p>
            Đã tạm dừng theo dõi.{" "}
            <button onClick={tracking.resume}>Tiếp tục kiểm tra</button>
          </p>
        )}
        <div className="actions section-gap">
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
