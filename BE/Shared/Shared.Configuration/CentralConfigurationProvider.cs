using Microsoft.Extensions.Configuration;
using Npgsql;

namespace Shared.Configuration;

public class CentralConfigurationSource(string connectionString, string serviceType, TimeSpan reloadInterval) : IConfigurationSource
{
    public IConfigurationProvider Build(IConfigurationBuilder builder)
    {
        return new CentralConfigurationProvider(connectionString, serviceType, reloadInterval);
    }
}

/// <summary>
/// Nạp cấu hình từ bảng SystemConfigs (một cột Value) vào IConfiguration: dòng 'Global' trước, dòng theo service ghi đè.
/// Tự reload theo chu kỳ và chỉ phát OnReload khi dữ liệu thực sự đổi, để IOptionsMonitor/IConfiguration thấy giá trị mới
/// mà không cần khởi động lại. DB lỗi thì giữ dữ liệu đã nạp gần nhất (lần đầu thì rỗng) và chạy tiếp bằng file cấu hình.
/// </summary>
public sealed class CentralConfigurationProvider : ConfigurationProvider, IDisposable
{
    private const string UndefinedTable = "42P01";

    private readonly string _connectionString;
    private readonly string _serviceType;
    private readonly object _sync = new();
    private readonly Timer? _timer;

    public CentralConfigurationProvider(string connectionString, string serviceType, TimeSpan reloadInterval)
    {
        _connectionString = connectionString;
        _serviceType = serviceType;
        if (reloadInterval > TimeSpan.Zero)
            _timer = new Timer(_ => Reload(), null, reloadInterval, reloadInterval);
    }

    public string ServiceType => _serviceType;
    public DateTime? LastLoadedAt { get; private set; }
    public string? LastError { get; private set; }

    public override void Load()
    {
        var fresh = TryFetch();
        if (fresh is not null)
            Data = fresh;
    }

    /// <summary>Đọc lại DB ngay; phát OnReload nếu có thay đổi. Trả true khi đọc DB thành công.</summary>
    public bool Reload()
    {
        var fresh = TryFetch();
        if (fresh is null) return false;

        bool changed;
        lock (_sync)
        {
            changed = !SameContent(Data, fresh);
            if (changed) Data = fresh;
        }
        if (changed) OnReload();
        return true;
    }

    public void Dispose()
    {
        _timer?.Dispose();
    }

    private Dictionary<string, string?>? TryFetch()
    {
        try
        {
            var data = Fetch();
            LastLoadedAt = DateTime.UtcNow;
            LastError = null;
            return data;
        }
        catch (PostgresException ex) when (ex.SqlState == UndefinedTable)
        {
            // Chưa chạy migration tạo SystemConfigs — dùng tạm cấu hình file
            LastError = "Bảng SystemConfigs chưa tồn tại.";
            return new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase);
        }
        catch (Exception ex)
        {
            LastError = ex.Message;
            Console.Error.WriteLine($"[CentralConfig:{_serviceType}] Không đọc được cấu hình tập trung: {ex.Message}");
            return null;
        }
    }

    private Dictionary<string, string?> Fetch()
    {
        var global = new List<(string Key, string Value)>();
        var service = new List<(string Key, string Value)>();

        using var connection = new NpgsqlConnection(_connectionString);
        connection.Open();
        using var command = new NpgsqlCommand(
            """
            SELECT "Key", "Value", "ServiceType"
            FROM "SystemConfigs"
            WHERE "IsActive" AND ("ServiceType" = 'Global' OR "ServiceType" = @service)
            """,
            connection);
        command.Parameters.AddWithValue("service", _serviceType);
        using var reader = command.ExecuteReader();
        while (reader.Read())
        {
            var row = (reader.GetString(0), reader.GetString(1));
            if (string.Equals(reader.GetString(2), ConfigCatalog.Global, StringComparison.OrdinalIgnoreCase))
                global.Add(row);
            else
                service.Add(row);
        }

        var data = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase);
        foreach (var (key, value) in global.Concat(service))
            data[key] = value;
        return data;
    }

    private static bool SameContent(IDictionary<string, string?> current, Dictionary<string, string?> fresh)
    {
        if (current.Count != fresh.Count) return false;
        foreach (var (key, value) in fresh)
        {
            if (!current.TryGetValue(key, out var existing) || !string.Equals(existing, value, StringComparison.Ordinal))
                return false;
        }
        return true;
    }
}
