"use client";
import { confirmDiscard } from "@/lib/forms/confirm-discard";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

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
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content
          className={`dialog-content entity-dialog entity-dialog-${size}`}
          aria-describedby={undefined}
        >
          <div className="entity-dialog-header">
            <div className="dialog-heading">
              <Dialog.Title>{title}</Dialog.Title>
              <Dialog.Close className="icon-button" aria-label="Đóng biểu mẫu">
                <X size={18} />
              </Dialog.Close>
            </div>
            {status && <div className="page-status">{status}</div>}
            {stamp}
          </div>
          <div className="entity-dialog-body">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// Footer dính của chế độ Xem: [Đóng] + các nút như [Chỉnh sửa].
export function DialogFooter({ children }: { children: ReactNode }) {
  return <div className="form-actions entity-dialog-footer">{children}</div>;
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
    <div className="section-nav dialog-tabs" role="tablist" aria-label={label}>
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          role="tab"
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
    <span className="row-actions">
      <Link
        href={view}
        scroll={false}
        className="detail-link"
        aria-label={`Xem ${name}`}
      >
        Xem
      </Link>
      {edit && (
        <Link
          href={edit}
          scroll={false}
          className="detail-link"
          aria-label={`Sửa ${name}`}
        >
          Sửa
        </Link>
      )}
    </span>
  );
}
