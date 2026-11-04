"use client";
import { cn } from "@/lib/cn";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { IconButton } from "./icon-button";

// Lớp phủ và khung nổi dùng chung cho hộp thoại, hộp xác nhận và ngăn kéo.
// Lớp nổi (overlay) có viền, bo 12px và bóng; mở/đóng bằng hiệu ứng ngắn, tắt khi
// người dùng chọn giảm chuyển động.
export const overlayClass = (
  layer: "dialog" | "confirm" = "dialog",
  light = false,
) =>
  cn(
    "fixed inset-0 motion-reduce:animate-none",
    light ? "bg-overlay/55" : "bg-overlay",
    "data-[state=open]:animate-[fade-in_160ms_ease-out] data-[state=closed]:animate-[fade-out_120ms_ease-in]",
    layer === "confirm" ? "z-90" : "z-60",
  );

export const modalClass = (
  size: "sm" | "md" = "md",
  layer: "dialog" | "confirm" = "dialog",
) =>
  cn(
    "fixed top-1/2 left-1/2 max-h-[90dvh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto",
    "rounded-xl border border-line bg-surface p-5 shadow-overlay outline-none md:p-6",
    "motion-reduce:animate-none data-[state=open]:animate-[modal-in_160ms_ease-out]",
    size === "sm"
      ? "w-[min(440px,calc(100vw-32px))]"
      : "w-[min(640px,calc(100vw-32px))]",
    layer === "confirm" ? "z-91" : "z-61",
  );

// Ngăn kéo bên phải, nằm dưới thanh trên để thanh trên luôn dùng được.
export const drawerClass = cn(
  "fixed top-(--topbar-h) right-0 bottom-0 z-65 w-[min(420px,100vw)] overflow-y-auto",
  "border-l border-line bg-surface p-4 shadow-overlay outline-none motion-reduce:animate-none",
  "data-[state=open]:animate-[slide-in-right_180ms_ease-out] data-[state=closed]:animate-[slide-out-right_140ms_ease-in]",
);

// Tiêu đề (h2) kèm nút đóng; Radix gắn tên của hộp thoại vào tiêu đề này.
export function ModalHeader({
  title,
  closeLabel,
  compact = false,
}: {
  title: string;
  closeLabel: string;
  compact?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <Dialog.Title
        className={cn(
          "m-0 font-semibold text-fg",
          compact ? "text-heading-sm" : "text-heading-md",
        )}
      >
        {title}
      </Dialog.Title>
      <Dialog.Close asChild>
        <IconButton label={closeLabel} className="-mt-1 -mr-2">
          <X className="size-[18px]" aria-hidden="true" />
        </IconButton>
      </Dialog.Close>
    </div>
  );
}
