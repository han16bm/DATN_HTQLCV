import { ProjectShell } from "@/features/projects/components/project-shell";
import { Suspense, type ReactNode } from "react";
export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return (
    <Suspense>
      <ProjectShell projectId={projectId}>{children}</ProjectShell>
    </Suspense>
  );
}
