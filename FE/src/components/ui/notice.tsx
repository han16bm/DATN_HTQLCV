import { cn } from "@/lib/cn";
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

type Tone = "info" | "success" | "warning" | "danger";

const tones: Record<Tone, { box: string; icon: typeof Info }> = {
  info: {
    box: "border-info-fg/25 bg-info-bg text-info-fg",
    icon: Info,
  },
  success: {
    box: "border-success-fg/25 bg-success-bg text-success-fg",
    icon: CircleCheck,
  },
  warning: {
    box: "border-warning-fg/25 bg-warning-bg text-warning-fg",
    icon: TriangleAlert,
  },
  danger: {
    box: "border-danger-fg/25 bg-danger-bg text-danger-fg",
    icon: CircleAlert,
  },
};

// Thông báo trong trang: biểu tượng + tiêu đề ngắn + nội dung + hành động tiếp theo.
// Màu theo ý nghĩa nhưng luôn kèm biểu tượng và chữ. Lỗi dùng role="alert".
export function Notice({
  tone = "info",
  title,
  children,
  actions,
  className,
  role,
}: {
  tone?: Tone;
  title?: string;
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
  role?: "alert" | "status";
}) {
  const { box, icon: Icon } = tones[tone];
  return (
    <div
      role={role ?? (tone === "danger" ? "alert" : undefined)}
      className={cn(
        "flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm",
        box,
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="grid min-w-0 flex-1 gap-1 text-fg">
        {title && (
          <h2 className="m-0 text-sm font-semibold text-inherit">{title}</h2>
        )}
        {children && <div className="[&_p]:m-0 [&_p]:mt-0">{children}</div>}
        {actions && (
          <div className="mt-1.5 flex flex-wrap gap-2">{actions}</div>
        )}
      </div>
    </div>
  );
}
