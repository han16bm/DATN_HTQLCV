"use client";
import { cn } from "@/lib/cn";
import Link from "next/link";
import { useId, type ReactNode } from "react";
import { buttonClass } from "./button";
import { StatusLozenge } from "./lozenge";

export function PageHeader({
  title,
  description,
  actions,
  status,
  level = 1,
  compact = false,
  icon,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  status?: ReactNode;
  level?: 1 | 2;
  compact?: boolean;
  icon?: ReactNode;
}) {
  const Heading = level === 1 ? "h1" : "h2";
  return (
    <header
      className={cn(
        "flex flex-wrap items-start justify-between gap-x-4 gap-y-2",
        compact || level === 2 ? "mb-3" : "mb-5",
      )}
    >
      <div className={cn("flex min-w-0 items-start gap-3", compact && "flex-1 basis-60")}>
        {icon && <div className="shrink-0">{icon}</div>}
        <div className="min-w-0">
          <Heading
            className={cn(
              "m-0 font-semibold break-words text-fg",
              compact ? "text-xl leading-7" : level === 1 ? "text-heading-lg" : "text-heading-sm",
            )}
          >
            {title}
          </Heading>
          {compact ? (
            (description || status) && (
              <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                {description && <span className="text-xs text-fg-subtle">{description}</span>}
                {status}
              </div>
            )
          ) : (
            <>
              {status && (
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
                  {status}
                </div>
              )}
              {description && (
                <p className="mt-1 mb-0 max-w-[80ch] text-sm text-fg-subtle">
                  {description}
                </p>
              )}
            </>
          )}
        </div>
      </div>
      {actions && (
        <div className="ml-auto flex w-fit min-w-0 max-w-full flex-none flex-wrap items-center justify-end gap-1.5">{actions}</div>
      )}
    </header>
  );
}

export function Panel({
  title,
  children,
  className = "",
  actions,
  flush = false,
  compact = false,
  subtle = false,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
  flush?: boolean;
  compact?: boolean;
  subtle?: boolean;
}) {
  const titleId = useId();
  return (
    <section
      data-slot="panel"
      aria-labelledby={title ? titleId : undefined}
      className={cn("min-w-0", className)}
    >
      {(title || actions) && (
        <div
          className={cn(
            "mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-2",
            compact ? "min-h-7" : "min-h-8",
          )}
        >
          {title && (
            <h2
              id={titleId}
              className={cn(
                "m-0 font-semibold text-fg",
                compact ? "text-sm" : "text-heading-sm",
              )}
            >
              {title}
            </h2>
          )}
          {actions && <div className="flex min-w-0 max-w-full flex-wrap items-center justify-end gap-2">{actions}</div>}
        </div>
      )}
      <div
        data-slot="panel-body"
        className={cn(
          "min-w-0 overflow-hidden rounded-lg border",
          subtle ? "border-line/60 bg-sunken/60" : "border-line bg-surface",
          !flush && (compact
            ? cn(subtle ? "p-2.5" : "p-3", "[&>*+*]:mt-2")
            : "p-4 [&>*+*]:mt-3"),
        )}
      >
        {children}
      </div>
    </section>
  );
}

export function ButtonLink({
  href,
  children,
  primary = false,
}: {
  href: string;
  children: ReactNode;
  primary?: boolean;
}) {
  return (
    <Link
      className={buttonClass(primary ? "primary" : "secondary")}
      href={href}
    >
      {children}
    </Link>
  );
}

export const detailClass =
  "inline-flex min-h-7 items-center rounded-sm px-1.5 text-sm font-medium whitespace-nowrap text-selected-fg transition-colors hover:bg-hover active:bg-pressed motion-reduce:transition-none pointer-coarse:min-h-11";

export function DetailLink({
  href,
  label = "Xem chi tiết",
}: {
  href: string;
  label?: string;
}) {
  return (
    <Link href={href} aria-label={label} title={label} className={detailClass}>
      Chi tiết
    </Link>
  );
}

export const nameClass = "block max-w-[30ch] truncate";
export const linkClass =
  "font-medium text-selected-fg underline-offset-2 hover:underline";

export function StatusField({
  label = "Trạng thái",
  value,
}: {
  label?: string;
  value: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-fg-subtle">
      <span className="whitespace-nowrap">{label}:</span>
      <StatusLozenge value={value} />
    </span>
  );
}
