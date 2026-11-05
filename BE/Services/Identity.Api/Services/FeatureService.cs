using Identity.Api.Interfaces;
using Identity.Api.Models.Dtos;
using Identity.Api.Models.Requests;
using Microsoft.EntityFrameworkCore;
using Shared.Commons.Exceptions;
using Shared.Entities;
using Shared.Entities.Entities;

namespace Identity.Api.Services;

public class FeatureService(ApplicationDbContext context, IHttpContextAccessor httpContextAccessor)
    : BaseService<Feature>(context, httpContextAccessor), IFeatureService
{
    public async Task<List<FeatureDto>> ListAsync()
    {
        var features = await context.Features.AsNoTracking().OrderBy(f => f.SortOrder).ToListAsync();
        var names = await LoadDisplayNamesAsync(features.Select(f => f.UpdatedBy));
        return features.Select(f => ToDto(f, names)).ToList();
    }

    public async Task<FeatureDto> UpdateAsync(string code, FeaturePatchRequest request, int ifMatchVersion)
    {
        var feature = await context.Features.FirstOrDefaultAsync(f => f.Code == code)
            ?? throw new NotFoundException("Không tìm thấy mã quyền.");
        CheckVersion(feature.Version, ifMatchVersion);

        if (feature.IsGroup)
            throw new UnprocessableRuleException("Node nhóm chỉ để dựng cây, không bật/tắt được.");
        // Tắt PERMISSIONS_MANAGE rút quyền cả sysadmin — sẽ không còn ai bật lại được qua UI
        if (feature.Code == PermissionFeatures.PermissionsManage && request.IsActive == false)
            throw new UnprocessableRuleException("Không thể tắt mã PERMISSIONS_MANAGE vì sẽ không còn ai bật lại được.");

        var before = new { feature.IsActive };
        feature.IsActive = request.IsActive!.Value;
        feature.UpdatedAt = DateTime.UtcNow;
        feature.Version++;

        await WriteAuditLog(feature.Code, feature.IsActive ? "ACTIVATE" : "DEACTIVATE", before, new { feature.IsActive }, request.Reason);
        await context.SaveChangesAsync();
        return ToDto(feature, await LoadDisplayNamesAsync([feature.UpdatedBy]));
    }

    private static FeatureDto ToDto(Feature f, Dictionary<string, string> names)
    {
        return new FeatureDto(
            f.Code, f.Version, f.Name, f.Description, f.ParentCode, f.IsGroup, f.Scope, f.Path, f.Icon, f.SortOrder, f.IsActive,
            f.UpdatedAt, PersonRef(f.UpdatedBy, names));
    }
}
