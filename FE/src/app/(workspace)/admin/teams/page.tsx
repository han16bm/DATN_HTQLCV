import { TeamsPage } from "@/features/organization/components/teams-page";
import { Suspense } from "react";
export default function Page() {
  return (
    <Suspense>
      <TeamsPage />
    </Suspense>
  );
}
