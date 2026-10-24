"use client";
import { useHashDialog } from "@/lib/forms/use-hash-dialog";
import { useUI } from "@/stores/ui-store";
import * as Dialog from "@radix-ui/react-dialog";
import { type ReactNode } from "react";

export function HashDialog({
  name,
  title,
  description,
  children,
}: {
  name: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const dialog = useHashDialog();
  return (
    <Dialog.Root
      open={dialog.name === name}
      onOpenChange={(open) => {
        if (open) dialog.open(name);
        else if (
          !useUI.getState().dirtyForms.length ||
          window.confirm("Bỏ dữ liệu chưa lưu trong biểu mẫu?")
        )
          dialog.close();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <div className="dialog-heading">
            <Dialog.Title>{title}</Dialog.Title>
            <Dialog.Close aria-label="Đóng biểu mẫu">×</Dialog.Close>
          </div>
          <Dialog.Description className="muted">
            {description ?? "Kiểm tra thông tin trước khi xác nhận."}
          </Dialog.Description>
          <div className="section-gap">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
