import { Suspense } from "react";
import { TaskListPage } from "@/features/tasks/client";
export default function Page() {
  return (
    <Suspense>
      <TaskListPage personal />
    </Suspense>
  );
}
