"use client";
import type { SessionDto } from "@/features/auth/types/auth.types";
import { canVisit } from "@/lib/auth/access";
import {
  Bell,
  Building2,
  ChartNoAxesCombined,
  ChevronDown,
  CircleCheckBig,
  ClipboardList,
  FileChartColumn,
  FolderKanban,
  House,
  LayoutDashboard,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState, type ReactNode } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};
const groups: { id: string; label: string; items: NavItem[] }[] = [
  {
    id: "work",
    label: "Công việc",
    items: [
      { href: "/workspace", label: "Tổng quan cá nhân", icon: House },
      { href: "/projects", label: "Dự án", icon: FolderKanban },
      { href: "/tasks", label: "Công việc", icon: ClipboardList },
      {
        href: "/reviews",
        label: "Chờ nghiệm thu",
        icon: CircleCheckBig,
      },
      { href: "/reports", label: "Báo cáo công việc", icon: FileChartColumn },
    ],
  },
  {
    id: "insights",
    label: "Theo dõi & phân tích",
    items: [
      {
        href: "/dashboard",
        label: "Bảng tổng quan",
        icon: LayoutDashboard,
      },
      {
        href: "/analytics/risks",
        label: "Phân tích & AI",
        icon: ChartNoAxesCombined,
      },
      {
        href: "/alerts",
        label: "Cảnh báo",
        icon: Bell,
      },
    ],
  },
  {
    id: "admin",
    label: "Quản trị hệ thống",
    items: [
      {
        href: "/admin/users",
        label: "Tài khoản người dùng",
        icon: Users,
      },
      {
        href: "/admin/organization",
        label: "Cơ cấu đơn vị",
        icon: Building2,
      },
      {
        href: "/admin/teams",
        label: "Nhóm nhân sự",
        icon: UsersRound,
      },
    ],
  },
];

export function SidebarContent({
  session,
  collapsed = false,
  toggle,
  onNavigate,
}: {
  session: SessionDto;
  collapsed?: boolean;
  toggle: ReactNode;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const id = useId();
  const [closed, setClosed] = useState<string[]>([]);
  return (
    <>
      <div className="sidebar-header">
        <Link
          href="/workspace"
          className="brand"
          aria-label="Cổng công việc"
          onClick={onNavigate}
        >
          <span className="brand-mark">
            <CircleCheckBig size={23} aria-hidden="true" />
          </span>
          <span className="sidebar-text">Cổng công việc</span>
        </Link>
        {toggle}
      </div>
      <div className="sidebar-unit sidebar-text">
        <span className="small muted">KHÔNG GIAN LÀM VIỆC</span>
        <p>
          <Building2 size={15} aria-hidden="true" />
          {session.user.unit.name}
        </p>
      </div>
      <nav className="sidebar-nav" aria-label="Điều hướng chính">
        {groups.map((group) => {
          const items = group.items.filter((item) =>
            canVisit(session.user.systemRole, item.href),
          );
          if (!items.length) return null;
          const expanded = collapsed || !closed.includes(group.id);
          return (
            <div className="nav-group" key={group.id}>
              <button
                type="button"
                className="nav-group-toggle"
                aria-expanded={expanded}
                aria-controls={`${id}-${group.id}`}
                onClick={() =>
                  setClosed((values) =>
                    values.includes(group.id)
                      ? values.filter((value) => value !== group.id)
                      : [...values, group.id],
                  )
                }
              >
                <span>{group.label}</span>
                <ChevronDown size={15} aria-hidden="true" />
              </button>
              <div
                className="nav-items"
                id={`${id}-${group.id}`}
                hidden={!expanded}
              >
                {items.map((item) => {
                  const active =
                    pathname === item.href ||
                    (item.href === "/analytics/risks"
                      ? pathname.startsWith("/analytics/")
                      : pathname.startsWith(`${item.href}/`));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`nav-item ${active ? "active" : ""}`}
                      aria-current={active ? "page" : undefined}
                      aria-label={item.label}
                      title={collapsed ? item.label : undefined}
                      onClick={onNavigate}
                    >
                      <item.icon
                        size={20}
                        strokeWidth={1.8}
                        aria-hidden="true"
                      />
                      <span className="sidebar-text">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
      <div className="sidebar-bottom">
        <p className="sidebar-text small muted">Theo phạm vi được cấp quyền</p>
      </div>
    </>
  );
}
