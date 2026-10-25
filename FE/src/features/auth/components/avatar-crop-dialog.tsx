"use client";
import { Avatar } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/loading";
import { ApiError } from "@/types/api/error";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
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
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content avatar-crop-dialog" aria-busy={busy}>
          <div className="dialog-heading">
            <Dialog.Title>Chỉnh sửa ảnh</Dialog.Title>
            <Dialog.Close className="icon-button" aria-label="Đóng chỉnh sửa ảnh" disabled={busy}>
              <X size={18} aria-hidden="true" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="small muted">
            Kéo ảnh để chọn vị trí và thu phóng vùng cắt.
          </Dialog.Description>
          <div className="avatar-crop-area" inert={busy}>
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
              setImageRef={(ref) => { image.current = ref.current; }}
              mediaProps={{ alt: "Ảnh đang cắt", onError: () => {
                setArea(undefined);
                setError(new Error("Không đọc được ảnh. Vui lòng chọn ảnh khác."));
              } }}
              cropperProps={{ "aria-label": "Vùng cắt ảnh" }}
            />
          </div>
          <label className="avatar-zoom">
            Thu phóng
            <input type="range" min={1} max={3} step={0.1} value={zoom} disabled={busy}
              aria-label="Thu phóng ảnh" onChange={(event) => setZoom(Number(event.target.value))} />
          </label>
          {error && (
            <div className="notice error" role="alert">
              <p>{error instanceof ApiError ? error.fields.find((field) => field.path[0] === "avatar")?.message ?? error.message : error.message}</p>
              {error instanceof ApiError && error.status === 412 && (
                <button type="button" onClick={async () => {
                  try { setLatest(await onConflictReload()); } catch (cause) { fail(cause); }
                }}>Tải bản mới để đối chiếu</button>
              )}
            </div>
          )}
          {latest && (
            <div className="avatar-comparison">
              <Avatar name={latest.displayName} src={latest.avatarUrl} />
              <span className="small muted">Ảnh hiện tại. Vùng cắt đang chọn được giữ lại.</span>
              <button type="button" onClick={() => {
                onConflictAccept();
                setLatest(undefined);
                setError(undefined);
              }}>Đã đối chiếu, tiếp tục chỉnh sửa</button>
            </div>
          )}
          <div className="actions avatar-crop-actions">
            <button type="button" disabled={busy} onClick={onCancel}>Hủy</button>
            <button type="button" className="primary pending-button" disabled={!area || busy || Boolean(latest)} onClick={() => void confirm()}>
              {busy && <Spinner />}
              {busy ? "Đang cập nhật…" : "Cập nhật"}
            </button>
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
  context.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, 512, 512);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((file) => file ? resolve(file) : reject(new Error("Không cắt được ảnh. Vui lòng thử lại.")), "image/webp", 0.9);
  });
  return new File([blob], `${name.replace(/\.[^.]+$/, "") || "avatar"}.${blob.type === "image/webp" ? "webp" : "png"}`, { type: blob.type });
}
