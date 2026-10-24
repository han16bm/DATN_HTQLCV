"use client";
import { createContext, useContext } from "react";
import type { AuthSessionDTO } from "@/features/auth/types/auth.types";
export type SessionContext = {
  session: AuthSessionDTO | null;
  loading: boolean;
  refresh: () => Promise<unknown>;
  signIn: (session: AuthSessionDTO) => Promise<void>;
  signOut: () => Promise<void>;
};
export const Session = createContext<SessionContext>({
  session: null,
  loading: true,
  refresh: async () => {},
  signIn: async () => {},
  signOut: async () => {},
});
export const useSession = () => useContext(Session);
export function hasPermission(
  session: AuthSessionDTO | null,
  permission: string,
  projectId?: string,
) {
  if (!session) return false;
  if (projectId)
    return session.projectAccess.some(
      (p) =>
        p.projectId === projectId &&
        p.permissions.some((v) => v === permission),
    );
  return (
    session.systemPermissions.some((v) => v === permission) ||
    session.projectAccess.some((p) =>
      p.permissions.some((v) => v === permission),
    )
  );
}
