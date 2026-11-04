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
  return (
    <Notice
      tone="danger"
      title={
        status === 403
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
    </Notice>
  );
}
