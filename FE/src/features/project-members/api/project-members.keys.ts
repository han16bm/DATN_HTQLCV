// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
import { normalizeQuery } from "@/lib/query/normalize-query";
import * as contracts from "./project-members.contract";
export const projectMembersKeys = {
  all: ["project-members"] as const,
  viewer: (viewerId: string) => ["project-members", viewerId] as const,
  listProjectMembers: (
    viewerId: string,
    params: Record<string, string> = {},
    query: Record<string, unknown> = {},
  ) =>
    [
      "project-members",
      viewerId,
      "listProjectMembers",
      params,
      normalizeQuery(contracts.listProjectMembersContract.query.parse(query)),
    ] as const,
};
