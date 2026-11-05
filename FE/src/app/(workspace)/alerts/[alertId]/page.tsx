import { AlertDetailPage } from "@/features/alerts/components/alert-detail-page";
export default async function Page({
  params,
}: {
  params: Promise<{ alertId: string }>;
}) {
  const { alertId } = await params;
  return <AlertDetailPage alertId={alertId} />;
}
