import { WorkspaceOverview } from "@/features/projects/components/workspace-overview";
import { TaskListPage } from "@/features/tasks/components/task-list-page";
import { Suspense } from "react";
export default function Page() {
  return (
    <Suspense>
      <WorkspaceOverview>
        <TaskListPage personal />
      </WorkspaceOverview>
    </Suspense>
  );
}
