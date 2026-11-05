import { TaskEditorPage } from "@/features/tasks/components/task-editor-page";
export default async function Page({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return <TaskEditorPage projectId={projectId} />;
}
