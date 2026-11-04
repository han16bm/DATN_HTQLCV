import { redirect } from "next/navigation";
// Chi tiết mở bằng dialog Xem trên trang danh sách (ADMIN_MODULES 9).
export default async function Page({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  redirect(
    `/admin/permission-groups?dialog=view&id=${encodeURIComponent(groupId)}`,
  );
}
