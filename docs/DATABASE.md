# Database

Cập nhật lần cuối: 2026-11-03.

## 1. Tổng quan

- Engine: **PostgreSQL 16**.
- Một database duy nhất (`datn`) dùng chung cho cả 4 service BE (`Identity.Api`, `Projects.Api`, `Tasks.Api`, `Analytics.Api`) qua một `ApplicationDbContext` (`BE/Shared/Shared.Entities`). Đây là lựa chọn "shared database" hiện tại giữa các microservice — không phải mỗi service một DB riêng.
- EF Core migrations, provider `Npgsql.EntityFrameworkCore.PostgreSQL`. Migration hiện có: `InitialCreate`, `AddUserTokenVersion` (thêm cột `Users.TokenVersion`, xem mục 2), `AddPermissionGroups`, `AdminModulesAndDynamicRbac` (phân quyền động thay `SystemRole`, nhật ký, job nền, IP whitelist — xem `docs/ADMIN_MODULES.md`; chuyển `SystemRole='Admin'` → `IsSysAdmin` + nhóm `pg-admin`, `'Manager'` → nhóm `pg-pm` rồi mới xoá cột), `CentralSystemConfigs` (thay `SystemSettings` bằng bảng cấu hình tập trung `SystemConfigs`, một cột giá trị), `AddAuditStamps` (thêm `CreatedBy`/`UpdatedBy` cho 12 bảng, backfill từ `AuditLogs` — xem mục 4).
- **DB dùng chung hiện tại: Neon PostgreSQL** (cloud, `neondb`, đã migrate đủ 5 migration và nạp dữ liệu mẫu ngày 03/11/2026). Connection string nằm trong `BE/appsettings.Shared.json` (gitignore, xem mục 5). Vẫn có thể chạy Postgres cục bộ bằng Docker (mục 2) bằng cách trỏ connection string về `localhost:55432`.
- Với DB riêng của từng người: dùng chung schema qua migration trong repo. Khi ai đó đổi entity/migration, mọi người phải `git pull` rồi tự chạy lại bước áp migration (mục 3) trước khi chạy service — đừng giả định schema máy mình đang khớp code mới nhất.

## 2. Đứng DB bằng Docker (khuyến nghị cho mọi máy)

File `docker-compose.yml` ở root repo định nghĩa 1 service `db` (Postgres 16, image `postgres:16-alpine`).

```bash
docker compose up -d db
```

Mặc định: database `datn`, user `datn`, password `datn_dev_only` (dev-only, không dùng cho prod), map ra cổng host **55432** (không phải 5432 mặc định).

> **Vì sao cổng 55432 chứ không phải 5432**: nếu máy bạn đã cài Postgres native trước đó (rất hay gặp trên máy dev), nó thường tự chiếm cổng 5432 ở tầng hệ điều hành. Khi đó ứng dụng .NET kết nối "localhost:5432" sẽ vô tình nối vào Postgres native đó thay vì container, và báo sai mật khẩu dù container hoàn toàn đúng — đây là lỗi thực tế đã gặp khi dựng lần đầu. Dùng cổng lẻ 55432 để tránh việc này. Nếu máy bạn chắc chắn không có gì chiếm 5432, có thể đổi lại cả hai nơi (docker-compose.yml + `BE/appsettings.Shared.json`) nhưng không bắt buộc.

Kiểm tra container đã sẵn sàng:
```bash
docker exec datn-postgres pg_isready -U datn
```

## 3. Áp schema (chạy SQL/migration) — làm trước khi chạy service, và mỗi khi pull code có đổi entity

```bash
cd BE
dotnet ef database update --project Shared/Shared.Entities --startup-project Services/Identity.Api --context ApplicationDbContext
```

- Lệnh này cần `dotnet-ef` CLI: `dotnet tool install --global dotnet-ef` nếu chưa có.
- Dùng `--startup-project Services/Identity.Api` chỉ vì cần một project có thể chạy được để EF tools đọc cấu hình/connection string — không liên quan gì đến nghiệp vụ Identity. Kết quả migration áp dụng cho toàn bộ schema chung, không riêng gì Identity.
- EF tools dựng host của Identity.Api nên đọc connection string và `Jwt:SigningKey` từ `BE/appsettings.Shared.json` như lúc chạy thật. Nếu chưa có file đó (máy mới), set tạm biến môi trường:
  ```bash
  Jwt__SigningKey="bat-ky-chuoi-du-dai" ConnectionStrings__DefaultConnection="Host=..." dotnet ef database update ...
  ```
