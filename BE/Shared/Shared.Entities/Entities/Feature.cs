using Shared.Entities.Auditing;

namespace Shared.Entities.Entities;

/// <summary>Danh mục mã quyền dạng cây (seed bằng migration). Node nhóm chỉ để dựng cây, không cấp được.</summary>
public class Feature : IUpdateStamped
{
    public string Code { get; set; } = null!;
    public int Version { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }

    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public string? ParentCode { get; set; }
    public bool IsGroup { get; set; }
    public string? Scope { get; set; }
    public string? Path { get; set; }
    public string? Icon { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
}
