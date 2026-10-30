import type { SessionDto } from "@/features/auth/types/auth.types";

type Role = SessionDto["user"]["systemRole"];

// One role policy for navigation and direct route access.
const routes: {
  path: RegExp;
  roles: readonly Role[];
  permission?: string;
}[] = [
  { path: /^\/admin(?:\/|$)/, roles: ["ADMIN"] },
  {
    path: /^\/(?:dashboard|analytics|alerts|reviews)(?:\/|$)/,
    roles: ["MANAGER", "ADMIN"],
    permission: "ANALYTICS_VIEW",
  },
  { path: /^\/projects\/new\/?$/, roles: ["MANAGER"] },
  {
    path: /^\/projects\/[^/]+\/(?:edit|tasks\/new)\/?$/,
    roles: ["MANAGER", "ADMIN"],
  },
  { path: /^\/tasks\/[^/]+\/edit\/?$/, roles: ["MANAGER", "ADMIN"] },
];

export function canVisit(session: SessionDto | null | undefined, path: string) {
  const role = session?.user.systemRole;
  if (!role) return false;
  const route = routes.find((route) => route.path.test(path));
  if (!route || route.roles.includes(role)) return true;
  return Boolean(route.permission && session?.permissions.includes(route.permission));
}

// Project actions remain scoped; opening a page does not grant write access.
export function canManage(session: SessionDto | null, projectId: string) {
  return (
    session?.user.systemRole === "MANAGER" &&
    session.projectAccess.some(
      (project) =>
        project.projectId === projectId && project.projectRole !== "MEMBER",
    )
  );
}
