import { useUI } from "@/stores/ui-store";
export async function confirmDiscard(
  message = "Bỏ dữ liệu chưa lưu để chuyển thao tác?",
) {
  return (
    !useUI.getState().dirtyForms.length || useUI.getState().confirm(message)
  );
}
