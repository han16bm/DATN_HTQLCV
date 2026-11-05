using Identity.Api.Models.Dtos;
using Microsoft.EntityFrameworkCore;
using Shared.Commons.Exceptions;
using Shared.Entities;
using Shared.Entities.Authorization;
using Shared.Entities.Entities;
using Shared.Entities.Enums;

namespace Identity.Api.Services;

public record ProjectRolePolicyDto(string Role, List<string> Permissions, bool Editable, int Version, DateTime? UpdatedAt, RefDto? UpdatedBy);

public record UpdateProjectRolePolicyRequest
{
    [System.ComponentModel.DataAnnotations.Required]
    public List<string> Permissions { get; init; } = [];

    [System.ComponentModel.DataAnnotations.Required(ErrorMessage = "Vui lòng nhập thông tin bắt buộc"),
     System.ComponentModel.DataAnnotations.MaxLength(2000)]
    public string Reason { get; init; } = null!;
}

/// <summary>
/// Ma trận quyền theo vai trò dự án (ADMIN_MODULES §11): OWNER cố định đủ quyền; MANAGER/MEMBER chỉnh được.
/// Vai trò chưa chỉnh dùng mặc định (version 1, chưa có dòng); lần lưu đầu tạo dòng version 2.
/// Thay đổi có hiệu lực ngay ở request kế tiếp của mọi service (ProjectAccess đọc bảng mỗi request).
/// </summary>
public class ProjectRolePolicyService(ApplicationDbContext context, IHttpContextAccessor http)
    : BaseService<ProjectRolePolicy>(context, http)
{
    private static readonly ProjectRole[] Roles = [ProjectRole.Owner, ProjectRole.Manager, ProjectRole.Member];

    public async Task<List<ProjectRolePolicyDto>> ListAsync()
    {
        var rows = await context.ProjectRolePolicies.AsNoTracking().ToDictionaryAsync(r => r.Role);
        var matrix = await ProjectAccess.MatrixAsync(context);
        var names = await LoadDisplayNamesAsync(rows.Values.Select(r => r.UpdatedBy));
        return Roles.Select(role =>
        {
            var key = role.ToString().ToUpperInvariant();
            rows.TryGetValue(key, out var row);
            return new ProjectRolePolicyDto(key, matrix[role].ToList(), role != ProjectRole.Owner, row?.Version ?? 1,
                row?.UpdatedAt, row is null ? null : PersonRef(row.UpdatedBy, names));
        }).ToList();
    }

    public async Task<ProjectRolePolicyDto> UpdateAsync(string role, UpdateProjectRolePolicyRequest request, int ifMatchVersion)
    {
        if (!Enum.TryParse<ProjectRole>(role, true, out var parsed) || !Roles.Contains(parsed))
            throw new NotFoundException("Không tìm thấy vai trò dự án.");
        if (parsed == ProjectRole.Owner)
            throw new UnprocessableRuleException("Chủ dự án luôn có đủ quyền trong dự án của mình.") { Code = "ROLE_LOCKED" };
        var unknown = request.Permissions.Except(ProjectAccess.ProjectCodes).ToList();
        if (unknown.Count > 0)
            throw new ValidationException($"Mã quyền không thuộc phạm vi dự án: {string.Join(", ", unknown)}.", ["permissions"]);
        if (string.IsNullOrWhiteSpace(request.Reason))
            throw new ValidationException("Vui lòng nhập thông tin bắt buộc", ["reason"]);

        var key = parsed.ToString().ToUpperInvariant();
        var before = (await ProjectAccess.MatrixAsync(context))[parsed].ToList();
        var row = await context.ProjectRolePolicies.FirstOrDefaultAsync(r => r.Role == key);
        CheckVersion(row?.Version ?? 1, ifMatchVersion);
        var permissions = ProjectAccess.ProjectCodes.Where(request.Permissions.Contains).ToList();
        if (row is null)
        {
            row = new ProjectRolePolicy { Role = key, Permissions = permissions, Version = 2, UpdatedAt = DateTime.UtcNow };
            context.ProjectRolePolicies.Add(row);
        }
        else
        {
            row.Permissions = permissions;
            row.Version++;
            row.UpdatedAt = DateTime.UtcNow;
        }
        await WriteAuditLog(key, "UPDATE", new { permissions = before }, new { permissions }, request.Reason.Trim());
        await context.SaveChangesAsync();
        return (await ListAsync()).First(p => p.Role == key);
    }
}
