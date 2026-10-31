"use client";

import { Badge, DataTable, DetailLink } from "@/components/ui/page";
import { dateTime, hours } from "@/lib/format";
import type { ReactNode } from "react";
import { type ReportPreviewDto } from "../types/reports.types";
export function ReportNumbers({
  value,
  frozen = false,
  actions,
}: {
  value: ReportPreviewDto;
  frozen?: boolean;
  actions?: ReactNode;
}) {
  return (
    <DataTable
      title={frozen ? "Số liệu đã chốt" : "Số liệu từ nhật ký"}
      headerActions={actions}
      description={
        <p className="metadata">
          {frozen ? "Số liệu chốt tại" : "Số liệu nguồn tại"}{" "}
          {dateTime(value.dataAsOf)} · {hours(value.totalMinutes)}
          {value.partialPeriod && " · Kỳ chưa kết thúc"}
        </p>
      }
      actions
      widths={[38, 24, 20, 18]}
      headers={[
        frozen ? "Công việc tại lúc gửi" : "Công việc liên quan",
        frozen ? "Trạng thái tại lúc gửi" : "Trạng thái hiện tại",
        "Phút trong kỳ",
        "Hành động",
      ]}
      rows={value.items.map((t) => [
        <span key="title" className="task-name" title={t.title}>
          {t.title}
        </span>,
        <Badge key="status" value={t.status} />,
        String(t.minutes),
        <DetailLink
          key="detail"
          href={`/tasks/${t.taskId}`}
          label={`Xem công việc ${t.title}`}
        />,
      ])}
    />
  );
}
