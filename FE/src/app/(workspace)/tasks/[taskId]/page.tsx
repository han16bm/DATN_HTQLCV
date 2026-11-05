import { TaskDetailPage } from "@/features/tasks/components/task-detail-page";
export default async function Page({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;
  return <TaskDetailPage taskId={taskId} />;
}
