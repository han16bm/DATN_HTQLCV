namespace Identity.Api.Models.Dtos;

public record TeamDto(
    string Id,
    int Version,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    string Name,
    string UnitId,
    List<string> MemberIds,
    string Status,
    RefDto? CreatedBy,
    RefDto? UpdatedBy,
    // Trường cho bảng danh sách nhóm (teamRowSchema của FE)
    EntityLabelDto Unit,
    int MemberCount);
