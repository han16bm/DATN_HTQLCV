"use client";
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
export function MultiSelect({
  label,
  options,
  value,
  onChange,
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
          {...props}
          type="button"
          className="multi-select-trigger"
          aria-label={label}
        >
          <span>
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
            className="dropdown-chevron"
            size={16}
            aria-hidden="true"
          />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="multi-select-popup"
          sideOffset={6}
          align="start"
          collisionPadding={16}
          aria-label={`Chọn ${label.toLowerCase()}`}
        >
          <div className="multi-select-search">
            <Search size={16} aria-hidden="true" />
            <input
              aria-label={`Tìm ${label.toLowerCase()}`}
              placeholder="Tìm kiếm…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="multi-select-options" role="group" aria-label={label}>
            {visible.map((option) => (
              <label key={option.value}>
                <input
                  type="checkbox"
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
              <p className="small muted">Không có kết quả phù hợp.</p>
            )}
          </div>
          <div className="multi-select-footer">
            <span className="small muted">Đã chọn {value.length}</span>
            <Popover.Close asChild>
              <button type="button">Xong</button>
            </Popover.Close>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
