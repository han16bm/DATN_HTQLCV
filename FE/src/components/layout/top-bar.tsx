"use client";
import { IconButton } from "@/components/ui/icon-button";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import type { SessionDto } from "@/features/auth/types/auth.types";
import type { Area } from "@/lib/navigation";
import { useUI } from "@/stores/ui-store";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { AccountMenu } from "./account-menu";
import { MainNav } from "./main-nav";
import { ProjectSwitcher } from "./project-switcher";

// Header giữ bộ chọn dự án, chức năng quản lý bổ sung và menu tài khoản.
// Chức năng chung nằm ở sidebar; màn hẹp gom menu vào drawer.
export function TopBar({
  area,
  session,
  sidebar,
  onSignOut,
}: {
  area: Area;
  session: SessionDto;
  sidebar: boolean;
  onSignOut: () => Promise<void>;
}) {
  const pathname = usePathname();
  const collapsed = useUI((s) => s.sidebarCollapsed);
  const toggleSidebar = useUI((s) => s.toggleSidebar);
  const Panel = collapsed ? PanelLeftOpen : PanelLeftClose;
  return (
    <header className="nav-surface fixed inset-x-0 top-0 z-40 flex h-(--topbar-h) items-center gap-1.5 px-2 md:px-3">
      <Dialog.Trigger asChild>
        <IconButton label="Mở menu" className="md:hidden">
          <Menu className="size-5" aria-hidden="true" />
        </IconButton>
      </Dialog.Trigger>
      {sidebar && (
        <IconButton
          label={
            collapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"
          }
          title="Ctrl+["
          data-sidebar-toggle
          className="max-md:hidden"
          onClick={toggleSidebar}
        >
          <Panel className="size-[18px]" aria-hidden="true" />
        </IconButton>
      )}
      {area === "admin" ? (
        <>
          <Link
            href="/workspace"
            className="inline-flex h-(--control-h) items-center gap-1.5 rounded-md px-2 text-sm font-medium whitespace-nowrap text-selected-fg hover:bg-hover max-md:hidden"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Về không gian làm việc
          </Link>
          <span className="inline-flex h-6 items-center rounded-sm bg-info-bg px-2 text-xs font-medium whitespace-nowrap text-info-fg">
            Quản trị hệ thống
          </span>
        </>
      ) : (
        <ProjectSwitcher />
      )}
      <div className="ml-1 hidden h-full min-w-0 flex-1 md:flex">
        <Suspense>
          <MainNav area={area} session={session} />
        </Suspense>
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <NotificationBell />
        <AccountMenu
          key={pathname}
          area={area}
          session={session}
          onSignOut={onSignOut}
        />
      </div>
    </header>
  );
}
