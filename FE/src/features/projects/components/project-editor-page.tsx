"use client";
import { ProjectForm } from "./project-form";

import { PermissionGate } from "@/components/layout/permission-gate";
import { ButtonLink, Loading, PageHeader } from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { useListProjectMembersQuery } from "@/features/project-members/hooks/use-project-members-queries";
import { useGetProjectQuery } from "../hooks/use-projects-queries";

export function ProjectEditorPage({ projectId }: { projectId?: string }) {
  return (
    <PermissionGate
      permission={projectId ? "PROJECT_MANAGE" : "PROJECT_CREATE"}
      projectId={projectId}
    >
      <EditorLoader projectId={projectId} />
    </PermissionGate>
  );
}
function EditorLoader({ projectId }: { projectId?: string }) {
  const query = useGetProjectQuery(projectId ?? "");
  const members = useListProjectMembersQuery(projectId ?? "", {
    pageSize: 100,
  });
  if (projectId && query.isError)
    return (
      <QueryErrorState error={query.error} retry={() => void query.refetch()} />
    );
  if (projectId && !query.data) return <Loading />;
  return (
    <>
      <PageHeader
        title={projectId ? "Điều chỉnh dự án" : "Tạo dự án"}
        description="Giữ kế hoạch và lý do của mỗi lần điều chỉnh."
        actions={
          <ButtonLink href={projectId ? `/projects/${projectId}` : "/projects"}>
            Quay lại
          </ButtonLink>
        }
      />
      <ProjectForm
        key={projectId ?? "new"}
        project={query.data}
        owners={
          members.data?.items
            .filter((m) => !m.endedAt)
            .map((m) => ({ value: m.userId, label: m.user.displayName })) ?? []
        }
        reload={() => query.refetch()}
      />
    </>
  );
}
