import { ReportPage } from "@/features/reports/components/report-page";
export default async function Page({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  return <ReportPage reportId={reportId} />;
}
