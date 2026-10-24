"use client";
import { Panel } from "@/components/ui/page";
import { dateTime, label } from "@/lib/format";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AnalysisDto } from "../types/analytics.types";
import { DomainActionLink, metricValue } from "./analysis-links";
export function AnalysisSources({
  snapshot,
  summary,
}: {
  snapshot: AnalysisDto["snapshot"];
  summary: string;
}) {
  return (
    <div className="analysis-sources">
      <Panel title="Bối cảnh phân tích">
        <dl>
          {snapshot.context.map((c) => (
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
        {!snapshot.context.length && (
          <p>
            Phạm vi {snapshot.scope.projectId ? "dự án" : "đơn vị"} ·{" "}
            {snapshot.scope.from} – {snapshot.scope.to}.
          </p>
        )}
      </Panel>
      <Panel title="Thông số và cách tính">
        {snapshot.metrics.map((m) => (
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
      {snapshot.series.map((series) => (
        <Panel title={series.label} key={series.id}>
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series.points}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line dataKey="value" stroke="#365b85" connectNulls={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      ))}
      <Panel title="Dữ liệu căn cứ">
        <p className="small muted">
          Nguồn được giới hạn theo quyền truy cập và mốc dữ liệu.
        </p>
        {snapshot.evidence.map((ev, i) => (
          <div className="measure-row" id={`evidence-${ev.id}`} key={ev.id}>
            <p>{ev.label}</p>
            <p className="small muted">
              Căn cứ {i + 1} · {dateTime(ev.observedAt)}
            </p>
            <DomainActionLink value={ev.action} />
          </div>
        ))}
        {!snapshot.evidence.length && (
          <p className="muted">
            Thông số tổng hợp theo công thức; bản này không có liên kết nguồn
            chi tiết.
          </p>
        )}
      </Panel>
      <Panel title="Tổng hợp theo số liệu">
        <p className="preserve-lines">{summary}</p>
      </Panel>
    </div>
  );
}
