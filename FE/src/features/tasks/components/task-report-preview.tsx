"use client";

import { PageSkeleton } from "@/components/ui/loading";
import { Pagination, StatusField } from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { AttachmentViewer } from "@/features/attachments/components/attachment-viewer";
import {
  useGetSubmissionQuery,
  useListSubmissionsQuery,
} from "@/features/submissions/hooks/use-submissions-queries";
import type { SubmissionQuery } from "@/features/submissions/types/submissions.types";
import { dateTime } from "@/lib/format";
import { useState } from "react";

// Chỉ tải tài liệu của lần được chọn; danh sách lần nộp phân trang qua HTTP.
export function TaskReportPreview({
  taskId,
  submissionId,
}: {
  taskId: string;
  submissionId: string;
}) {
  const [picked, setPicked] = useState<string | null>(submissionId);
  const [page, setPage] = useState(1);
  const [sort, setSort] =
    useState<NonNullable<SubmissionQuery["sort"]>>("-sequence");
  const list = useListSubmissionsQuery(taskId, { page, pageSize: 5, sort });
  const selected = picked ?? list.data?.items[0]?.id ?? "";
  const query = useGetSubmissionQuery(taskId, selected);
  const s = query.data;
  const rows = list.data?.items ?? (s ? [s] : []);
  return (
    <section className="report-preview">
      <div className="panel-heading">
        <h2>Báo cáo kết quả</h2>
        {s && <StatusField value={s.status} />}
      </div>
      <div className="report-picker">
        <label className="viewer-select">
          Lần nộp
          <select
            value={selected}
            disabled={!rows.length || list.isFetching}
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
        <label className="viewer-select">
          Sắp xếp
          <select
            value={sort}
            onChange={(event) => {
              setSort(
                event.target.value as NonNullable<SubmissionQuery["sort"]>,
              );
              setPage(1);
              setPicked(null);
            }}
          >
            <option value="-sequence">Mới nhất trước</option>
            <option value="sequence">Cũ nhất trước</option>
          </select>
        </label>
      </div>
      {list.isError && (
        <QueryErrorState error={list.error} retry={list.refetch} />
      )}
      {query.isError ? (
        <QueryErrorState error={query.error} retry={query.refetch} />
      ) : !s ? (
        list.isError ? null : list.data && !selected ? (
          <AttachmentViewer attachmentIds={[]} />
        ) : (
          <PageSkeleton />
        )
      ) : (
        <AttachmentViewer key={s.id} attachmentIds={s.attachmentIds} />
      )}
      {list.data && (
        <Pagination
          {...list.data.pagination}
          onPage={(value) => {
            setPage(value);
            setPicked(null);
          }}
        />
      )}
    </section>
  );
}
