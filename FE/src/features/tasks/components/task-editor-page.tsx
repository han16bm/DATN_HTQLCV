"use client";

import { PageSkeleton } from "@/components/ui/loading";
import { PageHeader, Panel } from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { useGetProjectQuery } from "@/features/projects/hooks/use-projects-queries";
import { canManage } from "@/lib/auth/access";
import { useSession } from "@/lib/auth/session-context";
import { dateTime } from "@/lib/format";
import { useGetTaskQuery } from "../hooks/use-tasks-queries";
import { TaskForm } from "./task-form";

export function TaskEditorPage({
  taskId,
  projectId,
}: {
  taskId?: string;
  projectId?: string;
}) {
  const { session } = useSession();
  const query = useGetTaskQuery(taskId ?? "");
  const id = projectId ?? query.data?.projectId ?? "";
  const project = useGetProjectQuery(id);
  if (query.isError) return <QueryErrorState error={query.error} />;
  if (project.isError) return <QueryErrorState error={project.error} />;
  if (!project.data) return <PageSkeleton variant="form" />;
  return (
    <>
      <PageHeader
        title={taskId ? "Điều chỉnh công việc" : "Tạo công việc"}
        description={`${project.data.name} · Hạn dự án ${dateTime(project.data.dueAt)}`}
      />
      {!canManage(session, id) ? (
        <Panel>
          <p>Bạn không được thay đổi công việc trong dự án này.</p>
        </Panel>
      ) : project.data.status !== "ACTIVE" ? (
        <Panel>
          <p>
            Dự án cần ở trạng thái đang triển khai để tạo hoặc sửa công việc.
          </p>
        </Panel>
      ) : query.data &&
        !["NEW", "TODO", "IN_PROGRESS"].includes(query.data.status) ? (
        <Panel>
          <p>Trạng thái hiện tại chỉ cho phép xem công việc.</p>
        </Panel>
      ) : (
        <TaskForm
          key={taskId ?? id}
          task={query.data}
          projectId={id}
          reload={() => query.refetch()}
        />
      )}
    </>
  );
}
