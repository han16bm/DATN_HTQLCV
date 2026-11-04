"use client";
import { ActionButton } from "@/components/ui/action-button";
import { IconButton } from "@/components/ui/icon-button";
import { MenuContent, MenuItem } from "@/components/ui/menu";
import { PageSkeleton } from "@/components/ui/loading";
import { ProjectTile } from "@/components/ui/project-tile";
import { SectionNav } from "@/components/layout/section-nav";
import { StatusField } from "@/components/ui/page";
import { HeaderTarget } from "@/components/ui/header-actions";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { hasPermission } from "@/lib/auth/access";
import { useSession } from "@/lib/auth/session-context";
import { useHashDialog } from "@/lib/forms/use-hash-dialog";
import { useCrumbLabel } from "@/lib/use-crumb-label";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  Ellipsis,
  History,
  LayoutDashboard,
  ListChecks,
  Settings,
  SquareCheckBig,
  Users,
} from "lucide-react";
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
      <header className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <ProjectTile id={project.id} />
        <div className="min-w-0 flex-1 basis-60">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="m-0 text-heading-lg font-semibold text-fg">
              {project.name}
            </h1>
            <StatusField value={project.status} />
          </div>
          <p className="m-0 text-sm text-fg-subtle">
            {project.code} · {project.unit.name}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="contents" ref={setTarget} />
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
                <IconButton
                  label="Cài đặt dự án"
                  className="border border-line-input"
                >
                  <Ellipsis className="size-[18px]" aria-hidden="true" />
                </IconButton>
              </DropdownMenu.Trigger>
              <MenuContent>
                <MenuItem asChild>
                  <Link href={`${root}/edit`}>
                    <Settings className="size-4" aria-hidden="true" />
                    Chỉnh sửa kế hoạch
                  </Link>
                </MenuItem>
                <MenuItem onSelect={() => dialog.open("close")}>
                  <SquareCheckBig className="size-4" aria-hidden="true" />
                  Kết thúc / hủy dự án
                </MenuItem>
              </MenuContent>
            </DropdownMenu.Root>
          )}
        </div>
      </header>
      <SectionNav
        label="Mục dự án"
        items={[
          {
            href: root,
            label: "Tổng quan",
            icon: LayoutDashboard,
            active: path === root && !history,
          },
          {
            href: `${root}/tasks`,
            label: "Công việc",
            icon: ListChecks,
            active: tasks || path === `${root}/tasks/new`,
          },
          {
            href: `${root}/members`,
            label: "Thành viên",
            icon: Users,
            active: path === `${root}/members`,
          },
          {
            href: `${root}?tab=history`,
            label: "Lịch sử",
            icon: History,
            active: history,
          },
          ...(path === `${root}/edit`
            ? [{ href: path, label: "Cài đặt", icon: Settings, active: true }]
            : []),
        ]}
      />
      {children}
      {manage && editable && (
        <ProjectCloseDialog project={project} reload={query.refetch} />
      )}
    </HeaderTarget>
  );
}
