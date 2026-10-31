"use client";
import { ActionButton } from "@/components/ui/action-button";
import { PageSkeleton } from "@/components/ui/loading";
import { ProjectTile } from "@/components/ui/project-tile";
import { StatusField, SectionNav } from "@/components/ui/page";
import { HeaderTarget } from "@/components/ui/header-actions";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { hasPermission } from "@/lib/auth/access";
import { useSession } from "@/lib/auth/session-context";
import { useHashDialog } from "@/lib/forms/use-hash-dialog";
import { useCrumbLabel } from "@/lib/use-crumb-label";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Ellipsis, Settings, SquareCheckBig } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useActivateProjectMutation } from "../hooks/use-projects-mutations";
import { useGetProjectQuery } from "../hooks/use-projects-queries";
import { ProjectCloseDialog } from "./project-close-dialog";

// Header gom điều hướng mục và thao tác của trang con trong cùng khung dự án.
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
  const [target, setTarget] = useState<HTMLDivElement | null>(null);
  useCrumbLabel("project", projectId, query.data?.name);
  if (query.isError)
    return <QueryErrorState error={query.error} retry={query.refetch} />;
  if (!query.data) return <PageSkeleton />;
  const project = query.data;
  const root = `/projects/${projectId}`;
  const manage = hasPermission(session, "PROJECT_MANAGE", projectId);
  const editable = ["PLANNED", "ACTIVE"].includes(project.status);
  const tasks = path === `${root}/tasks`;
  const history = path === root && search.get("tab") === "history";
  return (
    <HeaderTarget value={target}>
      <header className="project-header">
        <ProjectTile id={project.id} />
        <div className="project-heading">
          <div className="page-title">
            <h1>{project.name}</h1>
            <StatusField value={project.status} />
          </div>
          <p className="muted">
            {project.code} · {project.unit.name}
          </p>
        </div>
        <div className="project-navigation">
          <SectionNav
            label="Mục dự án"
            items={[
              {
                href: root,
                label: "Tổng quan",
                active: path === root && !history,
              },
              {
                href: `${root}/tasks`,
                label: "Công việc",
                active: tasks || path === `${root}/tasks/new`,
              },
              {
                href: `${root}/members`,
                label: "Thành viên",
                active: path === `${root}/members`,
              },
              {
                href: `${root}?tab=history`,
                label: "Lịch sử",
                active: history,
              },
              ...(path === `${root}/edit`
                ? [{ href: path, label: "Cài đặt", active: true }]
                : []),
            ]}
          />
        </div>
        <div className="actions">
          <div className="header-actions-slot" ref={setTarget} />
          {manage && editable && project.status === "PLANNED" && (
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
          {manage && editable && (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  type="button"
                  className="icon-button bordered"
                  aria-label="Cài đặt dự án"
                >
                  <Ellipsis size={18} aria-hidden="true" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="account-menu"
                  align="end"
                  sideOffset={8}
                  collisionPadding={12}
                >
                  <DropdownMenu.Item asChild>
                    <Link href={`${root}/edit`} className="account-menu-item">
                      <Settings size={17} aria-hidden="true" />
                      Chỉnh sửa kế hoạch
                    </Link>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    className="account-menu-item"
                    onSelect={() => dialog.open("close")}
                  >
                    <SquareCheckBig size={17} aria-hidden="true" />
                    Kết thúc / hủy dự án
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          )}
        </div>
      </header>
      {children}
      {manage && editable && (
        <ProjectCloseDialog project={project} reload={query.refetch} />
      )}
    </HeaderTarget>
  );
}
