"use client";
import { useSession } from "@/lib/auth/session-context";
import { confirmDiscard } from "@/lib/forms/confirm-discard";
import { useUI } from "@/stores/ui-store";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, Menu, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, type ReactNode } from "react";
import { DirtyNavigationGuard } from "./dirty-navigation-guard";
import { SidebarContent } from "./sidebar-content";
import { AvatarMenu } from "./avatar-menu";
import { Spinner } from "@/components/ui/loading";
import { useIsFetching } from "@tanstack/react-query";

export function WorkspaceShell({ children }: { children: ReactNode }) {
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
  const section =
    pathname === "/profile" || pathname.startsWith("/users/")
      ? "Hồ sơ"
      : pathname.startsWith("/admin")
        ? "Quản trị"
        : pathname.startsWith("/projects")
          ? "Dự án"
          : pathname.startsWith("/tasks")
            ? "Công việc"
            : pathname.startsWith("/reports")
              ? "Báo cáo"
              : pathname.startsWith("/reviews")
                ? "Nghiệm thu"
                : pathname.startsWith("/alerts")
                  ? "Cảnh báo"
                  : pathname.startsWith("/analytics") ||
                      pathname === "/dashboard"
                    ? "Phân tích"
                    : "Tổng quan";
  useEffect(() => {
    if (!loading && !session) router.replace("/login");
  }, [loading, session, router]);
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
    await signOut();
    router.replace("/login");
  };
  return (
    <Dialog.Root open={open} onOpenChange={setSidebar}>
      <div className={`workspace ${collapsed ? "sidebar-collapsed" : ""}`}>
        <Suspense>
          <DirtyNavigationGuard />
        </Suspense>
        <aside
          className={`sidebar desktop-sidebar ${collapsed ? "collapsed" : ""}`}
          aria-label="Thanh điều hướng"
        >
          <SidebarContent
            session={session}
            collapsed={collapsed}
            toggle={
              <button
                type="button"
                className="icon-button sidebar-toggle"
                aria-label={
                  collapsed
                    ? "Mở rộng thanh điều hướng"
                    : "Thu gọn thanh điều hướng"
                }
                onClick={toggleSidebar}
              >
                {collapsed ? (
                  <ChevronRight size={17} />
                ) : (
                  <ChevronLeft size={17} />
                )}
              </button>
            }
          />
        </aside>
        <Dialog.Portal>
          <Dialog.Overlay className="sidebar-overlay" />
          <Dialog.Content
            className="sidebar mobile-sidebar"
            aria-describedby={undefined}
          >
            <Dialog.Title className="sr-only">Menu điều hướng</Dialog.Title>
            <SidebarContent
              session={session}
              onNavigate={() => setSidebar(false)}
              toggle={
                <Dialog.Close className="icon-button" aria-label="Đóng menu">
                  <X size={19} />
                </Dialog.Close>
              }
            />
          </Dialog.Content>
        </Dialog.Portal>
        <div className="workspace-main">
          <header className="topbar">
            <Dialog.Trigger
              className="icon-button menu-toggle"
              aria-label="Mở menu"
            >
              <Menu size={21} />
            </Dialog.Trigger>
            <span className="breadcrumb">
              <span className="muted">Không gian làm việc</span>
              <ChevronRight size={14} aria-hidden="true" />
              <strong>{section}</strong>
            </span>
            <div className="actions">
              {fetching > 0 && <Spinner label="Đang cập nhật dữ liệu" />}
              <AvatarMenu key={pathname} session={session} onSignOut={logout} />
            </div>
          </header>
          <main className="content">
            <div className="page-surface">{children}</div>
          </main>
        </div>
      </div>
    </Dialog.Root>
  );
}
