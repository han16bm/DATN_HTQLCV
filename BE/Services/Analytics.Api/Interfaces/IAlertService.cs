using Analytics.Api.Models.Dtos;
using Analytics.Api.Models.Queries;
using Analytics.Api.Models.Requests;
using Shared.Commons.Models;

namespace Analytics.Api.Interfaces;

public interface IAlertService
{
    Task<PagedResult<AlertDto>> ListAsync(AlertQuery query);
    Task<AlertDto> GetAsync(string alertId);
    Task<AlertDto> UpdateAsync(string alertId, UpdateAlertRequest request, string? ifMatch);
}
