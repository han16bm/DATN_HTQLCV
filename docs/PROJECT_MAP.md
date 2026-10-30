# Bản đồ dự án DATN

> File định hướng nhanh cho bất kỳ ai (người hoặc AI session) bắt đầu làm việc trên repo này.
> Đọc file này trước khi tự khám phá lại codebase — mục đích là tránh tốn công/tốn token dò lại những gì đã biết.
> Cập nhật file này mỗi khi fix thêm lỗi, phát hiện vấn đề mới, hoặc đổi trạng thái một hạng mục.

Cập nhật lần cuối: 2026-10-28.

## 1. Dự án là gì

Hệ thống quản lý công việc/dự án nội bộ, có phân hệ phân tích (dashboard, nguy cơ trễ hạn, workload, điểm nghẽn, cảnh báo) với lời giải thích do AI sinh ra (hiện là mô phỏng, chưa gọi LLM thật).

Gồm 2 phần tách biệt, phát triển không đồng bộ:

- **FE** (`FE/`) — Next.js App Router + TypeScript strict + Tailwind + React Hook Form + Zod + Zustand + TanStack Query. **Đã triển khai gần như đầy đủ** các luồng nghiệp vụ (mã S01–S43 trong đặc tả), nhưng chạy trên **MSW mock** (`NEXT_PUBLIC_API_MODE=mock`), chưa nối backend thật.
- **BE** (`BE/`) — .NET 8, kiến trúc microservices: `Gateway` (YARP reverse proxy) + 4 service (`Identity.Api`, `Projects.Api`, `Tasks.Api`, `Analytics.Api`) + 2 thư viện chung (`Shared.Commons`, `Shared.Entities`). Code đã khá đầy đủ chiều rộng nghiệp vụ (xem mục 4) nhưng **chưa từng được FE thật nối vào và chạy thử end-to-end**, và **chưa có test project nào**.

Nói ngắn: FE coi như xong phần giao diện/luồng dựa trên một "hợp đồng" (contract) do chính FE tự định nghĩa khi mock; BE được viết sau, độc lập, theo cùng tinh thần nghiệp vụ nhưng **không đảm bảo khớp 100% field-by-field** với contract đó. Việc chính còn lại không phải là "viết thêm tính năng từ đầu" mà là **đối chiếu + nối thật FE ↔ BE**, bắt đầu từ luồng login.

## 2. Tài liệu đã có — đọc trước, đừng khám phá lại

| Tài liệu | Nội dung |
| --- | --- |
| `README.md` | Giới thiệu, lệnh chạy FE |
| `FE/fe-specs/README.md` | Đặc tả nghiệp vụ gốc (nguồn sự thật cho hành vi từng màn S01–S43) |
| `FE/docs/ARCHITECTURE.md` | Kiến trúc FE, các quyết định thiết kế |
| `FE/docs/IMPLEMENTATION_STATUS.md` | **Quan trọng nhất** — log theo ngày những gì đã làm ở FE, bảng "Phạm vi chức năng" S01–S43, bảng endpoint theo feature, và mục cuối **"Phần cần nghiệm thu hoặc BE xác nhận"** — đây chính là backlog tích hợp BE/production còn thiếu (Gateway thật, auth/cookie/CSRF/CORS production, rate limit, quét tệp, lưu trữ bền vững, scheduler, notification thật) |
| `FE/docs/SPEC_REVIEW.md`, `REFACTOR_REVIEW.md`, `UI_REVIEW.md` | Lịch sử rà soát/refactor FE, quy tắc tránh lặp code đã rút ra |
| `BE/docs/CODING_STYLE.md` | Quy ước code BE |
| `docs/DATABASE.md` | Cấu trúc DB (PostgreSQL), cách dựng bằng Docker, cách áp migration, lỗi thường gặp |
| `docs/PROJECT_MAP.md` (file này) | Trạng thái tổng hợp 2 phía + backlog lỗi + kế hoạch |

## 3. Cấu trúc thư mục chính

```
BE/
  Gateway/                  YARP reverse proxy, JWT bearer, CORS — cổng vào duy nhất cho FE (port 5000)
  Services/
    Identity.Api/           auth, users, units, teams          (port 5101)
    Projects.Api/           projects, project members          (port 5102)
    Tasks.Api/               tasks, time-logs, submissions, reports, attachments (port 5103)
    Analytics.Api/          dashboard, risks, workload, bottlenecks, alerts    (port 5104)
  Shared/
    Shared.Commons/         exceptions, attributes (Audit), extensions, PagedResult
    Shared.Entities/        EF Core entities + ApplicationDbContext + Migrations
  docs/CODING_STYLE.md

FE/
  src/features/<feature>/   mỗi feature: api/ (service HTTP), schemas/ (zod), types/, components/, hooks/
  src/services/api-client.ts   axios instance dùng chung, interceptor auth/refresh/If-Match/idempotency
  src/mocks/                MSW: data.json, db.ts (nghiệp vụ mock), handlers/ (12 nhóm API)
  tests/                    vitest, chạy qua HTTP thật nhắm vào MSW (không phải unit test thuần)
  docs/, fe-specs/
```

