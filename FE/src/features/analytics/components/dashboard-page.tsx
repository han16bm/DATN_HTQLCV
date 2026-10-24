"use client";
import { Badge, DataTable, Loading, Panel } from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { dateTime, hours, label, number } from "@/lib/format";
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
import { AnalysisLink, metricValue } from "./analysis-links";
import { AnalyticsFrame } from "./analytics-frame";

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
        <Loading />
      ) : (
        <>
          <p className="metadata">
            Dữ liệu đến {dateTime(query.data.metadata.dataAsOf)} · Giờ Việt Nam
            · <Badge value={query.data.metadata.quality.status} /> ·{" "}
            <AnalysisLink
              value={query.data.overviewRef}
              label="Mở phân tích tổng quan"
            />
          </p>
          <div className="metric-grid">
            {["K03", "K04", "K06", "K12"].map((code) => {
              const m = data?.metrics.find((m) => m.code === code);
              return m ? (
                <Panel key={m.code}>
                  <p className="muted">{m.label}</p>
                  <p className="metric-value">{metricValue(m.value, m.unit)}</p>
                  <p className="small muted">
                    {m.basis === "CURRENT"
                      ? "Hiện trạng tại mốc dữ liệu"
                      : "Theo kỳ đã chọn"}
                    {m.denominator !== null
                      ? ` · Mẫu scopeố ${number(m.denominator)}`
                      : ""}
                  </p>
                  <AnalysisLink value={m.analysisRef} />
                </Panel>
              ) : null;
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
              <p className="small muted">
                {query.data.totalTasks} công việc; nhóm đã hủy thể hiện riêng.
              </p>
              <details>
                <summary>Xem scopeố liệu trạng thái</summary>
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
              <p className="small muted">
                Chỉ hiển thị ngày có dữ liệu nguồn được xác nhận trong kỳ.
              </p>
              <div
                className="chart"
                role="img"
                aria-label="Xu hướng hoàn thành và scopeố lần nộp"
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
            </Panel>
          </div>
          <Panel title="So scopeánh dự án">
            <DataTable
              headers={[
                "Dự án",
                "Công việc được tính",
                "Hoàn thành",
                "Quá hạn",
                "Giờ công trong kỳ",
                "Phân tích",
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
          </Panel>
          <Panel title="Giờ công và dự kiến">
            <div className="two-column">
              <dl>
                <dt>Thực tế của nhóm công việc hiện tại</dt>
                <dd>{hours(query.data.timeVariance.actualMinutes)}</dd>
                <dt>Dự kiến hiện tại</dt>
                <dd>{hours(query.data.timeVariance.currentEstimateMinutes)}</dd>
                <dt>Dự kiến gốc</dt>
                <dd>
                  {hours(query.data.timeVariance.originalEstimateMinutes)}
                </dd>
              </dl>
              <dl>
                <dt>Chênh lệch so hiện tại / gốc</dt>
                <dd>
                  {hours(query.data.timeVariance.deltaCurrentMinutes)} /{" "}
                  {hours(query.data.timeVariance.deltaOriginalMinutes)}
                </dd>
                <dt>Số lần nộp trong kỳ: đúng hạn / muộn</dt>
                <dd>
                  {query.data.submissionTimeliness.onTimeCount} /{" "}
                  {query.data.submissionTimeliness.lateCount} (tổng{" "}
                  {query.data.submissionTimeliness.denominator})
                </dd>
                <dt>Báo cáo ngày / tuần đã gửi</dt>
                <dd>
                  {query.data.reporting.submittedDaily} /{" "}
                  {query.data.reporting.submittedWeekly}
                </dd>
              </dl>
            </div>
            <p className="small muted">
              Chênh lệch thời gian chưa đủ căn cứ đánh giá năng lực. Chưa có
              lịch yêu cầu báo cáo nên chưa tính tỷ lệ gửi đủ.
            </p>
          </Panel>
          <Panel title="Các chỉ scopeố khác">
            <div className="metric-grid compact">
              {query.data.metrics
                .filter((m) => !["K03", "K04", "K06", "K12"].includes(m.code))
                .map((m) => (
                  <div className="metric-cell" key={m.code}>
                    <p className="small muted">
                      {m.code} · {m.label}
                    </p>
                    <p className="metric-secondary">
                      {metricValue(m.value, m.unit)}
                    </p>
                    <p className="small muted">
                      {m.basis === "CURRENT" ? "Hiện trạng" : "Trong kỳ"}
                      {m.denominator !== null
                        ? ` · Mẫu scopeố ${m.denominator}`
                        : ""}
                    </p>
                    <AnalysisLink value={m.analysisRef} />
                  </div>
                ))}
            </div>
          </Panel>
        </>
      )}
    </AnalyticsFrame>
  );
}
