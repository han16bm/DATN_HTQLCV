"use client";
import { VersionedSchemaForm } from "@/components/forms/versioned-schema-form";
import { HashDialog } from "@/components/ui/dialog";
import { PageSkeleton } from "@/components/ui/loading";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { type ProjectDto } from "@/features/projects/types/projects.types";
import { confirmDiscard } from "@/lib/forms/confirm-discard";
import { useHashDialog } from "@/lib/forms/use-hash-dialog";
import { reasonSchema } from "@/lib/validation/common.schema";
import { emptySchema } from "@/lib/validation/request.schema";
import { useState } from "react";
import { toast } from "sonner";
import {
  useCancelProjectMutation,
  useCompleteProjectMutation,
} from "../hooks/use-projects-mutations";
import { useGetProjectClosureChecksQuery } from "../hooks/use-projects-queries";

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
  const complete = useCompleteProjectMutation();
  const cancel = useCancelProjectMutation();
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
        <QueryErrorState
          error={checks.error}
          retry={() => void checks.refetch()}
        />
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
                <VersionedSchemaForm
                  initial={project}
                  reload={reload}
                  key={action}
                  schema={action === "COMPLETE" ? emptySchema : reasonSchema}
                  fields={
                    action === "CANCEL"
                      ? [
                          {
                            name: "reason",
                            label: "Lý do hủy",
                            type: "textarea",
                            required: true,
                          },
                        ]
                      : []
                  }
                  onSubmit={async (values, base) => {
                    const input = {
                      projectId: project.id,
                      version: base.version,
                    };
                    if ("reason" in values)
                      await cancel.mutateAsync({
                        ...input,
                        payload: { reason: values.reason },
                      });
                    else await complete.mutateAsync(input);
                    toast.success("Đã đóng dự án.");
                    dialog.close();
                  }}
                  submitLabel="Kiểm tra và xác nhận"
                />
              </div>
            </>
          )}
        </>
      )}
    </HashDialog>
  );
}
