"use client";
import type { SessionDto } from "@/features/auth/types/auth.types";
import { type Area } from "@/lib/navigation";
import { useUI } from "@/stores/ui-store";
import { ArrowLeft, Clock } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MainList } from "./main-nav";
import { ProfileCard } from "./profile-card";

type Child = { href: string; label: string };

export function SideNav({
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
  const labels = useUI((s) => s.labels);
  const recent = useUI((s) => s.recent);
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
  return (
    <>
      <ProfileCard user={session.user} collapsed={collapsed} />
      <div className="grid min-h-0 flex-1 content-start gap-3 overflow-y-auto pt-3">
        {drawer && area === "admin" && (
          <Link
            href="/workspace"
            onClick={onNavigate}
            className="flex h-9 items-center gap-2 rounded-md px-2.5 text-sm font-medium text-selected-fg hover:bg-hover"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Về không gian làm việc
          </Link>
        )}
        <MainList
          area={area}
          session={session}
          collapsed={collapsed}
          drawer={drawer}
          onNavigate={onNavigate}
        />
        {area === "workspace" && !collapsed && (
          <RecentList entries={recentEntries} onNavigate={onNavigate} />
        )}
      </div>
    </>
  );
}

function RecentList({
  entries,
  onNavigate,
}: {
  entries: Child[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  if (!entries.length) return null;
  return (
    <div className="grid gap-0.5 pt-3">
      <p className="m-0 flex items-center gap-1.5 px-2.5 pb-1 text-xs font-semibold text-fg-subtlest">
        <Clock className="size-3.5" aria-hidden="true" />
        Gần đây
      </p>
      <ul className="m-0 grid list-none gap-px p-0">
        {entries.slice(0, 5).map((entry) => (
          <li key={entry.href}>
            <Link
              href={entry.href}
              onClick={onNavigate}
              aria-current={pathname === entry.href ? "page" : undefined}
              title={entry.label}
              className="block h-8 truncate rounded-md px-2.5 text-sm leading-8 text-fg-subtle hover:bg-hover hover:text-fg aria-[current=page]:font-medium aria-[current=page]:text-selected-fg"
            >
              {entry.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
