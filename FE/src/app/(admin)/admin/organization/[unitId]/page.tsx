import { redirect } from "next/navigation";
export default async function Page({
  params,
}: {
  params: Promise<{ unitId: string }>;
}) {
  const { unitId } = await params;
  redirect(`/admin/organization?dialog=view&id=${encodeURIComponent(unitId)}`);
}
