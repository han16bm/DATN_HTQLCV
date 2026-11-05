"use client";
import { ApiError } from "@/types/api/error";
import { ActionButton } from "./action-button";
import { Notice } from "./notice";

export function QueryErrorState({
  error,
  retry,
}: {
  error: Error;
  retry?: () => Promise<unknown>;
}) {
  const status = error instanceof ApiError ? error.status : 0;
  const ipBlocked =
    error instanceof ApiError && error.code === "IP_NOT_ALLOWED";
  const details = ipBlocked ? error.details : undefined;
  const ip =
    details && typeof details === "object" && !Array.isArray(details)
      ? details.ip
      : undefined;
  return (
    <Notice
      tone="danger"
      title={
        ipBlocked
          ? "IP của bạn không được phép truy cập khu quản trị"
          : status === 403
            ? "Bạn chưa được cấp quyền"
            : status === 404
              ? "Không tìm thấy nội dung"
              : "Chưa tải được dữ liệu"
      }
      actions={
        retry && ![401, 403, 404].includes(status) ? (
          <ActionButton onAction={retry} pendingLabel="Đang tải lại…">
            Thử tải lại
          </ActionButton>
        ) : undefined
      }
      className="mb-3"
    >
      <p>{error.message}</p>
      {typeof ip === "string" && (
        <p className="text-xs text-fg-subtle">Địa chỉ IP: {ip}</p>
      )}
    </Notice>
  );
}
