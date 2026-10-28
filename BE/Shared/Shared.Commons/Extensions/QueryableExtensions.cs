using Microsoft.EntityFrameworkCore;
using Shared.Commons.Models;

namespace Shared.Commons.Extensions;

public static class QueryableExtensions
{
    public static async Task<PagedResult<T>> ToPagedResultAsync<T>(this IQueryable<T> query, PagingQuery paging, CancellationToken ct = default)
    {
        var total = await query.CountAsync(ct);
        var items = await query.Skip((paging.Page - 1) * paging.PageSize).Take(paging.PageSize).ToListAsync(ct);
        return new PagedResult<T> { Items = items, Page = paging.Page, PageSize = paging.PageSize, Total = total };
    }
}
