"use client";
import type { SessionDto } from "@/features/auth/types/auth.types";
import { canVisit } from "@/lib/auth/access";
import { navigation, type Area, type NavItem } from "@/lib/navigation";
import { confirmDiscard } from "@/lib/forms/confirm-discard";
import { useUI } from "@/stores/ui-store";
import { ArrowLeft, ChevronDown, Clock } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Fragment, useId, useState, type ReactNode } from "react";

type Child = { href: string; label: string };

// Sidebar theo mô hình Jira: Dành cho bạn, Gần đây, Dự án, Bộ lọc, báo cáo và
// phân tích. Mục con chỉ là lối tắt; quyền mở trang vẫn do canVisit quyết định.
export function SidebarContent({
  area,
  session,
  collapsed = false,
  toggle,
  onNavigate,
}: {
  area: Area;
  session: SessionDto;
  collapsed?: boolean;
  toggle?: ReactNode;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const labels = useUI((s) => s.labels);
  const recent = useUI((s) => s.recent);
  const items = navigation[area].filter((item) => canVisit(session, item.href));
  const recentEntries: Child[] = recent.flatMap((key) => {
    const entry = labels[key];
    const [kind, ...rest] = key.split(":");
    const id = encodeURIComponent(rest.join(":"));
    return entry
      ? [
          {
            href: kind === "project" ? `/projects/${id}` : `/tasks/${id}`,
            label: entry.label,
          },
        ]
      : [];
  });
  const children = (item: NavItem): Child[] => {
    if (area !== "workspace") return [];
    if (item.href === "/projects")
      return recentEntries
        .filter((entry) => entry.href.startsWith("/projects/"))
        .slice(0, 5);
    return [];
  };
  return (
    <>
      {area === "admin" ? (
        <div className="sidebar-scope">
          <Link
            href="/workspace"
            className="scope-link"
            title={collapsed ? "Về không gian làm việc" : undefined}
            onClick={onNavigate}
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <span className="sidebar-text">Về không gian làm việc</span>
          </Link>
          <p className="sidebar-text scope-title">Quản trị hệ thống</p>
        </div>
      ) : (
        <div className="sidebar-scope sidebar-text">
          <p className="scope-title">{session.user.unit.name}</p>
        </div>
      )}
      <nav
        className="sidebar-nav"
        aria-label={
          area === "admin" ? "Điều hướng quản trị" : "Điều hướng chính"
        }
      >
        {items.map((item, index) => (
          <Fragment key={`${item.href}:${item.match.test(pathname)}`}>
            {item.group && item.group !== items[index - 1]?.group && (
              <p className="nav-group-title sidebar-text">{item.group}</p>
            )}
            <NavSection
              item={item}
              pathname={pathname}
              collapsed={collapsed}
              onNavigate={onNavigate}
              subItems={children(item)}
              filters={
                area === "workspace" && item.href === "/tasks" ? (
                  <TaskFilters userId={session.user.id} onChange={onNavigate} />
                ) : undefined
              }
            >
              {area === "workspace" && index === 0 && !collapsed && (
                <RecentList entries={recentEntries} onNavigate={onNavigate} />
              )}
            </NavSection>
          </Fragment>
        ))}
      </nav>
      {toggle && <div className="sidebar-bottom">{toggle}</div>}
    </>
  );
}

function NavSection({
  item,
  pathname,
  collapsed,
  onNavigate,
  subItems,
  filters,
  children,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
  onNavigate?: () => void;
  subItems: Child[];
  filters?: ReactNode;
  children?: ReactNode;
}) {
  const id = useId();
  const active = item.match.test(pathname);
  const [open, setOpen] = useState(active);
  const expandable = (subItems.length > 0 || Boolean(filters)) && !collapsed;
  const expanded = expandable && open;
  return (
    <div className="nav-section">
      <div className={`nav-row ${active ? "active" : ""}`}>
        <Link
          href={item.href}
          className={`nav-item ${active ? "active" : ""}`}
          aria-current={active ? "page" : undefined}
          aria-label={item.label}
          title={collapsed ? item.label : undefined}
          onClick={onNavigate}
        >
          <item.icon size={18} strokeWidth={1.8} aria-hidden="true" />
          <span className="sidebar-text">{item.label}</span>
        </Link>
        {expandable && (
          <button
            type="button"
            className="nav-expand"
            aria-expanded={expanded}
            aria-controls={`${id}-sub`}
            aria-label={`${expanded ? "Thu gọn" : "Mở rộng"} ${item.label}`}
            onClick={() => setOpen(!expanded)}
          >
            <ChevronDown size={15} aria-hidden="true" />
          </button>
        )}
      </div>
      {expanded &&
        (filters ? (
          <div className="nav-sub" id={`${id}-sub`}>
            {filters}
          </div>
        ) : (
          <ul className="nav-sub" id={`${id}-sub`}>
            {subItems.map((child) => (
              <li key={child.href}>
                <Link
                  href={child.href}
                  className={`nav-sub-item ${
                    pathname === child.href ? "active" : ""
                  }`}
                  onClick={onNavigate}
                >
                  {child.label}
                </Link>
              </li>
            ))}
          </ul>
        ))}
      {children}
    </div>
  );
}

function TaskFilters({
  userId,
  onChange,
}: {
  userId: string;
  onChange?: () => void;
}) {
  const pathname = usePathname();
  const search = useSearchParams();
  const router = useRouter();
  const mine = search.get("assigneeId") === userId;
  const overdue = search.get("overdue") === "true";
  return (
    <div className="nav-filters" role="group" aria-label="Lọc công việc">
      {[
        { value: "all", label: "Tất cả" },
        { value: "mine", label: "Việc của tôi" },
        { value: "overdue", label: "Việc quá hạn" },
      ].map((item) => (
        <button
          key={item.value}
          type="button"
          className="nav-sub-item"
          aria-pressed={
            pathname === "/tasks" &&
            (item.value === "mine"
              ? mine
              : item.value === "overdue"
                ? overdue
                : !mine && !overdue)
          }
          onClick={async () => {
            if (!(await confirmDiscard())) return;
            const next = new URLSearchParams(
              pathname === "/tasks" ? search : undefined,
            );
            next.delete("page");
            if (item.value === "all") {
              next.delete("assigneeId");
              next.delete("overdue");
              next.delete("status");
            } else if (item.value === "mine") {
              if (mine) next.delete("assigneeId");
              else next.set("assigneeId", userId);
            } else {
              next.delete("status");
              if (overdue) next.delete("overdue");
              else next.set("overdue", "true");
            }
            router.replace(`/tasks${next.size ? `?${next}` : ""}`, {
              scroll: false,
            });
            onChange?.();
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function RecentList({
  entries,
  onNavigate,
}: {
  entries: Child[];
  onNavigate?: () => void;
}) {
  if (!entries.length) return null;
  return (
    <div className="nav-recent">
      <p className="nav-recent-title">
        <Clock size={13} aria-hidden="true" />
        Gần đây
      </p>
      <ul className="nav-sub">
        {entries.slice(0, 5).map((entry) => (
          <li key={entry.href}>
            <Link
              href={entry.href}
              className="nav-sub-item"
              onClick={onNavigate}
            >
              {entry.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
