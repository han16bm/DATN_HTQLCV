import { redirect } from "next/navigation";
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
