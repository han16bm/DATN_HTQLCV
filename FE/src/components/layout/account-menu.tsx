"use client";
import { Avatar } from "@/components/ui/avatar";
import {
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuSeparator,
} from "@/components/ui/menu";
import type { SessionDto } from "@/features/auth/types/auth.types";
import { adminHome, canAdminister } from "@/lib/auth/access";
import type { Area } from "@/lib/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ArrowLeftRight, LogOut, Settings, UserRound } from "lucide-react";
import Link from "next/link";

export function AccountMenu({
  area,
  session,
  onSignOut,
}: {
  area: Area;
  session: SessionDto;
  onSignOut: () => Promise<void>;
}) {
  const admin = canAdminister(session) ? adminHome(session) : null;
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          data-ui
          type="button"
          aria-label="Mở menu tài khoản"
          title={session.user.displayName}
          className="grid size-10 place-items-center rounded-full hover:bg-hover active:bg-pressed aria-expanded:bg-pressed"
        >
          <Avatar
            name={session.user.displayName}
            src={session.user.avatarUrl}
          />
        </button>
      </DropdownMenu.Trigger>
      <MenuContent>
        <MenuLabel>
          {session.user.displayName}
          <span className="block text-xs font-normal text-fg-subtlest">
            {session.user.unit.name}
          </span>
        </MenuLabel>
        <MenuSeparator />
        <MenuItem asChild>
          <Link href={`/users/${encodeURIComponent(session.user.id)}`}>
            <UserRound className="size-4" aria-hidden="true" />
            Hồ sơ công khai
          </Link>
        </MenuItem>
        <MenuItem asChild>
          <Link href="/profile">
            <UserRound className="size-4" aria-hidden="true" />
            Hồ sơ cá nhân
          </Link>
        </MenuItem>
        {area === "admin" ? (
          <MenuItem asChild>
            <Link href="/workspace">
              <ArrowLeftRight className="size-4" aria-hidden="true" />
              Về không gian làm việc
            </Link>
          </MenuItem>
        ) : (
          admin && (
            <MenuItem asChild>
              <Link href={admin}>
                <Settings className="size-4" aria-hidden="true" />
                Quản trị hệ thống
              </Link>
            </MenuItem>
          )
        )}
        <MenuSeparator />
        <MenuItem
          tone="danger"
          onSelect={() => {
            void onSignOut();
          }}
        >
          <LogOut className="size-4" aria-hidden="true" />
          Đăng xuất
        </MenuItem>
      </MenuContent>
    </DropdownMenu.Root>
  );
}
