"use client";

import { PageSkeleton } from "@/components/ui/loading";
import { PageHeader, detailClass } from "@/components/ui/page";
import { StatusLozenge } from "@/components/ui/lozenge";
import { DataTable } from "@/components/patterns/data-table";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { UserBadge } from "@/components/ui/user-badge";
import { useGetProjectQuery } from "@/features/projects/hooks/use-projects-queries";
import { useGetTaskQuery } from "@/features/tasks/hooks/use-tasks-queries";
import { useSession } from "@/lib/auth/session-context";
import { number } from "@/lib/format";
import { useUrlFilters } from "@/lib/query/use-url-filters";
import Link from "next/link";
import { useListTimeLogsQuery } from "../hooks/use-time-logs-queries";

// Bảng nhật ký giờ công của một việc; trang và ngăn kéo ở trang Chi tiết dùng chung.
// `onEdit` chạy khi bấm liên kết sửa để nơi chứa (ngăn kéo) đóng lại.
export function TimeLogsTable({
  taskId,
  page,
  onPage,
  onEdit,
}: {
  taskId: string;
  page: number;
  onPage: (page: number) => void;
  onEdit?: () => void;
}) {
  const query = useListTimeLogsQuery(taskId, { page });
  const task = useGetTaskQuery(taskId);
  const project = useGetProjectQuery(task.data?.projectId ?? "");
  const { session } = useSession();
  const editable =
    task.data?.assigneeId === session?.user.id &&
    task.data?.status === "IN_PROGRESS" &&
    project.data?.status === "ACTIVE";
  return query.isError ? (
    <QueryErrorState error={query.error} retry={query.refetch} />
  ) : !query.data ? (
    <PageSkeleton variant="table" />
  ) : (
    <DataTable
      loading={query.isFetching}
      pagination={{
        ...query.data.pagination,
        onPage,
      }}
      actions
      widths={[14, 19, 9, 31, 15, 12]}
      headers={[
        "Ngày làm việc",
        "Người ghi",
        "Số phút",
        "Nội dung",
        "Hiệu lực",
        "Hành động",
      ]}
      rows={query.data.items.map((l) => [
        l.workDate,
        <UserBadge key="author" name={l.user.displayName} />,
        number(l.minutes),
        <div key="description">
          {l.description}
          {l.voidReason && (
            <p className="text-xs text-fg-subtle">Lý do loại: {l.voidReason}</p>
          )}
        </div>,
        l.status === "VOID" ? (
          <StatusLozenge key="state" value="VOID" />
        ) : (
          "Còn hiệu lực"
        ),
        editable && l.userId === session?.user.id && l.status === "ACTIVE" ? (
          <Link
            key="edit"
            className={detailClass}
            aria-label="Sửa hoặc loại nhật ký"
            href={`/tasks/${taskId}?timeLogId=${l.id}&logPage=${page}#time-log`}
            onClick={onEdit}
          >
            Sửa / loại
          </Link>
        ) : null,
      ])}
    />
  );
}

export function TimeLogsPage({ taskId }: { taskId: string }) {
  const filters = useUrlFilters();
  const task = useGetTaskQuery(taskId);
  return (
    <>
      <PageHeader
        title="Nhật ký giờ công"
        level={2}
        description={`Tổng giờ công hợp lệ: ${number(task.data?.actualMinutes, "phút")}. Nhật ký đã loại vẫn được giữ để tra cứu.`}
      />
      <TimeLogsTable
        taskId={taskId}
        page={filters.page}
        onPage={(p) => filters.set("page", String(p))}
      />
    </>
  );
}
