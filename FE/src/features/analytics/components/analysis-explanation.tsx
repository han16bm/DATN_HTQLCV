"use client";

import { dateTime } from "@/lib/format";
import type { AnalysisDto } from "../types/analytics.types";
import { DomainActionLink } from "./analysis-links";
export function AnalysisExplanation({
  snapshot,
  value,
}: {
  snapshot: AnalysisDto["snapshot"];
  value: AnalysisDto["explanation"]["lastSuccess"];
}) {
  return value ? (
    <>
      <p className="preserve-lines">{value.summary}</p>
      {value.findings.map((f) => (
        <div className="measure-row" key={f.id}>
          <h3>{f.title}</h3>
          <p className="preserve-lines">{f.text}</p>
          <div className="citation-links">
            {f.metricIds.map((id) => (
              <a className="text-link" key={id} href={`#metric-${id}`}>
                {snapshot.metrics.find((m) => m.id === id)?.label ?? "Chỉ số"}
              </a>
            ))}
            {f.evidenceIds.map((id) => (
              <a className="text-link" key={id} href={`#evidence-${id}`}>
                Căn cứ {snapshot.evidence.findIndex((ev) => ev.id === id) + 1}
              </a>
            ))}
          </div>
        </div>
      ))}
      {value.recommendations.length > 0 && (
        <h3 className="section-gap">Đề xuất</h3>
      )}
      {value.recommendations.map((r) => (
        <div key={r.id} className="recommendation">
          <h3>{r.title}</h3>
          <p className="preserve-lines">{r.text}</p>
          <DomainActionLink value={r.action} label="Mở chức năng liên quan" />
        </div>
      ))}
      <details className="analysis-limitations">
        <summary>Lưu ý khi sử dụng</summary>
        {value.limitations.map((v, i) => (
          <p key={i}>{v}</p>
        ))}
      </details>
      <p className="small muted metadata">
        {value.modelDisplayName} · Diễn giải lúc {dateTime(value.generatedAt)}
      </p>
    </>
  ) : null;
}