- Khi DB chưa có bảng `SystemConfigs`, các tiến trình in cảnh báo `[CentralConfig:...] Thiếu cấu hình bắt buộc: Jwt:Issuer...` — bình thường cho lần migrate đầu, hết sau khi migrate.
- Với Neon nên migrate qua host **không** có `-pooler` nếu gặp lỗi do PgBouncer; runtime dùng host `-pooler` bình thường.

### Nạp dữ liệu mẫu đầy đủ

```bash
cd BE
dotnet run --project Tools/DataSeeder              # DB trống
dotnet run --project Tools/DataSeeder -- --reset   # xoá dữ liệu nghiệp vụ rồi nạp lại
```

- Nguồn là `FE/src/mocks/data.json` (cùng seed với MSW mock, giữ nguyên Id) → FE ở `NEXT_PUBLIC_API_MODE=http` thấy cùng dữ liệu như chế độ mock. Mật khẩu mọi tài khoản = `password` trong `data.json`.
- Nạp: đơn vị, tài khoản (hash PBKDF2 thật), nhóm quyền + thành viên, team, dự án, thành viên dự án, công việc, lịch sử giao việc, giờ công, tệp đính kèm (ghi tệp vào `Services/Tasks.Api/wwwroot/uploads`), lần nộp, báo cáo (snapshot đúng hình `ReportPreviewDto`), cảnh báo, nhật ký, IP whitelist, job + lịch sử chạy.
- `--reset` **không** đụng `Features`, nhóm quyền hệ thống, `SystemConfigs`, `BackgroundJobs` (do migration/khởi động quản lý).
- Từ chối chạy khi còn migration chưa áp dụng.
- Kết quả mong đợi: 21 bảng nghiệp vụ + `__EFMigrationsHistory` (xem mục 4).

### Khi sửa entity (thêm field, đổi bảng...)

```bash
dotnet ef migrations add <TenMigrationMoTaThayDoi> --project Shared/Shared.Entities --startup-project Services/Identity.Api --context ApplicationDbContext
```
Commit các file sinh ra trong `BE/Shared/Shared.Entities/Migrations/`. Báo cho đồng đội biết cần chạy lại `dotnet ef database update` sau khi pull.

## 4. Cấu trúc bảng

Tất cả bảng có `Id` (string, khoá chính sinh ở ứng dụng — xem `Shared.Commons.Utils.GuidGenerator`), và hầu hết có `Version` (optimistic concurrency, dùng với header `If-Match`), `CreatedAt`, `UpdatedAt`. Cột enum (`Status`, `ProjectRole`...) được lưu dưới dạng `text` (chuỗi), không phải số nguyên.

