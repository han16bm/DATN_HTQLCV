"use client";
import { hasPermission, useSession } from "@/lib/auth/session-context";
import { useUI } from "@/stores/ui-store";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, type ReactNode } from "react";
import { DirtyNavigationGuard } from "./dirty-navigation-guard";

export function WorkspaceShell({ children }: { children: ReactNode }) {
  const { session, loading, signOut } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const sidebar = useUI((s) => s.sidebarOpen);
  const setSidebar = useUI((s) => s.setSidebar);
  const section = pathname.startsWith("/admin")
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
              : pathname.startsWith("/analytics") || pathname === "/dashboard"
                ? "Phân tích"
                : "Tổng quan";
  useEffect(() => {
    if (!loading && !session) router.replace("/login");
  }, [loading, session, router]);
  if (loading || !session)
    return (
      <div className="boot-state" role="status">
        Đang tải phiên làm việc…
      </div>
    );
  return (
    <div className="workspace">
      <Suspense>
        <DirtyNavigationGuard />
      </Suspense>
      <aside className={`sidebar ${sidebar ? "open" : ""}`}>
        <Link href="/workspace" className="brand">
          Cổng công việc
        </Link>
        <p className="muted small">
          Không gian nội bộ
          <br />
          {session.user.unit.name}
        </p>
        <div className="sidebar-label">KHÔNG GIAN LÀM VIỆC</div>
        <nav>
          {[
            ["/workspace", "Tổng quan cá nhân"],
            ["/projects", "Dự án"],
            ["/tasks", "Công việc"],
            ["/reports", "Báo cáo công việc"],
          ].map(([href, title]) => (
            <Link
              key={href}
              href={href}
              className={pathname === href ? "active" : ""}
              onClick={() => setSidebar(false)}
            >
              {title}
            </Link>
          ))}
        </nav>
        {hasPermission(session, "TASKS_REVIEW") && (
          <nav>
            <Link
              href="/reviews"
              className={pathname === "/reviews" ? "active" : ""}
            >
              Chờ nghiệm thu
            </Link>
          </nav>
        )}
        {(hasPermission(session, "USERS_MANAGE") ||
          hasPermission(session, "ORGANIZATION_MANAGE")) && (
          <>
            <div className="sidebar-label">QUẢN TRỊ</div>
            <nav>
              {hasPermission(session, "USERS_MANAGE") && (
                <Link
                  href="/admin/users"
                  className={
                    pathname.startsWith("/admin/users") ? "active" : ""
                  }
                >
                  Tài khoản người dùng
                </Link>
              )}
              {hasPermission(session, "ORGANIZATION_MANAGE") && (
                <>
                  <Link
                    href="/admin/organization"
                    className={
                      pathname === "/admin/organization" ? "active" : ""
                    }
                  >
                    Cơ cấu đơn vị
                  </Link>
                  <Link
                    href="/admin/teams"
                    className={pathname === "/admin/teams" ? "active" : ""}
                  >
                    Nhóm nhân sự
                  </Link>
                </>
              )}
            </nav>
          </>
        )}
        {hasPermission(session, "ANALYTICS_VIEW") && (
          <>
            <div className="sidebar-label">THEO DÕI & PHÂN TÍCH</div>
            <nav>
              {[
                ["/dashboard", "Bảng tổng quan"],
                ["/analytics/risks", "Phân tích & AI"],
                ["/alerts", "Cảnh báo"],
              ].map(([href, title]) => (
                <Link
                  key={href}
                  href={href}
                  className={
                    pathname === href ||
                    (href === "/analytics/risks" &&
                      pathname.startsWith("/analytics/"))
                      ? "active"
                      : ""
                  }
                >
                  {title}
                </Link>
              ))}
            </nav>
          </>
        )}
        <div className="sidebar-bottom">
          <p className="small muted">Theo phạm vi được cấp quyền</p>
          <button
            onClick={async () => {
              if (
                useUI.getState().dirtyForms.length &&
                !window.confirm(
                  "Bạn có dữ liệu chưa lưu. Bỏ thay đổi và đăng xuất?",
                )
              )
                return;
              await signOut();
              router.replace("/login");
            }}
          >
            Đăng xuất
          </button>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="topbar">
          <button
            className="menu-toggle"
            aria-label="Mở menu"
            onClick={() => setSidebar(!sidebar)}
          >
            ☰
          </button>
          <span className="muted">
            Không gian làm việc <span className="breadcrumb-separator">›</span>{" "}
            {section}
          </span>
          <div className="profile">
            <span className="avatar">
              {session.user.displayName
                .split(" ")
                .slice(-2)
                .map((n) => n[0])
                .join("")}
            </span>
            <div>
              {session.user.displayName}
              <div className="small muted">
                {session.user.systemRole === "ADMIN"
                  ? "Quản trị hệ thống"
                  : session.user.systemRole === "MANAGER"
                    ? "Quản lý dự án"
                    : "Nhân viên"}
              </div>
            </div>
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
