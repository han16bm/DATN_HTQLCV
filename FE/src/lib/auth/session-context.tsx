"use client";
import { type SessionDto } from "@/features/auth/types/auth.types";
import { createContext, useContext } from "react";

export type SessionContext = {
  session: SessionDto | null;
  loading: boolean;
  refresh: () => Promise<unknown>;
  signIn: (session: SessionDto) => Promise<void>;
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
  session: SessionDto | null,
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
