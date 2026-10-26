"use client";

import { PageSkeleton } from "@/components/ui/loading";
import { Badge, DataTable, Empty, Panel } from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { dateTime, hours, label, metricValue, number } from "@/lib/format";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useGetDashboardQuery } from "../hooks/use-analytics-queries";
import { useAnalyticsScope } from "../hooks/use-analytics-scope";
import type { MetricDto } from "../types/analytics.types";
import { AnalysisLink } from "./analysis-links";
import { AnalyticsFrame } from "./analytics-frame";

function MetricCard({ metric }: { metric: MetricDto }) {
  return (
    <article className="metric-card" aria-label={metric.label}>
      <div className="metric-heading">
        <h3>{metric.label}</h3>
        <AnalysisLink
          value={metric.analysisRef}
          label={`Xem chỉ số ${metric.label}`}
        />
      </div>
      <p
        className={`metric-number ${metric.value === null ? "metric-missing" : ""}`}
      >
        {metricValue(metric.value, metric.unit)}
      </p>
      <p className="small muted">
        {metric.basis === "CURRENT" ? "Hiện tại" : "Trong kỳ"}
        {metric.denominator !== null
          ? ` · Tổng ${number(metric.denominator)}`
          : ""}
      </p>
    </article>
  );
}

export function DashboardPage() {
  const scope = useAnalyticsScope();
  const query = useGetDashboardQuery(scope.query, {
    enabled: scope.parsed.success,
  });
  const data = query.data;
  return (
    <AnalyticsFrame scope={scope} title="Bảng tổng quan">
      {query.isError ? (
        <QueryErrorState
          error={query.error}
          retry={() => void query.refetch()}
        />
      ) : !query.data ? (
        <PageSkeleton variant="cards" />
      ) : (
        <>
          <p className="metadata">
            Cập nhật {dateTime(query.data.metadata.dataAsOf)}
            · <Badge value={query.data.metadata.quality.status} /> ·{" "}
            <AnalysisLink
              value={query.data.overviewRef}
              label="Mở phân tích tổng quan"
            />
          </p>
          <div className="metric-grid">
            {["K03", "K04", "K06", "K12"].map((code) => {
              const m = data?.metrics.find((m) => m.code === code);
              return m ? <MetricCard key={m.code} metric={m} /> : null;
            })}
          </div>
          <div className="two-column">
            <Panel title="Công việc theo trạng thái">
              <div
                className="chart"
                role="img"
                aria-label="Phân bố công việc theo trạng thái"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={query.data.byStatus.map((row) => ({
                      ...row,
                      name: label(row.status),
                    }))}
                    margin={{ bottom: 50, left: -20 }}
                  >
                    <CartesianGrid vertical={false} stroke="#e0e5eb" />
                    <XAxis
                      dataKey="name"
                      fontSize={11}
                      interval={0}
                      angle={-18}
                      textAnchor="end"
                    />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar
                      dataKey="count"
                      name="Số công việc"
                      fill="#829db8"
                      radius={[3, 3, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="small muted">{query.data.totalTasks} công việc</p>
              <details>
                <summary>Xem số liệu trạng thái</summary>
                <DataTable
                  headers={["Trạng thái", "Số việc"]}
                  rows={query.data.byStatus.map((row) => [
                    label(row.status),
                    String(row.count),
                  ])}
                />
              </details>
            </Panel>
            <Panel title="Hoàn thành và nộp kết quả">
              {!query.data.trend.length ? (
                <Empty message="Chưa có hoạt động hoàn thành hoặc nộp kết quả trong kỳ." />
              ) : (
                <div
                  className="chart"
                  role="img"
                  aria-label="Xu hướng hoàn thành và số lần nộp"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={query.data.trend}>
                      <CartesianGrid vertical={false} stroke="#e0e5eb" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(d) => String(d).slice(5)}
                        fontSize={11}
                      />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="linear"
                        dataKey="completedCount"
                        name="Hoàn thành"
                        stroke="#365b85"
                        connectNulls={false}
                      />
                      <Line
                        type="linear"
                        dataKey="submissionCount"
                        name="Lần nộp"
                        stroke="#839782"
                        strokeDasharray="4 4"
                        connectNulls={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Panel>
          </div>
          <DataTable
            title="So sánh dự án"
            actions
            headers={[
              "Dự án",
              "Công việc theo dõi",
              "Hoàn thành",
              "Quá hạn",
              "Giờ công trong kỳ",
              "Hành động",
            ]}
            rows={query.data.projectComparisons.map((p) => [
              <Link
                className="text-link"
                key={p.projectId}
                href={`/projects/${p.projectId}`}
              >
                {p.projectName}
              </Link>,
              String(p.validTaskCount),
              number(p.completionRate, "%"),
              String(p.overdueCount),
              hours(p.actualMinutes),
              <AnalysisLink key="analysis" value={p.analysisRef} />,
            ])}
          />
          <Panel title="Giờ công và ước lượng">
            <div className="two-column">
              <dl>
                <div>
                  <dt>Giờ công thực tế</dt>
                  <dd>{hours(query.data.timeVariance.actualMinutes)}</dd>
                </div>
                <div>
                  <dt>Ước lượng hiện tại</dt>
                  <dd>
                    {hours(query.data.timeVariance.currentEstimateMinutes)}
                  </dd>
                </div>
                <div>
                  <dt>Ước lượng ban đầu</dt>
                  <dd>
                    {hours(query.data.timeVariance.originalEstimateMinutes)}
                  </dd>
                </div>
              </dl>
              <dl>
                <div>
                  <dt>Chênh lệch so với ước lượng hiện tại</dt>
                  <dd>{hours(query.data.timeVariance.deltaCurrentMinutes)}</dd>
                </div>
                <div>
                  <dt>Chênh lệch so với ước lượng ban đầu</dt>
                  <dd>{hours(query.data.timeVariance.deltaOriginalMinutes)}</dd>
                </div>
                <div>
                  <dt>Nộp kết quả trong kỳ</dt>
                  <dd>
                    Đúng hạn: {query.data.submissionTimeliness.onTimeCount} ·
                    Trễ hạn: {query.data.submissionTimeliness.lateCount} (tổng{" "}
                    {query.data.submissionTimeliness.denominator})
                  </dd>
                </div>
                <div>
                  <dt>Báo cáo đã gửi</dt>
                  <dd>
                    Ngày: {query.data.reporting.submittedDaily} · Tuần:{" "}
                    {query.data.reporting.submittedWeekly}
                  </dd>
                </div>
              </dl>
            </div>
            <p className="small muted">
              Chênh lệch giờ công chưa đủ để đánh giá năng lực nhân sự. Chưa có
              lịch yêu cầu nộp báo cáo nên chưa xác định được tỷ lệ nộp đủ.
            </p>
          </Panel>
          <Panel title="Các chỉ số khác">
            <div className="metric-grid compact">
              {query.data.metrics
                .filter((m) => !["K03", "K04", "K06", "K12"].includes(m.code))
                .map((m) => (
                  <MetricCard key={m.code} metric={m} />
                ))}
            </div>
          </Panel>
        </>
      )}
    </AnalyticsFrame>
  );
}
