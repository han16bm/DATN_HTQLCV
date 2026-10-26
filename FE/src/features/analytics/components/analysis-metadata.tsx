"use client";

import { Badge } from "@/components/ui/page";
import { dateTime } from "@/lib/format";
import { type AnalysisMetaDto } from "../types/analytics.types";
export function Metadata({ value }: { value: AnalysisMetaDto }) {
  return (
    <p className="metadata">
      Cập nhật {dateTime(value.dataAsOf)} ·{" "}
      <Badge value={value.quality.status} />
    </p>
  );
}
