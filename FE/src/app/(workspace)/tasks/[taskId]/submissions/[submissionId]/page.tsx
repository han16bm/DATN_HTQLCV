import { SubmissionDetailPage } from "@/features/submissions/components/submission-detail-page";
export default async function Page({
  params,
}: {
  params: Promise<{ taskId: string; submissionId: string }>;
}) {
  const { taskId, submissionId } = await params;
  return <SubmissionDetailPage taskId={taskId} submissionId={submissionId} />;
}
