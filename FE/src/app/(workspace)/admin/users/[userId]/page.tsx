import { UserEditorPage } from "@/features/users/components/user-editor-page";
export default async function Page({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  return <UserEditorPage userId={userId} />;
}
