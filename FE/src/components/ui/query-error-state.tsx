"use client";
import { ApiError } from "@/types/api/error";
import { ActionButton } from "./action-button";

export function QueryErrorState({
  error,
  retry,
}: {
  error: Error;
  retry?: () => Promise<unknown>;
}) {
  const status = error instanceof ApiError ? error.status : 0;
  // Khu quản trị bật IP whitelist: lỗi quyền riêng, kèm IP nếu BE gửi trong details.
  const ipBlocked =
    error instanceof ApiError && error.code === "IP_NOT_ALLOWED";
  const details = ipBlocked ? error.details : undefined;
  const ip =
    details && typeof details === "object" && !Array.isArray(details)
      ? details.ip
      : undefined;
  return (
    <div role="alert" className="notice error">
      <h2>
        {ipBlocked
          ? "IP của bạn không được phép truy cập khu quản trị"
          : status === 403
            ? "Bạn chưa được cấp quyền"
            : status === 404
              ? "Không tìm thấy nội dung"
              : "Chưa tải được dữ liệu"}
      </h2>
      <p>{error.message}</p>
      {typeof ip === "string" && <p className="small">Địa chỉ IP: {ip}</p>}
      {retry && ![401, 403, 404].includes(status) && (
        <ActionButton onAction={retry} pendingLabel="Đang tải lại…">
          Thử tải lại
        </ActionButton>
      )}
    </div>
  );
}
