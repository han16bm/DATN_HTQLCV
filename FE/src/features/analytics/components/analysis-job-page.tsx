"use client";
import { ActionButton } from "@/components/ui/action-button";
import {
  Badge,
  ButtonLink,
  Loading,
  PageHeader,
  Panel,
  PermissionGate,
} from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { dateTime } from "@/lib/format";
import { useRouter } from "next/navigation";
import { useAnalysisTracking } from "../hooks/use-analysis-tracking";
import { useCreateAnalysisJobMutation } from "../hooks/use-analytics-mutations";
import { useGetAnalysisDetailQuery } from "../hooks/use-analytics-queries";
export function AnalysisJobPage({ jobId }: { jobId: string }) {
  return (
    <PermissionGate permission="ANALYTICS_VIEW">
      <JobContent key={jobId} jobId={jobId} />
    </PermissionGate>
  );
}

function JobContent({ jobId }: { jobId: string }) {
  const tracking = useAnalysisTracking(jobId);
  const job = tracking.query.data;
  const detail = useGetAnalysisDetailQuery(job?.analysisId ?? "", {
    enabled: Boolean(job),
  });
  const create = useCreateAnalysisJobMutation();
  const router = useRouter();
  if (tracking.query.isError)
    return (
      <QueryErrorState error={tracking.query.error} retry={tracking.resume} />
    );
  if (!job) return <Loading />;
  return (
    <>
      <PageHeader
        title="Tiến trình AI phân tích"
        description={detail.data?.snapshot.title}
      />
      <Panel>
        <Badge value={job.status} />
        <dl>
          <dt>Tiếp nhận lúc</dt>
          <dd>{dateTime(job.createdAt)}</dd>
          <dt>Kết thúc lúc</dt>
          <dd>{dateTime(job.completedAt)}</dd>
          <dt>Kỳ và mốc dữ liệu</dt>
          <dd>
            {detail.data?.snapshot.scope.from} –{" "}
            {detail.data?.snapshot.scope.to} ·{" "}
            {dateTime(detail.data?.snapshot.dataAsOf)}
          </dd>
        </dl>
        {job.error && <p className="notice error">{job.error.message}</p>}
        {tracking.paused && (
          <p>
            Đã tạm dừng theo dõi.{" "}
            <button onClick={tracking.resume}>Tiếp tục kiểm tra</button>
          </p>
        )}
        <div className="actions">
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
