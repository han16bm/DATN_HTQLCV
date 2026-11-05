using Shared.Entities.Auditing;

namespace Shared.Entities.Entities;

/// <summary>
/// Ma trận quyền theo vai trò dự án do quản trị chỉnh (MANAGER, MEMBER). OWNER luôn đủ quyền và không lưu ở đây;
/// vai trò chưa có dòng thì dùng mặc định ProjectAccess.DefaultMatrix.
/// </summary>
public class ProjectRolePolicy : IUpdateStamped
{
    public string Role { get; set; } = null!; // MANAGER | MEMBER
    public List<string> Permissions { get; set; } = [];
    public int Version { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
}
