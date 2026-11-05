import { BottlenecksPage } from "@/features/analytics/components/bottlenecks-page";
import { Suspense } from "react";
export default function Page() {
  return (
    <Suspense>
      <BottlenecksPage />
    </Suspense>
  );
}
