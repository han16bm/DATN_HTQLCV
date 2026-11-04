import { Avatar } from "@/components/ui/avatar";
import type { SessionDto } from "@/features/auth/types/auth.types";
import { cn } from "@/lib/cn";

// Thẻ người dùng đầu sidebar, tràn hết chiều ngang và nằm ngay dưới header (đã có bộ
// chọn dự án) trên các mục chức năng: ảnh bìa tối, hàng ảnh tròn viền + tên + email chữ
// trắng căn giữa theo chiều dọc của thẻ. Chỉ để nhận diện nên không điều hướng. Sidebar
// thu gọn chỉ còn ảnh. Màu cố định (trắng trên ảnh tối) vì ở chế độ Sáng chữ của sidebar
// đổi sang tối.
export function ProfileCard({
  user,
  collapsed = false,
}: {
  user: SessionDto["user"];
  collapsed?: boolean;
}) {
  return (
    <div
      title={collapsed ? user.displayName : undefined}
      className={cn(
        "profile-cover -mx-2 flex min-h-28 shrink-0 items-center text-white",
        collapsed ? "justify-center" : "px-4",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid rounded-full shadow-raised ring-2 ring-white/70">
          <Avatar name={user.displayName} src={user.avatarUrl} size="md" />
        </span>
        <div
          className={cn("grid min-w-0 leading-tight", collapsed && "sr-only")}
        >
          <span className="truncate text-sm font-semibold">
            {user.displayName}
          </span>
          <span className="truncate text-xs">{user.email}</span>
        </div>
      </div>
    </div>
  );
}
