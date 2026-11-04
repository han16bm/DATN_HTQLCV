"use client";

import { Form } from "@/components/forms/form";
import { FormSelect } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { HashDialog } from "@/components/ui/dialog";
import {
  useGetProjectQuery,
  useListProjectsQuery,
} from "@/features/projects/hooks/use-projects-queries";
import { hasPermission } from "@/lib/auth/access";
import { useSession } from "@/lib/auth/session-context";
import { useHashDialog } from "@/lib/forms/use-hash-dialog";
import { validationMessage } from "@/lib/forms/validation-message";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Nút "Tạo công việc": chỉ hiện khi người dùng quản lý ít nhất một dự án đang chạy.
// Đang ở một dự án thì đi thẳng tới biểu mẫu; ở nơi khác thì chọn dự án trước.
export function CreateTaskAction({ projectId }: { projectId?: string }) {
  const { session } = useSession();
  const router = useRouter();
  const dialog = useHashDialog();
  const project = useGetProjectQuery(projectId ?? "");
  const projects = useListProjectsQuery(
    { pageSize: 100 },
    { enabled: !projectId },
  );
  const choices = projectId
    ? project.data
      ? [project.data]
      : []
    : (projects.data?.items ?? []);
  const manageable = choices.filter(
    (p) =>
      p.status === "ACTIVE" && hasPermission(session, "TASKS_MANAGE", p.id),
  );
  const form = useForm({
    resolver: zodResolver(z.object({ projectId: z.string().min(1) }).strict(), {
      error: validationMessage,
    }),
    defaultValues: {},
  });
  if (!manageable.length) return null;
  return (
    <>
      <Button
        variant="primary"
        onClick={() =>
          projectId && manageable.some((p) => p.id === projectId)
            ? router.push(`/projects/${projectId}/tasks/new`)
            : dialog.open("choose-task-project")
        }
      >
        <Plus className="size-4" aria-hidden="true" />
        Tạo công việc
      </Button>
      <HashDialog name="choose-task-project" title="Chọn dự án tạo công việc">
        <Form
          compact
          form={form}
          onSubmit={async (values) => {
            dialog.close();
            router.push(`/projects/${values.projectId}/tasks/new`);
          }}
          submitLabel="Mở biểu mẫu"
        >
          <FormSelect
            label="Dự án bạn quản lý"
            required
            options={manageable.map((p) => ({ value: p.id, label: p.name }))}
            {...form.register("projectId")}
            error={form.formState.errors.projectId}
          />
        </Form>
      </HashDialog>
    </>
  );
}
