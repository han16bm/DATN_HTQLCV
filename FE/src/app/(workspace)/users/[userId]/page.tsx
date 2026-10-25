import { MemberProfilePage } from "@/features/users/components/member-profile-page";
export default async function Page({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  return <MemberProfilePage userId={userId} />;
}
