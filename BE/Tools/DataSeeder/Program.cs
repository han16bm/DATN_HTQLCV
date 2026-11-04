using System.Text.Json;
using DataSeeder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Shared.Configuration;
using Shared.Entities;

// Nạp toàn bộ dữ liệu mẫu (cùng bộ seed với MSW mock của FE: FE/src/mocks/data.json) vào DB thật.
//
//   dotnet run --project BE/Tools/DataSeeder -- [--data <đường dẫn data.json>] [--reset] [--uploads <thư mục>]
//
// Connection string lấy từ BE/appsettings.Shared.json (giống mọi service) hoặc ConnectionStrings__DefaultConnection.
// Mặc định từ chối chạy khi DB đã có tài khoản; --reset xoá dữ liệu nghiệp vụ trước khi nạp
// (giữ nguyên Features, PermissionGroups hệ thống, SystemConfigs, BackgroundJobs do migration/khởi động tạo).

var options = SeedOptions.Parse(args);

var configuration = new ConfigurationBuilder()
    .AddJsonFile(options.SharedSettingsPath, optional: true)
    .AddEnvironmentVariables()
    .Build();
var connectionString = configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrWhiteSpace(connectionString))
{
    Console.Error.WriteLine($"Thiếu ConnectionStrings:DefaultConnection (không thấy trong {options.SharedSettingsPath}).");
    return 1;
}

if (!File.Exists(options.DataPath))
{
    Console.Error.WriteLine($"Không tìm thấy file dữ liệu: {options.DataPath}");
    return 1;
}

var dbOptions = new DbContextOptionsBuilder<ApplicationDbContext>().UseNpgsql(connectionString).Options;
await using var context = new ApplicationDbContext(dbOptions);

var pending = (await context.Database.GetPendingMigrationsAsync()).ToList();
if (pending.Count > 0)
{
    Console.Error.WriteLine($"DB còn {pending.Count} migration chưa áp dụng ({string.Join(", ", pending)}). Chạy `dotnet ef database update` trước.");
    return 1;
}

if (await context.Users.AnyAsync())
{
    if (!options.Reset)
    {
        Console.Error.WriteLine("DB đã có dữ liệu tài khoản. Chạy lại với --reset để xoá dữ liệu nghiệp vụ rồi nạp lại.");
        return 1;
    }
    await Seeder.ResetAsync(context);
    Console.WriteLine("Đã xoá dữ liệu nghiệp vụ cũ.");
}

using var document = JsonDocument.Parse(await File.ReadAllTextAsync(options.DataPath));
var summary = await new Seeder(context, document.RootElement, options.UploadsDir).SeedAsync();

Console.WriteLine("Đã nạp dữ liệu mẫu:");
foreach (var (table, count) in summary)
    Console.WriteLine($"  {table,-24} {count,5}");
Console.WriteLine($"Đăng nhập bằng username trong data.json (admin, minh, lan, huy, other) với mật khẩu seed của mock.");
return 0;

namespace DataSeeder
{
    public record SeedOptions(string DataPath, string SharedSettingsPath, string UploadsDir, bool Reset)
    {
        public static SeedOptions Parse(string[] args)
        {
            var beRoot = LocateBeRoot();
            var dataPath = Path.GetFullPath(Path.Combine(beRoot, "..", "FE", "src", "mocks", "data.json"));
            var uploads = Path.Combine(beRoot, "Services", "Tasks.Api", "wwwroot", "uploads");
            var reset = false;

            for (var i = 0; i < args.Length; i++)
            {
                switch (args[i])
                {
                    case "--data":
                        dataPath = Path.GetFullPath(args[++i]);
                        break;
                    case "--uploads":
                        uploads = Path.GetFullPath(args[++i]);
                        break;
                    case "--reset":
                        reset = true;
                        break;
                    default:
                        throw new ArgumentException($"Tham số không hợp lệ: {args[i]}");
                }
            }

            var shared = Environment.GetEnvironmentVariable(CentralConfigurationExtensions.SharedSettingsPathVariable)
                ?? Path.Combine(beRoot, CentralConfigurationExtensions.SharedSettingsFileName);
            return new SeedOptions(dataPath, shared, uploads, reset);
        }

        // Thư mục BE là nơi chứa DATN.slnx — tìm ngược từ thư mục làm việc và thư mục chạy
        private static string LocateBeRoot()
        {
            foreach (var start in new[] { Directory.GetCurrentDirectory(), AppContext.BaseDirectory })
            {
                for (var dir = new DirectoryInfo(start); dir is not null; dir = dir.Parent)
                {
                    if (File.Exists(Path.Combine(dir.FullName, "DATN.slnx"))) return dir.FullName;
                    var nested = Path.Combine(dir.FullName, "BE");
                    if (File.Exists(Path.Combine(nested, "DATN.slnx"))) return nested;
                }
            }
            throw new InvalidOperationException("Không xác định được thư mục BE (chứa DATN.slnx).");
        }
    }
}
