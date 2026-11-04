"use client";
import { MenuContent, MenuItem } from "@/components/ui/menu";
import type { SessionDto } from "@/features/auth/types/auth.types";
import { canVisit, seesOthersTasks } from "@/lib/auth/access";
import { cn } from "@/lib/cn";
import {
  navigation,
  type Area,
  type NavChild,
  type NavContext,
  type NavItem,
} from "@/lib/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";

const name = (area: Area) =>
  area === "admin" ? "Điều hướng quản trị" : "Điều hướng chính";

const itemClass = cn(
  "inline-flex h-(--control-h) pointer-coarse:min-h-11 shrink-0 items-center gap-1 rounded-md px-2.5 text-sm whitespace-nowrap text-fg-subtle transition-colors hover:bg-hover hover:text-fg active:bg-pressed aria-expanded:bg-pressed lg:px-3",
  "aria-[current=page]:bg-selected-bg aria-[current=page]:font-semibold aria-[current=page]:text-selected-fg motion-reduce:transition-none",
);

// Mục con của một mục chính, chỉ giữ những trang người dùng được phép mở.
function childrenOf(
  item: NavItem,
  session: SessionDto,
  context: NavContext,
): NavChild[] {
  return (item.children?.(context) ?? []).filter((child) =>
    canVisit(session, child.href.split("?")[0]),
  );
}

function useNavContext(session: SessionDto): NavContext {
  const pathname = usePathname();
  const search = useSearchParams();
  return {
    userId: session.user.id,
    seesOthers: seesOthersTasks(session),
    pathname,
    search: new URLSearchParams(search),
  };
}

// Menu con dùng chung cho header và sidebar ở chế độ chỉ có biểu tượng.
function NavDropdown({
  item,
  items,
  active,
  compact = false,
}: {
  item: NavItem;
  items: NavChild[];
  active: boolean;
  compact?: boolean;
}) {
  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger asChild>
        <button
          data-ui
          type="button"
          aria-current={active ? "page" : undefined}
          aria-label={compact ? item.label : undefined}
          title={compact ? item.label : undefined}
          className={
            compact
              ? "flex h-9 pointer-coarse:min-h-11 w-full items-center justify-center rounded-md text-fg-subtle hover:bg-hover aria-expanded:bg-pressed aria-[current=page]:bg-selected-bg aria-[current=page]:text-selected-fg"
              : cn(itemClass, "group")
          }
        >
          {compact ? (
            <item.icon className="size-[18px]" aria-hidden="true" />
          ) : (
            <>
              {item.label}
              <ChevronDown
                className="size-3.5 transition-transform group-aria-expanded:rotate-180 motion-reduce:transition-none"
                aria-hidden="true"
              />
            </>
          )}
        </button>
      </DropdownMenu.Trigger>
      <MenuContent align="start" side={compact ? "right" : "bottom"}>
        {items.map((child) => (
          <MenuItem asChild key={child.label}>
            <Link
              href={child.href}
              aria-current={child.active ? "page" : undefined}
              className="aria-[current=page]:bg-selected-bg aria-[current=page]:font-medium aria-[current=page]:text-selected-fg"
            >
              <child.icon
                className="size-4 shrink-0"
                strokeWidth={1.8}
                aria-hidden="true"
              />
              {child.label}
            </Link>
          </MenuItem>
        ))}
      </MenuContent>
    </DropdownMenu.Root>
  );
}

// Chỉ mục quản lý bổ sung của khu làm việc ở header; các mục quản trị nằm ở sidebar.
// Cùng nguồn khai báo với sidebar/mobile, quyền mở từng mục vẫn do canVisit quyết định.
export function MainNav({
  area,
  session,
}: {
  area: Area;
  session: SessionDto;
}) {
  const context = useNavContext(session);
  const items = navigation[area].filter(
    (item) => canVisit(session, item.href) && item.placement === "header",
  );
  if (!items.length) return null;
  return (
    <nav
      aria-label="Điều hướng quản lý"
      className="hidden h-full min-w-0 items-center gap-1 overflow-x-auto [scrollbar-width:none] md:flex"
    >
      {items.map((item) => {
        const active = item.match.test(context.pathname);
        const children = childrenOf(item, session, context);
        if (!children.length)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={itemClass}
            >
              {item.label}
            </Link>
          );
        return (
          <NavDropdown
            key={`${item.href}:${context.pathname}?${context.search}`}
            item={item}
            items={children}
            active={active}
          />
        );
      })}
    </nav>
  );
}

