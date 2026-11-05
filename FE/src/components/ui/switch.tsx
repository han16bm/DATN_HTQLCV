"use client";
import { cn } from "@/lib/cn";
import { useId } from "react";

export function Switch({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  return (
    <div className="flex min-h-10 items-center justify-between gap-3 px-4">
      <label
        htmlFor={id}
        title={hint}
        className="min-w-0 cursor-pointer text-xs text-fg"
      >
        {label}
      </label>
      {hint && (
        <span id={hintId} className="sr-only">
          {hint}
        </span>
      )}
      <button
        data-ui
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        aria-describedby={hint ? hintId : undefined}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full bg-line-input transition-colors pointer-coarse:my-1.5 motion-reduce:transition-none",
          "aria-checked:bg-action",
          "after:absolute after:top-0.5 after:left-0.5 after:size-4 after:rounded-full after:bg-white after:shadow-raised after:transition-transform motion-reduce:after:transition-none",
          "aria-checked:after:translate-x-4",
        )}
      />
    </div>
  );
}
