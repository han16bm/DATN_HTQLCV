"use client";
import { ApiError } from "@/types/api/error";
export function QueryErrorState({
  error,
  retry,
}: {
  error: Error;
  retry?: () => void;
}) {
  const status = error instanceof ApiError ? error.status : 0;
  return (
    <div role="alert" className="notice error">
      <h2>
        {status === 403
          ? "Bạn chưa được cấp quyền"
          : status === 404
            ? "Không tìm thấy nội dung"
            : "Chưa tải được dữ liệu"}
      </h2>
      <p>{error.message}</p>
      {retry && ![401, 403, 404].includes(status) && (
        <button onClick={retry}>Thử tải lại</button>
      )}
    </div>
  );
}
