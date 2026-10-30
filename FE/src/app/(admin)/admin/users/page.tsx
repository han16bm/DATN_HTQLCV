import { UsersPage } from "@/features/users/components/users-page";
import { Suspense } from "react";
export default function Page() {
  return (
    <Suspense>
      <UsersPage />
    </Suspense>
  );
}
