"use client";

import { Form } from "@/components/forms/form";
import { FormTextarea } from "@/components/forms/form-field";
import { HashDialog } from "@/components/ui/dialog";
import { PageSkeleton } from "@/components/ui/loading";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { confirmDiscard } from "@/lib/forms/confirm-discard";
import { useEditSnapshot } from "@/lib/forms/use-edit-snapshot";
import { useHashDialog } from "@/lib/forms/use-hash-dialog";
import { validationMessage } from "@/lib/forms/validation-message";
import { reasonSchema } from "@/lib/validation/common.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  useCancelProjectMutation,
  useCompleteProjectMutation,
} from "../hooks/use-projects-mutations";
import { useGetProjectClosureChecksQuery } from "../hooks/use-projects-queries";
import { type ProjectDto } from "../types/projects.types";

export function ProjectCloseDialog({
  project,
  reload,
}: {
  project: ProjectDto;
  reload: () => Promise<{ data?: ProjectDto }>;
}) {
  const dialog = useHashDialog();
  const checks = useGetProjectClosureChecksQuery(project.id, {
    enabled: dialog.name === "close",
  });
  const [action, setAction] = useState(
    project.status === "ACTIVE" ? "COMPLETE" : "CANCEL",
  );
  return (
    <HashDialog
      name="close"
      title="Kết thúc dự án"
      description="Các điều kiện được kiểm tra lại tại thời điểm xác nhận."
    >
      {checks.isError ? (
        <QueryErrorState error={checks.error} retry={checks.refetch} />
      ) : !checks.data ? (
        <PageSkeleton variant="form" />
      ) : (
        <>
          <dl>
            <div>
              <dt>Công việc mở</dt>
              <dd>{checks.data.openTaskCount}</dd>
            </div>
            <div>
              <dt>Kết quả chờ nghiệm thu</dt>
              <dd>{checks.data.pendingReviewCount}</dd>
            </div>
            <div>
              <dt>Báo cáo cần gửi</dt>
              <dd>{checks.data.pendingReportCount}</dd>
            </div>
          </dl>
          {!checks.data.canClose ? (
            <div className="hint">
              Cần xử lý các mục còn tồn trước khi đóng dự án. Không tự hủy công
              việc hoặc bỏ qua kết quả chờ xét.
            </div>
          ) : (
            <>
              <label className="form-field section-gap">
                Thao tác
                <select
                  value={action}
                  onChange={async (e) => {
                    const value = e.target.value;
                    if (await confirmDiscard()) setAction(value);
                  }}
                >
                  {project.status === "ACTIVE" && (
                    <option value="COMPLETE">Kết thúc dự án</option>
                  )}
                  <option value="CANCEL">Hủy dự án</option>
                </select>
              </label>
              <div className="section-gap">
                <CloseForm
                  key={action}
                  action={action}
                  project={project}
                  reload={reload}
                />
              </div>
            </>
          )}
        </>
      )}
    </HashDialog>
  );
}

function CloseForm({
  action,
  project,
  reload,
}: {
  action: string;
  project: ProjectDto;
  reload: () => Promise<{ data?: ProjectDto }>;
}) {
  const complete = useCompleteProjectMutation();
  const cancel = useCancelProjectMutation();
  const dialog = useHashDialog();
  const snapshot = useEditSnapshot(project);
  const schema = reasonSchema.extend({
    reason: action === "COMPLETE" ? z.string() : reasonSchema.shape.reason,
  });
  type Values = z.input<typeof schema>;
  const form = useForm<Values>({
    resolver: zodResolver(schema, { error: validationMessage }),
    defaultValues: { reason: "" },
  });
  const { errors } = form.formState;
  return (
    <Form
      compact
      form={form}
      onConflictReload={() => snapshot.load(reload)}
      onConflictAccept={snapshot.accept}
      onSubmit={async (values) => {
        const input = {
          projectId: project.id,
          version: snapshot.base.version,
        };
        if (action === "CANCEL")
          await cancel.mutateAsync({
            ...input,
            payload: { reason: values.reason },
          });
        else await complete.mutateAsync(input);
        toast.success("Đã đóng dự án.");
        dialog.close();
      }}
      submitLabel="Kiểm tra và xác nhận"
    >
      {action === "CANCEL" && (
        <FormTextarea
          label="Lý do hủy"
          required
          {...form.register("reason")}
          error={errors.reason}
        />
      )}
    </Form>
  );
}
