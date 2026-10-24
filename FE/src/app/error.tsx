"use client";
import { SystemMessage } from "@/components/ui/system-message";

export default function ErrorPage({
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <SystemMessage
      code="Không thể mở nội dung"
      title="Đã xảy ra lỗi khi tải màn hình"
      description="Bạn có thể thử tải lại hoặc quay về không gian làm việc."
    >
      <button onClick={retry}>Thử tải lại</button>
    </SystemMessage>
  );
}
