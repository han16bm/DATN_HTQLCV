"use client";

import { DataTable } from "@/components/patterns/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusLozenge } from "@/components/ui/lozenge";
import { DetailLink, detailClass } from "@/components/ui/page";
import { UserBadge } from "@/components/ui/user-badge";
import { dateTime } from "@/lib/format";
import { useUrlFilters } from "@/lib/query/use-url-filters";
import { useListSubmissionsQuery } from "../hooks/use-submissions-queries";

export function SubmissionsPage({
  taskId,
  onDetail,
}: {
  taskId: string;
  onDetail?: (id: string) => void;
}) {
  const f = useUrlFilters();
  const sort = f.get("sort") === "sequence" ? "sequence" : "-sequence";
  const q = useListSubmissionsQuery(taskId, {
    page: f.page,
    pageSize: 5,
    sort,
  });
  return (
    <DataTable
      loading={q.isFetching}
      error={q.error}
      onRetry={q.refetch}
      title="Các lần nộp kết quả"
      pagination={
        q.data && {
          ...q.data.pagination,
          onPage: (p) => f.set("page", String(p)),
        }
      }
      actions
      widths={onDetail ? [18, 34, 30, 18] : [12, 26, 24, 22, 16]}
      headers={[
        {
          label: "Lần nộp",
          sort: sort === "sequence" ? "ascending" : "descending",
          onSort: () =>
            f.set("sort", sort === "sequence" ? "-sequence" : "sequence"),
        },
        ...(onDetail ? [] : ["Người nộp"]),
        "Thời điểm",
        "Kết quả xét",
        "Hành động",
      ]}
      empty={
        <EmptyState
          title="Chưa có lần nộp kết quả"
          message="Các kết quả sau khi nộp sẽ xuất hiện tại đây."
        />
      }
      rows={(q.data?.items ?? []).map((s) => [
        `Lần ${s.sequence}`,
        ...(onDetail
          ? []
          : [<UserBadge key="submitter" name={s.submitter.displayName} />]),
        <time key="time" dateTime={s.submittedAt}>
          {dateTime(s.submittedAt)}
        </time>,
        <StatusLozenge key="state" value={s.status} />,
        onDetail ? (
          <button
            key="detail"
            type="button"
            aria-label={`Xem lần nộp ${s.sequence}`}
            aria-haspopup="dialog"
            className={detailClass}
            onClick={() => onDetail(s.id)}
          >
            Chi tiết
          </button>
        ) : (
          <DetailLink
            key="detail"
            href={`/tasks/${taskId}/submissions/${s.id}`}
            label={`Xem lần nộp ${s.sequence}`}
          />
        ),
      ])}
    />
  );
}
