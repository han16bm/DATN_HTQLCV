using Shared.Configuration;
using Shared.Entities.Entities;
using Shared.Entities.Enums;
using P = Shared.Entities.PermissionFeatures;

namespace Shared.Entities;

/// <summary>Dữ liệu seed qua HasData — giá trị cố định để migration sinh ra ổn định giữa các máy.</summary>
public static class SeedData
{
    public static readonly DateTime SeedAt = new(2026, 11, 3, 0, 0, 0, DateTimeKind.Utc);

    public const string AdminGroupId = "pg-admin";
    public const string ProjectManagerGroupId = "pg-pm";


    public static Feature[] Features()
    {
        return
        [
            Group("ADMIN", "Quản trị hệ thống", 10),
            Leaf(P.UsersManage, "ADMIN", "Quản lý người dùng", "/admin/users", 11),
            Leaf(P.OrganizationManage, "ADMIN", "Quản lý đơn vị và team", "/admin/organization", 12),
            Leaf(P.PermissionsManage, "ADMIN", "Quản lý nhóm quyền và phân quyền", "/admin/permission-groups", 13),
            Leaf(P.AuditView, "ADMIN", "Xem nhật ký hệ thống", "/admin/audit-logs", 14),
            Leaf(P.SettingsManage, "ADMIN", "Cấu hình hệ thống và IP whitelist", "/admin/settings", 15),
            Leaf(P.JobsManage, "ADMIN", "Giám sát và điều khiển job nền", "/admin/jobs", 16),
            Group("WORK", "Dự án và công việc", 20),
            Leaf(P.ProjectCreate, "WORK", "Tạo dự án và giữ vai trò quản lý dự án", "/projects/new", 21),
            Group("ANALYTICS", "Phân tích", 30),
            Leaf(P.AnalyticsView, "ANALYTICS", "Xem phân tích mọi dự án", "/analytics", 31)
        ];
    }

    public static PermissionGroup[] PermissionGroups()
    {
        return
        [
            new PermissionGroup
            {
                Id = AdminGroupId, Code = "ADMINISTRATORS", Name = "Quản trị viên", IsSystem = true,
                Status = OrgStatus.Active, Version = 1, CreatedAt = SeedAt, UpdatedAt = SeedAt,
                Features = [P.UsersManage, P.OrganizationManage, P.PermissionsManage, P.AuditView, P.SettingsManage, P.JobsManage, P.AnalyticsView]
            },
            new PermissionGroup
            {
                Id = ProjectManagerGroupId, Code = "PROJECT_MANAGERS", Name = "Quản lý dự án (Leader/PM)", IsSystem = true,
                Status = OrgStatus.Active, Version = 1, CreatedAt = SeedAt, UpdatedAt = SeedAt,
                Features = [P.ProjectCreate]
            }
        ];
    }

    /// <summary>Seed SystemConfigs từ ConfigCatalog. Id cố định theo thứ tự để migration ổn định.</summary>
    public static SystemConfig[] SystemConfigs()
    {
        return ConfigCatalog.Known.Select((d, i) => new SystemConfig
        {
            Id = $"cfg-{i + 1:D3}",
            Key = d.Key,
            ServiceType = d.ServiceType,
            Group = d.Group,
            Name = d.Name,
            Description = d.Description,
            DataType = d.DataType,
            Value = d.InitialValue,
            IsActive = true,
            Version = 1,
            CreatedAt = SeedAt,
            UpdatedAt = SeedAt
        }).ToArray();
    }

    private static Feature Group(string code, string name, int sortOrder)
    {
        return new Feature { Code = code, Name = name, IsGroup = true, SortOrder = sortOrder, IsActive = true, Version = 1, UpdatedAt = SeedAt };
    }

    private static Feature Leaf(string code, string parentCode, string name, string path, int sortOrder)
    {
        return new Feature
        {
            Code = code, ParentCode = parentCode, Name = name, Scope = "SYSTEM", Path = path,
            SortOrder = sortOrder, IsActive = true, Version = 1, UpdatedAt = SeedAt
        };
    }
}
