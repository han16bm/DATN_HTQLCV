"use client";
import { useHashDialog } from "@/lib/forms/use-hash-dialog";
import { confirmDiscard } from "@/lib/forms/confirm-discard";
import * as Dialog from "@radix-ui/react-dialog";
import { useId, type ReactNode } from "react";
import { ModalHeader, modalClass, overlayClass } from "./overlay";

// Hộp thoại mở bằng hash trên URL hiện tại nên giữ ngữ cảnh trang; đóng lúc còn
// dữ liệu chưa lưu thì hỏi lại.
export function HashDialog({
  name,
  title,
  description,
  returnTo,
  children,
}: {
  name: string;
  title: string;
  description?: string;
  returnTo?: string;
  children: ReactNode;
}) {
  const dialog = useHashDialog();
  const descriptionId = useId();
  return (
    <Dialog.Root
      open={dialog.name === name}
      onOpenChange={async (open) => {
        if (open) dialog.open(name);
        else if (await confirmDiscard("Bỏ dữ liệu chưa lưu trong biểu mẫu?")) {
          if (returnTo) dialog.open(returnTo);
          else dialog.close();
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className={overlayClass(returnTo ? "confirm" : "dialog")} />
        <Dialog.Content
          className={modalClass("md", returnTo ? "confirm" : "dialog")}
          aria-describedby={description ? descriptionId : undefined}
        >
          <ModalHeader title={title} closeLabel="Đóng biểu mẫu" />
          {description && (
            <Dialog.Description
              id={descriptionId}
              className="mt-1 mb-0 text-sm text-fg-subtle"
            >
              {description}
            </Dialog.Description>
          )}
          <div className="mt-5">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
