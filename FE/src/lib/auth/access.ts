import type { SessionDto } from "@/features/auth/types/auth.types";

type Role = SessionDto["user"]["systemRole"];

// One role policy for navigation and direct route access.
const routes: { path: RegExp; roles: readonly Role[] }[] = [
  { path: /^\/admin(?:\/|$)/, roles: ["ADMIN"] },
  {
    path: /^\/(?:dashboard|analytics|alerts|reviews)(?:\/|$)/,
    roles: ["MANAGER", "ADMIN"],
  },
  { path: /^\/projects\/new\/?$/, roles: ["MANAGER"] },
  {
    path: /^\/projects\/[^/]+\/(?:edit|tasks\/new)\/?$/,
    roles: ["MANAGER", "ADMIN"],
  },
  { path: /^\/tasks\/[^/]+\/edit\/?$/, roles: ["MANAGER", "ADMIN"] },
];

export function canVisit(role: Role | undefined, path: string) {
  if (!role) return false;
  const route = routes.find((route) => route.path.test(path));
  return !route || route.roles.includes(role);
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
