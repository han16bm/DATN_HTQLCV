import { ProjectRolesPage } from "@/features/permissions/components/project-roles-page";
import { Suspense } from "react";
export default function Page() {
  return (
    <Suspense>
      <ProjectRolesPage />
    </Suspense>
  );
}
