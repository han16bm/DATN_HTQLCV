"use client";
import type { FormField } from "@/components/forms/form.types";
import { SchemaForm } from "@/components/forms/schema-form";
import { ButtonLink, Panel } from "@/components/ui/page";
import {
  createTaskSchema,
  updateTaskSchema,
} from "@/features/tasks/schemas/task-form.schema";
import { prioritySchema } from "@/features/tasks/schemas/task.schema";
import { type TaskDto } from "@/features/tasks/types/tasks.types";
import { changedFields, localDateTime, options } from "@/lib/format";
import { useEditSnapshot } from "@/lib/forms/use-edit-snapshot";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  useCreateTaskMutation,
  useUpdateTaskMutation,
} from "../hooks/use-tasks-mutations";
export function TaskForm({
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
  const base = snapshot.base;
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
    fields,
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
      {base ? (
        <SchemaForm
          {...formProps}
          schema={updateTaskSchema}
          onSubmit={async (values) => {
            await update.mutateAsync({
              taskId: base.id,
              payload: updateTaskSchema.parse({
                ...changedFields(base, values, [
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
              version: base.version,
            });
            toast.success("Đã điều chỉnh công việc.");
            router.push(`/tasks/${base.id}`);
          }}
        />
      ) : (
        <SchemaForm
          {...formProps}
          schema={createTaskSchema}
          onSubmit={async (values) => {
            const created = await create.mutateAsync({
              projectId,
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
