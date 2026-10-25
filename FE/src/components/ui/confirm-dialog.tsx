"use client";
import { useUI } from "@/stores/ui-store";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { TriangleAlert } from "lucide-react";

export function ConfirmDialog() {
  const pending = useUI((s) => s.confirmation);
  const answer = useUI((s) => s.answer);
  return (
    <AlertDialog.Root
      open={!!pending}
      onOpenChange={(open) => {
        if (!open) answer(false);
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="confirm-overlay" />
        <AlertDialog.Content className="confirm-content">
          <span className="confirm-icon">
            <TriangleAlert size={23} aria-hidden="true" />
          </span>
          <AlertDialog.Title>Thay đổi chưa được lưu</AlertDialog.Title>
          <AlertDialog.Description>{pending?.message}</AlertDialog.Description>
          <div className="confirm-actions">
            <AlertDialog.Cancel asChild>
              <button type="button" onClick={() => answer(false)}>
                Ở lại
              </button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                type="button"
                className="primary"
                onClick={() => answer(true)}
              >
                Bỏ thay đổi
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
