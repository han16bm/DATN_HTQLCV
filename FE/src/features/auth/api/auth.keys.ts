export const authKeys = {
  all: ["auth"] as const,
  viewer: (viewerId: string) => ["auth", viewerId] as const,
  getSession: (viewerId: string) => ["auth", viewerId, "getSession"] as const,
};
