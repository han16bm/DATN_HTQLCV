"use client";
import { confirmDiscard } from "@/lib/forms/confirm-discard";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/cn";
import Link from "next/link";
import type { ReactNode } from "react";
import { detailClass } from "./page";
import { ModalHeader, overlayClass } from "./overlay";

// Khung dialog Thêm/Xem/Sửa của khu quản trị (ADMIN_MODULES 9): header (tiêu đề,
// trạng thái, dấu vết) và footer dính, thân cuộn. Không tải dữ liệu.
export function EntityDialog({
  open,
  title,
  status,
  stamp,
  size = "md",
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  status?: ReactNode;
  stamp?: ReactNode;
  size?: "md" | "lg";
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={async (next) => {
        if (
          !next &&
          (await confirmDiscard("Bỏ dữ liệu chưa lưu trong biểu mẫu?"))
        )
          onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className={overlayClass("dialog")} />
        <Dialog.Content
          className={cn(
            "fixed top-1/2 left-1/2 z-61 flex max-h-[90dvh] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden",
            "rounded-xl border border-line bg-surface shadow-overlay outline-none",
            "motion-reduce:animate-none data-[state=open]:animate-[modal-in_160ms_ease-out]",
            size === "lg"
              ? "w-[min(960px,calc(100vw-32px))]"
              : "w-[min(680px,calc(100vw-32px))]",
          )}
          aria-describedby={undefined}
        >
          <div className="grid gap-2 border-b border-line px-5 pt-5 pb-3 md:px-6">
            <ModalHeader title={title} closeLabel="Đóng biểu mẫu" />
            {status && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                {status}
              </div>
            )}
            {stamp}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 md:px-6 [&>*+*]:mt-4">
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// Footer dính của chế độ Xem: [Đóng] + các nút như [Chỉnh sửa].
export function DialogFooter({ children }: { children: ReactNode }) {
  return (
    <div className="sticky -bottom-4 -mx-5 -mb-4 flex flex-wrap items-center justify-end gap-2.5 border-t border-line bg-surface px-5 py-3 md:-mx-6 md:px-6">
      {children}
    </div>
  );
}

// Tab trong dialog (Thông tin / Phân quyền …); trạng thái tab là của dialog.
export function DialogTabs<T extends string>({
  label,
  value,
  items,
  onChange,
}: {
  label: string;
  value: T;
  items: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div
      className="flex gap-1 overflow-x-auto overflow-y-hidden border-b border-line"
      role="tablist"
      aria-label={label}
    >
      {items.map((item) => (
        <button
          key={item.value}
          data-ui
          type="button"
          role="tab"
          className="-mb-px h-9 border-b-2 border-transparent px-3 text-sm font-medium whitespace-nowrap text-fg-subtle hover:text-fg aria-selected:border-action aria-selected:text-selected-fg"
          aria-selected={item.value === value}
          aria-current={item.value === value ? "page" : undefined}
          onClick={async () => {
            if (item.value !== value && (await confirmDiscard()))
              onChange(item.value);
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

// Cột Hành động của danh sách: [Xem] [Sửa] mở dialog qua URL.
export function RowDialogLinks({
  name,
  view,
  edit,
}: {
  name: string;
  view: string;
  edit?: string;
}) {
  return (
    <span className="actions inline-flex items-center gap-1">
      <Link
        href={view}
        scroll={false}
        className={detailClass}
        aria-label={`Xem ${name}`}
      >
        Xem
      </Link>
      {edit && (
        <Link
          href={edit}
          scroll={false}
          className={detailClass}
          aria-label={`Sửa ${name}`}
        >
          Sửa
        </Link>
      )}
    </span>
  );
}
