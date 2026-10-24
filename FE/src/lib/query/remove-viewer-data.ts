import { type QueryClient } from "@tanstack/react-query";
export async function removeViewerData(client: QueryClient, viewerId: string) {
  const filter = {
    predicate: (q: { queryKey: readonly unknown[] }) =>
      q.queryKey[0] !== "auth" && q.queryKey[1] === viewerId,
  };
  await client.cancelQueries(filter);
  client.removeQueries(filter);
  for (const mutation of client.getMutationCache().getAll())
    if (
      mutation.options.mutationKey?.[1] === viewerId &&
      mutation.options.mutationKey?.[0] !== "auth"
    )
      client.getMutationCache().remove(mutation);
}
