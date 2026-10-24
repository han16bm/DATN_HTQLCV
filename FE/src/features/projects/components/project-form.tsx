"use client";
import type { FormField, FormOption } from "@/components/forms/form.types";
import { SchemaForm } from "@/components/forms/schema-form";
import { ButtonLink, Panel } from "@/components/ui/page";
import {
  createProjectSchema,
  updateProjectSchema,
} from "@/features/projects/schemas/projects.schema";
import { type ProjectDto } from "@/features/projects/types/projects.types";
import { useSession } from "@/lib/auth/session-context";
import { changedFields, localDateTime } from "@/lib/format";
import { useEditSnapshot } from "@/lib/forms/use-edit-snapshot";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  useCreateProjectMutation,
  useUpdateProjectMutation,
} from "../hooks/use-projects-mutations";
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
  const base = snapshot.base;
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
  const fields: FormField[] = [
    ...(!project
      ? [
          {
            name: "code",
            label: "Mã dự án",
            required: true,
            hint: "Chữ in hoa, số, dấu gạch ngang hoặc gạch dưới.",
          },
        ]
      : []),
    { name: "name", label: "Tên dự án", required: true },
    { name: "objective", label: "Mục tiêu", type: "textarea", required: true },
    ...(!project
      ? [
          {
            name: "unitId",
            label: "Đơn vị",
            type: "select" as const,
            required: true,
            options: [
              { value: session.user.unitId, label: session.user.unit.name },
            ],
          },
        ]
      : []),
    {
      name: "ownerId",
      label: "Người phụ trách",
      type: "select",
      required: true,
      options: ownerOptions,
    },
    { name: "startDate", label: "Ngày bắt đầu", type: "date", required: true },
    {
      name: "dueAt",
      label: "Hạn hoàn thành (giờ Việt Nam)",
      type: "datetime-local",
      required: true,
    },
    ...(project
      ? [
          {
            name: "changeReason",
            label: "Lý do điều chỉnh",
            type: "textarea" as const,
            required: true,
          },
        ]
      : []),
  ];
  const formProps = {
    fields,
    defaults: project
      ? {
          name: project.name,
          objective: project.objective,
          ownerId: project.ownerId,
          startDate: project.startDate,
          dueAt: localDateTime(project.dueAt),
        }
      : { unitId: session.user.unitId, ownerId: session.user.id },
    onConflictReload: () => snapshot.load(reload),
    onConflictAccept: snapshot.accept,
    submitLabel: project ? "Lưu kế hoạch" : "Tạo dự án",
    cancel: (
      <ButtonLink href={project ? `/projects/${project.id}` : "/projects"}>
        Hủy
      </ButtonLink>
    ),
  };
  return (
    <Panel title="Kế hoạch dự án">
      {base ? (
        <SchemaForm
          {...formProps}
          schema={updateProjectSchema}
          onSubmit={async (values) => {
            await update.mutateAsync({
              projectId: base.id,
              payload: updateProjectSchema.parse({
                ...changedFields(base, values, [
                  "name",
                  "objective",
                  "ownerId",
                  "startDate",
                  "dueAt",
                ]),
                changeReason: values.changeReason,
              }),
              version: base.version,
            });
            toast.success("Đã lưu kế hoạch.");
            router.push(`/projects/${base.id}`);
          }}
        />
      ) : (
        <SchemaForm
          {...formProps}
          schema={createProjectSchema}
          onSubmit={async (values) => {
            const created = await create.mutateAsync(values);
            toast.success("Đã tạo dự án ở trạng thái dự kiến.");
            router.push(`/projects/${created.id}`);
          }}
        />
      )}
    </Panel>
  );
}
