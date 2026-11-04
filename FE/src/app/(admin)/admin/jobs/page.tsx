import { JobsPage } from "@/features/jobs/components/jobs-page";
import { Suspense } from "react";
export default function Page() {
  return (
    <Suspense>
      <JobsPage />
    </Suspense>
  );
}
