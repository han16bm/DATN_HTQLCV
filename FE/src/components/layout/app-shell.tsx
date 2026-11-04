"use client";
import { IconButton } from "@/components/ui/icon-button";
import { Notice } from "@/components/ui/notice";
import { ButtonLink } from "@/components/ui/page";
import { Spinner } from "@/components/ui/loading";
import { canVisit } from "@/lib/auth/access";
import { useSession } from "@/lib/auth/session-context";
import { cn } from "@/lib/cn";
import { confirmDiscard } from "@/lib/forms/confirm-discard";
import type { Area } from "@/lib/navigation";
import { usePreferences } from "@/stores/preferences-store";
import { useUI } from "@/stores/ui-store";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { BreadcrumbTrail } from "./breadcrumb-trail";
import { DirtyNavigationGuard } from "./dirty-navigation-guard";
import { NavigationTracker } from "./navigation-tracker";
import { SectionSlot } from "./section-nav";
import { SideNav } from "./side-nav";
import { TopBar } from "./top-bar";

// Phiên hết hạn hoặc bị thu hồi: về đăng nhập và nhớ trang đang mở để quay lại.
function loginUrl() {
  const next = location.pathname + location.search;
  return `/login?next=${encodeURIComponent(next)}&expired=1`;
}

// Khung dùng chung của khu làm việc và khu quản trị: cùng phiên, cùng quy tắc
// quyền; chỉ khác menu. Trang chỉ được mount khi canVisit cho phép.
export function AppShell({
  area,
  children,
}: {
  area: Area;
  children: ReactNode;
}) {
  const { session, loading, signOut } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const open = useUI((s) => s.sidebarOpen);
  const collapsed = useUI((s) => s.sidebarCollapsed);
  const setSidebar = useUI((s) => s.setSidebar);
  const toggleSidebar = useUI((s) => s.toggleSidebar);
  const leaving = useRef(false);
  const [navSlot, setNavSlot] = useState<HTMLElement | null>(null);
  // Cả hai khu đều có sidebar (chức năng chung hoặc các mục quản trị) trừ khi người
  // dùng chọn ẩn trong Cài đặt giao diện; mục quản lý bổ sung nằm ở header.
  const hidden = usePreferences((s) => s.hideSidebar);
  const showSidebar = usePreferences((s) => s.set);
  const sidebar = !hidden;
  const slots = useMemo(
    () => ({ nav: navSlot, enabled: sidebar }),
    [navSlot, sidebar],
  );
  useEffect(() => {
    if (!loading && !session && !leaving.current) router.replace(loginUrl());
  }, [loading, session, router]);
  // Đổi trang thì đóng menu di động, kể cả khi điều hướng không đi qua menu.
  useEffect(() => {
    setSidebar(false);
  }, [pathname, setSidebar]);
  useEffect(() => {
    const close = () => {
      if (window.innerWidth >= 768) setSidebar(false);
    };
    window.addEventListener("resize", close);
    return () => window.removeEventListener("resize", close);
  }, [setSidebar]);
  // Ctrl+[ thu gọn/mở rộng sidebar như Jira.
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if (
        event.ctrlKey &&
        !event.altKey &&
        !event.metaKey &&
        event.key === "["
      ) {
        event.preventDefault();
        if (hidden) showSidebar({ hideSidebar: false });
        else toggleSidebar();
        document
          .querySelector<HTMLButtonElement>("[data-sidebar-toggle]")
          ?.focus();
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, [hidden, showSidebar, toggleSidebar]);
  if (loading || !session)
    return (
      <div
        className="flex min-h-screen items-center justify-center gap-3.5 text-sm text-fg"
        role="status"
      >
        <Spinner />
        Đang tải phiên làm việc…
      </div>
    );
  const logout = async () => {
    if (
      !(await confirmDiscard(
        "Bạn có dữ liệu chưa lưu. Bỏ thay đổi và đăng xuất?",
      ))
    )
      return;
    leaving.current = true;
    await signOut();
    router.replace("/login");
  };
  return (
    <Dialog.Root open={open} onOpenChange={setSidebar}>
      <SectionSlot value={slots}>
        <div className="min-h-screen">
          <a
            href="#main"
            className="sr-only z-50 rounded-md bg-surface px-3 py-2 text-sm font-medium text-selected-fg shadow-overlay focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
          >
            Bỏ qua điều hướng
          </a>
          <Suspense>
            <DirtyNavigationGuard />
            <NavigationTracker />
          </Suspense>
          <TopBar
            area={area}
            session={session}
            sidebar={sidebar}
            onSignOut={logout}
          />
          {sidebar && (
            <aside
              aria-label="Thanh điều hướng"
              className={cn(
                "nav-surface fixed top-(--topbar-h) bottom-0 left-0 z-30 hidden flex-col px-2 pt-3 pb-2 md:flex",
                "motion-safe:transition-[width] motion-safe:duration-150",
                collapsed ? "w-(--sidebar-w-collapsed)" : "w-(--sidebar-w)",
              )}
            >
              <Suspense>
                <SideNav
                  area={area}
                  session={session}
                  collapsed={collapsed}
                  slot={setNavSlot}
                />
              </Suspense>
            </aside>
          )}
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-60 bg-overlay md:hidden" />
            <Dialog.Content
              aria-describedby={undefined}
              className="nav-surface fixed inset-y-0 left-0 z-61 flex w-[min(300px,86vw)] flex-col px-2 pt-2 pb-2 shadow-overlay outline-none md:hidden motion-safe:animate-[drawer-in_180ms_ease-out]"
            >
              <div className="mb-2 flex items-center justify-between pl-2.5">
                <Dialog.Title className="m-0 text-sm font-semibold text-fg">
                  Menu điều hướng
                </Dialog.Title>
                <Dialog.Close asChild>
                  <IconButton label="Đóng menu">
                    <X className="size-[18px]" aria-hidden="true" />
                  </IconButton>
                </Dialog.Close>
              </div>
              <Suspense>
                <SideNav
                  area={area}
                  session={session}
                  drawer
                  onNavigate={() => setSidebar(false)}
                />
              </Suspense>
            </Dialog.Content>
          </Dialog.Portal>
          <div
            className={cn(
              "pt-(--topbar-h) motion-safe:transition-[padding] motion-safe:duration-150",
              sidebar &&
                (collapsed
                  ? "md:pl-(--sidebar-w-collapsed)"
                  : "md:pl-(--sidebar-w)"),
            )}
          >
            <main
              id="main"
              tabIndex={-1}
              className="mx-auto w-full max-w-(--content-data) px-4 pt-5 pb-10 outline-none md:px-6 lg:px-8"
            >
              {canVisit(session, pathname) ? (
                <>
                  <Suspense>
                    <BreadcrumbTrail />
                  </Suspense>
                  <div className="@container/page min-w-0 wrap-anywhere">
                    {children}
                  </div>
                </>
              ) : (
                <div className="@container/page min-w-0 wrap-anywhere">
                  <Notice
                    tone="danger"
                    title="Bạn chưa được cấp quyền"
                    actions={
                      <ButtonLink href="/workspace">
                        Về không gian làm việc
                      </ButtonLink>
                    }
                  >
                    <p>
                      Tài khoản của bạn chưa được cấp quyền truy cập trang này.
                    </p>
                  </Notice>
                </div>
              )}
            </main>
          </div>
        </div>
      </SectionSlot>
    </Dialog.Root>
  );
}
