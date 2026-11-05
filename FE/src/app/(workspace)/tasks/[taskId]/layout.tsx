import { TaskShell } from "@/features/tasks/components/task-shell";
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
      <TaskShell taskId={taskId}>{children}</TaskShell>
    </Suspense>
  );
}
