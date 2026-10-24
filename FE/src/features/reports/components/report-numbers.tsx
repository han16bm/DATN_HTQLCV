"use client";
import { Badge, DataTable } from "@/components/ui/page";
import { type ReportPreviewDto } from "@/features/reports/types/reports.types";
import { dateTime, hours } from "@/lib/format";
import Link from "next/link";
export function ReportNumbers({
  value,
  frozen = false,
}: {
  value: ReportPreviewDto;
  frozen?: boolean;
}) {
  return (
    <>
      <p className="metadata">
        {frozen ? "Số liệu chốt tại" : "Số liệu nguồn tại"}{" "}
        {dateTime(value.dataAsOf)} · Giờ Việt Nam · {hours(value.totalMinutes)}
        {value.partialPeriod && " · Kỳ chưa kết thúc"}
      </p>
      {frozen && (
        <p className="small muted">
          Mở công việc dẫn tới dữ liệu hiện tại; bảng này giữ trạng thái tại lúc
          gửi.
        </p>
      )}
      <DataTable
        headers={[
          frozen ? "Công việc tại lúc gửi" : "Công việc liên quan",
          frozen ? "Trạng thái tại lúc gửi" : "Trạng thái hiện tại",
          "Phút trong kỳ",
        ]}
        rows={value.items.map((t) => [
          <Link
            key={t.taskId}
            className="text-link"
            href={`/tasks/${t.taskId}`}
          >
            {t.title}
          </Link>,
          <Badge key="status" value={t.status} />,
          String(t.minutes),
        ])}
      />
    </>
  );
}
