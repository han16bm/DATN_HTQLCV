import { PermissionGroupsPage } from "@/features/permissions/components/permission-groups-page";
import { Suspense } from "react";
export default function Page() {
  return (
    <Suspense>
      <PermissionGroupsPage />
    </Suspense>
  );
}
