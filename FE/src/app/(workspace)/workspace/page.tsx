import { TodayPage } from "@/features/tasks/components/today-page";
import { Suspense } from "react";
export default function Page() {
  return (
    <Suspense>
      <TodayPage />
    </Suspense>
  );
}
