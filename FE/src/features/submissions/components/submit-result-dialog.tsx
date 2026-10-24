"use client";
import { VersionedSchemaForm } from "@/components/forms/versioned-schema-form";
import { HashDialog } from "@/components/ui/dialog";
import { Loading } from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { EvidenceUploader } from "@/features/attachments/components/evidence";
import { useGetProjectQuery } from "@/features/projects/hooks/use-projects-queries";
import { createSubmissionSchema } from "@/features/submissions/schemas/submissions.schema";
import { useGetTaskQuery } from "@/features/tasks/hooks/use-tasks-queries";
import { type TaskDto } from "@/features/tasks/types/tasks.types";
import { useSession } from "@/lib/auth/session-context";
import { useHashDialog } from "@/lib/forms/use-hash-dialog";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useCreateSubmissionMutation } from "../hooks/use-submissions-mutations";

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
      .pipe(createSubmissionSchema.shape.links.max(10)),
  })
  .strict();
export function SubmitResultDialog({ taskId }: { taskId: string }) {
  const query = useGetTaskQuery(taskId);
  const project = useGetProjectQuery(query.data?.projectId ?? "", {
    enabled: Boolean(query.data),
  });
  const { session } = useSession();
  const dialog = useHashDialog();
  return (
    <HashDialog
      name={dialog.name === "attachment" ? "attachment" : "submit"}
      title="Nộp kết quả công việc"
      description="Mỗi lần nộp lưu riêng hạn hoàn thành và tổng giờ công tại thời điểm nộp."
    >
      {query.isError ? (
        <QueryErrorState error={query.error} />
      ) : !query.data ? (
        <Loading />
      ) : query.data.assigneeId !== session?.user.id ||
        query.data.status !== "IN_PROGRESS" ||
        project.data?.status !== "ACTIVE" ? (
        <p>Công việc không còn ở trạng thái được phép nộp kết quả.</p>
      ) : query.data.actualMinutes <= 0 ? (
        <p>Cần ghi nhận giờ công hợp lệ trước khi nộp.</p>
      ) : ["submit", "attachment"].includes(dialog.name) ? (
        <SubmissionForm
          key={taskId}
          taskId={taskId}
          task={query.data}
          reload={() => query.refetch()}
          criteria={query.data.acceptanceCriteria}
        />
      ) : null}
    </HashDialog>
  );
}
function SubmissionForm({
  taskId,
  task,
  reload,
  criteria,
}: {
  taskId: string;
  task: TaskDto;
  reload: () => Promise<{
    data?: TaskDto;
  }>;
  criteria: string;
}) {
  const [ids, setIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const mutation = useCreateSubmissionMutation();
  const dialog = useHashDialog();
  const router = useRouter();
  return (
    <>
      <h3>Tiêu chí nghiệm thu</h3>
      <p className="preserve-lines">{criteria}</p>
      <VersionedSchemaForm
        initial={task}
        reload={reload}
        schema={formSchema}
        defaults={{ summary: "", links: "" }}
        fields={[
          {
            name: "summary",
            label: "Tóm tắt kết quả",
            type: "textarea",
            required: true,
          },
          {
            name: "links",
            label: "Liên kết minh chứng",
            type: "textarea",
            hint: "Mỗi dòng một liên kết HTTP/HTTPS, tối đa 10 liên kết.",
          },
        ]}
        submitDisabled={busy}
        submitLabel="Xác nhận nộp"
        onSubmit={async (values, base) => {
          if (busy) throw new Error("Vui lòng chờ tệp tải xong.");
          await mutation.mutateAsync({
            taskId: taskId,
            payload: createSubmissionSchema.parse({
              ...values,
              attachmentIds: ids,
            }),
            version: base.version,
          });
          dialog.close();
          toast.success("Đã nộp kết quả.");
          router.push(`/tasks/${taskId}/submissions`);
        }}
      >
        <EvidenceUploader
          taskId={taskId}
          onChange={setIds}
          onBusyChange={setBusy}
        />
      </VersionedSchemaForm>
    </>
  );
}
