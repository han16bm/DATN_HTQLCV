import { IpWhitelistPage } from "@/features/ip-whitelist/components/ip-whitelist-page";
import { Suspense } from "react";
export default function Page() {
  return (
    <Suspense>
      <IpWhitelistPage />
    </Suspense>
  );
}
