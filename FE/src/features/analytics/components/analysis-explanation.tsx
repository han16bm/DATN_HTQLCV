"use client";

import { linkClass } from "@/components/ui/page";
import { dateTime } from "@/lib/format";
import type { AnalysisDto } from "../types/analytics.types";
import { DomainActionLink } from "./analysis-links";

const proseClass = "m-0 text-sm leading-relaxed whitespace-pre-wrap text-fg";
const titleClass = "m-0 text-sm font-semibold text-fg";

export function AnalysisExplanation({
  snapshot,
  value,
}: {
  snapshot: AnalysisDto["snapshot"];
  value: AnalysisDto["explanation"]["lastSuccess"];
}) {
  return value ? (
    <div className="grid gap-3">
      <p className={proseClass}>{value.summary}</p>
      {value.findings.map((f) => (
        <div className="grid gap-1 border-t border-line pt-3" key={f.id}>
          <h3 className={titleClass}>{f.title}</h3>
          <p className={proseClass}>{f.text}</p>
          {(f.metricIds.length > 0 || f.evidenceIds.length > 0) && (
            <details>
              <summary className="cursor-pointer py-0.5 text-xs font-medium text-selected-fg">
                Căn cứ tham chiếu ({f.metricIds.length + f.evidenceIds.length})
              </summary>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm">
                {f.metricIds.map((id) => (
                  <a key={id} className={linkClass} href={`#metric-${id}`}>
                    {snapshot.metrics.find((m) => m.id === id)?.label ??
                      "Chỉ số"}
                  </a>
                ))}
                {f.evidenceIds.map((id) => (
                  <a key={id} className={linkClass} href={`#evidence-${id}`}>
                    Căn cứ{" "}
                    {snapshot.evidence.findIndex((ev) => ev.id === id) + 1}
                  </a>
                ))}
              </div>
            </details>
          )}
        </div>
      ))}
      {value.recommendations.length > 0 && (
        <h3 className="m-0 border-t border-line pt-3 text-sm font-semibold text-fg">
          Đề xuất
        </h3>
      )}
      {value.recommendations.map((r) => (
        <div
          key={r.id}
          className="grid gap-1 rounded-lg border border-info-fg/25 bg-info-bg/60 p-2.5"
        >
          <h3 className={titleClass}>{r.title}</h3>
          <p className={proseClass}>{r.text}</p>
          <DomainActionLink value={r.action} label="Mở chức năng liên quan" />
        </div>
      ))}
      <details>
        <summary className="cursor-pointer py-0.5 text-sm font-medium text-selected-fg">
          Lưu ý khi sử dụng
        </summary>
        <div className="mt-1 grid gap-1 text-sm text-fg-subtle">
          {value.limitations.map((v, i) => (
            <p key={i} className="m-0">
              {v}
            </p>
          ))}
        </div>
      </details>
      <p className="m-0 text-xs text-fg-subtle">
        Diễn giải lúc {dateTime(value.generatedAt)}
      </p>
    </div>
  ) : null;
}
