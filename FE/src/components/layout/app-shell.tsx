"use client";
import { BrandLogo } from "@/components/ui/brand-logo";
import { Spinner } from "@/components/ui/loading";
import { canVisit } from "@/lib/auth/access";
import { useSession } from "@/lib/auth/session-context";
import { confirmDiscard } from "@/lib/forms/confirm-discard";
import { type Area } from "@/lib/navigation";
import { useUI } from "@/stores/ui-store";
import * as Dialog from "@radix-ui/react-dialog";
import { useIsFetching } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useRef, type ReactNode } from "react";
import { AvatarMenu } from "./avatar-menu";
import { DirtyNavigationGuard } from "./dirty-navigation-guard";
import { NavigationTracker } from "./navigation-tracker";
import { PageNav } from "./page-nav";
import { SidebarContent } from "./sidebar-content";

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
  const fetching = useIsFetching({
    predicate: (query) => query.queryKey[0] !== "auth",
  });
  const { session, loading, signOut } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const open = useUI((s) => s.sidebarOpen);
  const collapsed = useUI((s) => s.sidebarCollapsed);
  const setSidebar = useUI((s) => s.setSidebar);
  const toggleSidebar = useUI((s) => s.toggleSidebar);
  const leaving = useRef(false);
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
  if (loading || !session)
    return (
      <div className="boot-state" role="status">
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
  const sidebar = (
    <SidebarContent
      area={area}
      session={session}
      collapsed={collapsed}
      toggle={
        <button
          type="button"
          className="icon-button sidebar-toggle"
          aria-label={
            collapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"
          }
          onClick={toggleSidebar}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      }
    />
  );
  return (
    <Dialog.Root open={open} onOpenChange={setSidebar}>
      <div className={`workspace ${collapsed ? "sidebar-collapsed" : ""}`}>
        <Suspense>
          <DirtyNavigationGuard />
          <NavigationTracker />
        </Suspense>
        <header className="topbar">
          <Dialog.Trigger
            className="icon-button menu-toggle"
            aria-label="Mở menu"
          >
            <Menu size={20} />
          </Dialog.Trigger>
          <Link href="/workspace" className="brand" aria-label="Cổng công việc">
            <BrandLogo />
          </Link>
          {area === "admin" && (
            <span className="area-label">Quản trị hệ thống</span>
          )}
          <div className="actions">
            {fetching > 0 && <Spinner label="Đang cập nhật dữ liệu" />}
            <AvatarMenu
              key={pathname}
              area={area}
              session={session}
              onSignOut={logout}
            />
          </div>
        </header>
        <aside
          className={`sidebar desktop-sidebar ${collapsed ? "collapsed" : ""}`}
          aria-label="Thanh điều hướng"
        >
          <Suspense>{sidebar}</Suspense>
        </aside>
        <Dialog.Portal>
          <Dialog.Overlay className="sidebar-overlay" />
          <Dialog.Content
            className="sidebar mobile-sidebar"
            aria-describedby={undefined}
          >
            <Dialog.Title className="sr-only">Menu điều hướng</Dialog.Title>
            <div className="mobile-sidebar-header">
              <BrandLogo />
              <Dialog.Close className="icon-button" aria-label="Đóng menu">
                <X size={18} />
              </Dialog.Close>
            </div>
            <Suspense>
              <SidebarContent
                area={area}
                session={session}
                onNavigate={() => setSidebar(false)}
              />
            </Suspense>
          </Dialog.Content>
        </Dialog.Portal>
        <div className="workspace-main">
          <main className="content">
            {canVisit(session, pathname) ? (
              <>
                <Suspense>
                  <PageNav />
                </Suspense>
                <div className="page-surface">{children}</div>
              </>
            ) : (
              <div className="page-surface">
                <div role="alert" className="notice error">
                  <h2>Bạn chưa được cấp quyền</h2>
                  <p>
                    Tài khoản của bạn chưa được cấp quyền truy cập trang này.
                  </p>
                  <div className="actions section-gap">
                    <Link className="button" href="/workspace">
                      Về không gian làm việc
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </Dialog.Root>
  );
}
