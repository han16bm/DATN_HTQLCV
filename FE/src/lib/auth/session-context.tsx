"use client";
import { type SessionDto } from "@/features/auth/types/auth.types";
import { createContext, useContext } from "react";

export type SessionContext = {
  session: SessionDto | null;
  loading: boolean;
  refresh: () => Promise<{ data?: SessionDto }>;
  signIn: (session: SessionDto) => Promise<void>;
  signOut: () => Promise<void>;
};
export const Session = createContext<SessionContext>({
  session: null,
  loading: true,
  refresh: async () => ({}),
  signIn: async () => {},
  signOut: async () => {},
});
export const useSession = () => useContext(Session);
