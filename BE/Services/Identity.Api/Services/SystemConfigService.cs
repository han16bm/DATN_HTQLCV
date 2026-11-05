using Identity.Api.Interfaces;
using Identity.Api.Models.Dtos;
using Identity.Api.Models.Queries;
using Identity.Api.Models.Requests;
using Microsoft.EntityFrameworkCore;
using Shared.Commons.Exceptions;
using Shared.Commons.Utils;
using Shared.Configuration;
using Shared.Entities;
using Shared.Entities.Authorization;
using Shared.Entities.Entities;

namespace Identity.Api.Services;

/// <summary>
/// Quản trị bảng SystemConfigs (cấu hình tập trung, một cột Value). Sau mỗi lần ghi, nạp lại cấu hình của chính
/// Identity.Api ngay; các service khác tự nhận giá trị mới sau tối đa CentralConfig:ReloadSeconds.
/// </summary>
public class SystemConfigService(
    ApplicationDbContext context,
    IHttpContextAccessor httpContextAccessor,
    ICentralConfigReloader reloader,
    IConfiguration configuration)
    : BaseService<SystemConfig>(context, httpContextAccessor), ISystemConfigService
{
    public async Task<List<SystemConfigDto>> ListAsync(SystemConfigQuery query)
    {
        var q = context.SystemConfigs.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(query.ServiceType)) q = q.Where(c => c.ServiceType == query.ServiceType);
        if (!string.IsNullOrWhiteSpace(query.Group)) q = q.Where(c => c.Group == query.Group);
        if (!string.IsNullOrWhiteSpace(query.Q))
        {
            var term = query.Q.Trim().ToLower();
            q = q.Where(c => c.Key.ToLower().Contains(term) || c.Name.ToLower().Contains(term));
        }

        var rows = await q.OrderBy(c => c.ServiceType).ThenBy(c => c.Group).ThenBy(c => c.Key).ToListAsync();
        var names = await LoadDisplayNamesAsync(rows.SelectMany(c => new[] { c.CreatedBy, c.UpdatedBy }));
        return rows.Select(c => ToDto(c, names)).ToList();
    }

    public async Task<SystemConfigDto> CreateAsync(SystemConfigCreateRequest request)
    {
        var key = request.Key.Trim();
        var serviceType = NormalizeServiceType(request.ServiceType);
        var dataType = request.DataType.Trim().ToUpperInvariant();

        if (!ConfigCatalog.IsValidKeyFormat(key))
            throw new ValidationException("Key phải là đường dẫn cấu hình dạng Section:SubKey (chữ, số, dấu chấm, gạch dưới).", ["key"]);
        var definition = ConfigCatalog.Find(key, serviceType);
        // Secret chỉ được lưu qua key đã khai báo Secret trong ConfigCatalog (mã hoá, không hiển thị lại).
        if (ConfigCatalog.IsForbiddenKey(key) && definition is null)
            throw new ValidationException("Không được lưu secret, connection string hay cấu hình hạ tầng trong cấu hình tập trung.", ["key"]);
        if (!ConfigCatalog.DataTypes.Contains(dataType))
            throw new ValidationException("Kiểu dữ liệu phải là INT, BOOL hoặc STRING.", ["dataType"]);

        if (definition is not null && definition.DataType != dataType)
            throw new ValidationException($"Key này phải có kiểu {definition.DataType}.", ["dataType"]);

        if (await context.SystemConfigs.AnyAsync(c => c.Key.ToLower() == key.ToLower() && c.ServiceType == serviceType))
            throw new BusinessRuleException($"Key '{key}' đã tồn tại cho {serviceType}.");

        var value = Protect(definition, NormalizeValue(dataType, request.Value, definition));
        if (definition?.Key == ConfigCatalog.AdminIpWhitelistEnabled && value == "true")
            await EnsureWhitelistKeepsCurrentIpAsync();

        var now = DateTime.UtcNow;
        var config = new SystemConfig
        {
            Id = GuidGenerator.NewId(),
            Key = key,
            ServiceType = serviceType,
            Group = request.Group.Trim().ToUpperInvariant(),
            Name = request.Name.Trim(),
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            DataType = dataType,
            Value = value,
            IsActive = true,
            UpdatedBy = CurrentUserId(),
            CreatedAt = now,
            UpdatedAt = now,
            Version = 1
        };

        await context.SystemConfigs.AddAsync(config);
        await WriteAuditLog(config.Id, "CREATE", null, Snapshot(config));
        await context.SaveChangesAsync();
        reloader.Reload();

        return ToDto(config, await LoadDisplayNamesAsync([config.CreatedBy, config.UpdatedBy]));
    }

    public async Task<SystemConfigDto> UpdateAsync(string id, SystemConfigPatchRequest request, int ifMatchVersion)
    {
        var config = await context.SystemConfigs.FirstOrDefaultAsync(c => c.Id == id)
            ?? throw new NotFoundException("Không tìm thấy cấu hình.");
        CheckVersion(config.Version, ifMatchVersion);

        var definition = ConfigCatalog.Find(config.Key, config.ServiceType);
        var before = Snapshot(config);

        // Secret: để trống = giữ giá trị cũ (FE không bao giờ nhận lại giá trị thật để gửi lên).
        if (request.Value is not null && !(definition?.Secret == true && string.IsNullOrEmpty(request.Value)))
            config.Value = Protect(definition, NormalizeValue(config.DataType, request.Value, definition));
        if (request.Name is not null)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
                throw new ValidationException("Tên không được để trống.", ["name"]);
            config.Name = request.Name.Trim();
        }
        if (request.Description is not null)
            config.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        if (request.IsActive.HasValue)
        {
            if (!request.IsActive.Value && definition?.Required == true)
                throw new UnprocessableRuleException($"Không thể tắt cấu hình bắt buộc '{config.Key}'.");
            config.IsActive = request.IsActive.Value;
        }

        // Bật whitelist (hoặc bật lại dòng cờ đang true), hay chuyển phạm vi sang SYSTEM khi whitelist đang bật,
        // phải còn cho chính IP người thao tác đi qua
        if (config.IsActive
            && (IsKey(config, ConfigCatalog.AdminIpWhitelistEnabled) && config.Value == "true"
                || IsKey(config, ConfigCatalog.IpWhitelistScope) && config.Value == ConfigCatalog.IpScopeSystem && await IsWhitelistEnabledAsync()))
            await EnsureWhitelistKeepsCurrentIpAsync();

        config.UpdatedBy = CurrentUserId();
        config.UpdatedAt = DateTime.UtcNow;
        config.Version++;

        await WriteAuditLog(config.Id, "UPDATE", before, Snapshot(config), request.Reason);
        await context.SaveChangesAsync();
        reloader.Reload();

        return ToDto(config, await LoadDisplayNamesAsync([config.CreatedBy, config.UpdatedBy]));
    }

    /// <summary>Chống tự khoá (§5.3): sau thay đổi, IP người thao tác phải còn khớp ít nhất một entry Active.</summary>
    public static void EnsureNotSelfLockout(IEnumerable<string> activeCidrs, HttpContext? http)
    {
        var ip = http?.Connection.RemoteIpAddress;
        if (!IpRules.AnyMatches(activeCidrs, ip))
            throw new UnprocessableRuleException($"Thao tác này sẽ chặn chính IP hiện tại của bạn ({IpRules.Normalize(ip)}).");
    }

    private static bool IsKey(SystemConfig config, string key)
    {
        return string.Equals(config.Key, key, StringComparison.OrdinalIgnoreCase);
    }

    // Đọc thẳng DB thay vì IConfiguration (reload theo chu kỳ) — kiểm tra chống tự khoá phải theo giá trị mới nhất
    private async Task<bool> IsWhitelistEnabledAsync()
    {
        return await context.SystemConfigs.AsNoTracking().AnyAsync(c =>
            c.Key == ConfigCatalog.AdminIpWhitelistEnabled && c.ServiceType == ConfigCatalog.Global && c.IsActive && c.Value == "true");
    }

    private async Task EnsureWhitelistKeepsCurrentIpAsync()
    {
        var cidrs = await context.IpWhitelistEntries.AsNoTracking().Where(e => e.IsActive).Select(e => e.Cidr).ToListAsync();
        EnsureNotSelfLockout(cidrs, httpContextAccessor.HttpContext);
    }

    private static string NormalizeServiceType(string raw)
    {
        var match = ConfigCatalog.ServiceTypes.FirstOrDefault(s => string.Equals(s, raw.Trim(), StringComparison.OrdinalIgnoreCase));
        return match ?? throw new ValidationException(
            $"ServiceType phải là một trong: {string.Join(", ", ConfigCatalog.ServiceTypes)}.", ["serviceType"]);
    }

    private static string NormalizeValue(string dataType, string raw, ConfigDefinition? definition)
    {
        if (!ConfigCatalog.TryNormalize(dataType, raw, definition, out var value, out var error))
            throw new ValidationException(error!, ["value"]);
        return value;
    }

    private string Protect(ConfigDefinition? definition, string value)
    {
        if (definition?.Secret != true || value.Length == 0) return value;
        var root = ConfigSecretBox.RootSecret(configuration)
            ?? throw new UnprocessableRuleException("Chưa có khoá gốc (CentralConfig:SecretKey hoặc Jwt:SigningKey) để mã hoá secret.");
        return ConfigSecretBox.Protect(value, root);
    }

    // Audit không ghi secret (kể cả bản mã), chỉ ghi đã đặt hay chưa.
    private static object Snapshot(SystemConfig c)
    {
        var secret = ConfigCatalog.Find(c.Key, c.ServiceType)?.Secret == true;
        return new
        {
            c.Key, c.ServiceType, c.Group, c.Name, c.Description, c.DataType,
            Value = secret ? (string.IsNullOrEmpty(c.Value) ? "" : "(đã đặt)") : c.Value,
            c.IsActive
        };
    }

    private static SystemConfigDto ToDto(SystemConfig c, Dictionary<string, string> names)
    {
        var definition = ConfigCatalog.Find(c.Key, c.ServiceType);
        var secret = definition?.Secret == true;
        return new SystemConfigDto(
            c.Id, c.Version, c.Key, c.ServiceType, c.Group, c.Name, c.Description, c.DataType, secret ? "" : c.Value, c.IsActive,
            definition is not null, definition?.RequiresRestart ?? false, definition?.MinValue, definition?.MaxValue,
            definition?.AllowedValues, c.CreatedAt, c.UpdatedAt, PersonRef(c.CreatedBy, names), PersonRef(c.UpdatedBy, names),
            secret, secret && !string.IsNullOrEmpty(c.Value));
    }
}
