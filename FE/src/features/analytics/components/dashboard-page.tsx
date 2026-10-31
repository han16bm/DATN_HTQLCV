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
      <h3>{metric.label}</h3>
      <p
        className={`metric-number ${metric.value === null ? "metric-missing" : ""}`}
      >
        {metricValue(metric.value, metric.unit)}
      </p>
      <p className="metric-context small muted">
        {metric.basis === "CURRENT" ? "Hiện tại" : "Trong kỳ"}
        {metric.denominator !== null
          ? ` · Tổng ${number(metric.denominator)}`
          : ""}
      </p>
      <AnalysisLink
        value={metric.analysisRef}
        label={`Xem chỉ số ${metric.label}`}
      />
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
        <QueryErrorState error={query.error} retry={query.refetch} />
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
          <section
            className="metric-grid analytics-stats"
            aria-label="Chỉ số tổng quan"
          >
            {["K03", "K04", "K06", "K12"].map((code) => {
              const m = data?.metrics.find((m) => m.code === code);
              return m ? <MetricCard key={m.code} metric={m} /> : null;
            })}
          </section>
          <div className="two-column analytics-charts">
            <Panel title="Công việc theo trạng thái">
              <div
                className="chart"
                role="img"
                aria-label="Phân bố công việc theo trạng thái"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={query.data.byStatus.map((row) => ({
                      ...row,
                      name: label(row.status),
                    }))}
                    margin={{ top: 4, right: 16, bottom: 4, left: 0 }}
                  >
                    <CartesianGrid horizontal={false} stroke="#e0e5eb" />
                    <XAxis
                      type="number"
                      fontSize={12}
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      fontSize={12}
                      interval={0}
                      width={116}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip />
                    <Bar
                      dataKey="count"
                      name="Số công việc"
                      fill="#0c66e4"
                      maxBarSize={22}
                      radius={[0, 3, 3, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="small muted">{query.data.totalTasks} công việc</p>
              <details>
                <summary>Xem số liệu trạng thái</summary>
                <DataTable
                  widths={[70, 30]}
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
                        fontSize={12}
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
            widths={[28, 17, 13, 10, 18, 14]}
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
          <div className="analytics-summary">
            <Panel className="analytics-effort" title="Giờ công và ước lượng">
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
                <div>
                  <dt>Chênh lệch so với ước lượng hiện tại</dt>
                  <dd>{hours(query.data.timeVariance.deltaCurrentMinutes)}</dd>
                </div>
                <div>
                  <dt>Chênh lệch so với ước lượng ban đầu</dt>
                  <dd>{hours(query.data.timeVariance.deltaOriginalMinutes)}</dd>
                </div>
                <div className="wide">
                  <dt>Nộp kết quả trong kỳ</dt>
                  <dd>
                    Đúng hạn: {query.data.submissionTimeliness.onTimeCount} ·
                    Trễ hạn: {query.data.submissionTimeliness.lateCount} (tổng{" "}
                    {query.data.submissionTimeliness.denominator})
                  </dd>
                </div>
                <div className="wide">
                  <dt>Báo cáo đã gửi</dt>
                  <dd>
                    Ngày: {query.data.reporting.submittedDaily} · Tuần:{" "}
                    {query.data.reporting.submittedWeekly}
                  </dd>
                </div>
              </dl>
              <p className="small muted">
                Chênh lệch giờ công chưa đủ để đánh giá năng lực nhân sự. Chưa
                có lịch yêu cầu nộp báo cáo nên chưa xác định được tỷ lệ nộp đủ.
              </p>
            </Panel>
            <Panel title="Chỉ số bổ sung" className="analytics-metrics">
              <dl className="metric-list">
                {query.data.metrics
                  .filter((m) => !["K03", "K04", "K06", "K12"].includes(m.code))
                  .map((m) => (
                    <div key={m.code}>
                      <dt>
                        {m.label}
                        <span className="small muted">
                          {m.basis === "CURRENT" ? "Hiện tại" : "Trong kỳ"}
                          {m.denominator !== null
                            ? ` · Tổng ${number(m.denominator)}`
                            : ""}
                        </span>
                      </dt>
                      <dd className="metric-value">
                        {metricValue(m.value, m.unit)}
                      </dd>
                      <dd>
                        <AnalysisLink
                          value={m.analysisRef}
                          label={`Xem chỉ số ${m.label}`}
                        />
                      </dd>
                    </div>
                  ))}
              </dl>
            </Panel>
          </div>
        </>
      )}
    </AnalyticsFrame>
  );
}
