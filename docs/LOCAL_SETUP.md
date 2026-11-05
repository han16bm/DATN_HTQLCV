# Hướng dẫn cấu hình và chạy DATN trên máy cá nhân

Hướng dẫn này dành cho collaborator checkout branch có tích hợp phân tích LLM. Các lệnh giả định PowerShell đang mở tại root repo `DATN`. Giá trị secret, connection string và dữ liệu thử nghiệm là riêng của từng môi trường; **không điền giá trị thật vào file này, commit vào Git hoặc gửi qua chat**. Chi tiết migration/database xem [DATABASE.md](./DATABASE.md); riêng cách dùng Gemini xem [LLM_ANALYSIS.md](../FE/fe-specs/rules/LLM_ANALYSIS.md).

## 1. Chọn nơi chạy PostgreSQL

### Dùng database chung trên máy khác

Đây là lựa chọn phù hợp khi nhóm đã có một máy/database dùng chung:

- Đảm bảo máy của bạn kết nối được tới máy chủ PostgreSQL qua mạng nội bộ/VPN.
- Xin người quản lý database cung cấp host, port, database name, username, password và thông tin TLS qua kênh bảo mật.
- Không chạy Docker hoặc DataSeeder trên database chung.
- Chỉ người được nhóm chỉ định mới áp migration vào database chung. Kiểm tra backup và thống nhất thời điểm trước khi thay đổi schema.

### Dùng Docker local để thử nghiệm

Docker chỉ tạo database riêng trên máy hiện tại, không phải database nhóm dùng chung. Cần cài và khởi động Docker Desktop trước:

```powershell
docker compose up -d db
docker exec datn-postgres pg_isready -U datn -d datn
```

Kết quả kiểm tra cần có `accepting connections`. Docker Compose tạo database `datn`, user `datn`, password dev-only `datn_dev_only`, host port `55432`.

## 2. Cấu hình BE local

Từ root repo, tạo file riêng nếu chưa có:

```powershell
if (-not (Test-Path BE\appsettings.Shared.json)) {
    Copy-Item BE\appsettings.Shared.example.json BE\appsettings.Shared.json
}
notepad BE\appsettings.Shared.json
```

Điền các giá trị phù hợp vào `BE\appsettings.Shared.json`:

| Key | Nguồn/ý nghĩa |
|---|---|
| `ConnectionStrings:DefaultConnection` | Connection string của database mà nhóm cho phép dùng. Với Docker local: `Host=localhost;Port=55432;Database=datn;Username=datn;Password=datn_dev_only;SSL Mode=Disable`. Với database khác, dùng thông tin do quản trị viên cung cấp. |
| `Jwt:SigningKey` | Chuỗi ngẫu nhiên tối thiểu 32 ký tự. Dùng **cùng một giá trị trên mọi service và Gateway của môi trường đó**, nếu không token đăng nhập sẽ không hợp lệ khi được chuyển tiếp. |
| `CentralConfig:ReloadSeconds` | Có thể để mặc định `30`. |
| `CentralConfig:SecretKey` | Tuỳ chọn. Nếu dùng secret lưu trong `SystemConfigs`, cần cùng giá trị ổn định ở các lần chạy; nếu không khai báo thì ứng dụng dùng `Jwt:SigningKey` làm khóa gốc mã hóa. |

Tạo JWT signing key ngẫu nhiên bằng PowerShell nếu cần:

```powershell
$bytes = New-Object byte[] 48
$rng = [Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
$jwtKey = [Convert]::ToBase64String($bytes)
$rng.Dispose()
$jwtKey
```

Copy giá trị vừa in vào `Jwt:SigningKey`, rồi lưu file. File `BE\appsettings.Shared.json` đã được Git ignore; không force-add hoặc commit file này. Các secret nên được quản lý riêng theo môi trường, không tái sử dụng key local ở production.

## 3. Cấu hình Gemini API key

