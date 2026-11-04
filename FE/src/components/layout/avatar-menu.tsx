"use client";
import { Avatar } from "@/components/ui/avatar";
import type { SessionDto } from "@/features/auth/types/auth.types";
import { canAdminister } from "@/lib/auth/access";
import { accessText } from "@/lib/format";
import type { Area } from "@/lib/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  ArrowLeftRight,
  ChevronDown,
  LogOut,
  Settings,
  UserRound,
} from "lucide-react";
import Link from "next/link";

export function AvatarMenu({
  area,
  session,
  onSignOut,
}: {
  area: Area;
  session: SessionDto;
  onSignOut: () => Promise<void>;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="profile profile-trigger"
          aria-label="Mở menu tài khoản"
        >
          <Avatar
            name={session.user.displayName}
            src={session.user.avatarUrl}
          />
          <span className="profile-name">
            {session.user.displayName}
            <span className="small muted">{accessText(session.user)}</span>
          </span>
          <ChevronDown
            className="dropdown-chevron"
            size={15}
            aria-hidden="true"
          />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="account-menu"
          align="end"
          sideOffset={8}
          collisionPadding={12}
        >
          <DropdownMenu.Label className="account-menu-label">
            {session.user.displayName}
            <span>{session.user.unit.name}</span>
          </DropdownMenu.Label>
          <DropdownMenu.Separator className="account-menu-separator" />
          <DropdownMenu.Item asChild>
            <Link
              href={`/users/${encodeURIComponent(session.user.id)}`}
              className="account-menu-item"
            >
              <UserRound size={17} aria-hidden="true" />
              Hồ sơ công khai
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild>
            <Link href="/profile" className="account-menu-item">
              <UserRound size={17} aria-hidden="true" />
              Hồ sơ cá nhân
            </Link>
          </DropdownMenu.Item>
          {area === "admin" ? (
            <DropdownMenu.Item asChild>
              <Link href="/workspace" className="account-menu-item">
                <ArrowLeftRight size={17} aria-hidden="true" />
                Về không gian làm việc
              </Link>
            </DropdownMenu.Item>
          ) : (
            canAdminister(session) && (
              <DropdownMenu.Item asChild>
                <Link href="/admin" className="account-menu-item">
                  <Settings size={17} aria-hidden="true" />
                  Quản trị hệ thống
                </Link>
              </DropdownMenu.Item>
            )
          )}
          <DropdownMenu.Separator className="account-menu-separator" />
          <DropdownMenu.Item
            className="account-menu-item danger"
            onSelect={() => {
              void onSignOut();
            }}
          >
            <LogOut size={17} aria-hidden="true" />
            Đăng xuất
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
