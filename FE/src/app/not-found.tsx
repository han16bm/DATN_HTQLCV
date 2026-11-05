import { SystemMessage } from "@/components/ui/system-message";
export default function NotFound() {
  return (
    <SystemMessage
      code="404"
      title="Không tìm thấy nội dung"
      description="Nội dung không tồn tại hoặc đã được chuyển sang địa chỉ khác."
    />
  );
}
