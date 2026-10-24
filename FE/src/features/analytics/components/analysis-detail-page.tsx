"use client";
import { ActionButton } from "@/components/ui/action-button";
import {
  Badge,
  Loading,
  PageHeader,
  Panel,
  PermissionGate,
} from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { FeedbackPanel } from "@/features/analytics/components/analysis-feedback-panel";
import { dateTime, label } from "@/lib/format";
import { confirmDiscard } from "@/lib/forms/confirm-discard";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAnalysisTracking } from "../hooks/use-analysis-tracking";
import { useCreateAnalysisJobMutation } from "../hooks/use-analytics-mutations";
import { useGetAnalysisDetailQuery } from "../hooks/use-analytics-queries";
import { DomainActionLink, metricValue } from "./analysis-links";
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
  const q = useGetAnalysisDetailQuery(analysisId);
  const create = useCreateAnalysisJobMutation();
  const attempted = useRef(false);
  const router = useRouter();
  const [jobId, setJobId] = useState<string | null>(null);
  const [startError, setStartError] = useState<Error | null>(null);
  const current = q.data;
  const tracking = useAnalysisTracking(
    current?.explanation.activeJobId ?? jobId,
  );
  useEffect(() => {
    if (
      current?.explanation.status === "NOT_REQUESTED" &&
      current.generation.allowed &&
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
    current?.explanation.status,
    current?.generation.allowed,
    create,
  ]);
  if (q.isError)
    return <QueryErrorState error={q.error} retry={() => void q.refetch()} />;
  if (!current) return <Loading />;
  const d = current;
  const s = d.snapshot;
  const e = d.explanation;
  return (
    <>
      <PageHeader
        title={s.title}
        description={`${typeLabel[s.analysisType]} · ${s.scope.from} – ${s.scope.to}`}
        actions={
          <>
            <button
              onClick={() => {
                if (confirmDiscard()) router.back();
              }}
            >
              Quay lại
            </button>
            {d.generation.allowed && e.status !== "NOT_REQUESTED" && (
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
        Dữ liệu đến {dateTime(s.dataAsOf)} · Giờ Việt Nam ·{" "}
        <Badge value={s.quality.status} /> ·{" "}
        <Badge value={d.freshness.status} />
      </p>
      {d.freshness.status === "OUTDATED" && (
        <p className="notice">
          Đang xem bản dữ liệu cũ. Các thông số và lời diễn giải vẫn thuộc cùng
          mốc.
          {d.freshness.latestAnalysisId && (
            <>
              {" "}
              <Link
                className="text-link"
                href={`/analytics/details/${d.freshness.latestAnalysisId}`}
              >
                Xem dữ liệu mới
              </Link>
            </>
          )}
        </p>
      )}
      <div className="metric-grid">
        {s.metrics.slice(0, 4).map((m) => (
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
        <div className="analysis-sources">
          <Panel title="Bối cảnh phân tích">
            <dl>
              {s.context.map((c) => (
                <div key={c.key}>
                  <dt>{c.label}</dt>
                  <dd>
                    {c.valueType === "UTC"
                      ? dateTime(c.value)
                      : c.value
                        ? label(c.value)
                        : "Chưa đủ dữ liệu"}
                  </dd>
                </div>
              ))}
            </dl>
            {!s.context.length && (
              <p>
                Phạm vi {s.scope.projectId ? "dự án" : "đơn vị"} ·{" "}
                {s.scope.from} – {s.scope.to}.
              </p>
            )}
          </Panel>
          <Panel title="Thông số và cách tính">
            {s.metrics.map((m) => (
              <div key={m.id} className="measure-row" id={`metric-${m.id}`}>
                <div className="list-row">
                  <span>{m.label}</span>
                  <span>{metricValue(m.value, m.unit)}</span>
                </div>
                <p className="small muted">{m.formula}</p>
                {m.value === null && (
                  <p className="small muted">
                    Nguồn chưa đầy đủ nên chưa tính giá trị.
                  </p>
                )}
              </div>
            ))}
          </Panel>
          {s.series.map((series) => (
            <Panel title={series.label} key={series.id}>
              <div className="chart">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={series.points}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      dataKey="value"
                      stroke="#365b85"
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          ))}
          <Panel title="Dữ liệu căn cứ">
            <p className="small muted">
              Nguồn được giới hạn theo quyền truy cập và mốc dữ liệu.
            </p>
            {s.evidence.map((ev, i) => (
              <div className="measure-row" id={`evidence-${ev.id}`} key={ev.id}>
                <p>{ev.label}</p>
                <p className="small muted">
                  Căn cứ {i + 1} · {dateTime(ev.observedAt)}
                </p>
                <DomainActionLink value={ev.action} />
              </div>
            ))}
            {!s.evidence.length && (
              <p className="muted">
                Thông số tổng hợp theo công thức; bản này không có liên kết
                nguồn chi tiết.
              </p>
            )}
          </Panel>
          <Panel title="Tổng hợp theo số liệu">
            <p className="preserve-lines">{d.systemSummary}</p>
          </Panel>
        </div>
        <div className="analysis-ai">
          <Panel title="AI phân tích">
            <p className="metadata">
              <Badge value={e.status} />
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
            {["QUEUED", "RUNNING"].includes(e.status) && (
              <p role="status">
                AI đang phân tích. Thông số và căn cứ vẫn có thể đọc ngay.
              </p>
            )}
            {(current.explanation.activeJobId ?? jobId) && (
              <p>
                <Link
                  className="text-link"
                  href={`/analytics/jobs/${current.explanation.activeJobId ?? jobId}`}
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
            {e.error && (
              <p className="notice error">
                {e.error.message}
                {e.error.retryAfterSeconds
                  ? ` Có thể thử lại sau ${e.error.retryAfterSeconds} giây.`
                  : ""}
              </p>
            )}
            {e.lastSuccess ? (
              <>
                <p className="preserve-lines">{e.lastSuccess.summary}</p>
                {e.lastSuccess.findings.map((f) => (
                  <div className="measure-row" key={f.id}>
                    <h3>{f.title}</h3>
                    <p className="preserve-lines">{f.text}</p>
                    <div className="citation-links">
                      {f.metricIds.map((id) => (
                        <a
                          className="text-link"
                          key={id}
                          href={`#metric-${id}`}
                        >
                          {s.metrics.find((m) => m.id === id)?.label ??
                            "Chỉ số"}
                        </a>
                      ))}
                      {f.evidenceIds.map((id) => (
                        <a
                          className="text-link"
                          key={id}
                          href={`#evidence-${id}`}
                        >
                          Căn cứ{" "}
                          {s.evidence.findIndex((ev) => ev.id === id) + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
                <h3 className="section-gap">Đề xuất để xem xét</h3>
                {e.lastSuccess.recommendations.map((r) => (
                  <div key={r.id} className="recommendation">
                    <h3>{r.title}</h3>
                    <p className="preserve-lines">{r.text}</p>
                    <DomainActionLink
                      value={r.action}
                      label="Mở chức năng liên quan"
                    />
                  </div>
                ))}
                <div className="notice">
                  <h3>Giới hạn cần lưu ý</h3>
                  {e.lastSuccess.limitations.map((v, i) => (
                    <p key={i}>{v}</p>
                  ))}
                </div>
                <p className="small muted metadata">
                  {e.lastSuccess.modelDisplayName} · Diễn giải lúc{" "}
                  {dateTime(e.lastSuccess.generatedAt)}
                </p>
              </>
            ) : (
              <p className="muted">
                Chưa có lời diễn giải AI hợp lệ cho bản dữ liệu này. Tổng hợp
                theo số liệu được trình bày riêng.
              </p>
            )}
          </Panel>
          {s.analysisType === "BOTTLENECK" && <FeedbackPanel value={d} />}
        </div>
      </div>
    </>
  );
}
