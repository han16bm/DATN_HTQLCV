"use client";

import { KeyValue, KeyValueList } from "@/components/patterns/key-value";
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

const anchorClass = "scroll-mt-[calc(var(--topbar-h)+16px)]";

export function AnalysisSources({
  snapshot,
}: {
  snapshot: AnalysisDto["snapshot"];
}) {
  return (
    <div className="grid min-w-0 gap-3">
      <Panel title="Chỉ số phân tích">
        {snapshot.context.length > 0 && (
          <KeyValueList className="mb-1">
            {snapshot.context.map((c) => (
              <KeyValue key={c.key} label={c.label}>
                {c.valueType === "UTC"
                  ? dateTime(c.value)
                  : c.value
                    ? label(c.value)
                    : "Chưa đủ dữ liệu"}
              </KeyValue>
            ))}
          </KeyValueList>
        )}
        {snapshot.metrics.map((m) => (
          <div
            key={m.id}
            id={`metric-${m.id}`}
            className={`${anchorClass} flex items-center justify-between gap-4 border-t border-line/70 py-2 text-sm`}
          >
            <span>{m.label}</span>
            <strong className="font-semibold tabular-nums">
              {metricValue(m.value, m.unit)}
            </strong>
          </div>
        ))}
        <details>
          <summary className="cursor-pointer py-1 text-sm font-medium text-selected-fg">
            Ý nghĩa chỉ số
          </summary>
          {snapshot.metrics.map((m) => (
            <p key={m.id} className="m-0 mt-1 text-xs text-fg-subtle">
              <strong>{m.label}: </strong>
              {m.formula}
            </p>
          ))}
        </details>
      </Panel>
      {snapshot.series.map((series) => (
        <Panel title={series.label} key={series.id}>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series.points}>
                <CartesianGrid vertical={false} stroke="#dde2ea" />
                <XAxis dataKey="date" fontSize="0.75rem" />
                <YAxis fontSize="0.75rem" width="auto" />
                <Tooltip />
                <Line
                  dataKey="value"
                  stroke="var(--color-action)"
                  strokeWidth={2}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      ))}
      {snapshot.evidence.length > 0 && (
        <Panel title="Dữ liệu liên quan">
          {snapshot.evidence.map((ev, i) => (
            <div
              className={`${anchorClass} grid gap-0.5 border-t border-line/70 pt-2 first:border-t-0 first:pt-0`}
              id={`evidence-${ev.id}`}
              key={ev.id}
            >
              <p className="m-0 text-sm">{ev.label}</p>
              <p className="m-0 text-xs text-fg-subtle">
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
