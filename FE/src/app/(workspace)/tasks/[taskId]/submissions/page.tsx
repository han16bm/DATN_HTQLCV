import { SubmissionsPage } from "@/features/submissions/components/submissions-page";
export default async function Page({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;
  return <SubmissionsPage taskId={taskId} />;
}
