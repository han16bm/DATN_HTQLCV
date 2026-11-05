"use client";
import { Button } from "@/components/ui/button";
import { controlClass } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import * as Popover from "@radix-ui/react-popover";
import { ChevronDown, Search } from "lucide-react";
import { useState, type ComponentPropsWithRef } from "react";
import type { FormOption } from "./form.types";

type Props = Omit<ComponentPropsWithRef<"button">, "value" | "onChange"> & {
  label: string;
  options: FormOption[];
  value: string[];
  onChange: (value: string[]) => void;
};

// Chọn nhiều mục trong danh sách có ô tìm kiếm; nút hiện tối đa hai mục đã chọn.
export function MultiSelect({
  label,
  options,
  value,
  onChange,
  className,
  ...props
}: Props) {
  const [query, setQuery] = useState("");
  const selected = options.filter((option) => value.includes(option.value));
  const visible = options.filter((option) =>
    option.label
      .toLocaleLowerCase("vi")
      .includes(query.trim().toLocaleLowerCase("vi")),
  );
  return (
    <Popover.Root
      onOpenChange={(open) => {
        if (!open) setQuery("");
      }}
    >
      <Popover.Trigger asChild>
        <button
          data-ui
          {...props}
          type="button"
          className={cn(
            controlClass("form"),
            "group flex w-full cursor-pointer items-center justify-between gap-2.5 text-left",
            className,
          )}
          aria-label={label}
        >
          <span className="truncate">
            {value.length
              ? `${selected
                  .slice(0, 2)
                  .map((option) => option.label)
                  .join(
                    ", ",
                  )}${value.length > 2 ? ` +${value.length - 2}` : ""}`
              : `Chọn ${label.toLowerCase()}`}
          </span>
          <ChevronDown
            className="size-4 shrink-0 text-fg-subtle transition-transform group-aria-expanded:rotate-180"
            aria-hidden="true"
          />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="z-80 max-h-(--radix-popover-content-available-height) w-[max(300px,var(--radix-popover-trigger-width))] max-w-[calc(100vw-32px)] overflow-auto rounded-lg border border-line bg-surface shadow-overlay"
          sideOffset={4}
          align="start"
          collisionPadding={16}
          aria-label={`Chọn ${label.toLowerCase()}`}
        >
          <div className="relative flex items-center border-b border-line p-2">
            <Search
              className="pointer-events-none absolute left-4.5 size-4 text-fg-subtlest"
              aria-hidden="true"
            />
            <input
              data-ui
              className={cn(controlClass(), "w-full pl-8")}
              aria-label={`Tìm ${label.toLowerCase()}`}
              placeholder="Tìm kiếm…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div
            className="max-h-60 overflow-y-auto p-1.5"
            role="group"
            aria-label={label}
          >
            {visible.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-sm hover:bg-hover has-checked:bg-selected-bg has-checked:text-selected-fg"
              >
                <input
                  data-ui
                  type="checkbox"
                  className="size-4 shrink-0 accent-action"
                  checked={value.includes(option.value)}
                  onChange={(event) =>
                    onChange(
                      event.target.checked
                        ? [...value, option.value]
                        : value.filter((id) => id !== option.value),
                    )
                  }
                />
                <span>{option.label}</span>
              </label>
            ))}
            {!visible.length && (
              <p className="m-0 p-2 text-xs text-fg-subtle">
                Không có kết quả phù hợp.
              </p>
            )}
          </div>
          <div className="flex items-center justify-between border-t border-line px-3 py-2">
            <span className="text-xs text-fg-subtle">
              Đã chọn {value.length}
            </span>
            <Popover.Close asChild>
              <Button>Xong</Button>
            </Popover.Close>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
