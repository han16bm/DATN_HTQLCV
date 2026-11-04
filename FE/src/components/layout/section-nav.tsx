"use client";
import { cn } from "@/lib/cn";
import { useMediaQuery } from "@/lib/use-media-query";
import { useUI } from "@/stores/ui-store";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { createContext, useContext } from "react";
import { createPortal } from "react-dom";

type Item = { href: string; label: string; active: boolean; icon?: LucideIcon };

// Vị trí trong sidebar dành cho các mục của trang (dự án, công việc, phân tích).
// AppShell cung cấp phần tử; trang chỉ khai báo các mục, không biết sidebar ở đâu.
// enabled = false khi trang không có sidebar, khi đó mục hiện thành dải tab trong trang.
export const SectionSlot = createContext<{
  nav: HTMLElement | null;
  enabled: boolean;
} | null>(null);

function Strip({ label, items }: { label: string; items: Item[] }) {
  return (
    <nav
      aria-label={label}
      className="mb-3 flex items-stretch gap-0.5 overflow-x-auto border-b border-line"
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={item.active ? "page" : undefined}
          className={cn(
            "relative inline-flex h-9 pointer-coarse:min-h-11 shrink-0 items-center px-3 text-sm whitespace-nowrap text-fg-subtle hover:bg-hover hover:text-fg",
            "aria-[current=page]:font-semibold aria-[current=page]:text-selected-fg",
            "after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full aria-[current=page]:after:bg-action",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

function Rail({ label, items }: { label: string; items: Item[] }) {
  const collapsed = useUI((s) => s.sidebarCollapsed);
  return (
    <nav aria-label={label} className="grid gap-0.5">
      {!collapsed && (
        <p className="m-0 px-2.5 pb-1 text-xs font-medium text-fg-subtlest">
          {label}
        </p>
      )}
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={item.active ? "page" : undefined}
          aria-label={item.label}
          title={collapsed ? item.label : undefined}
          className={cn(
            "relative flex h-8 pointer-coarse:min-h-11 items-center gap-2.5 rounded-md px-2.5 text-sm text-fg-subtle hover:bg-hover hover:text-fg active:bg-pressed",
            collapsed && "justify-center px-0",
            "aria-[current=page]:bg-selected-bg aria-[current=page]:font-medium aria-[current=page]:text-selected-fg",
          )}
        >
          {item.icon && (
            <item.icon
              className="size-[18px] shrink-0"
              strokeWidth={1.8}
              aria-hidden="true"
            />
          )}
          <span className={cn("truncate", collapsed && item.icon && "hidden")}>
            {item.label}
          </span>
        </Link>
      ))}
    </nav>
  );
}

// Các mục của một khu (dự án, công việc, phân tích). Từ màn vừa trở lên nằm ở sidebar
// như thanh bên dự án của Jira; màn hẹp hoặc trang không có sidebar thì hiện thành
// một dải tab ngay trong trang.
export function SectionNav({ label, items }: { label: string; items: Item[] }) {
  const slot = useContext(SectionSlot);
  const wide = useMediaQuery("(min-width: 768px)");
  if (!slot?.enabled || !wide) return <Strip label={label} items={items} />;
  if (!slot.nav) return null;
  return createPortal(<Rail label={label} items={items} />, slot.nav);
}
