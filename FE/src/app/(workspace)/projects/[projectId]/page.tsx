import { ProjectDetailPage } from "@/features/projects/components/project-detail-page";
import { Suspense } from "react";
export default async function Page({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return (
    <Suspense>
      <ProjectDetailPage projectId={projectId} />
    </Suspense>
  );
}
