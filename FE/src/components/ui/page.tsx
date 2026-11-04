"use client";
import { cn } from "@/lib/cn";
import Link from "next/link";
import { useId, type ReactNode } from "react";
import { buttonClass } from "./button";
import { StatusLozenge } from "./lozenge";

// Tên và hành động chính chung một hàng; metadata/trạng thái ở tầng đọc thứ hai.
// `level={2}` cho phần con trong trang (ví dụ việc cá nhân ở trang chủ).
export function PageHeader({
  title,
  description,
  actions,
  status,
  level = 1,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  status?: ReactNode;
  level?: 1 | 2;
}) {
  const Heading = level === 1 ? "h1" : "h2";
  return (
    <header
      className={cn(
        "flex flex-wrap items-start justify-between gap-x-4 gap-y-2",
        level === 1 ? "mb-5" : "mb-3",
      )}
    >
      <div className="min-w-0">
        <Heading
          className={cn(
            "m-0 font-semibold text-fg",
            level === 1 ? "text-heading-lg" : "text-heading-sm",
          )}
        >
          {title}
        </Heading>
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
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </header>
  );
}

// Tiêu đề và hành động nằm ngoài bề mặt dữ liệu; không lồng thẻ trắng quanh bảng.
export function Panel({
  title,
  children,
  className = "",
  actions,
  flush = false,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
  // Thân không đệm, cho nội dung tự có khung (bảng, xem trước PDF).
  flush?: boolean;
}) {
  const titleId = useId();
  return (
    <section
      data-slot="panel"
      aria-labelledby={title ? titleId : undefined}
      className={cn("min-w-0", className)}
    >
      {(title || actions) && (
        <div className="mb-2 flex min-h-8 flex-wrap items-center justify-between gap-x-3 gap-y-2">
          {title && (
            <h2
              id={titleId}
              className="m-0 text-heading-sm font-semibold text-fg"
            >
              {title}
            </h2>
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div
        data-slot="panel-body"
        className={cn(
          "min-w-0 overflow-hidden rounded-lg border border-line bg-surface",
          !flush && "p-4 [&>*+*]:mt-3",
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

// Liên kết "Chi tiết" cuối hàng: chỉ là chữ, không viền, không gạch chân khi rê.
export function DetailLink({
  href,
  label = "Xem chi tiết",
}: {
  href: string;
  label?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className="inline-flex min-h-7 items-center rounded-sm px-1.5 text-sm font-medium whitespace-nowrap text-selected-fg transition-colors hover:bg-hover pointer-coarse:min-h-11"
    >
      Chi tiết
    </Link>
  );
}

// Tên mục trong bảng: một dòng, cắt bằng dấu … (đủ tên ở thuộc tính title).
export const nameClass = "block max-w-[30ch] truncate";
// Liên kết trong dòng chữ.
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
