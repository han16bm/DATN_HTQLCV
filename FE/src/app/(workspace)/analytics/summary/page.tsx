import { AnalysisSummaryPage } from "@/features/analytics/components/analysis-summary-page";
import { Suspense } from "react";
export default function Page() {
  return (
    <Suspense>
      <AnalysisSummaryPage />
    </Suspense>
  );
}
