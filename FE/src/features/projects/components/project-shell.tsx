"use client";
import { ActionButton } from "@/components/ui/action-button";
import {
  Badge,
  ButtonLink,
  Loading,
  PageHeader,
  Tabs,
} from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { hasPermission, useSession } from "@/lib/auth/session-context";
import { useHashDialog } from "@/lib/forms/use-hash-dialog";
import { usePathname, useSearchParams } from "next/navigation";
import { type ReactNode } from "react";
import { toast } from "sonner";
import { useActivateProjectMutation } from "../hooks/use-projects-mutations";
import { useGetProjectQuery } from "../hooks/use-projects-queries";
import { ProjectCloseDialog } from "./project-close-dialog";

export function ProjectShell({
  projectId,
  children,
}: {
  projectId: string;
  children: ReactNode;
}) {
  const search = useSearchParams();
  const query = useGetProjectQuery(projectId);
  const activate = useActivateProjectMutation();
  const { session } = useSession();
  const path = usePathname();
  const dialog = useHashDialog();
  if (query.isError)
    return (
      <QueryErrorState error={query.error} retry={() => void query.refetch()} />
    );
  if (!query.data) return <Loading />;
  const project = query.data;
  const manage = hasPermission(session, "PROJECT_MANAGE", projectId);
  const editable = ["PLANNED", "ACTIVE"].includes(project.status);
  return (
    <>
      <PageHeader
        title={project.name}
        description={`${project.unit.name} · Kế hoạch dự án`}
        actions={
          <>
            <ButtonLink href="/projects">Danh sách</ButtonLink>
            {manage && editable && (
              <>
                <ButtonLink href={`/projects/${projectId}/edit`}>
                  Chỉnh sửa kế hoạch
                </ButtonLink>
                {project.status === "PLANNED" && (
                  <ActionButton
                    primary
                    onAction={async () => {
                      await activate.mutateAsync({
                        projectId: projectId,
                        version: project.version,
                      });
                      toast.success("Đã triển khai dự án.");
                    }}
                  >
                    Triển khai dự án
                  </ActionButton>
                )}
                <button onClick={() => dialog.open("close")}>
                  Kết thúc / hủy
                </button>
              </>
            )}
          </>
        }
      />
      <p className="metadata">
        <Badge value={project.status} />
      </p>
      <Tabs
        active={search.get("tab") === "history" ? "history" : path}
        items={[
          { href: `/projects/${projectId}`, label: "Tổng quan" },
          { href: `/tasks?projectId=${projectId}`, label: "Công việc" },
          { href: `/projects/${projectId}/members`, label: "Thành viên" },
          ...(hasPermission(session, "MEMBERS_MANAGE", projectId)
            ? [
                {
                  href: `/projects/${projectId}/permissions`,
                  label: "Phân quyền",
                },
              ]
            : []),
          {
            href: `/projects/${projectId}?tab=history`,
            label: "Lịch sử",
            key: "history",
          },
        ]}
      />
      {children}
      {manage && editable && <ProjectCloseDialog project={project} />}
    </>
  );
}
