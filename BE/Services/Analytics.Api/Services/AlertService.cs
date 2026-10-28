using Analytics.Api.Interfaces;
using Analytics.Api.Models.Dtos;
using Analytics.Api.Models.Queries;
using Analytics.Api.Models.Requests;
using Microsoft.EntityFrameworkCore;
using Shared.Commons.Exceptions;
using Shared.Commons.Extensions;
using Shared.Commons.Models;
using Shared.Entities;
using Shared.Entities.Entities;
using Shared.Entities.Enums;

namespace Analytics.Api.Services;

public class AlertService(ApplicationDbContext context, IHttpContextAccessor httpContextAccessor) : IAlertService
{
    public async Task<PagedResult<AlertDto>> ListAsync(AlertQuery query)
    {
        var q = context.Alerts.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(query.ProjectId)) q = q.Where(a => a.ProjectId == query.ProjectId);
        if (query.Status.HasValue) q = q.Where(a => a.Status == query.Status);
        if (query.Severity.HasValue) q = q.Where(a => a.Severity == query.Severity);

        q = q.OrderByDescending(a => a.CreatedAt);

        var paged = await q.ToPagedResultAsync(query);
        return new PagedResult<AlertDto>
        {
            Items = paged.Items.Select(ToDto).ToList(),
            Page = paged.Page,
            PageSize = paged.PageSize,
            Total = paged.Total
        };
    }

    public async Task<AlertDto> GetAsync(string alertId)
    {
        var alert = await context.Alerts.AsNoTracking().FirstOrDefaultAsync(a => a.Id == alertId)
            ?? throw new NotFoundException("Không tìm thấy cảnh báo.");
        return ToDto(alert);
    }

    public async Task<AlertDto> UpdateAsync(string alertId, UpdateAlertRequest request, string? ifMatch)
    {
        if (string.IsNullOrWhiteSpace(ifMatch))
            throw new PreconditionRequiredException("Thiếu If-Match.");

        if (request.Status != AlertStatus.Read && string.IsNullOrWhiteSpace(request.ResolutionNote))
            throw new ValidationException("Cần nhập hướng xử lý/lý do khi đổi trạng thái khác Đã xem.");

        var alert = await context.Alerts.FirstOrDefaultAsync(a => a.Id == alertId)
            ?? throw new NotFoundException("Không tìm thấy cảnh báo.");

        if (!int.TryParse(ifMatch.Trim('"'), out var version) || version != alert.Version)
            throw new PreconditionFailedException("Cảnh báo vừa được cập nhật, hãy tải lại.");

        var actorId = httpContextAccessor.HttpContext?.GetUserId()
            ?? throw new ValidationException("Thiếu định danh người xử lý trong phiên.");

        alert.Status = request.Status;
        alert.ResolutionNote = request.ResolutionNote;
        alert.HandledBy = actorId;
        alert.HandledAt = DateTime.UtcNow;
        alert.Version++;
        alert.UpdatedAt = DateTime.UtcNow;

        await context.SaveChangesAsync();
        return ToDto(alert);
    }

    private static AlertDto ToDto(Alert a)
    {
        return new()
        {
            Id = a.Id,
            Version = a.Version,
            CreatedAt = a.CreatedAt,
            UpdatedAt = a.UpdatedAt,
            ProjectId = a.ProjectId,
            TaskId = a.TaskId,
            Type = a.Type.ToUpperSnake(),
            Severity = a.Severity.ToUpperSnake(),
            Status = a.Status.ToUpperSnake(),
            ConditionActive = a.ConditionActive,
            Evidence = a.Evidence,
            DataAsOf = a.DataAsOf,
            MethodVersion = a.MethodVersion,
            ResolutionNote = a.ResolutionNote,
            HandledBy = a.HandledBy,
            HandledAt = a.HandledAt
        };
    }
}
