"use client";
import { useHashDialog } from "@/lib/forms/use-hash-dialog";
import { confirmDiscard } from "@/lib/forms/confirm-discard";
import * as Dialog from "@radix-ui/react-dialog";
import { useId, type ReactNode } from "react";

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
  const descriptionId = useId();
  return (
    <Dialog.Root
      open={dialog.name === name}
      onOpenChange={async (open) => {
        if (open) dialog.open(name);
        else if (await confirmDiscard("Bỏ dữ liệu chưa lưu trong biểu mẫu?"))
          dialog.close();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content
          className="dialog-content"
          aria-describedby={description ? descriptionId : undefined}
        >
          <div className="dialog-heading">
            <Dialog.Title>{title}</Dialog.Title>
            <Dialog.Close className="icon-button" aria-label="Đóng biểu mẫu">
              ×
            </Dialog.Close>
          </div>
          {description && (
            <Dialog.Description id={descriptionId} className="muted">
              {description}
            </Dialog.Description>
          )}
          <div className="section-gap">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
