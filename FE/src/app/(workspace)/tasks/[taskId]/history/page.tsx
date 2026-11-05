import { TaskHistoryPage } from "@/features/tasks/components/task-history-page";
import { Suspense } from "react";
export default async function Page({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;
  return (
    <Suspense>
      <TaskHistoryPage taskId={taskId} />
    </Suspense>
  );
}
