"use client";

import { Form } from "@/components/forms/form";
import { FormTextarea } from "@/components/forms/form-field";
import { Panel } from "@/components/ui/page";
import { confirmDiscard } from "@/lib/forms/confirm-discard";
import { useEditSnapshot } from "@/lib/forms/use-edit-snapshot";
import { validationMessage } from "@/lib/forms/validation-message";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import {
  useApproveSubmissionMutation,
  useRequestSubmissionRevisionMutation,
} from "../hooks/use-submissions-mutations";
import { approveSchema, revisionSchema } from "../schemas/submissions.schema";
import type { SubmissionDto } from "../types/submissions.types";
export function ReviewForm({
  submission,
  reload,
}: {
  submission: SubmissionDto;
  reload: () => Promise<{ data?: SubmissionDto }>;
}) {
  const [open, setOpen] = useState(false);
  const [decision, setDecision] = useState("APPROVE");
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
      <DecisionForm
        key={decision}
        decision={decision}
        submission={submission}
        reload={reload}
        close={close}
      />
    </Panel>
  );
}

function DecisionForm({
  decision,
  submission,
  reload,
  close,
}: {
  decision: string;
  submission: SubmissionDto;
  reload: () => Promise<{ data?: SubmissionDto }>;
  close: () => Promise<void>;
}) {
  const approve = useApproveSubmissionMutation();
  const revision = useRequestSubmissionRevisionMutation();
  const router = useRouter();
  const snapshot = useEditSnapshot(submission);
  const schema = decision === "APPROVE" ? approveSchema : revisionSchema;
  type Values = z.input<typeof schema>;
  const form = useForm<Values>({
    resolver: zodResolver<Values, unknown, Values>(schema, {
      error: validationMessage,
    }),
    defaultValues:
      decision === "APPROVE"
        ? { comment: "" }
        : { reason: "", requestedChanges: "" },
  });
  return (
    <Form
      compact
      form={form}
      cancel={
        <button type="button" onClick={close}>
          Hủy
        </button>
      }
      submitLabel="Xác nhận quyết định"
      compareFields={[
        { name: "status", label: "Trạng thái lần nộp" },
        { name: "summary", label: "Tóm tắt kết quả" },
      ]}
      onConflictReload={() => snapshot.load(reload)}
      onConflictAccept={snapshot.accept}
      onSubmit={async (values) => {
        const input = {
          taskId: submission.taskId,
          submissionId: submission.id,
          version: snapshot.base.version,
        };
        if ("requestedChanges" in values)
          await revision.mutateAsync({ ...input, payload: values });
        else await approve.mutateAsync({ ...input, payload: values });
        toast.success("Đã ghi nhận quyết định nghiệm thu.");
        router.push(`/tasks/${submission.taskId}`);
      }}
    >
      {decision === "APPROVE" ? (
        <FormTextarea
          label="Nhận xét"
          {...form.register("comment")}
          error={form.getFieldState("comment", form.formState).error}
        />
      ) : (
        <>
          <FormTextarea
            label="Lý do yêu cầu sửa"
            required
            {...form.register("reason")}
            error={form.getFieldState("reason", form.formState).error}
          />
          <FormTextarea
            label="Nội dung cần sửa"
            required
            {...form.register("requestedChanges")}
            error={form.getFieldState("requestedChanges", form.formState).error}
          />
        </>
      )}
    </Form>
  );
}
