using Identity.Api.Models.Dtos;
using Identity.Api.Models.Queries;
using Identity.Api.Models.Requests;
using Shared.Commons.Models;

namespace Identity.Api.Interfaces;

public interface IUnitService
{
    Task<PagedResult<UnitDto>> ListAsync(UnitQuery query);
    Task<UnitDto> GetAsync(string unitId);
    Task<UnitDto> CreateAsync(UnitCreateRequest request);
    Task<UnitDto> UpdateAsync(string unitId, UnitPatchRequest request, int ifMatchVersion);
    Task<UnitDto> DeactivateAsync(string unitId, ReasonRequest request, int ifMatchVersion);
}
