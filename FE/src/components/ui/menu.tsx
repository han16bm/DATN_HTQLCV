"use client";
import { cn } from "@/lib/cn";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import type { ComponentProps } from "react";

export function MenuContent({
  className,
  ...props
}: ComponentProps<typeof DropdownMenu.Content>) {
  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        align="end"
        sideOffset={4}
        collisionPadding={12}
        className={cn(
          "z-70 w-max min-w-[min(12rem,calc(100vw-1.5rem))] max-w-[min(20rem,calc(100vw-1.5rem))] rounded-lg border border-line bg-surface p-1 shadow-overlay",
          className,
        )}
        {...props}
      />
    </DropdownMenu.Portal>
  );
}

export function MenuItem({
  className,
  tone,
  ...props
}: ComponentProps<typeof DropdownMenu.Item> & { tone?: "danger" }) {
  return (
    <DropdownMenu.Item
      className={cn(
        "flex min-h-8 min-w-0 cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-1 text-sm break-words outline-none select-none",
        "data-highlighted:bg-hover data-disabled:cursor-not-allowed data-disabled:opacity-50",
        tone === "danger" ? "text-danger-fg" : "text-fg",
        className,
      )}
      {...props}
    />
  );
}

export function MenuLabel({
  className,
  ...props
}: ComponentProps<typeof DropdownMenu.Label>) {
  return (
    <DropdownMenu.Label
      className={cn("px-2.5 py-2 text-sm font-medium break-words", className)}
      {...props}
    />
  );
}

export function MenuSeparator() {
  return <DropdownMenu.Separator className="my-1 h-px bg-line" />;
}
