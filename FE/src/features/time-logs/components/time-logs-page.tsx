"use client";
import {
  Badge,
  ButtonLink,
  DataTable,
  Loading,
  PageHeader,
  Pagination,
  Panel,
} from "@/components/ui/page";
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
  const project = useGetProjectQuery(task.data?.projectId ?? "", {
    enabled: Boolean(task.data),
  });
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
        <Loading />
      ) : (
        <section className="panel">
          <DataTable
            headers={[
              "Ngày làm việc",
              "Người ghi",
              "Số phút",
              "Nội dung",
              "Hiệu lực",
              "",
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
          <Pagination
            {...query.data.pagination}
            onPage={(p) => filters.set("page", String(p))}
          />
        </section>
      )}
      <Panel>
        <p className="small muted">
          Giờ công chỉ được cộng từ nhật ký hợp lệ; thời gian ở trạng thái và
          thời gian chờ nghiệm thu không được tự cộng thành giờ công.
        </p>
      </Panel>
    </>
  );
}
