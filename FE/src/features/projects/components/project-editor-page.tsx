"use client";

import { PageSkeleton } from "@/components/ui/loading";
import { ButtonLink, PageHeader } from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { useListProjectMembersQuery } from "@/features/project-members/hooks/use-project-members-queries";
import { canManage } from "@/lib/auth/access";
import { useSession } from "@/lib/auth/session-context";
import { ApiError } from "@/types/api/error";
import { useGetProjectQuery } from "../hooks/use-projects-queries";
import { ProjectForm } from "./project-form";

export function ProjectEditorPage({ projectId }: { projectId?: string }) {
  const { session } = useSession();
  return projectId && !canManage(session, projectId) ? (
    <QueryErrorState
      error={
        new ApiError(
          403,
          "FORBIDDEN",
          "Bạn không được chỉnh sửa kế hoạch của dự án này.",
        )
      }
    />
  ) : (
    <EditorLoader projectId={projectId} />
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
  if (projectId && members.isError)
    return (
      <QueryErrorState
        error={members.error}
        retry={() => void members.refetch()}
      />
    );
  if (projectId && (!query.data || !members.data))
    return <PageSkeleton variant="form" />;
  return (
    <>
      <PageHeader
        title={projectId ? "Điều chỉnh dự án" : "Tạo dự án"}
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
            .filter((m) => !m.endedAt && m.projectRole !== "MEMBER")
            .map((m) => ({ value: m.userId, label: m.user.displayName })) ?? []
        }
        reload={() => query.refetch()}
      />
    </>
  );
}
