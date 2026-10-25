"use client";
import { Badge, ButtonLink, DataTable, PageHeader } from "@/components/ui/page";
import { PageSkeleton } from "@/components/ui/loading";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { useGetProjectQuery } from "@/features/projects/hooks/use-projects-queries";
import { useGetTaskQuery } from "@/features/tasks/hooks/use-tasks-queries";
import { useSession } from "@/lib/auth/session-context";
import { number } from "@/lib/format";
import { useUrlFilters } from "@/lib/query/use-url-filters";
import Link from "next/link";
import { useListTimeLogsQuery } from "../hooks/use-time-logs-queries";

export function TimeLogsPage({ taskId }: { taskId: string }) {
  const filters = useUrlFilters();
  const query = useListTimeLogsQuery(taskId, { page: filters.page });
  const task = useGetTaskQuery(taskId);
  const project = useGetProjectQuery(task.data?.projectId ?? "");
  const { session } = useSession();
  const editable =
    task.data?.assigneeId === session?.user.id &&
    task.data?.status === "IN_PROGRESS" &&
    project.data?.status === "ACTIVE";
  return (
    <>
      <PageHeader
        title="Nhật ký giờ công"
        description={`Tổng giờ công hợp lệ: ${number(task.data?.actualMinutes, "phút")}. Nhật ký đã loại vẫn được giữ để tra cứu.`}
        actions={
          editable && (
            <ButtonLink href={`/tasks/${taskId}#time-log`} primary>
              Ghi thời gian
            </ButtonLink>
          )
        }
      />
      {query.isError ? (
        <QueryErrorState
          error={query.error}
          retry={() => void query.refetch()}
        />
      ) : !query.data ? (
        <PageSkeleton variant="table" />
      ) : (
        <DataTable
          pagination={{
            ...query.data.pagination,
            onPage: (p) => filters.set("page", String(p)),
          }}
          actions
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
            l.user.displayName,
            number(l.minutes),
            <div key="description">
              {l.description}
              {l.voidReason && (
                <p className="small muted">Lý do loại: {l.voidReason}</p>
              )}
            </div>,
            l.status === "VOID" ? (
              <Badge key="state" value="VOID" />
            ) : (
              "Còn hiệu lực"
            ),
            editable &&
            l.userId === session?.user.id &&
            l.status === "ACTIVE" ? (
              <Link
                key="edit"
                className="text-link"
                href={`/tasks/${taskId}?timeLogId=${l.id}&logPage=${filters.page}#time-log`}
              >
                Sửa / loại khỏi tổng
              </Link>
            ) : null,
          ])}
        />
      )}
    </>
  );
}
