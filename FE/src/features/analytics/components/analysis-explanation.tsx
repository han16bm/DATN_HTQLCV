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
      <h3 className="section-gap">Đề xuất để xem xét</h3>
      {value.recommendations.map((r) => (
        <div key={r.id} className="recommendation">
          <h3>{r.title}</h3>
          <p className="preserve-lines">{r.text}</p>
          <DomainActionLink value={r.action} label="Mở chức năng liên quan" />
        </div>
      ))}
      <div className="notice">
        <h3>Giới hạn cần lưu ý</h3>
        {value.limitations.map((v, i) => (
          <p key={i}>{v}</p>
        ))}
      </div>
      <p className="small muted metadata">
        {value.modelDisplayName} · Diễn giải lúc {dateTime(value.generatedAt)}
      </p>
    </>
  ) : (
    <p className="muted">
      Chưa có lời diễn giải AI hợp lệ cho bản dữ liệu này. Tổng hợp theo số liệu
      được trình bày riêng.
    </p>
  );
}
