import { AnalysisDetailPage } from "@/features/analytics/components/analysis-detail-page";
export default async function Page({
  params,
}: {
  params: Promise<{ analysisId: string }>;
}) {
  const { analysisId } = await params;
  return <AnalysisDetailPage analysisId={analysisId} />;
}
