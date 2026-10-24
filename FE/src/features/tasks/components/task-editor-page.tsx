"use client";
import type { FormField } from "@/components/forms/form.types";
import { SchemaForm } from "@/components/forms/schema-form";
import {
  ButtonLink,
  Loading,
  PageHeader,
  Panel,
  PermissionGate,
} from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { useGetProjectQuery } from "@/features/projects/hooks/use-projects-queries";
import {
  createTaskSchema,
  updateTaskSchema,
} from "@/features/tasks/schemas/task-form.schema";
import { prioritySchema } from "@/features/tasks/schemas/task.schema";
import { type TaskDto } from "@/features/tasks/types/tasks.types";
import { changedFields, dateTime, localDateTime, options } from "@/lib/format";
import { useEditSnapshot } from "@/lib/forms/use-edit-snapshot";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  useCreateTaskMutation,
  useUpdateTaskMutation,
} from "../hooks/use-tasks-mutations";
import { useGetTaskQuery } from "../hooks/use-tasks-queries";

export function TaskEditorPage({
  taskId,
  projectId,
}: {
  taskId?: string;
  projectId?: string;
}) {
  const query = useGetTaskQuery(taskId ?? "", { enabled: Boolean(taskId) });
  const id = projectId ?? query.data?.projectId ?? "";
  const project = useGetProjectQuery(id, { enabled: Boolean(id) });
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
function TaskForm({
  task,
  projectId,
  reload,
}: {
  task?: TaskDto;
  projectId: string;
  reload: () => Promise<{
    data?: TaskDto;
  }>;
}) {
  const create = useCreateTaskMutation();
  const update = useUpdateTaskMutation();
  const snapshot = useEditSnapshot(task);
  const router = useRouter();
  const fields: FormField[] = [
    { name: "title", label: "Tên công việc", required: true },
    { name: "description", label: "Mô tả", type: "textarea", nullable: true },
    {
      name: "acceptanceCriteria",
      label: "Tiêu chí nghiệm thu",
      type: "textarea",
      required: true,
    },
    {
      name: "priority",
      label: "Ưu tiên",
      type: "select",
      options: options(prioritySchema.options),
      required: true,
    },
    {
      name: "dueAt",
      label: "Hạn hoàn thành (giờ Việt Nam)",
      type: "datetime-local",
      required: true,
    },
    {
      name: "estimatedMinutes",
      label: "Thời gian dự kiến (phút)",
      type: "number",
      required: true,
    },
    ...(task
      ? [
          {
            name: "changeReason",
            label: "Lý do thay đổi kế hoạch",
            type: "textarea" as const,
            required: Boolean(task.assigneeId),
            emptyAsUndefined: true,
            hint: "Bắt buộc khi đổi hạn hoặc dự kiến sau khi phân công.",
          },
        ]
      : []),
  ];
  const formProps = {
    fields: fields,
    defaults: task
      ? {
          title: task.title,
          description: task.description ?? "",
          acceptanceCriteria: task.acceptanceCriteria,
          priority: task.priority,
          dueAt: localDateTime(task.dueAt),
          estimatedMinutes: task.estimatedMinutes,
        }
      : { priority: "NORMAL", description: "" },
    onConflictReload: () => snapshot.load(reload),
    onConflictAccept: snapshot.accept,
    submitLabel: task ? "Lưu thay đổi" : "Tạo công việc",
    cancel: (
      <ButtonLink
        href={task ? `/tasks/${task.id}` : `/tasks?projectId=${projectId}`}
      >
        Hủy
      </ButtonLink>
    ),
  };
  return (
    <Panel title="Kế hoạch công việc">
      {task ? (
        <SchemaForm
          {...formProps}
          schema={updateTaskSchema}
          onSubmit={async (values) => {
            if (task && snapshot.base) {
              await update.mutateAsync({
                taskId: task.id,
                payload: updateTaskSchema.parse({
                  ...changedFields(snapshot.base, values, [
                    "title",
                    "description",
                    "acceptanceCriteria",
                    "priority",
                    "dueAt",
                    "estimatedMinutes",
                  ]),
                  ...(values.changeReason
                    ? { changeReason: values.changeReason }
                    : {}),
                }),
                version: snapshot.base.version,
              });
              toast.success("Đã điều chỉnh công việc.");
              router.push(`/tasks/${task.id}`);
            }
          }}
        />
      ) : (
        <SchemaForm
          {...formProps}
          schema={createTaskSchema}
          onSubmit={async (values) => {
            const created = await create.mutateAsync({
              projectId: projectId,
              payload: values,
            });
            toast.success("Đã tạo công việc, chưa phân công.");
            router.push(`/tasks/${created.id}`);
          }}
        />
      )}
    </Panel>
  );
}
