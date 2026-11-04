"use client";

import { DataTable } from "@/components/patterns/data-table";
import { KeyValue, KeyValueList } from "@/components/patterns/key-value";
import { MetricStrip } from "@/components/patterns/metric";
import { EmptyState } from "@/components/ui/empty-state";
import { PageSkeleton } from "@/components/ui/loading";
import { StatusLozenge } from "@/components/ui/lozenge";
import { Panel, linkClass } from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { cn } from "@/lib/cn";
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

const basisText = (metric: MetricDto) =>
  `${metric.basis === "CURRENT" ? "Hiện tại" : "Trong kỳ"}${
    metric.denominator !== null ? ` · Tổng ${number(metric.denominator)}` : ""
  }`;

// Chỉ số chính: nhãn và lối vào phân tích chi tiết cùng một hàng, số lớn ở giữa, cơ
// sở tính nhỏ bên dưới.
function MetricCard({ metric }: { metric: MetricDto }) {
  return (
    <article
      aria-label={metric.label}
      className="grid min-w-0 content-start gap-1 bg-surface px-4 py-3"
    >
      <div className="flex items-baseline justify-between gap-2">
        <p className="m-0 min-w-0 text-xs font-medium text-fg-subtle">
          {metric.label}
        </p>
        <AnalysisLink
          value={metric.analysisRef}
          label={`Xem chỉ số ${metric.label}`}
        />
      </div>
      <p
        className={cn(
          "m-0 text-metric font-semibold tabular-nums",
          metric.value === null && "text-fg-subtlest",
        )}
      >
        {metricValue(metric.value, metric.unit)}
      </p>
      <p className="m-0 text-xs text-fg-subtle">{basisText(metric)}</p>
    </article>
  );
}

const chartGrid = "var(--color-line)";

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
          <p className="mb-2 text-xs text-fg-subtle">
            Cập nhật {dateTime(query.data.metadata.dataAsOf)}
            · <StatusLozenge
              value={query.data.metadata.quality.status}
            /> ·{" "}
            <AnalysisLink
              value={query.data.overviewRef}
              label="Mở phân tích tổng quan"
            />
          </p>
          <MetricStrip aria-label="Chỉ số tổng quan">
            {["K03", "K04", "K06", "K12"].map((code) => {
              const m = data?.metrics.find((m) => m.code === code);
              return m ? <MetricCard key={m.code} metric={m} /> : null;
            })}
          </MetricStrip>
          <div className="mb-5 grid items-start gap-5 @min-[900px]/page:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <Panel title="Công việc theo trạng thái">
              <div
                className="h-60 w-full"
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
                    <CartesianGrid horizontal={false} stroke={chartGrid} />
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
                      fill="var(--color-action)"
                      maxBarSize={20}
                      radius={[0, 3, 3, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="m-0 text-xs text-fg-subtle">
                {query.data.totalTasks} công việc
              </p>
              <details>
                <summary className="cursor-pointer py-1 text-sm font-medium text-selected-fg">
                  Xem số liệu trạng thái
                </summary>
                <DataTable
                  loading={query.isFetching}
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
                <EmptyState message="Chưa có hoạt động hoàn thành hoặc nộp kết quả trong kỳ." />
              ) : (
                <div
                  className="h-60 w-full"
                  role="img"
                  aria-label="Xu hướng hoàn thành và số lần nộp"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={query.data.trend}>
                      <CartesianGrid vertical={false} stroke={chartGrid} />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(d) => String(d).slice(5)}
                        fontSize={12}
                      />
                      <YAxis allowDecimals={false} fontSize={12} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="linear"
                        dataKey="completedCount"
                        name="Hoàn thành"
                        stroke="var(--color-action)"
                        strokeWidth={2}
                        connectNulls={false}
                      />
                      <Line
                        type="linear"
                        dataKey="submissionCount"
                        name="Lần nộp"
                        stroke="var(--color-warning-fg)"
                        strokeDasharray="4 4"
                        strokeWidth={2}
                        connectNulls={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Panel>
          </div>
          <DataTable
            loading={query.isFetching}
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
                className={linkClass}
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
          <div className="grid items-start gap-5 @min-[900px]/page:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <Panel title="Giờ công và ước lượng">
              <KeyValueList>
                <KeyValue label="Giờ công thực tế">
                  {hours(query.data.timeVariance.actualMinutes)}
                </KeyValue>
                <KeyValue label="Ước lượng hiện tại">
                  {hours(query.data.timeVariance.currentEstimateMinutes)}
                </KeyValue>
                <KeyValue label="Ước lượng ban đầu">
                  {hours(query.data.timeVariance.originalEstimateMinutes)}
                </KeyValue>
                <KeyValue label="Chênh lệch so với ước lượng hiện tại">
                  {hours(query.data.timeVariance.deltaCurrentMinutes)}
                </KeyValue>
                <KeyValue label="Chênh lệch so với ước lượng ban đầu">
                  {hours(query.data.timeVariance.deltaOriginalMinutes)}
                </KeyValue>
                <KeyValue label="Nộp kết quả trong kỳ">
                  Đúng hạn: {query.data.submissionTimeliness.onTimeCount} · Trễ
                  hạn: {query.data.submissionTimeliness.lateCount} (tổng{" "}
                  {query.data.submissionTimeliness.denominator})
                </KeyValue>
                <KeyValue label="Báo cáo đã gửi">
                  Ngày: {query.data.reporting.submittedDaily} · Tuần:{" "}
                  {query.data.reporting.submittedWeekly}
                </KeyValue>
              </KeyValueList>
              <p className="m-0 text-xs text-fg-subtle">
                Chênh lệch giờ công chưa đủ để đánh giá năng lực nhân sự. Chưa
                có lịch yêu cầu nộp báo cáo nên chưa xác định được tỷ lệ nộp đủ.
              </p>
            </Panel>
            <Panel title="Chỉ số bổ sung">
              <dl className="m-0 grid gap-x-6 @min-[700px]/page:grid-cols-2">
                {query.data.metrics
                  .filter((m) => !["K03", "K04", "K06", "K12"].includes(m.code))
                  .map((m) => (
                    <div
                      key={m.code}
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 border-b border-line/70 py-2 text-sm"
                    >
                      <dt className="min-w-0 text-fg">
                        {m.label}
                        <span className="block text-xs text-fg-subtle">
                          {basisText(m)}
                        </span>
                      </dt>
                      <dd className="m-0 text-right font-semibold tabular-nums">
                        {metricValue(m.value, m.unit)}
                      </dd>
                      <dd className="col-span-full m-0 text-left text-xs">
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
