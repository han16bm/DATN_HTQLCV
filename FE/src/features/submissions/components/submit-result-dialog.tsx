"use client";

import { Form } from "@/components/forms/form";
import { FormTextarea } from "@/components/forms/form-field";
import { HashDialog } from "@/components/ui/dialog";
import { EvidenceUploader } from "@/features/attachments/components/evidence";
import { type TaskDto } from "@/features/tasks/types/tasks.types";
import { useSession } from "@/lib/auth/session-context";
import { useEditSnapshot } from "@/lib/forms/use-edit-snapshot";
import { useHashDialog } from "@/lib/forms/use-hash-dialog";
import { validationMessage } from "@/lib/forms/validation-message";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useCreateSubmissionMutation } from "../hooks/use-submissions-mutations";
import { createSubmissionSchema } from "../schemas/submissions.schema";

const formSchema = z
  .object({
    summary: createSubmissionSchema.shape.summary,
    links: z
      .string()
      .default("")
      .transform((value) =>
        value
          .split(/\r?\n/)
          .map((v) => v.trim())
          .filter(Boolean),
      )
      .pipe(createSubmissionSchema.shape.links),
    attachmentIds: createSubmissionSchema.shape.attachmentIds,
  })
  .strict();
export function SubmitResultDialog({
  task,
  active,
  reload,
}: {
  task: TaskDto;
  active: boolean;
  reload: () => Promise<{ data?: TaskDto }>;
}) {
  const { session } = useSession();
  const dialog = useHashDialog();
  return (
    <HashDialog
      name={dialog.name === "attachment" ? "attachment" : "submit"}
      title="Nộp kết quả công việc"
      description="Mỗi lần nộp lưu riêng hạn hoàn thành và tổng giờ công tại thời điểm nộp."
    >
      {task.assigneeId !== session?.user.id ||
      task.status !== "IN_PROGRESS" ||
      !active ? (
        <p>Công việc không còn ở trạng thái được phép nộp kết quả.</p>
      ) : task.actualMinutes <= 0 ? (
        <p>Cần ghi nhận giờ công hợp lệ trước khi nộp.</p>
      ) : ["submit", "attachment"].includes(dialog.name) ? (
        <SubmissionForm key={task.id} task={task} reload={reload} />
      ) : null}
    </HashDialog>
  );
}

function SubmissionForm({
  task,
  reload,
}: {
  task: TaskDto;
  reload: () => Promise<{
    data?: TaskDto;
  }>;
}) {
  const [busy, setBusy] = useState(false);
  const snapshot = useEditSnapshot(task);
  const form = useForm<
    z.input<typeof formSchema>,
    unknown,
    z.output<typeof formSchema>
  >({
    resolver: zodResolver(formSchema, { error: validationMessage }),
    defaultValues: { summary: "", links: "", attachmentIds: [] },
  });
  const { errors } = form.formState;
  const mutation = useCreateSubmissionMutation();
  const dialog = useHashDialog();
  const router = useRouter();
  return (
    <>
      <h3 className="m-0 mb-1 text-sm font-semibold text-fg">
        Tiêu chí nghiệm thu
      </h3>
      <p className="m-0 mb-4 text-sm whitespace-pre-wrap text-fg">
        {task.acceptanceCriteria}
      </p>
      <Form
        form={form}
        onConflictReload={() => snapshot.load(reload)}
        onConflictAccept={snapshot.accept}
        compareFields={[
          { name: "acceptanceCriteria", label: "Tiêu chí nghiệm thu" },
        ]}
        submitDisabled={busy}
        submitLabel="Xác nhận nộp"
        onSubmit={async (values) => {
          await mutation.mutateAsync({
            taskId: task.id,
            payload: values,
            version: snapshot.base.version,
          });
          dialog.close();
          toast.success("Đã nộp kết quả.");
          router.push(`/tasks/${task.id}/submissions`);
        }}
      >
        <FormTextarea
          label="Tóm tắt kết quả"
          required
          {...form.register("summary")}
          error={errors.summary}
        />
        <FormTextarea
          label="Liên kết minh chứng"
          hint="Mỗi dòng một liên kết, tối đa 10 liên kết."
          {...form.register("links")}
          error={errors.links}
        />
        <EvidenceUploader
          taskId={task.id}
          onChange={(ids) =>
            form.setValue("attachmentIds", ids, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
          onBusyChange={setBusy}
        />
      </Form>
    </>
  );
}
