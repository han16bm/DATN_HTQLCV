import { redirect } from "next/navigation";
export default async function Page({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  redirect(`/admin/teams?dialog=view&id=${encodeURIComponent(teamId)}`);
}
