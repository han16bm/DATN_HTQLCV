"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useRef, type ReactNode } from "react";
import { IconButton } from "./icon-button";
import { overlayClass, slideDrawerClass } from "./overlay";

export function SlidePanel({
  id,
  open,
  onOpenChange,
  title,
  description,
  closeLabel,
  size = "md",
  children,
}: {
  id?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  closeLabel: string;
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}) {
  const trigger = useRef<HTMLElement | null>(null);
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={overlayClass("dialog", true)} />
        <Dialog.Content
          id={id}
          className={slideDrawerClass(size)}
          aria-describedby={undefined}
          onOpenAutoFocus={() => {
            trigger.current =
              document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null;
          }}
          onCloseAutoFocus={(event) => {
            if (trigger.current?.isConnected) {
              event.preventDefault();
              trigger.current.focus();
            }
          }}
        >
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-4 py-2">
            <div className="min-w-0">
              <Dialog.Title className="m-0 text-base font-semibold text-fg">
                {title}
              </Dialog.Title>
              {description && (
                <p className="mt-0.5 mb-0 text-xs text-fg-subtle">
                  {description}
                </p>
              )}
            </div>
            <Dialog.Close asChild>
              <IconButton label={closeLabel}>
                <X className="size-[18px]" aria-hidden="true" />
              </IconButton>
            </Dialog.Close>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain bg-page p-4">
            <div className="grid min-w-0 content-start gap-4">{children}</div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