Tạo API key trong [Google AI Studio](https://aistudio.google.com/apikey). Tại root repo, chọn Gemini và model:

```powershell
dotnet user-secrets set "Analytics:Provider" "Gemini" --project BE\Services\Analytics.Api\Analytics.Api.csproj
dotnet user-secrets set "Analytics:Gemini:Model" "gemini-3.8-flash" --project BE\Services\Analytics.Api\Analytics.Api.csproj
```

Nhập API key mà không ghi trực tiếp vào lệnh hoặc PowerShell history:

```powershell
$secure = Read-Host "Gemini API key" -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try {
    $apiKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
    dotnet user-secrets set "Analytics:Gemini:ApiKey" $apiKey --project BE\Services\Analytics.Api\Analytics.Api.csproj
}
finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
    Remove-Variable apiKey, secure -ErrorAction SilentlyContinue
}
```

Các key LLM dành cho local:

| Key | Giá trị |
|---|---|
| `Analytics:Provider` | `Gemini` |
| `Analytics:Gemini:ApiKey` | API key riêng của máy/môi trường, lưu bằng User Secrets |
| `Analytics:Gemini:Model` | Model được API key cho phép; hướng dẫn hiện dùng `gemini-3.8-flash` |

User Secrets gắn với project `Analytics.Api`, không được chia sẻ qua Git. Nếu provider hoặc API key thay đổi, khởi động lại `Analytics.Api`. Tránh dùng `dotnet user-secrets list` khi chia sẻ màn hình vì lệnh hiển thị giá trị secret.

Để quay lại provider mặc định Anthropic, cấu hình API key Anthropic hợp lệ và bỏ selector local:

```powershell
dotnet user-secrets remove "Analytics:Provider" --project BE\Services\Analytics.Api\Analytics.Api.csproj
```

## 4. Cài công cụ và cập nhật schema

Đảm bảo đã cài .NET 8 SDK. Nếu máy chưa có EF CLI:

```powershell
dotnet tool install --global dotnet-ef --version 8.0.20
```

Chỉ chạy migration khi database đã sẵn sàng và bạn được phép cập nhật schema. Migration cần cho cấu hình Anthropic tập trung; Gemini local dùng User Secrets nhưng vẫn cần schema Analytics mới nhất.

```powershell
Set-Location BE
dotnet ef database update --project Shared\Shared.Entities --startup-project Services\Identity.Api --context ApplicationDbContext
Set-Location ..
```

**Database chung:** trước khi chạy lệnh, xác nhận với người quản lý DB vì migration thay đổi schema của tất cả service. Chạy một lần cho mỗi database, không phải mỗi collaborator.

**Docker local mới:** có thể nạp dữ liệu mẫu sau migration:

```powershell
dotnet run --project Tools\DataSeeder
```

DataSeeder lấy dữ liệu từ `FE\src\mocks\data.json`, tài khoản và nghiệp vụ là dữ liệu mẫu. Không chạy trên database chung hoặc database có dữ liệu cần giữ. Không thêm `--reset` trừ khi chủ động muốn xoá dữ liệu nghiệp vụ của database local đó.

## 5. Chạy backend

Mở một terminal riêng cho từng tiến trình. Từ root repo, chạy:

```powershell
dotnet run --project BE\Services\Identity.Api
```

```powershell
dotnet run --project BE\Services\Projects.Api
```

```powershell
dotnet run --project BE\Services\Tasks.Api
```

```powershell
dotnet run --project BE\Services\Analytics.Api
```

```powershell
dotnet run --project BE\Gateway
```

Đợi các tiến trình khởi động thành công và giữ terminal mở. Các cổng development hiện dùng: Identity `5101`, Projects `5102`, Tasks `5103`, Analytics `5104`, Gateway `5000`.

## 6. Chạy FE với backend thật

Trong terminal khác:

```powershell
Set-Location FE
npm ci
```

Mở `FE\.env`, đổi cấu hình từ MSW sang Gateway:

```env
NEXT_PUBLIC_API_MODE=http
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
```

Khởi động hoặc khởi động lại FE để nạp `.env`:

```powershell
npm run dev
```

Mở địa chỉ local mà Next.js in ra, đăng nhập bằng tài khoản được cấp hoặc tài khoản seed (chỉ trên DB test), rồi vào **Phân tích → Nguy cơ trễ hạn/Khối lượng/Điểm nghẽn/Tổng hợp**. Mở chi tiết một kết quả để hệ thống tạo job diễn giải; khi thành công sẽ thấy tên model `Google Gemini (...)`.

## 7. Kiểm tra và xử lý lỗi

Chạy test adapter (không gọi Gemini thật):

```powershell
dotnet test BE\Services\Analytics.Api.Tests\Analytics.Api.Tests.csproj
```

Nếu job báo lỗi, xem terminal `Analytics.Api`:

- `LLM_NOT_CONFIGURED`: xác nhận `Analytics:Provider` và `Analytics:Gemini:ApiKey` đã lưu cho đúng project, sau đó restart service.
- `PROVIDER_UNAVAILABLE` hoặc timeout: kiểm tra Internet/proxy và trạng thái Gemini API.
- Lỗi xác thực/model: xác nhận key còn hiệu lực và model khả dụng với key đó.
- DB connection failure: kiểm tra VPN/firewall, host/port, TLS và quyền DB.
- FE quay về mock: kiểm tra `FE\.env` có `NEXT_PUBLIC_API_MODE=http`, rồi restart Next.js.

Không gửi API key, password DB, JWT key hoặc nội dung `appsettings.Shared.json` trong ticket/log/chat. Snapshot gửi tới Gemini có thể chứa evidence label/tiêu đề công việc; chỉ dùng dữ liệu được tổ chức cho phép xử lý qua Google.
