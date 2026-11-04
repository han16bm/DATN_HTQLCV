"use client";

import { Form } from "@/components/forms/form";
import {
  FormInput,
  FormSelect,
  FormTextarea,
} from "@/components/forms/form-field";
import { ButtonLink, Panel } from "@/components/ui/page";
import {
  changedFields,
  localDateTime,
  options,
  utcDateTime,
} from "@/lib/format";
import { useEditSnapshot } from "@/lib/forms/use-edit-snapshot";
import { validationMessage } from "@/lib/forms/validation-message";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  useCreateTaskMutation,
  useUpdateTaskMutation,
} from "../hooks/use-tasks-mutations";
import { createTaskSchema } from "../schemas/task-form.schema";
import { prioritySchema } from "../schemas/task.schema";
import { type TaskDto } from "../types/tasks.types";

const schema = createTaskSchema.extend({
  dueAt: z.string().transform(utcDateTime).pipe(createTaskSchema.shape.dueAt),
  description: z
    .string()
    .trim()
    .transform((value) => value || null),
  changeReason: z.string().trim().max(2000).optional(),
});
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
  const form = useForm<
    z.input<typeof schema>,
    unknown,
    z.output<typeof schema>
  >({
    resolver: zodResolver(schema, { error: validationMessage }),
    defaultValues: {
      title: task?.title ?? "",
      description: task?.description ?? "",
      acceptanceCriteria: task?.acceptanceCriteria ?? "",
      priority: task?.priority ?? "NORMAL",
      dueAt: task ? localDateTime(task.dueAt) : "",
      estimatedMinutes: task?.estimatedMinutes,
      ...(task ? { changeReason: "" } : {}),
    },
  });
  const { errors } = form.formState;
  const formProps = {
    onConflictReload: () => snapshot.load(reload),
    onConflictAccept: snapshot.accept,
    submitLabel: task ? "Lưu thay đổi" : "Tạo công việc",
    cancel: (
      <ButtonLink
        href={task ? `/tasks/${task.id}` : `/projects/${projectId}#tasks`}
      >
        Hủy
      </ButtonLink>
    ),
  };
  return (
    <Panel title="Kế hoạch công việc">
      <Form
        form={form}
        {...formProps}
        compareFields={[
          { name: "title", label: "Tên công việc" },
          { name: "dueAt", label: "Hạn hoàn thành" },
          { name: "estimatedMinutes", label: "Thời gian dự kiến (phút)" },
          { name: "description", label: "Mô tả" },
          { name: "acceptanceCriteria", label: "Tiêu chí nghiệm thu" },
          {
            name: "priority",
            label: "Ưu tiên",
            options: options(prioritySchema.options),
          },
        ]}
        onSubmit={async ({ changeReason, ...values }) => {
          if (base) {
            await update.mutateAsync({
              taskId: base.id,
              payload: {
                ...changedFields(base, values, [
                  "title",
                  "description",
                  "acceptanceCriteria",
                  "priority",
                  "dueAt",
                  "estimatedMinutes",
                ]),
                ...(changeReason ? { changeReason } : {}),
              },
              version: base.version,
            });
            toast.success("Đã điều chỉnh công việc.");
            router.push(`/tasks/${base.id}`);
          } else {
            const created = await create.mutateAsync({
              projectId,
              payload: values,
            });
            toast.success("Đã tạo công việc, chưa phân công.");
            router.push(`/tasks/${created.id}`);
          }
        }}
      >
        <FormInput
          label="Tên công việc"
          required
          width="full"
          {...form.register("title")}
          error={errors.title}
        />
        <FormTextarea
          label="Mô tả"
          width="medium"
          {...form.register("description")}
          error={errors.description}
        />
        <FormTextarea
          label="Tiêu chí nghiệm thu"
          width="medium"
          required
          {...form.register("acceptanceCriteria")}
          error={errors.acceptanceCriteria}
        />
        <h3 className="col-span-12 m-0 border-t border-line pt-4 text-sm font-semibold text-fg">
          Kế hoạch thực hiện
        </h3>
        <FormSelect
          label="Ưu tiên"
          required
          width="short"
          options={options(prioritySchema.options)}
          {...form.register("priority")}
          error={errors.priority}
        />
        <FormInput
          label="Hạn hoàn thành (giờ Việt Nam)"
          width="short"
          type="datetime-local"
          required
          {...form.register("dueAt")}
          error={errors.dueAt}
        />
        <FormInput
          label="Thời gian dự kiến (phút)"
          width="short"
          type="number"
          required
          {...form.register("estimatedMinutes", { valueAsNumber: true })}
          error={errors.estimatedMinutes}
        />
        {task && (
          <FormTextarea
            label="Lý do thay đổi kế hoạch"
            required={Boolean(task.assigneeId)}
            hint="Bắt buộc khi đổi hạn hoặc dự kiến sau khi phân công."
            {...form.register("changeReason")}
            error={errors.changeReason}
          />
        )}
      </Form>
    </Panel>
  );
}
