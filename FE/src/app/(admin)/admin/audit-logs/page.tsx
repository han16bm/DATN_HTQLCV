import { AuditLogsPage } from "@/features/audit-logs/components/audit-logs-page";
import { Suspense } from "react";
export default function Page() {
  return (
    <Suspense>
      <AuditLogsPage />
    </Suspense>
  );
}
