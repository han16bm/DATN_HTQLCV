import { LoginPage } from "@/features/auth/components/login-page";
import { Suspense } from "react";
export default function Page() {
  return (
    <Suspense>
      <LoginPage />
    </Suspense>
  );
}
