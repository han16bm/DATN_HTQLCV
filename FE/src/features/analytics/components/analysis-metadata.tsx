"use client";

import { StatusLozenge } from "@/components/ui/lozenge";
import { dateTime } from "@/lib/format";
import { type AnalysisMetaDto } from "../types/analytics.types";
export function Metadata({ value }: { value: AnalysisMetaDto }) {
  return (
    <p className="mb-3 text-xs text-fg-subtle">
      Cập nhật {dateTime(value.dataAsOf)} ·{" "}
      <StatusLozenge value={value.quality.status} />
    </p>
  );
}
