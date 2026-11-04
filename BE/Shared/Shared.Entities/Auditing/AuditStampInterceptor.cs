using System.Reflection;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Shared.Commons.Extensions;

namespace Shared.Entities.Auditing;

/// <summary>
/// Tự điền CreatedAt/CreatedBy/UpdatedAt/UpdatedBy cho mọi entity <see cref="ICreateStamped"/>/<see cref="IUpdateStamped"/>
/// ngay trước SaveChanges — service không phải (và không được quên) tự gán. Người thao tác lấy từ claim của request
/// hiện tại; không có request (job nền) hoặc chưa đăng nhập (khoá tự động khi sai mật khẩu) thì ghi "SYSTEM".
/// </summary>
public sealed class AuditStampInterceptor(IHttpContextAccessor httpContextAccessor) : SaveChangesInterceptor
{
    // Cột tự thân của dấu vết/khóa lạc quan không được tính là "thay đổi nghiệp vụ"
    private static readonly HashSet<string> BookkeepingProperties =
        [nameof(IUpdateStamped.UpdatedAt), nameof(IUpdateStamped.UpdatedBy), "Version"];

    public override InterceptionResult<int> SavingChanges(DbContextEventData eventData, InterceptionResult<int> result)
    {
        Stamp(eventData.Context);
        return base.SavingChanges(eventData, result);
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        Stamp(eventData.Context);
        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private void Stamp(DbContext? context)
    {
        if (context is null) return;

        var now = DateTime.UtcNow;
        var actor = AuditActorScope.Override ?? httpContextAccessor.HttpContext?.GetUserId() ?? AuditActors.System;

        foreach (var entry in context.ChangeTracker.Entries())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    if (entry.Entity is ICreateStamped created)
                    {
                        if (created.CreatedAt == default) created.CreatedAt = now;
                        created.CreatedBy ??= actor;
                    }
                    if (entry.Entity is IUpdateStamped added)
                    {
                        if (added.UpdatedAt == default) added.UpdatedAt = now;
                        added.UpdatedBy ??= actor;
                    }
                    break;
                case EntityState.Modified when entry.Entity is IUpdateStamped updated && HasBusinessChange(entry):
                    updated.UpdatedAt = now;
                    updated.UpdatedBy = actor;
                    break;
            }
        }
    }

    private static bool HasBusinessChange(EntityEntry entry)
    {
        foreach (var property in entry.Properties)
        {
            if (!property.IsModified) continue;
            var name = property.Metadata.Name;
            if (BookkeepingProperties.Contains(name)) continue;
            if (property.Metadata.PropertyInfo?.GetCustomAttribute<NoAuditStampAttribute>() is not null) continue;
            return true;
        }
        return false;
    }
}
