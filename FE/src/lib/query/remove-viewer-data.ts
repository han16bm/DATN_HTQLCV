import { useUI } from "@/stores/ui-store";
import { ApiError } from "@/types/api/error";
import { type QueryClient } from "@tanstack/react-query";

export async function removeViewerData(
  client: QueryClient,
  viewerId: string,
  feature?: string,
) {
  useUI.getState().clearLabels();
  const filter = {
    predicate: (q: { queryKey: readonly unknown[] }) =>
      q.queryKey[1] === viewerId &&
      (feature ? q.queryKey[0] === feature : q.queryKey[0] !== "auth"),
  };
  await client.cancelQueries(filter);
  for (const query of client.getQueryCache().findAll(filter)) {
    const error = query.state.error;
    if (error instanceof ApiError && [403, 410].includes(error.status)) {
      query.setState({ data: undefined, dataUpdatedAt: 0 });
    } else client.removeQueries({ queryKey: query.queryKey, exact: true });
  }
  for (const mutation of client.getMutationCache().getAll())
    if (
      mutation.options.mutationKey?.[1] === viewerId &&
      (feature
        ? mutation.options.mutationKey?.[0] === feature
        : mutation.options.mutationKey?.[0] !== "auth")
    )
      client.getMutationCache().remove(mutation);
}