Mỗi service BE theo cùng pattern: `Controllers/` (mỏng, chỉ gọi service) → `Interfaces/` → `Services/` (nghiệp vụ, validate, audit log, optimistic concurrency qua `Version`/`If-Match`) → `Models/{Dtos,Queries,Requests}/`.

## 4. Trạng thái hiện tại

**BE**
- `dotnet build BE/DATN.slnx` → **PASS**, 0 error, 0 warning.
- Mỗi service + Gateway đều throw `InvalidOperationException` lúc start nếu `Jwt:SigningKey` chưa được set — **phải chạy `dotnet user-secrets set "Jwt:SigningKey" "<chuỗi ngẫu nhiên ≥32 ký tự>"` cho cả 5 project** (Gateway + 4 service) trước khi `dotnet run`, nếu không service không khởi động được.
- DB: **PostgreSQL** (đổi từ SQL Server LocalDB — xem [`docs/DATABASE.md`](DATABASE.md)), dựng qua `docker compose up -d db`, đã verify thật: build pass + migration `InitialCreate` áp thành công, tạo đủ 14 bảng.
- Chưa có test project nào cho BE (không có file nào match `*Tests*`).
- Toàn bộ `BE/` hiện **chưa được add vào git** (`git status` báo `?? BE/`) — nhớ commit, tránh mất việc.

**FE**
- Đã triển khai tuần tự S01–S43, 83 route HTTP (theo MSW), 167/167 test pass, typecheck/lint/build sạch.
- Chạy hoàn toàn trên MSW; `.env.example` có cờ `NEXT_PUBLIC_API_MODE=mock|http` để chuyển sang gọi backend thật nhưng **chưa từng thử ở mode `http` với BE thật** theo IMPLEMENTATION_STATUS.md.

## 5. Lỗi/gap đã phát hiện

