import { FeaturesPage } from "@/features/permissions/components/features-page";
import { Suspense } from "react";
export default function Page() {
  return (
    <Suspense>
      <FeaturesPage />
    </Suspense>
  );
}
