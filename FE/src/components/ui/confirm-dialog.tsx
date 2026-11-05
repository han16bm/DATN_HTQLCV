"use client";
import { useUI } from "@/stores/ui-store";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { TriangleAlert } from "lucide-react";
import { Button } from "./button";
import { modalClass, overlayClass } from "./overlay";

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
        <AlertDialog.Overlay className={overlayClass("confirm")} />
        <AlertDialog.Content className={modalClass("sm", "confirm")}>
          <span className="mb-3 grid size-10 place-items-center rounded-full bg-warning-bg text-warning-fg">
            <TriangleAlert className="size-5" aria-hidden="true" />
          </span>
          <AlertDialog.Title className="m-0 text-heading-md font-semibold text-fg">
            Thay đổi chưa được lưu
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-1.5 mb-0 text-sm text-fg-subtle">
            {pending?.message}
          </AlertDialog.Description>
          <div className="mt-6 flex flex-wrap justify-end gap-2.5">
            <AlertDialog.Cancel asChild>
              <Button onClick={() => answer(false)}>Ở lại</Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button variant="danger" onClick={() => answer(true)}>
                Bỏ thay đổi
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
