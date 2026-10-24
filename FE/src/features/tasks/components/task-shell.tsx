"use client";
import {
  Badge,
  ButtonLink,
  Loading,
  PageHeader,
  Tabs,
} from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { useGetProjectQuery } from "@/features/projects/hooks/use-projects-queries";
import { hasPermission, useSession } from "@/lib/auth/session-context";
import { label } from "@/lib/format";
import { useHashDialog } from "@/lib/forms/use-hash-dialog";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import { useGetTaskQuery } from "../hooks/use-tasks-queries";
import { TaskAssignmentDialog, TaskExecutionDialog } from "./task-commands";

export function TaskShell({
  taskId,
  children,
}: {
  taskId: string;
  children: ReactNode;
}) {
  const query = useGetTaskQuery(taskId);
  const project = useGetProjectQuery(query.data?.projectId ?? "", {
    enabled: Boolean(query.data),
  });
  const { session } = useSession();
  const dialog = useHashDialog();
  const path = usePathname();
  if (query.isError)
    return (
      <QueryErrorState error={query.error} retry={() => void query.refetch()} />
    );
  if (!query.data) return <Loading />;
  const task = query.data;
  const active = project.data?.status === "ACTIVE";
  const editable =
    active && ["NEW", "TODO", "IN_PROGRESS"].includes(task.status);
  const manage = hasPermission(session, "TASKS_MANAGE", task.projectId);
  const own = task.assigneeId === session?.user.id;
  return (
    <>
      <PageHeader
        title={task.title}
        description={`${task.project.name} · Công việc`}
        actions={
          <>
            {active && own && task.status === "IN_PROGRESS" && (
              <>
                <button
                  className="primary"
                  onClick={() => dialog.open("submit")}
                >
                  Nộp kết quả
                </button>
                <button onClick={() => dialog.open("time-log")}>
                  Ghi giờ công
                </button>
                <button onClick={() => dialog.open("attachment")}>
                  Tải minh chứng
                </button>
              </>
            )}
            {editable && manage && (
              <>
                <ButtonLink href={`/tasks/${taskId}/edit`}>
                  Điều chỉnh
                </ButtonLink>
                <button onClick={() => dialog.open("assignment")}>
                  {task.assigneeId ? "Bàn giao" : "Giao việc"}
                </button>
              </>
            )}
            {editable &&
              ((own && ["TODO", "IN_PROGRESS"].includes(task.status)) ||
                manage) && (
                <button onClick={() => dialog.open("execution")}>
                  {own && task.status === "TODO"
                    ? "Bắt đầu"
                    : own && task.status === "IN_PROGRESS"
                      ? "Tạm dừng / hủy"
                      : "Hủy công việc"}
                </button>
              )}
          </>
        }
      />
      <p className="metadata">
        <Badge value={task.status} />{" "}
        <span className="badge">
          Ưu tiên {label(task.priority).toLowerCase()}
        </span>
        {task.isOverdue && <Badge value="OVERDUE" />}
      </p>
      <Tabs
        active={path}
        items={[
          { href: `/tasks/${taskId}`, label: "Thông tin" },
          { href: `/tasks/${taskId}/time-logs`, label: "Giờ công" },
          { href: `/tasks/${taskId}/submissions`, label: "Các lần nộp" },
          { href: `/tasks/${taskId}/history`, label: "Lịch sử" },
        ]}
      />
      {project.isError && (
        <QueryErrorState
          error={project.error}
          retry={() => void project.refetch()}
        />
      )}{" "}
      {children}
      {editable && manage && <TaskAssignmentDialog task={task} />}{" "}
      {editable && <TaskExecutionDialog task={task} />}
    </>
  );
}
