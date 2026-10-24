import { useUI } from "@/stores/ui-store";
export function confirmDiscard() {
  if (
    useUI.getState().dirtyForms.length &&
    !window.confirm("Bỏ dữ liệu chưa lưu để chuyển thao tác?")
  )
    return false;
  return true;
}
