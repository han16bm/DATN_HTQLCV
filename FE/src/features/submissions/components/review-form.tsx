"use client";
import { SchemaForm } from "@/components/forms/schema-form";
import { Panel } from "@/components/ui/page";
import {
  approveSchema,
  revisionSchema,
} from "@/features/submissions/schemas/submissions.schema";
import { confirmDiscard } from "@/lib/forms/confirm-discard";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  useApproveSubmissionMutation,
  useRequestSubmissionRevisionMutation,
} from "../hooks/use-submissions-mutations";
export function ReviewForm({
  taskId,
  submissionId,
  version,
}: {
  taskId: string;
  submissionId: string;
  version: number;
}) {
  const [open, setOpen] = useState(false);
  const [decision, setDecision] = useState("APPROVE");
  const approve = useApproveSubmissionMutation();
  const revision = useRequestSubmissionRevisionMutation();
  const router = useRouter();
  const close = async () => {
    if (await confirmDiscard("Bỏ quyết định nghiệm thu chưa lưu?"))
      setOpen(false);
  };
  if (!open)
    return (
      <div className="actions review-actions">
        <button type="button" className="primary" onClick={() => setOpen(true)}>
          Đưa ra quyết định nghiệm thu
        </button>
      </div>
    );
  return (
    <Panel title="Quyết định nghiệm thu" className="review-form">
      <label className="form-field review-decision">
        Quyết định
        <select
          value={decision}
          onChange={async (e) => {
            const value = e.target.value;
            if (await confirmDiscard()) setDecision(value);
          }}
        >
          <option value="APPROVE">Chấp nhận kết quả</option>
          <option value="REVISION">Yêu cầu chỉnh sửa</option>
        </select>
      </label>
      <SchemaForm
        cancel={
          <button type="button" onClick={close}>
            Hủy
          </button>
        }
        key={decision}
        schema={decision === "APPROVE" ? approveSchema : revisionSchema}
        fields={
          decision === "APPROVE"
            ? [{ name: "comment", label: "Nhận xét", type: "textarea" }]
            : [
                {
                  name: "reason",
                  label: "Lý do yêu cầu sửa",
                  type: "textarea",
                  required: true,
                },
                {
                  name: "requestedChanges",
                  label: "Nội dung cần sửa",
                  type: "textarea",
                  required: true,
                },
              ]
        }
        submitLabel="Xác nhận quyết định"
        onSubmit={async (values) => {
          const input = { taskId, submissionId, version };
          if ("requestedChanges" in values)
            await revision.mutateAsync({ ...input, payload: values });
          else await approve.mutateAsync({ ...input, payload: values });
          toast.success("Đã ghi nhận quyết định nghiệm thu.");
          router.push(`/tasks/${taskId}`);
        }}
      />
    </Panel>
  );
}
