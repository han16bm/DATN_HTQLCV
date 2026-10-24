import { ProjectPermissionsPage } from "@/features/project-members/components/project-permissions-page";
import { Suspense } from "react";
export default async function Page({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return (
    <Suspense>
      <ProjectPermissionsPage projectId={projectId} />
    </Suspense>
  );
}
