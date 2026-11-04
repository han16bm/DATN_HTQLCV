import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

// Danh sách "nhãn: giá trị" gọn cho thông tin phụ (người thực hiện, hạn, giờ công…).
// Nhãn cố định bên trái, giá trị xuống dòng khi dài; dt và dd luôn đi liền nhau.
export function KeyValueList({
  children,
  className,
  compact = false,
}: {
  children: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <dl
      className={cn(
        "m-0 grid text-sm",
        compact ? "gap-y-2" : "gap-y-3",
        className,
      )}
    >
      {children}
    </dl>
  );
}

export function KeyValue({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[minmax(6rem,0.9fr)_minmax(0,1.1fr)] items-baseline gap-x-2">
      <dt className="text-xs leading-6 text-fg-subtle after:content-[':']">
        {label}
      </dt>
      <dd className="m-0 min-w-0 text-left break-words text-fg">{children}</dd>
    </div>
  );
}