| # | Vấn đề | Ảnh hưởng | Trạng thái |
| - | --- | --- | --- |
| 1 | `Identity.Api` `UserDto` không có field `avatarUrl`, nhưng FE `userSchema.avatarUrl` là field **bắt buộc có mặt** (nullable nhưng không optional) → mọi response chứa user (login, /auth/me, /auth/refresh, danh sách/chi tiết user) sẽ **vỡ Zod contract validation ở FE** ngay khi nối BE thật | Cao — chặn thẳng luồng login | ✅ Đã fix (`UserDto` thêm `string? AvatarUrl`, luôn `null` cho tới khi có tính năng upload avatar thật ở BE) |
| 2 | FE lưu access token chỉ trong biến JS (`api-client.ts`), mất ngay khi F5/reload cứng → gọi `/auth/refresh` lúc mount luôn 401 vì không còn token để gửi → người dùng bị đăng xuất mỗi lần reload | Cao — UX đăng nhập hỏng | ✅ Đã fix (token giờ đọc/ghi qua `sessionStorage`, khôi phục khi load lại trang trong cùng tab) |
| 3 | BE chưa có tính năng avatar thật (không có cột `AvatarId`, không có controller upload/serve ảnh) trong khi FE đã có UI đổi avatar hoàn chỉnh (`PATCH /auth/me` multipart, `GET /avatars/:id`) | Trung bình — là việc tính năng, không phải bug | ⏳ Chưa làm — thuộc giai đoạn "tính năng chính" (hồ sơ cá nhân), không phải "login cơ bản" |
| 4 | `Gateway` có `AddAuthentication/AddJwtBearer` nhưng route reverse-proxy không gắn `RequireAuthorization()` nào → lớp xác thực ở Gateway không thực sự chặn gì, toàn bộ authorize dồn cho service downstream (`[Authorize]` ở từng controller) | Thấp — không sai, chỉ dư thừa/dễ hiểu nhầm | ⏳ Chưa xử lý |
| 5 | `Tasks.Api` và `Projects.Api` không cấu hình CORS (trong khi `Identity.Api`/`Analytics.Api` có) | Thấp — chỉ lộ nếu gọi trực tiếp service, không qua Gateway | ⏳ Chưa xử lý |
| 6 | Chưa có test project nào cho BE | Trung bình — khó phát hiện regression khi sửa nghiệp vụ | ⏳ Chưa xử lý, chưa được yêu cầu làm |
| 7 | `[Audit]` (mọi `BaseApiController`) bọc **mọi** response thành `{succeeded, errors, data, traceId, statusCode}` và luôn trả HTTP 200 kể cả lỗi nghiệp vụ — vỡ thẳng contract FE (FE cần DTO trần + mã HTTP thật `{code, message, fieldErrors?, details?}`). Verify thật bằng Playwright: login trả 200 nhưng FE báo "Chưa thể xử lý dữ liệu lúc này" vì Zod từ chối parse response bị bọc | Cao — chặn **mọi** endpoint, không riêng login | ✅ Đã fix (`AuditAttribute` viết lại: trả DTO trần khi thành công, map exception → mã HTTP thật qua `ErrorCode % 1000`, lỗi 401/403 từ `[Authorize]` cũng trả JSON đúng hình dạng qua `JwtBearerEvents.OnChallenge/OnForbidden`). `BE/docs/CODING_STYLE.md` mục 4 + mục 13 đã được cập nhật khớp theo thiết kế mới này — không còn mô tả kiểu bọc cũ. |
| 8 | DB trống hoàn toàn sau migration — không có cách tạo tài khoản nào khác vì `UsersController.Create` yêu cầu `[Authorize]` (con gà quả trứng) | Cao — không login được lần đầu nếu DB rỗng | ✅ Có `BE/scripts/seed-admin.sql` (chạy 1 lần sau migration) tạo 1 Unit + 1 User ADMIN (`admin` / `Admin@123456`) |
| 9 | `Shared.Commons.Models.PagedResult<T>` serialize phẳng `{items, page, pageSize, total}`, nhưng FE cần `{items, pagination:{page,pageSize,total}}` (helper `page()` trong `common.schema.ts`) → **mọi** danh sách có phân trang (users, units, teams, projects, tasks, time-logs, submissions, reports, alerts, audit history...) vỡ contract. Verify thật: trang `/admin/users` báo "Chưa tải được dữ liệu" dù BE trả 200 | Cao — chặn mọi màn danh sách | ✅ Đã fix bằng `PagedResultJsonConverterFactory` (Shared.Commons) đăng ký qua `AddJsonOptions` ở cả 4 service — không cần sửa từng nơi gọi `PagedResult<T>`. |
| 10 | `ProjectService.CreateAsync` ghi audit log bằng chính entity `Project` (navigation property) làm "after" → EF tự fix-up `project.Memberships` ↔ `membership.Project` thành vòng lặp, `System.Text.Json` throw `JsonException` → **tạo dự án lỗi 500**. Verify thật: tạo dự án qua UI với tài khoản Manager | Cao — chặn thẳng việc tạo dự án | ✅ Đã fix: dùng `Snapshot(project)` (đã có sẵn, chỉ lấy field scalar) thay cho entity thô — áp cho cả `CreateAsync`/`UpdateAsync`/`ActivateAsync`/`CompleteAsync`/`CancelAsync` trong file để tránh lặp lại. Các service khác (`WorkTask`, `Team`...) chưa gặp lỗi này vì không add child entity cùng lúc trong cùng DbContext, nhưng là pattern cần cẩn trọng nếu sau này thêm logic tương tự. |
| 11 | `AuditDto` (Projects.Api + Tasks.Api) trả `ActorId` (string phẳng) + `EntityType`/`EntityId`, nhưng FE `auditSchema` yêu cầu `actor: {id, displayName}` (object, bắt buộc) → lịch sử dự án/task vỡ contract ("Các mốc triển khai" báo lỗi dù API trả 200) | Cao — chặn tab Lịch sử của Project/Task | ✅ Đã fix: `AuditDto` đổi `ActorId` → `Actor: PersonRefDto`, `ListHistoryAsync` ở cả 2 service lookup `Users` theo `ActorId` để build `PersonRefDto`. Còn cosmetic nhỏ chưa sửa: nội dung diff "Xem thay đổi" hiển thị tên field PascalCase (`Name`, `OwnerId`...) và enum dạng số thô (`Status: "0"`) vì `Snapshot()`/`WriteAuditLogAsync` serialize bằng `JsonSerializerOptions` mặc định, không phải options của app (camelCase/enum-string) — không chặn chức năng, chỉ chưa đẹp. |
| 12 | Cùng bug class #10 (audit log ghi entity thô gây JSON cycle) còn nằm rải ở `TimeLogService` (CREATE/UPDATE/VOID — load cả `task` và `log` cùng context), `SubmissionService` (CREATE/APPROVE/REQUEST_REVISION — load cả `task` và `submission`), `ProjectMemberService.EndAsync` (load cả `project` và `membership`). Riêng `ProjectMemberService.AddAsync`/`UpdateRoleAsync` không crash nhưng do EF fix-up `membership.User`, audit log AfterJson sẽ nhúng **toàn bộ User entity kèm PasswordHash** — lộ dữ liệu nhạy cảm vào lịch sử, không phải lỗi 500 nên dễ bị bỏ sót nếu chỉ test bằng cách xem có lỗi hay không | Cao (crash) ở TimeLog/Submission/EndMembership; Trung bình (lộ dữ liệu) ở Add/UpdateRole | ✅ Đã fix toàn bộ: thay entity thô bằng anonymous object/`Snapshot()` cho "after" ở cả 3 file. Đã quét toàn bộ `WriteAuditLog(Async)?(...)` trong BE — `Report` không có navigation property nên an toàn, không cần sửa. |
| 13 | Gateway thiếu route `/api/review-queue` trong `ReverseProxy:Routes` (có route cho `report-previews`, `reports`, `tasks`... nhưng quên route này) → trang "Chờ nghiệm thu" gọi thẳng 404 qua Gateway dù Tasks.Api có endpoint | Cao — chặn trang Chờ nghiệm thu | ✅ Đã thêm route `review-queue` → cluster `tasks` trong `Gateway/appsettings.json`. |
| 14 | `SubmissionService.ListReviewQueueAsync` trả `PagedResult<SubmissionDto>` (không có `taskTitle`), nhưng FE `reviewRowSchema` bắt buộc có `taskTitle` (để hiển thị tên công việc trong hàng chờ nghiệm thu) | Cao — chặn trang Chờ nghiệm thu (sau khi fix #13) | ✅ Đã fix: thêm `ReviewQueueItemDto` riêng (Id, TaskId, TaskTitle, Sequence, Submitter, SubmittedAt, DueAtSnapshot), join `Tasks` để lấy `Title`. |
| 15 | `ReportService.GetPreviewAsync` (`GET /report-previews`, dùng để hiển thị "Số liệu từ nhật ký" khi soạn báo cáo) luôn tính `totalMinutes` không lọc theo người (`authorId: null` cứng), trong khi `SubmitAsync`/`RefreshDraftAsync` tính lọc theo đúng tác giả đang gọi — khi tác giả báo cáo chưa tự ghi giờ công nhưng người khác trong dự án có ghi, màn soạn hiển thị "X giờ" (khiến FE tưởng không cần `zeroTimeReason`) nhưng `SubmitAsync` tính ra 0 giờ theo tác giả → nộp báo cáo bị 422 bất ngờ dù UI không báo lỗi trước đó | Cao — luồng nộp báo cáo (đặc biệt khi PM/Manager viết báo cáo nhưng không tự ghi giờ công) | ✅ Đã fix: `GetPreviewAsync` nay nhận `actorId` từ `ActorId` của controller (giống `SubmitAsync`), scope theo đúng người đang xem — khớp đúng ngữ nghĩa "báo cáo cá nhân", không phải hoạt động cả dự án. |
| 16 | **Binding enum từ query string sai trên toàn BE**: ASP.NET Core mặc định khớp enum theo tên member C# (`InProgress`), không hiểu `UPPER_SNAKE_CASE` mà FE gửi (`IN_PROGRESS`) → mọi filter dùng enum nhiều từ (`WorkTaskStatus.InProgress`/`PendingReview`, `SubmissionStatus.RevisionRequested`, `AlertType.DeadlineRisk`/`DataQuality`, `AlertStatus.InProgress`) trả `422 VALIDATION` thay vì lọc đúng. Phát hiện qua `curl` trực tiếp: `GET /api/tasks?status=IN_PROGRESS` → 422 `"The value 'IN_PROGRESS' is not valid for Status."`. Enum một từ (`NEW`, `HIGH`, `ACTIVE`...) vẫn chạy đúng nên lỗi này dễ lọt qua test hời hợt | Cao — âm thầm chặn filter trạng thái ở Tasks list, Analytics (Dashboard/Risks/Workload/Bottlenecks), Alerts, bất kỳ đâu dùng enum nhiều từ qua query string | ✅ Đã fix tận gốc, một chỗ: `Shared.Commons.Extensions.SnakeCaseEnumModelBinderProvider`/`SnakeCaseEnumModelBinder` (chuyển `IN_PROGRESS`→`InProgress` trước khi `Enum.TryParse`), đăng ký qua `options.ModelBinderProviders.Insert(0, ...)` ở cả 4 service. Verify thật: `status=IN_PROGRESS` trả 200 sau fix. |
| 17 | **`Analytics.Api` gần như chưa triển khai** — `DashboardDto`/`RisksDto`(cũ)/`WorkloadItemDto`/`BottleneckItemDto` thiếu toàn bộ field FE yêu cầu: không có `metadata`/`analysisRef` ở bất kỳ đâu, không có 16 chỉ số K01–K16 (chỉ có vài số đếm thô), không có `timeVariance`/`submissionTimeliness`/`reporting`/`trend`/`projectComparisons`, risk/bottleneck items thiếu `evidence`/`taskTitle`/`assignee`. Không có endpoint `GET /api/analytics/filter-options` (dropdown lọc theo đơn vị/dự án/nhóm/người) dù FE gọi ở mọi trang Analytics. Đây là khoảng trống tính năng, không phải lệch field nhỏ | Cao — Dashboard/Risks/Workload/Bottlenecks hoàn toàn không dùng được, bộ lọc trống | ✅ Đã viết lại toàn bộ theo yêu cầu người dùng ("làm đầy đủ K01-16 + dashboard thật, bỏ qua phần LLM mô phỏng"): `AnalyticsService.cs` viết lại hoàn toàn, DTO mới khớp đúng `dashboardSchema`/`risksSchema`/`workloadSchema`/`bottlenecksSchema`, cả 16 metric tính theo công thức trong `FE/fe-specs/rules/METRICS_K01_K16.md` (K06/K07 giờ công gắn `TimeLog.UserId`, K08-K11 gắn `Submission.SubmittedBy`, K16 gắn `Report.AuthorId` — không dùng nhầm "người nhận hiện tại của task" như spec cảnh báo). Thêm `FilterOptionsController`/`ListFilterOptionsAsync` (Unit/Project/Team/Person). K13/K14 (capacity/utilization) cố ý giữ `null` vì hệ thống chưa có nguồn dữ liệu lịch làm việc/nghỉ phép — đây là giá trị đúng theo spec ("thiếu nguồn → không chia"), không phải thiếu sót. **Phạm vi cố ý bỏ qua** (do người dùng chọn): hệ thống snapshot/analysis-detail/LLM thật (S40/S43) — `AnalysisRefDto.analysisId` được sinh ngẫu nhiên mỗi request để khớp hình dạng contract, nhưng click "Xem chi tiết chỉ số" trên các trang Analytics sẽ 404 vì `GET /api/analytics/details/{id}` chưa tồn tại. Alerts list vẫn trả rỗng vì không có job tự động sinh cảnh báo (giới hạn đã biết, khớp với giới hạn tương tự ở FE mock). |
| 18 | **`ErrorResponse.FieldErrors`/`Details` serialize thành `null` tường minh thay vì bị lược bỏ**, trong khi FE `errorResponseSchema` khai `fieldErrors`/`details` bằng `.optional()` (chỉ chấp nhận field vắng mặt/`undefined`, **không** chấp nhận `null` tường minh — khác `.nullable()`). Hậu quả: **hầu như mọi response lỗi không có field-level error** (401 sai mật khẩu, 403, 404, 409, 500...) có body `{"code":...,"message":...,"fieldErrors":null,"details":null}` → Zod `safeParse` fail → FE rơi vào nhánh `ContractError` mặc định, hiển thị "Chưa thể xử lý dữ liệu lúc này. Vui lòng thử lại." thay vì thông điệp lỗi thật. Phát hiện qua Playwright: đăng nhập sai mật khẩu hiện thông báo chung chung thay vì "Sai tên đăng nhập hoặc mật khẩu." dù BE đã trả đúng message | Cao — che giấu **gần như mọi** thông điệp lỗi nghiệp vụ trên toàn hệ thống, không riêng login; là bug âm thầm nhất vì vẫn "có vẻ hoạt động" (hiện đúng alert, sai nội dung) | ✅ Đã fix: `ErrorResponse` (Shared.Commons) gắn `[JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]` lên `FieldErrors`/`Details` — hai field này giờ bị lược bỏ hoàn toàn khỏi JSON khi `null`, khớp đúng kỳ vọng `.optional()` phía FE. Chỉ sửa tại `ErrorResponse`, không đổi `JsonSerializerOptions` toàn cục (tránh ảnh hưởng các DTO khác có field `nullable()`-bắt-buộc-có-mặt như `UserDto.AvatarUrl`). Verify qua Playwright: đăng nhập sai mật khẩu hiện đúng "Sai tên đăng nhập hoặc mật khẩu." |
| 20 | **Alert tự sinh chưa có job nào tạo ra** (ghi nhận từ đầu session là gap đã biết, không phải lỗi) — Alerts list luôn trống vì không có cơ chế quét điều kiện Overdue/DeadlineRisk/Bottleneck/DataQuality rồi tạo `Alert` row | Trung bình — tính năng cảnh báo hiện diện trên UI nhưng không có dữ liệu thật | ✅ Đã làm: `AlertGenerationBackgroundService` + `AlertGenerationService` (Analytics.Api) chạy theo interval cấu hình (`AlertGeneration:IntervalMinutes`/`Enabled`), tái dùng đúng công thức đã có trong `AnalyticsService` (không viết lại), đồng bộ 2 chiều tạo/cập nhật/tắt `conditionActive`. **Trong lúc verify phát hiện thêm 2 bug thật, vì đây là lần đầu Alerts list có dữ liệu để test**: (a) `AlertDto` thiếu `taskTitle`/`analysisRef` mà FE schema bắt buộc — đã thêm; (b) `Analytics.Api` thiếu hoàn toàn `JsonStringEnumConverter` trong `AddJsonOptions` → `PATCH /alerts/:id` luôn 422 khi gửi `status` dạng chuỗi — đã thêm (dời `UpperSnakeCaseNamingPolicy` từ `Tasks.Api` riêng sang `Shared.Commons.Models` dùng chung, tránh tạo bản sao). Verify thật qua Playwright: tạo task chưa phân công → alert DataQuality xuất hiện đúng ở list+detail → gán người → alert chuyển "Điều kiện phát sinh đã hết" (Status giữ "Chưa đọc") → cập nhật xử lý "Đã xử lý" thành công. Cố ý bỏ qua `AlertType.Workload` vì chưa có ngưỡng "quá tải" được định nghĩa sẵn trong codebase (chi tiết: `docs/REFERENCE_PATTERNS.md` mục A6). |
| 19 | **`AuthService.LoginAsync` trả HTTP 409 Conflict cho sai tên đăng nhập/mật khẩu** (dùng `BusinessRuleException` → `ErrorCodes.Conflict`), đúng ra phải là 401 Unauthorized — hằng số `ErrorCodes.Unauthorized = 100401` đã tồn tại sẵn nhưng chưa từng có exception class nào dùng tới | Trung bình — sai mã HTTP theo chuẩn REST, dễ gây nhầm lẫn khi debug hoặc khi FE sau này cần phân biệt 401 (sai creds, không retry) với 409 (xung đột dữ liệu, có thể cho phép giải quyết) | ✅ Đã fix: thêm `UnauthorizedException` (Shared.Commons.Exceptions, dùng `ErrorCodes.Unauthorized`), `AuthService.LoginAsync` dùng exception này cho cả 2 nhánh sai creds (không tìm thấy username, verify password fail). Tài khoản bị khóa (`UserStatus.Locked`) vẫn giữ nguyên `ForbiddenException` (403) — đúng ngữ nghĩa "tài khoản tồn tại nhưng bị chặn truy cập". Verify qua curl + Playwright: sai mật khẩu → 401 `UNAUTHORIZED`. |
| 21 | **Contract quyền FE ↔ BE chưa khớp** — FE đọc quyền hiệu lực từ session: `permissions` (hệ thống) và `projectAccess[].permissions` (theo dự án, gồm PROJECT_MANAGE, MEMBERS_MANAGE, TASKS_MANAGE, TASKS_REVIEW, ANALYTICS_VIEW, ALERTS_MANAGE). `Identity.Api` `ProjectAccessDto` chỉ có `projectId`/`projectRole`, `PermissionFeatures` không có `TASKS_REVIEW`, và `PermissionEvaluator` cấp ANALYTICS_VIEW toàn hệ thống cho ADMIN. Thiếu trường thì FE xem như chưa cấp quyền (không tự suy từ role) | Cao khi nối BE thật — thao tác theo dự án (sửa dự án, thành viên, giao việc, nghiệm thu, cảnh báo) bị khóa | ⏳ Cần BE thêm quyền theo dự án vào session, thêm `TASKS_REVIEW`, và quyết định quyền ANALYTICS_VIEW của ADMIN |

Đã verify **end-to-end thật** bằng Playwright (browser thật, không phải test giả định, dùng tài khoản seed + 2 tài khoản Manager + 1 Employee-role chưa cần, tự tạo qua UI):
- **Login**: `http://localhost:3000/login` → vào `/workspace`, đúng tên/vai trò.
- **Users/Organization**: tạo tài khoản, khóa (thường)/mở khóa, cấp lại mật khẩu, tạo đơn vị con, tạo nhóm kèm chọn thành viên — không phát hiện lỗi mới ở phần này.
- **Projects**: tạo dự án (`/projects/new`) → xem chi tiết → xem lịch sử (kèm diff) → thêm thành viên → triển khai dự án (Planned→Active) → đổi vai trò thành viên → kết thúc tư cách thành viên → closure-checks (chặn đúng khi còn submission chờ xét, cho qua khi đã xử lý hết) → hoàn thành dự án (Active→Completed) → hủy dự án (Planned→Cancelled, dialog đúng chỉ cho chọn "Hủy" khi dự án chưa từng Active).
- **Tasks + Time logs**: tạo task → giao việc → bắt đầu → ghi giờ công → nộp kết quả → tạm dừng (kèm lý do, quay về Todo) → hủy task (kể cả khi chưa giao việc) → cập nhật ước lượng còn lại → bàn giao/handover (giờ công người cũ được giữ nguyên, lý do lưu vào lịch sử) (CREATE/ASSIGN/START/PAUSE/CANCEL/UPDATE_REMAINING đều verify qua lịch sử task, không crash).
- **Submissions + Reports**: duyệt kết quả nộp bằng một Manager khác (không phải người nộp, đúng luật "không tự xét" — field `submittedBy !== session.user.id` ở `submission-detail-page.tsx`) → task chuyển Completed; yêu cầu sửa (task quay lại InProgress) → nộp lại (sequence tăng lên 2, lịch sử giữ đúng cả 2 lần nộp với kết quả xét khác nhau); tạo báo cáo nháp → soạn nội dung → gửi (kèm trường hợp 0 giờ công cần lý do).
- **Analytics + Alerts**: Dashboard (đủ 16 metric + biểu đồ + so sánh dự án + giờ công/ước lượng), Risks/Workload/Bottlenecks render đúng, bộ lọc (`filter-options`) populate đúng unit/project/team/person thật, verify filter theo status đa từ (`IN_PROGRESS`) hoạt động sau khi sửa bug #16. Alerts giờ có job tự sinh thật (`AlertGenerationBackgroundService`) — verify tạo/cập nhật/tắt điều kiện + cập nhật xử lý qua UI thành công (xem gap #20).
Toàn bộ qua Gateway thật, Postgres thật.

**Lưu ý công cụ khi test bằng Playwright MCP trên app này**: `browser_click`/`browser_type` theo role đôi khi không kích hoạt được submit/click thật trên trang này (không rõ nguyên nhân — không phải bug của app, có thể do cách Playwright MCP đưa event vs. cách React/Radix lắng nghe). Khi một click/fill "chạy xong nhưng không có network request nào xảy ra", dùng `browser_run_code_unsafe` gọi `.click()`/giá trị DOM trực tiếp (`element.click()`, `input.value` qua `fill()` của Playwright locator) thay vì tool `browser_click`/`browser_type` cấp cao.

Khi phát hiện vấn đề mới hoặc fix thêm, **thêm/sửa dòng trong bảng này** thay vì chỉ báo miệng trong chat — đây là nơi duy trì trạng thái lâu dài.

## 6. Kế hoạch ưu tiên tiếp theo

Theo đúng thứ tự người yêu cầu: **login cơ bản xong trước, rồi mới tới tính năng chính** theo thứ tự S01→S43 trong `IMPLEMENTATION_STATUS.md`.

1. ✅ **Luồng login cơ bản** — login/me/refresh/logout, nối Gateway thật. Verify xong bằng Playwright thật (mục 5).
2. ✅ **S03–S07** — Users/Organization. Verify xong: tạo tài khoản, khóa/mở khóa, cấp lại mật khẩu, tạo đơn vị con, tạo nhóm kèm chọn thành viên.
3. ✅ **S08–S14** — Projects & members. Đã verify end-to-end toàn bộ, không còn nhánh phụ nào chưa test: tạo dự án, xem chi tiết/lịch sử, thêm thành viên, triển khai (Planned→Active), **đổi vai trò thành viên** (Member→Manager, qua `PATCH /members/:id`), **kết thúc tư cách thành viên** (qua `/members/:id/end`), **closure-checks** (đúng chặn khi còn submission `PENDING`, trả về số liệu đúng khi đã xử lý hết), **hoàn thành dự án** (`POST /projects/:id/complete`, chỉ chạy được khi closure-checks sạch), **hủy dự án** (`POST /projects/:id/cancel`, test cả khi dự án còn ở trạng thái `Planned` — dialog đúng chỉ hiện lựa chọn "Hủy dự án", không cho "Kết thúc" vì dự án chưa từng Active).
4. ✅ **S15–S23** — Tasks & time logs. Verify xong toàn bộ: tạo task, giao việc, bắt đầu, ghi giờ công, nộp kết quả, **tạm dừng** (`POST /tasks/:id/pause`, task quay về `Todo` kèm lý do), **hủy task** (`POST /tasks/:id/cancel`, test cả khi task chưa giao việc), **cập nhật ước lượng còn lại** (`PATCH /tasks/:id/remaining-estimate`), **bàn giao/handover** (`POST /tasks/:id/assignments`, giờ công người cũ được giữ nguyên, lý do bàn giao lưu vào lịch sử).
5. ✅ **S24–S32** — Submissions & reports. Verify xong toàn bộ: duyệt kết quả (approve, bằng reviewer khác người nộp — đúng luật không tự xét, xác nhận field `submittedBy !== session.user.id` trong `submission-detail-page.tsx`), tạo/soạn/gửi báo cáo (kèm case 0 giờ công), **yêu cầu sửa** (`POST /submissions/:id/request-revision`, task quay lại `InProgress`), **nộp lại sau khi bị yêu cầu sửa** (sequence tăng đúng lên 2, lần 1 hiển thị "Yêu cầu chỉnh sửa", lần 2 "Chờ xét").
6. ✅ **S33–S40** — Analytics & alerts. Dashboard/Risks/Workload/Bottlenecks viết lại toàn bộ, verify đủ 16 metric + bộ lọc. Cố ý bỏ qua theo lựa chọn người dùng: snapshot/analysis-detail/LLM thật (S40/S43) — xem mục 5 #17.
7. ✅ **S41** — Attachments. Verify xong: upload qua dialog nộp kết quả (chung dialog theo đúng thiết kế), `attachmentIds` gắn đúng vào submission, download lại đúng `content-type`/`content-disposition`/`content-length`. Không phát hiện lỗi mới.

**Tất cả các luồng S01–S43 trong phạm vi được yêu cầu đã verify end-to-end qua browser thật (Playwright) với BE thật + Postgres thật — không còn nhánh phụ nào bỏ sót.** Gap còn lại duy nhất, đã biết và không phải lỗi: snapshot/LLM thật (S40/S43, bỏ qua theo lựa chọn người dùng — mục 5 #17). Job tự sinh Alerts đã được bổ sung sau đó — xem gap #20.

Ở mỗi bước, việc cần làm lặp lại là: (a) đối chiếu zod schema FE ↔ DTO C# BE field-by-field, (b) sửa lệch (thường là field thiếu/thừa hoặc khác tên), (c) chạy test FE liên quan + build BE để xác nhận không vỡ, (d) cập nhật bảng ở mục 5.

## 7. Cách chạy để kiểm tra tay

**DB** (xem chi tiết đầy đủ ở [`docs/DATABASE.md`](DATABASE.md) — PostgreSQL qua Docker, không phải SQL Server):
```
docker compose up -d db
cd BE
Jwt__SigningKey="tam-thoi-du-dai" dotnet ef database update --project Shared/Shared.Entities --startup-project Services/Identity.Api --context ApplicationDbContext
```

**BE** (từ `BE/`):
```
dotnet user-secrets set "Jwt:SigningKey" "<chuỗi ngẫu nhiên>" --project Gateway
dotnet user-secrets set "Jwt:SigningKey" "<chuỗi ngẫu nhiên>" --project Services/Identity.Api
dotnet user-secrets set "Jwt:SigningKey" "<chuỗi ngẫu nhiên>" --project Services/Projects.Api
dotnet user-secrets set "Jwt:SigningKey" "<chuỗi ngẫu nhiên>" --project Services/Tasks.Api
dotnet user-secrets set "Jwt:SigningKey" "<chuỗi ngẫu nhiên>" --project Services/Analytics.Api
# dùng CÙNG MỘT chuỗi cho cả 5 project — cùng Issuer/Audience, JWT ký bởi Identity.Api phải được Gateway/các service khác verify được
dotnet run --project Gateway
dotnet run --project Services/Identity.Api
dotnet run --project Services/Projects.Api
dotnet run --project Services/Tasks.Api
dotnet run --project Services/Analytics.Api
```

**FE** (từ `FE/`): đổi `.env` cục bộ (không commit) `NEXT_PUBLIC_API_MODE=http`, `NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api`, rồi `npm run dev`.

## 8. Gợi ý cho session AI sau

- Dùng `codegraph_explore` trước, không đọc file thủ công/grep mò — repo đã được index (`.codegraph/`).
- Đọc mục 5 (bảng gap) trước khi báo lại một vấn đề — tránh phát hiện lại thứ đã biết và tốn token.
- Khi đối chiếu contract FE↔BE, nơi cần nhìn luôn là: `FE/src/features/<feature>/schemas/*.schema.ts` (zod, nguồn sự thật phía FE) và `BE/Services/<Service>.Api/Models/Dtos/*.cs` (record C#, nguồn sự thật phía BE). Field thiếu ở BE thường là nguyên nhân vỡ contract, không phải lỗi logic.
- Sau khi sửa BE, chạy `dotnet build BE/DATN.slnx`. Sau khi sửa FE, chạy `npm run typecheck && npm run test` trong `FE/`. Không cần chạy full suite nếu chỉ đổi 1-2 file không liên quan — có thể chạy chọn lọc theo tên file test trước, full suite sau cùng để xác nhận.
