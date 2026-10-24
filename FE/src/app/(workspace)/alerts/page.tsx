import { AlertsPage } from "@/features/alerts/components/alerts-page";
import { Suspense } from "react";
export default function Page() {
  return (
    <Suspense>
      <AlertsPage />
    </Suspense>
  );
}
