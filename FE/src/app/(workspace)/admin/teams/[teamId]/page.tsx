import { TeamEditorPage } from "@/features/organization/components/team-editor-page";
export default async function Page({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  return <TeamEditorPage teamId={teamId} />;
}
