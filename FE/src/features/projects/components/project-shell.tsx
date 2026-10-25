"use client";
import { ActionButton } from "@/components/ui/action-button";
import {
  Badge,
  ButtonLink,
  PageHeader,
  SectionSelect,
} from "@/components/ui/page";
import { PageSkeleton } from "@/components/ui/loading";
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
  if (!query.data) return <PageSkeleton />;
  const project = query.data;
  const root = `/projects/${projectId}`;
  const manage = hasPermission(session, "PROJECT_MANAGE", projectId);
  const editable = ["PLANNED", "ACTIVE"].includes(project.status);
  return (
    <>
      <PageHeader
        title={project.name}
        description={project.unit.name}
        status={<Badge value={project.status} />}
        actions={
          <>
            <ButtonLink href="/projects">Danh sách</ButtonLink>
            {manage && editable && (
              <>
                {path !== `${root}/edit` && (
                  <ButtonLink href={`${root}/edit`}>
                    Chỉnh sửa kế hoạch
                  </ButtonLink>
                )}
                {project.status === "PLANNED" && (
                  <ActionButton
                    primary
                    onAction={async () => {
                      await activate.mutateAsync({
                        projectId,
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
      <div className="section-toolbar">
        <SectionSelect
          label="Mục dự án"
          active={
            path === root && search.get("tab") === "history"
              ? `${root}?tab=history`
              : path
          }
          items={[
            { href: root, label: "Tổng quan" },
            { href: `/tasks?projectId=${projectId}`, label: "Công việc" },
            { href: `${root}/members`, label: "Thành viên" },
            ...(hasPermission(session, "MEMBERS_MANAGE", projectId)
              ? [
                  {
                    href: `${root}/permissions`,
                    label: "Phân quyền",
                  },
                ]
              : []),
            {
              href: `${root}?tab=history`,
              label: "Lịch sử",
            },
            ...(path === `${root}/edit`
              ? [{ href: path, label: "Chỉnh sửa kế hoạch" }]
              : []),
          ]}
        />
      </div>
      {children}
      {manage && editable && (
        <ProjectCloseDialog project={project} reload={query.refetch} />
      )}
    </>
  );
}
