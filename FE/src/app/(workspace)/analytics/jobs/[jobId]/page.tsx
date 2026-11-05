import { AnalysisJobPage } from "@/features/analytics/components/analysis-job-page";
export default async function Page({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  return <AnalysisJobPage jobId={jobId} />;
}
