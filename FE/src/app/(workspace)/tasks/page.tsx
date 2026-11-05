import { TaskListPage } from "@/features/tasks/components/task-list-page";
import { Suspense } from "react";
export default function Page() {
  return (
    <Suspense>
      <TaskListPage />
    </Suspense>
  );
}
