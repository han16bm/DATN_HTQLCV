import { TaskEditorPage } from "@/features/tasks/components/task-editor-page";
export default async function Page({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;
  return <TaskEditorPage taskId={taskId} />;
}
