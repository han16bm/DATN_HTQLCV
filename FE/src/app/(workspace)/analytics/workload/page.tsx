import { WorkloadPage } from "@/features/analytics/components/workload-page";
import { Suspense } from "react";
export default function Page() {
  return (
    <Suspense>
      <WorkloadPage />
    </Suspense>
  );
}
