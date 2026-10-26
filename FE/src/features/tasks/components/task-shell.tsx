"use client";
import { canManage } from "@/lib/auth/access";

import { PageSkeleton } from "@/components/ui/loading";
import {
  Badge,
  ButtonLink,
  PageHeader,
  SectionSelect,
} from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { useGetProjectQuery } from "@/features/projects/hooks/use-projects-queries";
import { SubmitResultDialog } from "@/features/submissions/components/submit-result-dialog";
import { TimeLogDialog } from "@/features/time-logs/components/time-log-dialog";
import { useSession } from "@/lib/auth/session-context";
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
  const project = useGetProjectQuery(query.data?.projectId ?? "");
  const { session } = useSession();
  const dialog = useHashDialog();
  const path = usePathname();
  if (query.isError)
    return (
      <QueryErrorState error={query.error} retry={() => void query.refetch()} />
    );
  if (!query.data) return <PageSkeleton />;
  const task = query.data;
  const root = `/tasks/${taskId}`;
  const active = project.data?.status === "ACTIVE";
  const editable =
    active && ["NEW", "TODO", "IN_PROGRESS"].includes(task.status);
  const manage = canManage(session, task.projectId);
  const own = task.assigneeId === session?.user.id;
  return (
    <>
      <PageHeader
        title={task.title}
        description={task.project.name}
        status={
          <>
            <Badge value={task.status} />
            <span className="badge">
              Ưu tiên {label(task.priority).toLowerCase()}
            </span>
            {task.isOverdue && <Badge value="OVERDUE" />}
          </>
        }
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
                {path !== `${root}/edit` && (
                  <ButtonLink href={`${root}/edit`}>Điều chỉnh</ButtonLink>
                )}
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
      <div className="section-toolbar">
        <SectionSelect
          label="Mục công việc"
          active={
            path.startsWith(`${root}/submissions/`)
              ? `${root}/submissions`
              : path
          }
          items={[
            { href: root, label: "Thông tin" },
            { href: `${root}/time-logs`, label: "Giờ công" },
            { href: `${root}/submissions`, label: "Các lần nộp" },
            { href: `${root}/history`, label: "Lịch sử" },
            ...(path === `${root}/edit`
              ? [{ href: path, label: "Điều chỉnh" }]
              : []),
          ]}
        />
      </div>
      {project.isError && (
        <QueryErrorState
          error={project.error}
          retry={() => void project.refetch()}
        />
      )}
      {children}
      {editable && manage && (
        <TaskAssignmentDialog task={task} reload={query.refetch} />
      )}
      {editable && <TaskExecutionDialog task={task} reload={query.refetch} />}
      {project.data && (
        <>
          <TimeLogDialog task={task} active={active} reload={query.refetch} />
          <SubmitResultDialog
            task={task}
            active={active}
            reload={query.refetch}
          />
        </>
      )}
    </>
  );
}
