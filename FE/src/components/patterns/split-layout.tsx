import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

// Vùng chính (rộng) và cột phụ (hẹp): nội dung chính luôn nổi nhất, thông tin phụ
// gọn bên cạnh. Xếp dọc khi vùng nội dung hẹp hơn 900px, bất kể chiều rộng màn hình.
// Cột phụ tự khai báo <aside aria-label> khi nó là thông tin bổ trợ có tên riêng.
export function SplitLayout({
  aside,
  children,
  className,
}: {
  aside: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid items-start gap-5 @min-[900px]/page:grid-cols-[minmax(0,1fr)_300px]",
        className,
      )}
    >
      <div className="grid min-w-0 content-start gap-5">{children}</div>
      <div className="grid min-w-0 content-start gap-5">{aside}</div>
    </div>
  );
}
