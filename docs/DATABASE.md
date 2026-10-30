# Database

Cập nhật lần cuối: 2026-10-28.

## 1. Tổng quan

- Engine: **PostgreSQL 16**.
- Một database duy nhất (`datn`) dùng chung cho cả 4 service BE (`Identity.Api`, `Projects.Api`, `Tasks.Api`, `Analytics.Api`) qua một `ApplicationDbContext` (`BE/Shared/Shared.Entities`). Đây là lựa chọn "shared database" hiện tại giữa các microservice — không phải mỗi service một DB riêng.
- EF Core migrations, provider `Npgsql.EntityFrameworkCore.PostgreSQL`. Migration hiện có: `InitialCreate`, `AddUserTokenVersion` (thêm cột `Users.TokenVersion`, xem mục 2).
- **Chưa có DB prod chung.** Mỗi người chạy Postgres cục bộ bằng Docker, dùng chung schema qua migration trong repo. Khi ai đó đổi entity/migration, mọi người phải `git pull` rồi tự chạy lại bước áp migration (mục 3) trước khi chạy service — đừng giả định schema máy mình đang khớp code mới nhất.

## 2. Đứng DB bằng Docker (khuyến nghị cho mọi máy)

File `docker-compose.yml` ở root repo định nghĩa 1 service `db` (Postgres 16, image `postgres:16-alpine`).

```bash
docker compose up -d db
```

Mặc định: database `datn`, user `datn`, password `datn_dev_only` (dev-only, không dùng cho prod), map ra cổng host **55432** (không phải 5432 mặc định).

> **Vì sao cổng 55432 chứ không phải 5432**: nếu máy bạn đã cài Postgres native trước đó (rất hay gặp trên máy dev), nó thường tự chiếm cổng 5432 ở tầng hệ điều hành. Khi đó ứng dụng .NET kết nối "localhost:5432" sẽ vô tình nối vào Postgres native đó thay vì container, và báo sai mật khẩu dù container hoàn toàn đúng — đây là lỗi thực tế đã gặp khi dựng lần đầu. Dùng cổng lẻ 55432 để tránh việc này. Nếu máy bạn chắc chắn không có gì chiếm 5432, có thể đổi lại cả hai nơi (docker-compose.yml + 4 file appsettings.json) nhưng không bắt buộc.

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
- Vì Program.cs của Identity.Api bắt buộc có `Jwt:SigningKey` mới build xong instance cấu hình (guard chặn chạy thật), khi chỉ cần migrate schema (không chạy app), set tạm biến môi trường nếu chưa có user-secrets:
  ```bash
  Jwt__SigningKey="bat-ky-chuoi-du-dai" dotnet ef database update ...
  ```
- Kết quả mong đợi: 14 bảng nghiệp vụ + `__EFMigrationsHistory` (xem mục 4).

### Khi sửa entity (thêm field, đổi bảng...)

```bash
dotnet ef migrations add <TenMigrationMoTaThayDoi> --project Shared/Shared.Entities --startup-project Services/Identity.Api --context ApplicationDbContext
```
Commit các file sinh ra trong `BE/Shared/Shared.Entities/Migrations/`. Báo cho đồng đội biết cần chạy lại `dotnet ef database update` sau khi pull.

## 4. Cấu trúc bảng

Tất cả bảng có `Id` (string, khoá chính sinh ở ứng dụng — xem `Shared.Commons.Utils.GuidGenerator`), và hầu hết có `Version` (optimistic concurrency, dùng với header `If-Match`), `CreatedAt`, `UpdatedAt`. Cột enum (`Status`, `SystemRole`, `ProjectRole`...) được lưu dưới dạng `text` (chuỗi), không phải số nguyên.

| Bảng | Cột nghiệp vụ chính | Quan hệ |
| --- | --- | --- |
| `Users` | Username (unique), DisplayName, Email, PasswordHash, UnitId, SystemRole (`Employee/Manager/Admin`), Status (`Active/Locked`), LockedAt, LockReason, FailedLoginCount, TokenVersion (int, "security stamp" — bump để revoke JWT đang hoạt động khi logout/khoá tài khoản, xem `docs/REFERENCE_PATTERNS.md` A3) | → `Units.Id` (restrict) |
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
| `AuditLogs` | EntityType, EntityId, ActorId, Action, At, BeforeJson, AfterJson, Reason | index theo (EntityType, EntityId) |
| `__EFMigrationsHistory` | do EF Core tự quản lý, đừng sửa tay | — |

Cột kiểu JSON (`Links`, `AttachmentIds`, `SelectedTaskIds`, `Evidence`) là `List<string>` ở entity, được EF serialize sang JSON string khi lưu (`ValueConverter` khai báo trong `ApplicationDbContext.OnModelCreating`).

Chưa có cột lưu avatar ảnh đại diện (`Users.AvatarId`/tương đương) — FE đã có UI đổi avatar nhưng BE chưa triển khai tính năng này (xem `docs/PROJECT_MAP.md` mục 5, #3).

## 5. Connection string

Mỗi service đọc `ConnectionStrings:DefaultConnection` trong `appsettings.json` của chính nó (`BE/Services/<Service>.Api/appsettings.json`), hiện tại là:
```
Host=localhost;Port=55432;Database=datn;Username=datn;Password=datn_dev_only
```
Giá trị này khớp với `docker-compose.yml` và được commit thẳng vào repo vì chỉ là creds dev cục bộ, không phải bí mật thật (giống cách LocalDB cũ từng được commit). Khi có DB môi trường thật (staging/prod), override qua biến môi trường `ConnectionStrings__DefaultConnection` hoặc user-secrets — **không** đổi giá trị commit trong appsettings.json.

## 6. Lỗi đã gặp khi dựng — tránh lặp lại

- **`28P01: password authentication failed` dù connection string đúng**: do có Postgres native khác chiếm cổng 5432 trên máy, ứng dụng nối nhầm sang đó. Cách phát hiện: `netstat -ano | findstr :5432` (Windows) xem có >1 PID LISTEN không, rồi `Get-Process -Id <pid>` để biết là process nào. Cách xử lý: đổi cổng publish của container (đang dùng 55432).
- Việc update NuGet package mới (ví dụ thêm `Npgsql.EntityFrameworkCore.PostgreSQL`) có thể fail với `NU1301` nếu máy có NuGet source nội bộ đã cấu hình nhưng không còn tồn tại (`dotnet nuget list source` để xem). Workaround không cần sửa config máy: `dotnet restore --source https://api.nuget.org/v3/index.json`.
