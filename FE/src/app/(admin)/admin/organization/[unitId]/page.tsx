import { redirect } from "next/navigation";
// Chi tiết mở bằng dialog Xem trên trang danh sách (ADMIN_MODULES 9).
export default async function Page({
  params,
}: {
  params: Promise<{ unitId: string }>;
}) {
  const { unitId } = await params;
  redirect(`/admin/organization?dialog=view&id=${encodeURIComponent(unitId)}`);
}
