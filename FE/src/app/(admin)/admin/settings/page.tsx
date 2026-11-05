import { SettingsPage } from "@/features/settings/components/settings-page";
import { Suspense } from "react";
export default function Page() {
  return (
    <Suspense>
      <SettingsPage />
    </Suspense>
  );
}
