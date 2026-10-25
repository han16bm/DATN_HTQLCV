"use client";
import { Badge } from "@/components/ui/page";
import { type AnalysisMetaDto } from "@/features/analytics/types/analytics.types";
import { dateTime } from "@/lib/format";
export function Metadata({ value }: { value: AnalysisMetaDto }) {
  return (
    <p className="metadata">
      Cập nhật {dateTime(value.dataAsOf)} ·{" "}
      <Badge value={value.quality.status} />
    </p>
  );
}
