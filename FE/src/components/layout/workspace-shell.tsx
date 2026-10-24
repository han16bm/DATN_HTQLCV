"use client";
import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth/session-context";
import { useUI } from "@/stores/ui-store";

export function WorkspaceShell({ children }: { children: ReactNode }) {
  const { session, loading, signOut } = useSession(),
    router = useRouter(),
    pathname = usePathname();
  const sidebar = useUI((s) => s.sidebarOpen),
    setSidebar = useUI((s) => s.setSidebar);
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
            ["/tasks", "Công việc"],
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
            {pathname === "/tasks" ? "Công việc" : "Tổng quan"}
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
