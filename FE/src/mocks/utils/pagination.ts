export function paginate<T>(
  items: T[],
  query: { page?: number; pageSize?: number },
) {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;
  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    pagination: { page, pageSize, total: items.length },
  };
}
