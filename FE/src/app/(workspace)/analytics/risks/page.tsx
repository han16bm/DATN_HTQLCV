import { RisksPage } from "@/features/analytics/components/risks-page";
import { Suspense } from "react";
export default function Page() {
  return (
    <Suspense>
      <RisksPage />
    </Suspense>
  );
}
