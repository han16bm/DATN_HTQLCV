"use client";
import { TaskForm } from "./task-form";

import { PermissionGate } from "@/components/layout/permission-gate";
import { Loading, PageHeader, Panel } from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { useGetProjectQuery } from "@/features/projects/hooks/use-projects-queries";
import { dateTime } from "@/lib/format";
import { useGetTaskQuery } from "../hooks/use-tasks-queries";

export function TaskEditorPage({
  taskId,
  projectId,
}: {
  taskId?: string;
  projectId?: string;
}) {
  const query = useGetTaskQuery(taskId ?? "");
  const id = projectId ?? query.data?.projectId ?? "";
  const project = useGetProjectQuery(id);
  if (query.isError) return <QueryErrorState error={query.error} />;
  if (project.isError) return <QueryErrorState error={project.error} />;
  if (!project.data) return <Loading />;
  return (
    <PermissionGate permission="TASKS_MANAGE" projectId={id}>
      <PageHeader
        title={taskId ? "Điều chỉnh công việc" : "Tạo công việc"}
        description={`${project.data.name} · Hạn dự án ${dateTime(project.data.dueAt)}`}
      />
      {project.data.status !== "ACTIVE" ? (
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
    </PermissionGate>
  );
}
