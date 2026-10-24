"use client";
import { SchemaForm } from "@/components/forms/schema-form";
import { ButtonLink, Loading, Panel } from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { useGetProjectQuery } from "@/features/projects/hooks/use-projects-queries";
import { remainingSchema } from "@/features/tasks/schemas/task-form.schema";
import { type TaskDto } from "@/features/tasks/types/tasks.types";
import { useSession } from "@/lib/auth/session-context";
import { dateTime, number } from "@/lib/format";
import { useEditSnapshot } from "@/lib/forms/use-edit-snapshot";
import { toast } from "sonner";
import { useUpdateRemainingEstimateMutation } from "../hooks/use-tasks-mutations";
import {
  useGetTaskQuery,
  useListTaskHistoryQuery,
} from "../hooks/use-tasks-queries";

export function TaskDetailPage({ taskId }: { taskId: string }) {
  const query = useGetTaskQuery(taskId);
  const history = useListTaskHistoryQuery(taskId, { pageSize: 5 });
  const project = useGetProjectQuery(query.data?.projectId ?? "");
  const { session } = useSession();
  if (query.isError) return <QueryErrorState error={query.error} />;
  if (!query.data) return <Loading />;
  const task = query.data;
  return (
    <div className="details-grid">
      <div>
        <Panel title="Nội dung công việc">
          <p className="prose">
            {task.description || "Chưa có mô tả bổ sung."}
          </p>
          <h3 className="section-gap">Tiêu chí nghiệm thu</h3>
          <p className="prose">{task.acceptanceCriteria}</p>
        </Panel>
        <Panel title="Hoạt động gần đây">
          {history.isError ? (
            <QueryErrorState error={history.error} />
          ) : !history.data ? (
            <Loading />
          ) : (
            <ul className="timeline">
              {history.data.items.map((a) => (
                <li key={a.id}>
                  {a.action}
                  <div className="small muted">
                    {dateTime(a.at)}
                    {a.reason ? ` · ${a.reason}` : ""}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <ButtonLink href={`/tasks/${taskId}/history`}>
            Xem toàn bộ lịch sử
          </ButtonLink>
        </Panel>
      </div>
      <div>
        <Panel title="Thông tin công việc">
          <dl>
            <div>
              <dt>Người thực hiện</dt>
              <dd>{task.assignee?.displayName ?? "Chưa phân công"}</dd>
            </div>
            <div>
              <dt>Hạn hoàn thành</dt>
              <dd>{dateTime(task.dueAt)}</dd>
            </div>
            <div>
              <dt>Hạn ban đầu</dt>
              <dd>{dateTime(task.originalDueAt)}</dd>
            </div>
            <div>
              <dt>Dự án</dt>
              <dd>{task.project.name}</dd>
            </div>
          </dl>
        </Panel>
        <Panel title="Giờ công">
          <p>
            Đã ghi / dự kiến: {number(task.actualMinutes / 60)} /{" "}
            {number(task.estimatedMinutes / 60)} giờ
          </p>
          <progress
            max={task.estimatedMinutes}
            value={task.actualMinutes}
            aria-label="Giờ công đã ghi so với dự kiến"
          />
          <p className="small muted">
            Đây là giờ đã ghi so với dự kiến, không phải tỷ lệ hoàn thành.
          </p>
          <dl className="section-gap">
            <div>
              <dt>Dự kiến ban đầu</dt>
              <dd>{number(task.originalEstimatedMinutes, "phút")}</dd>
            </div>
            <div>
              <dt>Dự kiến hiện tại</dt>
              <dd>{number(task.estimatedMinutes, "phút")}</dd>
            </div>
            <div>
              <dt>Còn lại đã cập nhật</dt>
              <dd>{number(task.remainingMinutes, "phút")}</dd>
            </div>
          </dl>
          {task.assigneeId === session?.user.id &&
            task.status === "IN_PROGRESS" &&
            project.data?.status === "ACTIVE" && (
              <RemainingForm
                key={task.id}
                task={task}
                reload={() => query.refetch()}
              />
            )}
        </Panel>
      </div>
    </div>
  );
}
function RemainingForm({
  task,
  reload,
}: {
  task: TaskDto;
  reload: () => Promise<{
    data?: TaskDto;
  }>;
}) {
  const mutation = useUpdateRemainingEstimateMutation();
  const snapshot = useEditSnapshot(task);
  return (
    <div className="section-gap">
      <SchemaForm
        schema={remainingSchema}
        fields={[
          {
            name: "remainingMinutes",
            label: "Còn lại (phút)",
            type: "number",
            required: true,
          },
        ]}
        defaults={{ remainingMinutes: task.remainingMinutes ?? "" }}
        onConflictReload={() => snapshot.load(reload)}
        onConflictAccept={snapshot.accept}
        onSubmit={async (values) => {
          snapshot.saved(
            await mutation.mutateAsync({
              taskId: task.id,
              payload: values,
              version: snapshot.base.version,
            }),
          );
          toast.success("Đã cập nhật phút còn lại.");
        }}
        submitLabel="Lưu cập nhật"
      />
    </div>
  );
}
