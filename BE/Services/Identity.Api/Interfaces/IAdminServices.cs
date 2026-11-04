using Identity.Api.Models.Dtos;
using Identity.Api.Models.Queries;
using Identity.Api.Models.Requests;
using Shared.Commons.Models;

namespace Identity.Api.Interfaces;

public interface IFeatureService
{
    Task<List<FeatureDto>> ListAsync();
    Task<FeatureDto> UpdateAsync(string code, FeaturePatchRequest request, int ifMatchVersion);
}

public interface IAuditLogService
{
    Task<PagedResult<AuditLogRowDto>> ListAsync(AuditLogQuery query);
    Task<AuditLogDto> GetAsync(string id);
    Task<List<string>> ListEntityTypesAsync();
}

public interface ISystemConfigService
{
    Task<List<SystemConfigDto>> ListAsync(SystemConfigQuery query);
    Task<SystemConfigDto> CreateAsync(SystemConfigCreateRequest request);
    Task<SystemConfigDto> UpdateAsync(string id, SystemConfigPatchRequest request, int ifMatchVersion);
}

public interface IIpWhitelistService
{
    Task<IpWhitelistDto> GetAsync();
    Task<IpWhitelistEntryDto> CreateAsync(IpWhitelistEntryCreateRequest request);
    Task<IpWhitelistEntryDto> UpdateAsync(string id, IpWhitelistEntryPatchRequest request, int ifMatchVersion);
    Task DeleteAsync(string id, int ifMatchVersion);
}

public interface IIpAccessLogService
{
    Task<PagedResult<IpAccessLogDto>> ListAsync(IpAccessLogQuery query);
    Task<IpAccessLogAllowResultDto> AllowAsync(string id, IpAccessLogAllowRequest request, int ifMatchVersion);
    Task<IpAccessLogDto> DismissAsync(string id, IpAccessLogDismissRequest request, int ifMatchVersion);
}
