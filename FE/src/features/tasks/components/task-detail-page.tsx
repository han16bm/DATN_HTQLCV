"use client";

import { Form } from "@/components/forms/form";
import { FormInput } from "@/components/forms/form-field";
import { HistoryTable } from "@/components/ui/history-table";
import { PageSkeleton } from "@/components/ui/loading";
import { Panel } from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { UserBadge } from "@/components/ui/user-badge";
import { AttachmentViewer } from "@/features/attachments/components/attachment-viewer";
import { useGetProjectQuery } from "@/features/projects/hooks/use-projects-queries";
import { useSession } from "@/lib/auth/session-context";
import { dateTime, hours } from "@/lib/format";
import { confirmDiscard } from "@/lib/forms/confirm-discard";
import { useEditSnapshot } from "@/lib/forms/use-edit-snapshot";
import { validationMessage } from "@/lib/forms/validation-message";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { useUpdateRemainingEstimateMutation } from "../hooks/use-tasks-mutations";
import {
  useGetTaskQuery,
  useListTaskHistoryQuery,
} from "../hooks/use-tasks-queries";
import { remainingSchema } from "../schemas/task-form.schema";
import { TaskReportPreview } from "./task-report-preview";
import type { TaskDto } from "../types/tasks.types";

export function TaskDetailPage({ taskId }: { taskId: string }) {
  const query = useGetTaskQuery(taskId);
  const history = useListTaskHistoryQuery(taskId, { pageSize: 5 });
  const project = useGetProjectQuery(query.data?.projectId ?? "");
  const { session } = useSession();
  if (query.isError)
    return <QueryErrorState error={query.error} retry={query.refetch} />;
  if (!query.data) return <PageSkeleton />;
  const task = query.data;
  return (
    <div className="issue-layout">
      <div className="issue-main">
        <Panel title="Nội dung công việc" className="task-description">
          <div className="task-copy">
            <p className="prose">
              {task.description || "Chưa có mô tả bổ sung."}
            </p>
          </div>
          <section className="task-criteria">
            <h3>Tiêu chí nghiệm thu</h3>
            <p className="prose">{task.acceptanceCriteria}</p>
          </section>
        </Panel>
        {task.latestSubmissionId ? (
          <TaskReportPreview
            key={task.latestSubmissionId}
            taskId={task.id}
            submissionId={task.latestSubmissionId}
          />
        ) : (
          <AttachmentViewer attachmentIds={[]} />
        )}
      </div>
      <aside className="issue-side" aria-label="Thông tin công việc">
        <Panel title="Chi tiết">
          <dl className="record-details">
            <div>
              <dt>Người thực hiện</dt>
              <dd>
                {task.assignee ? (
                  <UserBadge
                    name={task.assignee.displayName}
                    href={`/users/${encodeURIComponent(task.assignee.id)}`}
                  />
                ) : (
                  "Chưa phân công"
                )}
              </dd>
            </div>
            <div>
              <dt>Dự án</dt>
              <dd>
                <Link
                  className="text-link"
                  href={`/projects/${encodeURIComponent(task.projectId)}`}
                >
                  {task.project.name}
                </Link>
              </dd>
            </div>
            <div>
              <dt>Ngày tạo</dt>
              <dd>{dateTime(task.createdAt)}</dd>
            </div>
            <div>
              <dt>Bắt đầu thực hiện</dt>
              <dd>
                {task.firstStartedAt
                  ? dateTime(task.firstStartedAt)
                  : "Chưa bắt đầu"}
              </dd>
            </div>
            <div>
              <dt>Hạn hoàn thành</dt>
              <dd className={task.isOverdue ? "task-overdue" : undefined}>
                {dateTime(task.dueAt)}
              </dd>
            </div>
            <div>
              <dt>Hạn ban đầu</dt>
              <dd>{dateTime(task.originalDueAt)}</dd>
            </div>
          </dl>
        </Panel>
        <Panel title="Giờ công" className="task-worklog">
          <dl className="record-details">
            {[
              ["Đã thực hiện", hours(task.actualMinutes)],
              ["Ước lượng hiện tại", hours(task.estimatedMinutes)],
              ["Ước lượng ban đầu", hours(task.originalEstimatedMinutes)],
              [
                "Thời gian còn lại",
                task.remainingMinutes === null
                  ? "Chưa cập nhật"
                  : hours(task.remainingMinutes),
              ],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          {task.assigneeId === session?.user.id &&
            task.status === "IN_PROGRESS" &&
            project.data?.status === "ACTIVE" && (
              <RemainingForm
                key={task.id}
                task={task}
                reload={() => query.refetch()}
              />
            )}
        </Panel>
      </aside>
      <div className="issue-activity">
        {history.isError ? (
          <QueryErrorState error={history.error} retry={history.refetch} />
        ) : !history.data ? (
          <PageSkeleton variant="table" />
        ) : (
          <HistoryTable
            title="Hoạt động gần đây"
            items={history.data.items}
            pagination={{ total: history.data.pagination.total }}
            headerActions={
              <Link
                className="text-link"
                href={`/tasks/${encodeURIComponent(taskId)}/history`}
              >
                Xem toàn bộ lịch sử
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
}

function RemainingForm({
  task,
  reload,
}: {
  task: TaskDto;
  reload: () => Promise<{
    data?: TaskDto;
  }>;
}) {
  const mutation = useUpdateRemainingEstimateMutation();
  const snapshot = useEditSnapshot(task);
  const [open, setOpen] = useState(false);
  const cancel = async () => {
    if (!(await confirmDiscard("Bỏ cập nhật thời gian chưa lưu?"))) return;
    setOpen(false);
  };
  const form = useForm<z.input<typeof remainingSchema>>({
    resolver: zodResolver(remainingSchema, { error: validationMessage }),
    defaultValues: { remainingMinutes: task.remainingMinutes ?? undefined },
  });
  const { errors } = form.formState;
  return (
    <div className="section-gap">
      {open ? (
        <Form
          compact
          form={form}
          compareFields={[
            { name: "remainingMinutes", label: "Còn lại (phút)" },
          ]}
          cancel={
            <button type="button" onClick={cancel}>
              Hủy
            </button>
          }
          onConflictReload={() => snapshot.load(reload)}
          onConflictAccept={snapshot.accept}
          onSubmit={async (values) => {
            snapshot.saved(
              await mutation.mutateAsync({
                taskId: task.id,
                payload: values,
                version: snapshot.base.version,
              }),
            );
            toast.success("Đã cập nhật phút còn lại.");
            setOpen(false);
          }}
          submitLabel="Lưu cập nhật"
        >
          <FormInput
            label="Còn lại (phút)"
            required
            type="number"
            {...form.register("remainingMinutes", { valueAsNumber: true })}
            error={errors.remainingMinutes}
          />
        </Form>
      ) : (
        <button
          type="button"
          onClick={() => {
            snapshot.saved(task);
            form.reset({
              remainingMinutes: task.remainingMinutes ?? undefined,
            });
            setOpen(true);
          }}
        >
          Cập nhật thời gian còn lại
        </button>
      )}
    </div>
  );
}
