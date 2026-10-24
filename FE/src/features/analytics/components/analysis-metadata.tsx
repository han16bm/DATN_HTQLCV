"use client";
import { Badge } from "@/components/ui/page";
import { type AnalysisMetaDto } from "@/features/analytics/types/analytics.types";
import { dateTime } from "@/lib/format";
export function Metadata({ value }: { value: AnalysisMetaDto }) {
  return (
    <p className="metadata">
      Dữ liệu đến {dateTime(value.dataAsOf)} · Quy tắc nghiệp vụ{" "}
      {value.calculationVersion} · <Badge value={value.quality.status} />
    </p>
  );
}
