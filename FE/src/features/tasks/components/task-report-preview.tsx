"use client";

import { PageSkeleton } from "@/components/ui/loading";
import { Panel, StatusField } from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { AttachmentViewer } from "@/features/attachments/components/attachment-viewer";
import {
  useGetSubmissionQuery,
  useListSubmissionsQuery,
} from "@/features/submissions/hooks/use-submissions-queries";
import { dateTime } from "@/lib/format";
import { useState } from "react";

// Quản lý xem báo cáo PDF ngay ở chi tiết công việc. Mặc định là lần nộp mới
// nhất; công việc nộp nhiều lần thì chọn lần cần xem bằng dropdown.
export function TaskReportPreview({
  taskId,
  submissionId,
}: {
  taskId: string;
  submissionId: string;
}) {
  const [picked, setPicked] = useState<string>();
  const selected = picked ?? submissionId;
  const list = useListSubmissionsQuery(taskId, { pageSize: 100 });
  const query = useGetSubmissionQuery(taskId, selected);
  if (query.isError)
    return (
      <Panel title="Báo cáo kết quả">
        <QueryErrorState
          error={query.error}
          retry={() => void query.refetch()}
        />
      </Panel>
    );
  if (!query.data)
    return (
      <Panel title="Báo cáo kết quả">
        <PageSkeleton />
      </Panel>
    );
  const s = query.data;
  // Chưa tải được danh sách thì vẫn xem được lần nộp mới nhất.
  const rows = list.data?.items.length
    ? list.data.items
    : [{ id: s.id, sequence: s.sequence, submittedAt: s.submittedAt }];
  return (
    <Panel
      title="Báo cáo kết quả"
      className="report-preview"
      actions={<StatusField value={s.status} />}
    >
      <div className="report-picker">
        <label className="viewer-select">
          Lần nộp
          <select
            value={selected}
            onChange={(event) => setPicked(event.target.value)}
          >
            {rows.map((row) => (
              <option key={row.id} value={row.id}>
                Lần {row.sequence} · {dateTime(row.submittedAt)}
                {row.id === submissionId ? " (mới nhất)" : ""}
              </option>
            ))}
          </select>
        </label>
        {rows.length > 1 && (
          <span className="small muted">Đã nộp {rows.length} lần</span>
        )}
      </div>
      {s.attachmentIds.length ? (
        <AttachmentViewer key={s.id} attachmentIds={s.attachmentIds} />
      ) : (
        <p className="muted">Lần nộp này không đính kèm báo cáo.</p>
      )}
    </Panel>
  );
}
