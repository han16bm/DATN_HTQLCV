import { TaskListPage } from "@/features/tasks/components/task-list-page";
import { Suspense } from "react";
export default async function Page({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return (
    <Suspense>
      <TaskListPage projectId={projectId} />
    </Suspense>
  );
}
