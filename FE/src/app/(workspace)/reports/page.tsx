import { ReportsPage } from "@/features/reports/components/reports-page";
import { Suspense } from "react";
export default function Page() {
  return (
    <Suspense>
      <ReportsPage />
    </Suspense>
  );
}
