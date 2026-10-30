"use client";
import { useUI } from "@/stores/ui-store";
import { useEffect } from "react";

// Trang đã tải thực thể thì đăng ký tên để breadcrumb hiển thị thay cho ID,
// không phải tải lại dữ liệu ở thanh điều hướng. Đăng ký lại nếu tên bị xóa
// (ví dụ sau khi mất quyền xem rồi tải lại được).
export function useCrumbLabel(
  kind: string,
  id: string,
  label: string | undefined,
  parentId?: string,
) {
  const setLabel = useUI((s) => s.setLabel);
  const registered = useUI((s) => s.labels[`${kind}:${id}`]?.label === label);
  useEffect(() => {
    if (label && !registered) setLabel(`${kind}:${id}`, label, parentId);
  }, [kind, id, label, parentId, registered, setLabel]);
}
