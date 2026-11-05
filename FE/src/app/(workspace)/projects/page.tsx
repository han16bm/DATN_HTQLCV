import { ProjectsPage } from "@/features/projects/components/projects-page";
import { Suspense } from "react";
export default function Page() {
  return (
    <Suspense>
      <ProjectsPage />
    </Suspense>
  );
}