| Bảng | Cột nghiệp vụ chính | Quan hệ |
| --- | --- | --- |
| `Users` | Username (unique), DisplayName, Email, PasswordHash, UnitId, IsSysAdmin (bool), GrantedFeatures/RevokedFeatures (`text[]`, cộng/trừ quyền riêng), Status (`Active/Locked`), LockedAt, LockReason, FailedLoginCount, TokenVersion (int, "security stamp" — bump để revoke JWT đang hoạt động khi logout/khoá tài khoản, xem `docs/REFERENCE_PATTERNS.md` A3) | → `Units.Id` (restrict) |
| `Units` | Name, ParentId, ManagerId, Status (`Active/Inactive`) | tự tham chiếu `ParentId` → `Units.Id` (restrict) |
| `Teams` | Name, UnitId, Status | — |
| `TeamMembers` | TeamId, UserId (khoá chính ghép) | → `Teams` (cascade), → `Users` (restrict) |
| `Projects` | Code (unique), Name, Objective, UnitId, OwnerId, StartDate, DueAt, Status (`Planned/Active/Completed/Cancelled`), CompletedAt, CancelledAt | — |
| `ProjectMemberships` | ProjectId, UserId, ProjectRole (`Owner/Manager/Member`), EndedAt | → `Projects` (cascade), → `Users` (restrict) |
| `Tasks` (entity `WorkTask`) | ProjectId, Title, Description, AcceptanceCriteria, Priority (`Low/Normal/High/Urgent`), DueAt, OriginalDueAt, EstimatedMinutes, OriginalEstimatedMinutes, RemainingMinutes, AssigneeId, Status (`New/Todo/InProgress/PendingReview/Completed/Cancelled`), StatusChangedAt, FirstStartedAt, CompletedAt, CancelledAt, LatestSubmissionId | → `Projects` (restrict) |
| `TaskAssignments` | TaskId, AssigneeId, AssignedBy, StartedAt, EndedAt, Reason — lịch sử giao/bàn giao việc | → `Tasks` (cascade) |
| `TimeLogs` | TaskId, UserId, WorkDate, Minutes, Description, Status (`Active/Void`), VoidReason | → `Tasks` (cascade), → `Users` (restrict) |
| `Submissions` | TaskId, Sequence, SubmittedBy, SubmittedAt, Summary, Links (JSON), AttachmentIds (JSON), DueAtSnapshot, ActualMinutesSnapshot, Status (`Pending/Accepted/RevisionRequested`), ReviewedBy, ReviewedAt, ReviewComment, RequestedChanges | → `Tasks` (cascade) |
| `Attachments` | TaskId, UploadedBy, Filename, MimeType, SizeBytes, StoragePath, Status (`Ready/Rejected`) | → `Tasks` (cascade) |
| `Reports` | ProjectId, PeriodType (`Daily/Weekly`), PeriodStart, AuthorId, Status (`Draft/Submitted`), Achievements, Blockers, NextPlan, SelectedTaskIds (JSON), ZeroTimeReason, SubmittedAt, SnapshotJson (chốt số liệu bất biến sau khi Submitted) | unique theo (AuthorId, ProjectId, PeriodType, PeriodStart) |
| `Alerts` | ProjectId, TaskId, Type (`DeadlineRisk/Overdue/Workload/Bottleneck/DataQuality`), Severity (`Info/Low/Medium/High/Critical`), Status (`Unread/Read/InProgress/Resolved/Dismissed`), ConditionActive, Evidence (JSON), DataAsOf, MethodVersion, ResolutionNote, HandledBy, HandledAt | — |
| `AuditLogs` | EntityType, EntityId, ActorId, Action, At, BeforeJson, AfterJson, Reason | index theo (EntityType, EntityId), (At desc), (ActorId, At) |
| `PermissionGroups` / `PermissionGroupMembers` | Code (unique), Name, Description, Status, IsSystem, Features (JSON mã quyền) / (PermissionGroupId, UserId) | nhóm hệ thống seed: `pg-admin`, `pg-pm` |
| `Features` | Code (PK), Name, ParentCode, IsGroup, Scope, Path, Icon, SortOrder, IsActive, Version | danh mục mã quyền, seed bằng `HasData` |
| `SystemConfigs` | Key (đường dẫn IConfiguration, ví dụ `Auth:MaxFailedAttempts`), ServiceType (`Global/Gateway/Identity.Api/...`), Group, Name, Description, DataType (`INT/BOOL/STRING`), **Value (cột giá trị duy nhất)**, IsActive, Version, UpdatedBy | unique (Key, ServiceType); seed 6 key từ `ConfigCatalog` — cấu hình tập trung cho mọi service, xem mục 5 |
| `IpWhitelistEntries` | Cidr, Description, IsActive, Version, CreatedBy | — |
| `BackgroundJobs` / `JobRuns` | Code (PK), IsEnabled, IntervalMinutes, LastRunAt, NextRunAt, LastStatus / JobCode, StartedAt, FinishedAt, Status, Trigger, TriggeredBy, SummaryJson, Error | `JobRuns.JobCode` → `BackgroundJobs` (cascade); giữ 200 lần chạy gần nhất mỗi job |
| `__EFMigrationsHistory` | do EF Core tự quản lý, đừng sửa tay | — |

**Dấu vết tạo/sửa** (`AddAuditStamps`, xem `docs/ADMIN_MODULES.md` §8): `CreatedBy` + `UpdatedBy` (`text NULL`, `Users.Id` hoặc `"SYSTEM"`, không FK) có ở `Users`, `Units`, `Teams`, `PermissionGroups`, `Projects`, `ProjectMemberships`, `Tasks`, `Alerts`, `SystemConfigs`, `IpWhitelistEntries`; riêng `Features`, `BackgroundJobs` chỉ có `UpdatedBy`. Điền tự động bởi `AuditStampInterceptor` (Shared.Entities) ở mọi `SaveChanges` — **không gán tay trong service**. Cột kỹ thuật gắn `[NoAuditStamp]` (`Users.FailedLoginCount`, `Users.TokenVersion`, `BackgroundJobs.LastRunAt/NextRunAt/LastStatus`) không làm đổi người sửa. Bảng không thêm vì đã có cột người thao tác riêng: `TimeLogs` (`UserId`), `Reports` (`AuthorId`), `Submissions` (`SubmittedBy`/`ReviewedBy`), `Attachments` (`UploadedBy`), `TaskAssignments` (`AssignedBy`), `AuditLogs` (`ActorId`), `JobRuns` (`TriggeredBy`).

