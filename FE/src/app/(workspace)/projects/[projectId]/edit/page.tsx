import { ProjectEditorPage } from "@/features/projects/components/project-editor-page";
export default async function Page({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return <ProjectEditorPage projectId={projectId} />;
}
