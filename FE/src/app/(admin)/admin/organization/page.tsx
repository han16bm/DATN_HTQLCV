import { OrganizationPage } from "@/features/organization/components/organization-page";
import { Suspense } from "react";
export default function Page() {
  return (
    <Suspense>
      <OrganizationPage />
    </Suspense>
  );
}
