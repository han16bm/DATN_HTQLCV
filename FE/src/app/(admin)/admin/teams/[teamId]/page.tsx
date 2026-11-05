import { redirect } from "next/navigation";
// Chi tiết mở bằng dialog Xem trên trang danh sách (ADMIN_MODULES 9).
export default async function Page({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  redirect(`/admin/teams?dialog=view&id=${encodeURIComponent(teamId)}`);
}
