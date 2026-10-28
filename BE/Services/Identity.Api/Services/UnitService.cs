using Identity.Api.Interfaces;
using Identity.Api.Models.Dtos;
using Identity.Api.Models.Queries;
using Identity.Api.Models.Requests;
using Microsoft.EntityFrameworkCore;
using Shared.Commons.Exceptions;
using Shared.Commons.Extensions;
using Shared.Commons.Models;
using Shared.Commons.Utils;
using Shared.Entities;
using Shared.Entities.Entities;
using Shared.Entities.Enums;

namespace Identity.Api.Services;

public class UnitService(ApplicationDbContext context, IHttpContextAccessor httpContextAccessor)
    : BaseService<Unit>(context, httpContextAccessor), IUnitService
{
    public async Task<PagedResult<UnitDto>> ListAsync(UnitQuery query)
    {
        var q = context.Units.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(query.Q)) q = q.Where(u => u.Name.Contains(query.Q));
        if (!string.IsNullOrWhiteSpace(query.Status) && Enum.TryParse<OrgStatus>(query.Status, true, out var status))
            q = q.Where(u => u.Status == status);

        var paged = await q.OrderBy(u => u.Name).ToPagedResultAsync(query);
        return new PagedResult<UnitDto> { Items = paged.Items.Select(ToDto).ToList(), Page = paged.Page, PageSize = paged.PageSize, Total = paged.Total };
    }

    public async Task<UnitDto> GetAsync(string unitId)
    {
        return ToDto(await FindAsync(unitId));
    }

    public async Task<UnitDto> CreateAsync(UnitCreateRequest request)
    {
        if (request.ParentId is not null && !await context.Units.AnyAsync(u => u.Id == request.ParentId))
            throw new NotFoundException("Không tìm thấy đơn vị cấp trên.");

        var unit = new Unit
        {
            Id = GuidGenerator.NewId(),
            Name = request.Name.Trim(),
            ParentId = request.ParentId,
            ManagerId = request.ManagerId,
            Status = OrgStatus.Active,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Version = 1
        };

        await context.Units.AddAsync(unit);
        await WriteAuditLog(unit.Id, "CREATE", null, new { unit.Name });
        await context.SaveChangesAsync();
        return ToDto(unit);
    }

    public async Task<UnitDto> UpdateAsync(string unitId, UnitPatchRequest request, int ifMatchVersion)
    {
        var unit = await FindAsync(unitId);
        CheckVersion(unit.Version, ifMatchVersion);

        if (request.ParentId == unitId)
            throw new BusinessRuleException("Đơn vị không thể là cấp trên của chính nó.");

        var before = new { unit.Name, unit.ParentId, unit.ManagerId };
        if (request.Name is not null) unit.Name = request.Name.Trim();
        if (request.ParentId is not null) unit.ParentId = request.ParentId == "" ? null : request.ParentId;
        if (request.ManagerId is not null) unit.ManagerId = request.ManagerId == "" ? null : request.ManagerId;

        unit.UpdatedAt = DateTime.UtcNow;
        unit.Version++;

        await WriteAuditLog(unit.Id, "UPDATE", before, new { unit.Name, unit.ParentId, unit.ManagerId }, request.Reason);
        await context.SaveChangesAsync();
        return ToDto(unit);
    }

    public async Task<UnitDto> DeactivateAsync(string unitId, ReasonRequest request, int ifMatchVersion)
    {
        var unit = await FindAsync(unitId);
        CheckVersion(unit.Version, ifMatchVersion);

        if (await context.Users.AnyAsync(u => u.UnitId == unitId && u.Status == UserStatus.Active))
            throw new BusinessRuleException("Đơn vị còn nhân sự hoạt động, chưa thể ngừng sử dụng.");

        unit.Status = OrgStatus.Inactive;
        unit.UpdatedAt = DateTime.UtcNow;
        unit.Version++;

        await WriteAuditLog(unit.Id, "DEACTIVATE", null, null, request.Reason);
        await context.SaveChangesAsync();
        return ToDto(unit);
    }

    private async Task<Unit> FindAsync(string unitId)
    {
        return await context.Units.FirstOrDefaultAsync(u => u.Id == unitId)
            ?? throw new NotFoundException("Không tìm thấy đơn vị.");
    }

    private static void CheckVersion(int current, int ifMatch)
    {
        if (ifMatch <= 0) throw new PreconditionRequiredException("Thiếu If-Match.");
        if (current != ifMatch) throw new PreconditionFailedException("Dữ liệu đã bị thay đổi bởi người khác.");
    }

    private static UnitDto ToDto(Unit u)
    {
        return new(u.Id, u.Version, u.CreatedAt, u.UpdatedAt, u.Name, u.ParentId, u.ManagerId, u.Status.ToString().ToUpperInvariant());
    }
}
