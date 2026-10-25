"use client";
import { Panel } from "@/components/ui/page";
import { dateTime, label, metricValue } from "@/lib/format";
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
import { DomainActionLink } from "./analysis-links";
export function AnalysisSources({
  snapshot,
}: {
  snapshot: AnalysisDto["snapshot"];
}) {
  return (
    <div className="analysis-sources">
      <Panel title="Chỉ số phân tích">
        {snapshot.context.length > 0 && (
          <dl className="analysis-context">
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
        )}
        {snapshot.metrics.map((m) => (
          <div key={m.id} className="measure-row" id={`metric-${m.id}`}>
            <div className="list-row">
              <span>{m.label}</span>
              <strong>{metricValue(m.value, m.unit)}</strong>
            </div>
          </div>
        ))}
        <details className="calculation-details">
          <summary>Ý nghĩa chỉ số</summary>
          {snapshot.metrics.map((m) => (
            <p key={m.id} className="small muted">
              <strong>{m.label}: </strong>
              {m.formula}
            </p>
          ))}
        </details>
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
      {snapshot.evidence.length > 0 && (
        <Panel title="Dữ liệu liên quan">
          {snapshot.evidence.map((ev, i) => (
            <div className="measure-row" id={`evidence-${ev.id}`} key={ev.id}>
              <p>{ev.label}</p>
              <p className="small muted">
                Căn cứ {i + 1} · {dateTime(ev.observedAt)}
              </p>
              <DomainActionLink value={ev.action} />
            </div>
          ))}
        </Panel>
      )}
    </div>
  );
}