Cột kiểu JSON (`Links`, `AttachmentIds`, `SelectedTaskIds`, `Evidence`) là `List<string>` ở entity, được EF serialize sang JSON string khi lưu (`ValueConverter` khai báo trong `ApplicationDbContext.OnModelCreating`).

Chưa có cột lưu avatar ảnh đại diện (`Users.AvatarId`/tương đương) — FE đã có UI đổi avatar nhưng BE chưa triển khai tính năng này (xem `docs/PROJECT_MAP.md` mục 5, #3).

## 5. Connection string và cấu hình tập trung

Connection string **không còn nằm trong `appsettings.json` của từng service**. Cả 5 tiến trình (Gateway + 4 service) gọi `builder.AddCentralConfiguration("<ServiceType>")` (`BE/Shared/Shared.Configuration`), lấy cấu hình theo thứ tự ưu tiên từ thấp lên cao:

1. `appsettings.json` của service (Kestrel, Serilog sink, route YARP…).
2. **`BE/appsettings.Shared.json`** — file bootstrap dùng chung, **gitignore**. Chỉ chứa thứ không thể nằm trong DB: `ConnectionStrings:DefaultConnection`, `Jwt:SigningKey`, `CentralConfig:ReloadSeconds`. Máy mới: copy `BE/appsettings.Shared.example.json` thành `appsettings.Shared.json` rồi điền. Có thể trỏ file khác bằng biến `DATN_SHARED_SETTINGS`.
3. **Bảng `SystemConfigs`**: dòng `Global` + dòng theo `ServiceType` của tiến trình (dòng theo service ghi đè `Global`). Tự đọc lại mỗi `ReloadSeconds` (mặc định 30s); code đọc qua `IConfiguration`/`IOptionsMonitor` nên đổi giá trị không cần khởi động lại (trừ key có cờ "cần khởi động lại" như `Jwt:Issuer`). Admin sửa ở màn **Cấu hình tập trung** (`/admin/settings`).
4. user-secrets → 5. biến môi trường (`ConnectionStrings__DefaultConnection`, `Security__AdminIpWhitelistEnabled`…) → 6. command line. Biến môi trường luôn thắng DB, dùng để cứu hộ.

`SystemConfigs` **từ chối** key chứa secret/hạ tầng (`ConnectionStrings:*`, `*Password*`, `*Secret*`, `*SigningKey*`, `*ApiKey*`, `CentralConfig:*`, `Kestrel:*`) — khác `UD_CAUHINH` của DVCLT vốn để lộ mật khẩu DB và JWT secret dạng plaintext.

## 6. Lỗi đã gặp khi dựng — tránh lặp lại

- **`28P01: password authentication failed` dù connection string đúng**: do có Postgres native khác chiếm cổng 5432 trên máy, ứng dụng nối nhầm sang đó. Cách phát hiện: `netstat -ano | findstr :5432` (Windows) xem có >1 PID LISTEN không, rồi `Get-Process -Id <pid>` để biết là process nào. Cách xử lý: đổi cổng publish của container (đang dùng 55432).
- Việc update NuGet package mới (ví dụ thêm `Npgsql.EntityFrameworkCore.PostgreSQL`) có thể fail với `NU1301` nếu máy có NuGet source nội bộ đã cấu hình nhưng không còn tồn tại (`dotnet nuget list source` để xem). Workaround không cần sửa config máy: `dotnet restore --source https://api.nuget.org/v3/index.json`.
- **Bị khoá khỏi khu admin vì IP whitelist** (403 `IP_NOT_ALLOWED` ở mọi API quản trị): hoặc khởi động lại service với biến môi trường `Security__AdminIpWhitelistEnabled=false` (thắng DB), hoặc tắt trực tiếp trong DB (các service nhận giá trị mới trong tối đa 30 giây):
  ```sql
  UPDATE "SystemConfigs" SET "Value"='false' WHERE "Key"='Security:AdminIpWhitelistEnabled' AND "ServiceType"='Global';
  ```
- **Gửi body tiếng Việt bằng `curl -d '...'` trong Git Bash trên Windows bị 422** ("could not be converted to System.String"): shell chuyển mã tham số dòng lệnh, body không còn là UTF-8 — không phải lỗi server. Ghi body ra file UTF-8 rồi dùng `--data-binary @file.json`.