// Chức năng chung trong sidebar của mọi role; drawer mobile có cả mục quản lý.
// Khi thu gọn dùng lại dropdown của header; khi mở rộng hiện mục con bên dưới.
export function MainList({
  area,
  session,
  collapsed = false,
  drawer = false,
  onNavigate,
}: {
  area: Area;
  session: SessionDto;
  collapsed?: boolean;
  drawer?: boolean;
  onNavigate?: () => void;
}) {
  const context = useNavContext(session);
  const items = navigation[area].filter(
    (item) =>
      canVisit(session, item.href) && (drawer || item.placement !== "header"),
  );
  const [expanded, setExpanded] = useState<string | null>(
    () =>
      items.find((item) => item.children && item.match.test(context.pathname))
        ?.href ?? null,
  );
  return (
    <nav aria-label={name(area)} className="grid gap-0.5">
      {items.map((item, index) => {
        // Tiêu đề nhóm (khu quản trị) đặt trước mục đầu tiên của nhóm khi sidebar mở rộng.
        const groupTitle = !collapsed &&
          item.group &&
          item.group !== items[index - 1]?.group && (
            <p className="m-0 px-2.5 pt-3 pb-1 text-xs font-semibold text-fg-subtlest">
              {item.group}
            </p>
          );
        const active = item.match.test(context.pathname);
        const children = childrenOf(item, session, context);
        if (collapsed)
          return children.length ? (
            <NavDropdown
              key={`${item.href}:${context.pathname}?${context.search}`}
              item={item}
              items={children}
              active={active}
              compact
            />
          ) : (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              title={item.label}
              aria-current={active ? "page" : undefined}
              onClick={onNavigate}
              className="flex h-9 pointer-coarse:min-h-11 items-center justify-center rounded-md text-fg-subtle hover:bg-hover aria-[current=page]:bg-selected-bg aria-[current=page]:text-selected-fg"
            >
              <item.icon
                className="size-[18px]"
                strokeWidth={1.8}
                aria-hidden="true"
              />
            </Link>
          );
        const opened = expanded === item.href;
        return (
          <div key={item.href} className="grid gap-0.5">
            {groupTitle}
            {children.length ? (
              <button
                data-ui
                type="button"
                aria-expanded={opened}
                onClick={() => setExpanded(opened ? null : item.href)}
                className={cn(
                  "flex h-9 pointer-coarse:min-h-11 w-full items-center gap-2.5 rounded-md px-2.5 text-left text-sm hover:bg-hover",
                  active
                    ? "bg-selected-bg font-medium text-selected-fg"
                    : "text-fg-subtle",
                )}
              >
                <item.icon
                  className="size-[18px] shrink-0"
                  aria-hidden="true"
                />
                <span className="flex-1">{item.label}</span>
                <ChevronDown
                  className={cn(
                    "size-4 transition-transform motion-reduce:transition-none",
                    opened && "rotate-180",
                  )}
                  aria-hidden="true"
                />
              </button>
            ) : (
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={onNavigate}
                className="flex h-9 pointer-coarse:min-h-11 items-center gap-2.5 rounded-md px-2.5 text-sm text-fg-subtle hover:bg-hover hover:text-fg aria-[current=page]:bg-selected-bg aria-[current=page]:font-medium aria-[current=page]:text-selected-fg"
              >
                <item.icon
                  className="size-[18px] shrink-0"
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
                <span className="truncate">{item.label}</span>
              </Link>
            )}
            {children.length > 0 && opened && (
              <ul className="m-0 ml-4 grid list-none gap-px p-0 pl-2">
                {children.map((child) => (
                  <li key={child.label}>
                    <Link
                      href={child.href}
                      aria-current={child.active ? "page" : undefined}
                      onClick={onNavigate}
                      className="flex h-8 pointer-coarse:min-h-11 items-center gap-2 rounded-md px-2 text-sm text-fg-subtle hover:bg-hover hover:text-fg aria-[current=page]:bg-selected-bg aria-[current=page]:font-medium aria-[current=page]:text-selected-fg"
                    >
                      <child.icon
                        className="size-4 shrink-0"
                        strokeWidth={1.8}
                        aria-hidden="true"
                      />
                      <span className="truncate">{child.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );
}
