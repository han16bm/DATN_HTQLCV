"use client";

import { linkClass } from "@/components/ui/page";
import { dateTime, metricValue } from "@/lib/format";
import type { AnalysisDto } from "../types/analytics.types";
import { DomainActionLink } from "./analysis-links";

const proseClass = "m-0 text-sm leading-relaxed whitespace-pre-wrap text-fg";
const titleClass = "m-0 text-sm font-semibold text-fg";
const chipClass =
  "inline-flex max-w-full items-baseline gap-1.5 rounded-full border border-line bg-sunken px-2.5 py-0.5 text-xs text-fg no-underline transition-colors duration-200 ease-out hover:border-selected-fg hover:bg-selected-bg";

type Snapshot = AnalysisDto["snapshot"];

function EvidenceRefs({
  snapshot,
  ids,
  label,
}: {
  snapshot: Snapshot;
  ids: string[];
  label: string;
}) {
  const refs = ids
    .map((id) => ({
      id,
      index: snapshot.evidence.findIndex((ev) => ev.id === id),
    }))
    .filter((ref) => ref.index >= 0);
  if (refs.length === 0) return null;
  return (
    <p className="m-0 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs text-fg-subtle">
      <span>{label}:</span>
      {refs.map((ref) => (
        <a key={ref.id} className={linkClass} href={`#evidence-${ref.id}`}>
          Căn cứ {ref.index + 1}
        </a>
      ))}
    </p>
  );
}

function MetricChips({ snapshot, ids }: { snapshot: Snapshot; ids: string[] }) {
  const metrics = ids
    .map((id) => snapshot.metrics.find((m) => m.id === id))
    .filter((m) => m !== undefined);
  if (metrics.length === 0) return null;
  return (
    <ul
      aria-label="Chỉ số được trích dẫn"
      className="m-0 flex list-none flex-wrap gap-1.5 p-0"
    >
      {metrics.map((m) => (
        <li key={m.id} className="max-w-full">
          <a className={chipClass} href={`#metric-${m.id}`}>
            <span className="truncate text-fg-subtle">{m.label}</span>
            <strong className="font-semibold whitespace-nowrap tabular-nums">
              {metricValue(m.value, m.unit)}
            </strong>
          </a>
        </li>
      ))}
    </ul>
  );
}

export function AnalysisExplanation({
  snapshot,
  value,
}: {
  snapshot: Snapshot;
  value: AnalysisDto["explanation"]["lastSuccess"];
}) {
  if (!value) return null;
  const limitedData = snapshot.quality.status !== "SUFFICIENT";
  return (
    <div className="grid gap-3">
      <p className={proseClass}>{value.summary}</p>
      {value.findings.map((f) => (
        <div className="grid gap-1.5 border-t border-line pt-3" key={f.id}>
          <h3 className={titleClass}>{f.title}</h3>
          <p className={proseClass}>{f.text}</p>
          <MetricChips snapshot={snapshot} ids={f.metricIds} />
          <EvidenceRefs
            snapshot={snapshot}
            ids={f.evidenceIds}
            label="Căn cứ"
          />
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
          <EvidenceRefs
            snapshot={snapshot}
            ids={r.evidenceIds}
            label="Dựa trên"
          />
          <DomainActionLink value={r.action} label="Mở chức năng liên quan" />
        </div>
      ))}
      {value.limitations.length > 0 && (
        <details open={limitedData}>
          <summary className="cursor-pointer py-0.5 text-sm font-medium text-selected-fg">
            Lưu ý khi sử dụng
          </summary>
          <ul className="m-0 mt-1 grid list-disc gap-1 pl-5 text-sm text-fg-subtle">
            {value.limitations.map((v, i) => (
              <li key={i}>{v}</li>
            ))}
          </ul>
        </details>
      )}
      <p className="m-0 border-t border-line pt-2 text-xs text-fg-subtle">
        Nội dung do AI diễn giải từ các chỉ số và căn cứ của bản dữ liệu này;
        hãy đối chiếu trước khi ra quyết định. Diễn giải lúc{" "}
        {dateTime(value.generatedAt)}.
      </p>
    </div>
  );
}
