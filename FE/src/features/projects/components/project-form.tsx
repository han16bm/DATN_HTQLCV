"use client";

import { Form } from "@/components/forms/form";
import {
  FormInput,
  FormSelect,
  FormTextarea,
} from "@/components/forms/form-field";
import type { FormOption } from "@/components/forms/form.types";
import { ButtonLink, Panel } from "@/components/ui/page";
import { useSession } from "@/lib/auth/session-context";
import { changedFields, localDateTime, utcDateTime } from "@/lib/format";
import { useEditSnapshot } from "@/lib/forms/use-edit-snapshot";
import { validationMessage } from "@/lib/forms/validation-message";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  useCreateProjectMutation,
  useUpdateProjectMutation,
} from "../hooks/use-projects-mutations";
import {
  createProjectSchema,
  updateProjectSchema,
} from "../schemas/projects.schema";
import { type ProjectDto } from "../types/projects.types";
const dueAt = z
  .string()
  .transform(utcDateTime)
  .pipe(createProjectSchema.shape.dueAt);

export function ProjectForm({
  project,
  owners,
  reload,
}: {
  project?: ProjectDto;
  owners: FormOption[];
  reload: () => Promise<{
    data?: ProjectDto;
  }>;
}) {
  const { session } = useSession();
  const router = useRouter();
  const create = useCreateProjectMutation();
  const update = useUpdateProjectMutation();
  const snapshot = useEditSnapshot(project);

  const schema = project
    ? updateProjectSchema.required().extend({ dueAt })
    : createProjectSchema.extend({ dueAt });
  type Values = z.input<typeof schema>;
  const form = useForm<Values>({
    resolver: zodResolver<Values, unknown, Values>(schema, {
      error: validationMessage,
    }),
    defaultValues: project
      ? {
          name: project.name,
          objective: project.objective,
          ownerId: project.ownerId,
          startDate: project.startDate,
          dueAt: localDateTime(project.dueAt),
          changeReason: "",
        }
      : {
          code: "",
          name: "",
          objective: "",
          unitId: session?.user.unitId ?? "",
          ownerId: session?.user.id ?? "",
          startDate: "",
          dueAt: "",
        },
  });
  const { errors } = form.formState;
  if (!session) return null;
  if (project && !["PLANNED", "ACTIVE"].includes(project.status))
    return (
      <Panel>
        <p>Dự án đã đóng, chỉ được tra cứu.</p>
      </Panel>
    );
  const ownerOptions = [
    ...new Map(
      [
        { value: session.user.id, label: session.user.displayName },
        ...owners,
        ...(project
          ? [{ value: project.ownerId, label: project.owner.displayName }]
          : []),
      ].map((o) => [o.value, o]),
    ).values(),
  ];
  const compareFields = [
    { name: "name", label: "Tên dự án" },
    { name: "objective", label: "Mục tiêu" },
    { name: "ownerId", label: "Người phụ trách", options: ownerOptions },
    { name: "startDate", label: "Ngày bắt đầu" },
    { name: "dueAt", label: "Hạn hoàn thành" },
  ];
  return (
    <Panel title="Kế hoạch dự án">
      <Form
        form={form}
        submitLabel={project ? "Lưu kế hoạch" : "Tạo dự án"}
        compareFields={compareFields}
        onConflictReload={() => snapshot.load(reload)}
        onConflictAccept={snapshot.accept}
        cancel={
          <ButtonLink href={project ? `/projects/${project.id}` : "/projects"}>
            Hủy
          </ButtonLink>
        }
        onSubmit={async (values) => {
          if ("code" in values) {
            const created = await create.mutateAsync(values);
            toast.success("Đã tạo dự án ở trạng thái dự kiến.");
            router.push(`/projects/${created.id}`);
          } else {
            const base = snapshot.base!;
            await update.mutateAsync({
              projectId: base.id,
              payload: {
                ...changedFields(base, values, [
                  "name",
                  "objective",
                  "ownerId",
                  "startDate",
                  "dueAt",
                ]),
                changeReason: values.changeReason,
              },
              version: base.version,
            });
            toast.success("Đã lưu kế hoạch.");
            router.push(`/projects/${base.id}`);
          }
        }}
      >
        {!project && (
          <FormInput
            label="Mã dự án"
            width="short"
            required
            hint="Chữ in hoa, số, dấu gạch ngang hoặc gạch dưới."
            {...form.register("code")}
            error={form.getFieldState("code", form.formState).error}
          />
        )}
        <FormInput
          label="Tên dự án"
          required
          width={project ? "medium" : "long"}
          {...form.register("name")}
          error={errors.name}
        />
        <FormTextarea
          label="Mục tiêu"
          required
          {...form.register("objective")}
          error={errors.objective}
        />
        <h3 className="col-span-12 m-0 border-t border-line pt-4 text-sm font-semibold text-fg">
          Phân công và thời hạn
        </h3>
        {!project && (
          <FormSelect
            label="Đơn vị"
            required
            options={[
              { value: session.user.unitId, label: session.user.unit.name },
            ]}
            {...form.register("unitId")}
            error={form.getFieldState("unitId", form.formState).error}
          />
        )}
        <FormSelect
          label="Người phụ trách"
          required
          hint={
            project
              ? "Chọn một quản lý đang tham gia dự án. Có thể đổi vai trò tại danh sách thành viên trước khi bàn giao."
              : undefined
          }
          options={ownerOptions}
          {...form.register("ownerId")}
          error={errors.ownerId}
        />
        <FormInput
          label="Ngày bắt đầu"
          type="date"
          required
          width="medium"
          {...form.register("startDate")}
          error={errors.startDate}
        />
        <FormInput
          label="Hạn hoàn thành (giờ Việt Nam)"
          type="datetime-local"
          required
          width="medium"
          {...form.register("dueAt")}
          error={errors.dueAt}
        />

        {project && (
          <FormTextarea
            label="Lý do điều chỉnh"
            required
            {...form.register("changeReason")}
            error={form.getFieldState("changeReason", form.formState).error}
          />
        )}
      </Form>
    </Panel>
  );
}
