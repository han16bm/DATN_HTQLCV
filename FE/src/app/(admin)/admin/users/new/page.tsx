import { redirect } from "next/navigation";
// Thêm mới mở bằng dialog trên trang danh sách (ADMIN_MODULES 9).
export default function Page() {
  redirect("/admin/users?dialog=create");
}
