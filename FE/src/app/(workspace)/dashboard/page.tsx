import { DashboardPage } from "@/features/analytics/components/dashboard-page";
import { Suspense } from "react";
export default function Page() {
  return (
    <Suspense>
      <DashboardPage />
    </Suspense>
  );
}
