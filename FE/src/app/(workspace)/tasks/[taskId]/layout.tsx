import { SubmitResultDialog } from "@/features/submissions/components/submit-result-dialog";
import { TaskShell } from "@/features/tasks/components/task-shell";
import { TimeLogDialog } from "@/features/time-logs/components/time-log-dialog";
import { Suspense, type ReactNode } from "react";
export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ taskId: string }>;
  children: ReactNode;
}) {
  const { taskId } = await params;
  return (
    <Suspense>
      <TaskShell taskId={taskId}>
        {children}
        <TimeLogDialog taskId={taskId} />
        <SubmitResultDialog taskId={taskId} />
      </TaskShell>
    </Suspense>
  );
}
