import { redirect } from "next/navigation";
// Chi tiết mở bằng dialog Xem trên trang danh sách (ADMIN_MODULES 9).
export default async function Page({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  redirect(`/admin/users?dialog=view&id=${encodeURIComponent(userId)}`);
}
