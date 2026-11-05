import { ProjectDetailPage } from "@/features/projects/components/project-detail-page";
import { Suspense } from "react";
import { projectUrl, type PageSearch } from "@/lib/navigation";
import { redirect } from "next/navigation";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<PageSearch>;
}) {
  const { projectId } = await params;
  const search = await searchParams;
  if (search.tab === "history")
    redirect(projectUrl(projectId, search, "history"));
  return (
    <Suspense>
      <ProjectDetailPage projectId={projectId} />
    </Suspense>
  );
}
