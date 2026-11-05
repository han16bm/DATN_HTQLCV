"use client";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ModalHeader, modalClass, overlayClass } from "@/components/ui/overlay";
import { cn } from "@/lib/cn";
import { Spinner } from "@/components/ui/loading";
import { ApiError } from "@/types/api/error";
import * as Dialog from "@radix-ui/react-dialog";
import { useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import type { SessionDto } from "../types/auth.types";

export function AvatarCropDialog({
  source,
  onCancel,
  onConfirm,
  onConflictReload,
  onConflictAccept,
}: {
  source: { name: string; url: string };
  onCancel: () => void;
  onConfirm: (file: File) => Promise<void>;
  onConflictReload: () => Promise<SessionDto["user"]>;
  onConflictAccept: () => void;
}) {
  const image = useRef<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Error>();
  const [latest, setLatest] = useState<SessionDto["user"]>();
  const fail = (cause: unknown) =>
    setError(
      cause instanceof Error ? cause : new Error("Không thể cập nhật ảnh."),
    );
  const confirm = async () => {
    if (!area || !image.current || busy) return;
    setBusy(true);
    setError(undefined);
    try {
      const file = await cropAvatar(image.current, area, source.name);
      await onConfirm(file);
    } catch (cause) {
      fail(cause);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog.Root open onOpenChange={(open) => !open && !busy && onCancel()}>
      <Dialog.Portal>
        <Dialog.Overlay className={overlayClass()} />
        <Dialog.Content
          className={cn(
            modalClass("md"),
            "flex h-[min(40rem,90dvh)] flex-col gap-4 *:shrink-0",
          )}
          aria-busy={busy}
        >
          <ModalHeader title="Chỉnh sửa ảnh" closeLabel="Đóng chỉnh sửa ảnh" />
          <Dialog.Description className="m-0 text-sm text-fg-subtle">
            Kéo ảnh để chọn vị trí và thu phóng vùng cắt.
          </Dialog.Description>
          <div
            className="relative min-h-40 flex-[1_0_11.25rem] overflow-hidden rounded-lg bg-[#1b2c43]"
            inert={busy}
          >
            <Cropper
              image={source.url}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              disableAutomaticStylesInjection
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, pixels) => setArea(pixels)}
              setImageRef={(ref) => {
                image.current = ref.current;
              }}
              mediaProps={{
                alt: "Ảnh đang cắt",
                onError: () => {
                  setArea(undefined);
                  setError(
                    new Error("Không đọc được ảnh. Vui lòng chọn ảnh khác."),
                  );
                },
              }}
              cropperProps={{ "aria-label": "Vùng cắt ảnh" }}
            />
          </div>
          <label className="flex items-center gap-4 text-sm">
            Thu phóng
            <input
              data-ui
              className="min-w-0 flex-1 accent-action"
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              disabled={busy}
              aria-label="Thu phóng ảnh"
              onChange={(event) => setZoom(Number(event.target.value))}
            />
          </label>
          {error && (
            <div
              role="alert"
              className="grid gap-2 rounded-lg border border-danger-bold/40 bg-danger-bg p-3 text-sm text-danger-fg"
            >
              <p className="m-0">
                {error instanceof ApiError
                  ? (error.fields.find((field) => field.path[0] === "avatar")
                      ?.message ?? error.message)
                  : error.message}
              </p>
              {error instanceof ApiError && error.status === 412 && (
                <Button
                  onClick={async () => {
                    try {
                      setLatest(await onConflictReload());
                    } catch (cause) {
                      fail(cause);
                    }
                  }}
                >
                  Tải bản mới để đối chiếu
                </Button>
              )}
            </div>
          )}
          {latest && (
            <div className="flex flex-wrap items-center gap-2.5">
              <Avatar name={latest.displayName} src={latest.avatarUrl} />
              <span className="text-xs text-fg-subtle">
                Ảnh hiện tại. Vùng cắt đang chọn được giữ lại.
              </span>
              <Button
                onClick={() => {
                  onConflictAccept();
                  setLatest(undefined);
                  setError(undefined);
                }}
              >
                Đã đối chiếu, tiếp tục chỉnh sửa
              </Button>
            </div>
          )}
          <div className="flex flex-wrap justify-end gap-2.5">
            <Button disabled={busy} onClick={onCancel}>
              Hủy
            </Button>
            <Button
              variant="primary"
              disabled={!area || busy || Boolean(latest)}
              onClick={() => void confirm()}
            >
              {busy && <Spinner />}
              {busy ? "Đang cập nhật…" : "Cập nhật"}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

async function cropAvatar(image: HTMLImageElement, area: Area, name: string) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Không thể xử lý ảnh trên trình duyệt này.");
  context.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    512,
    512,
  );
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (file) =>
        file
          ? resolve(file)
          : reject(new Error("Không cắt được ảnh. Vui lòng thử lại.")),
      "image/webp",
      0.9,
    );
  });
  return new File(
    [blob],
    `${name.replace(/\.[^.]+$/, "") || "avatar"}.${blob.type === "image/webp" ? "webp" : "png"}`,
    { type: blob.type },
  );
}
