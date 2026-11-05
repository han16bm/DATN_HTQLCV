"use client";
import { IconButton } from "@/components/ui/icon-button";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import type { SessionDto } from "@/features/auth/types/auth.types";
import type { Area } from "@/lib/navigation";
import { usePreferences } from "@/stores/preferences-store";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, Menu, PanelLeftOpen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { SettingsPanel } from "./settings-panel";
import { AccountMenu } from "./account-menu";
import { MainNav } from "./main-nav";
import { ProjectSwitcher } from "./project-switcher";

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
  const setPreferences = usePreferences((s) => s.set);
  return (
    <header className="nav-surface fixed inset-x-0 top-0 z-40 flex h-(--topbar-h) items-center gap-1.5 px-2 md:px-3">
      <Dialog.Trigger asChild>
        <IconButton label="Mở menu" className="md:hidden">
          <Menu className="size-5" aria-hidden="true" />
        </IconButton>
      </Dialog.Trigger>
      {!sidebar && (
        <IconButton
          label="Hiện thanh bên"
          title="Ctrl+["
          data-sidebar-toggle
          className="max-md:hidden"
          onClick={() => setPreferences({ hideSidebar: false })}
        >
          <PanelLeftOpen className="size-[18px]" aria-hidden="true" />
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
        <div className="flex min-w-0 md:max-w-44">
          <ProjectSwitcher />
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 hidden md:block md:pl-(--sidebar-w)">
        <div className="mx-auto h-full max-w-(--content-data) px-6 lg:px-8">
          <div className="pointer-events-auto -ml-2.5 h-full min-w-0 max-w-[calc(100%-10rem)] lg:-ml-3">
            <Suspense>
              <MainNav area={area} session={session} />
            </Suspense>
          </div>
        </div>
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <NotificationBell />
        <SettingsPanel />
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
