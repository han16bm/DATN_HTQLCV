"use client";
import { Loading } from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { hasPermission, useSession } from "@/lib/auth/session-context";
import { ApiError } from "@/types/api/error";
import { type ReactNode } from "react";
export function PermissionGate({
  permission,
  projectId,
  children,
}: {
  permission: string;
  projectId?: string;
  children: ReactNode;
}) {
  const { session, loading } = useSession();
  if (loading) return <Loading />;
  return hasPermission(session, permission, projectId) ? (
    children
  ) : (
    <QueryErrorState
      error={
        new ApiError(
          403,
          "FORBIDDEN",
          "Bạn chưa được cấp quyền truy cập nội dung này.",
        )
      }
    />
  );
}
