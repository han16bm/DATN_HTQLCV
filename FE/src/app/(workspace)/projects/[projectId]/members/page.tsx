import { ProjectMembersPage } from "@/features/project-members/components/project-members-page";
import { Suspense } from "react";
export default async function Page({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return (
    <Suspense>
      <ProjectMembersPage projectId={projectId} />
    </Suspense>
  );
}
