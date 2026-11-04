"use client";
import { SplitLayout } from "@/components/patterns/split-layout";

import { Form } from "@/components/forms/form";
import { FormInput } from "@/components/forms/form-field";
import { KeyValue, KeyValueList } from "@/components/patterns/key-value";
import { Button } from "@/components/ui/button";
import { HistoryTable } from "@/components/ui/history-table";
import { PageSkeleton } from "@/components/ui/loading";
import { Panel, linkClass } from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { UserBadge } from "@/components/ui/user-badge";
import { AttachmentViewer } from "@/features/attachments/components/attachment-viewer";
import { useGetProjectQuery } from "@/features/projects/hooks/use-projects-queries";
import { useSession } from "@/lib/auth/session-context";
import { cn } from "@/lib/cn";
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
import type { TaskDto } from "../types/tasks.types";
import { TaskReportPreview } from "./task-report-preview";

// Chi tiết công việc: mô tả, tiêu chí và báo cáo đính kèm ở vùng chính; người thực
// hiện, hạn và giờ công gọn ở cột phụ; hoạt động gần đây nằm dưới cùng.
export function TaskDetailPage({ taskId }: { taskId: string }) {
  const query = useGetTaskQuery(taskId);
  const history = useListTaskHistoryQuery(taskId, { pageSize: 5 });
  const project = useGetProjectQuery(query.data?.projectId ?? "");
  const { session } = useSession();
  if (query.isError)
    return <QueryErrorState error={query.error} retry={query.refetch} />;
  if (!query.data) return <PageSkeleton />;
  const task = query.data;
  const inspector = (
    <aside
      aria-label="Thông tin công việc"
      className="grid content-start gap-5"
    >
      <Panel title="Phân công và thời hạn">
        <KeyValueList>
          <KeyValue label="Người thực hiện">
            {task.assignee ? (
              <UserBadge
                name={task.assignee.displayName}
                href={`/users/${encodeURIComponent(task.assignee.id)}`}
              />
            ) : (
              "Chưa phân công"
            )}
          </KeyValue>
          <KeyValue label="Dự án">
            <Link
              className={linkClass}
              href={`/projects/${encodeURIComponent(task.projectId)}`}
            >
              {task.project.name}
            </Link>
          </KeyValue>
          <KeyValue label="Hạn hoàn thành">
            <span
              className={cn(task.isOverdue && "font-medium text-danger-fg")}
            >
              {dateTime(task.dueAt)}
            </span>
          </KeyValue>
        </KeyValueList>
        <details className="mt-3 border-t border-line pt-2">
          <summary className="cursor-pointer text-xs font-medium text-fg-subtle">
            Các mốc thời gian
          </summary>
          <div className="mt-2">
            <KeyValueList>
              <KeyValue label="Ngày tạo">{dateTime(task.createdAt)}</KeyValue>
              <KeyValue label="Bắt đầu thực hiện">
                {task.firstStartedAt
                  ? dateTime(task.firstStartedAt)
                  : "Chưa bắt đầu"}
              </KeyValue>
              <KeyValue label="Hạn ban đầu">
                {dateTime(task.originalDueAt)}
              </KeyValue>
            </KeyValueList>
          </div>
        </details>
      </Panel>
      <Panel title="Giờ công">
        <dl className="m-0 mb-4 grid grid-cols-2 gap-3 rounded-md bg-sunken/60 p-3">
          <div>
            <dt className="text-xs text-fg-subtle">Đã thực hiện</dt>
            <dd className="m-0 mt-1 text-base font-semibold text-fg tabular-nums">
              {hours(task.actualMinutes)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-fg-subtle">Ước lượng hiện tại</dt>
            <dd className="m-0 mt-1 text-base font-semibold text-fg tabular-nums">
              {hours(task.estimatedMinutes)}
            </dd>
          </div>
        </dl>
        <KeyValueList>
          {[
            ["Ước lượng ban đầu", hours(task.originalEstimatedMinutes)],
            [
              "Thời gian còn lại",
              task.remainingMinutes === null
                ? "Chưa cập nhật"
                : hours(task.remainingMinutes),
            ],
          ].map(([label, value]) => (
            <KeyValue key={label} label={label}>
              {value}
            </KeyValue>
          ))}
        </KeyValueList>
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
  );
  return (
    <SplitLayout aside={inspector}>
      <Panel title="Nội dung công việc">
        <div className="grid gap-4">
          <p className="m-0 max-w-[80ch] text-sm leading-relaxed whitespace-pre-wrap text-fg">
            {task.description || "Chưa có mô tả bổ sung."}
          </p>
          <section className="border-t border-line pt-4">
            <h3 className="m-0 mb-1.5 text-sm font-semibold text-fg">
              Tiêu chí nghiệm thu
            </h3>
            <p className="m-0 max-w-[80ch] text-sm leading-relaxed whitespace-pre-wrap text-fg">
              {task.acceptanceCriteria}
            </p>
          </section>
        </div>
      </Panel>

      <section className="min-w-0" aria-label="Kết quả công việc">
        {task.latestSubmissionId ? (
          <TaskReportPreview
            key={task.latestSubmissionId}
            taskId={task.id}
            submissionId={task.latestSubmissionId}
          />
        ) : (
          <AttachmentViewer attachmentIds={[]} />
        )}
      </section>
      <section className="min-w-0" aria-label="Hoạt động công việc">
        {history.isError ? (
          <QueryErrorState error={history.error} retry={history.refetch} />
        ) : !history.data ? (
          <PageSkeleton variant="table" />
        ) : (
          <HistoryTable
            loading={history.isFetching}
            title="Hoạt động gần đây"
            items={history.data.items}
            pagination={{ total: history.data.pagination.total }}
          />
        )}
      </section>
    </SplitLayout>
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
    <div className="mt-3 border-t border-line pt-3">
      {open ? (
        <Form
          compact
          form={form}
          compareFields={[
            { name: "remainingMinutes", label: "Còn lại (phút)" },
          ]}
          cancel={<Button onClick={cancel}>Hủy</Button>}
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
            width="full"
            {...form.register("remainingMinutes", { valueAsNumber: true })}
            error={errors.remainingMinutes}
          />
        </Form>
      ) : (
        <Button
          onClick={() => {
            snapshot.saved(task);
            form.reset({
              remainingMinutes: task.remainingMinutes ?? undefined,
            });
            setOpen(true);
          }}
        >
          Cập nhật thời gian còn lại
        </Button>
      )}
    </div>
  );
}
