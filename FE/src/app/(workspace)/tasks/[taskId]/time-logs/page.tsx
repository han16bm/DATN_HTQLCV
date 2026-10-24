import { TimeLogsPage } from "@/features/time-logs/components/time-logs-page";
import { Suspense } from "react";
export default async function Page({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;
  return (
    <Suspense>
      <TimeLogsPage taskId={taskId} />
    </Suspense>
  );
}
