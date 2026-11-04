# Thiết kế các phân hệ quản trị (tham khảo DVCLT)

> Hợp đồng chung giữa BE và FE cho đợt nâng cấp khu quản trị, chốt ngày 03/11/2026.
> Nguồn ý tưởng là schema DB `DVC_OWNER` của hệ thống DVCLT (`E:\HAN\OpenData\DVCLT\DVCLT_Cu\Tai_Lieu_hon_tap\DDL_STORAGE.json`).
> Thư mục DVCLT **không có mã nguồn**; Postman chỉ chứa API tích hợp (VNeID/BHXH/VPCP), không có API quản trị.
> Vì vậy cách lưu dữ liệu được lấy theo các bảng DVCLT. Route, DTO và giao diện được thiết kế lại theo convention của DATN
> (REST tiếng Anh, camelCase, `PagedResult` → `{items, pagination}`, lỗi dẹt `{code, message}`, `If-Match` theo `version`).

Người dùng đã chốt phạm vi:
1. Phân quyền động, **thay hẳn enum `SystemRole`**.
2. Nhật ký hệ thống và giám sát job nền.
3. Cấu hình hệ thống và trang tổng quan khu admin.
4. IP whitelist cho khu admin.

Lịch làm việc (`DM_NGAYLAMVIEC`/`DM_CALAMVIEC`) **không nằm trong đợt này**.

---

## 0. Đối chiếu DVCLT → DATN

| DVCLT | Vai trò bên DVCLT | DATN |
|---|---|---|
| `DM_CHUC_NANG` (ID, MA, TEN, MO_TA, CHA_ID, SU_DUNG, DUONG_DAN, CAP_MENU, TEN_ICON) | Cây chức năng/menu | Bảng `Features` dạng cây, khoá là `Code` |
| `DM_NHOM_QUYEN` (MA, TEN, DM_CHUC_NANG = CSV mã chức năng, SU_DUNG, MO_TA, NGUOI_TAO/SUA) | Nhóm quyền | `PermissionGroups` (đã có), thêm `Code`, `IsSystem` |
| `QUYEN_NGUOI_DUNG` (NGUOIDUNGID, QUYENID) | Gán người dùng vào nhóm | `PermissionGroupMembers` (đã có) |
| `NGUOI_DUNG.IS_SYSADMIN` | Quản trị tối cao | `Users.IsSysAdmin` |
| `NGUOI_DUNG.MOREPOWER` / `DOWPOWER` | Cộng hoặc trừ quyền riêng cho một người | `Users.GrantedFeatures` / `Users.RevokedFeatures` (text[]) |
| `UD_CAUHINH` (MA, SERVICE_TYPE, CONFIG_GROUP, GIA_TRI_PRODUCTION/C06/DEV/LOCAL, DATA_TYPE, IS_ACTIVE, IS_GIAIMA, ENCRYPTION_TYPE…) | Cấu hình tập trung cho mọi service | `SystemConfigs` + thư viện `Shared.Configuration` (mục 4). **Một cột `Value` duy nhất**, **không lưu secret** (DVCLT để lộ JWT secret và mật khẩu DB dạng plaintext trong bảng này) |
| `AUDIT_LOG` | Nhật ký request/response tích hợp | `AuditLogs` (đã có, lưu before/after theo thực thể), thêm API và màn xem toàn hệ thống |
| `JOB_TASK` / `JOB_STATUS` / `JOB_LOGS` / `JOB_SETTINGS` | Hàng đợi, trạng thái, log và cấu hình job | `BackgroundJobs` (định nghĩa + cấu hình) và `JobRuns` (mỗi lần chạy kèm kết quả/lỗi) |
| `API_AUTHORIZE`, `HOSO_SYNC_*`, `LOG_MESSAGE`, `JOB_MC_FAILURE`, danh mục hành chính/BHXH | Tích hợp liên thông | Không áp dụng |
| (không có) | — | `IpWhitelistEntries`: IP whitelist khu admin (yêu cầu thêm của người dùng) |

---

## 1. Phân quyền động

### 1.1 Mã quyền

`Features` là bảng danh mục, seed bằng migration (`HasData`). Admin **không** tạo mã quyền mới qua UI, vì mỗi mã phải có code kiểm tra tương ứng. Admin chỉ bật/tắt (`IsActive`) và gom mã quyền vào nhóm.

Hai loại node:
- **Node nhóm** (`IsGroup = true`): chỉ để dựng cây, không cấp được.
- **Node quyền** (`IsGroup = false`): mã quyền thật.

| Code | Parent | Tên hiển thị | Scope | Ghi chú |
|---|---|---|---|---|
| `ADMIN` | — | Quản trị hệ thống | (nhóm) | |
| `USERS_MANAGE` | ADMIN | Quản lý người dùng | SYSTEM | đã có |
| `ORGANIZATION_MANAGE` | ADMIN | Quản lý đơn vị và team | SYSTEM | đã có |
| `PERMISSIONS_MANAGE` | ADMIN | Quản lý nhóm quyền và phân quyền | SYSTEM | **mới** |
| `AUDIT_VIEW` | ADMIN | Xem nhật ký hệ thống | SYSTEM | **mới** |
| `SETTINGS_MANAGE` | ADMIN | Cấu hình hệ thống và IP whitelist | SYSTEM | **mới** |
| `JOBS_MANAGE` | ADMIN | Giám sát và điều khiển job nền | SYSTEM | **mới** |
| `WORK` | — | Dự án và công việc | (nhóm) | |
| `PROJECT_CREATE` | WORK | Tạo dự án và giữ vai trò quản lý dự án | SYSTEM | đã có. Thay điều kiện cũ "SystemRole ≠ Employee" khi gán `ProjectRole.Manager` |
| `ANALYTICS` | — | Phân tích | (nhóm) | |
| `ANALYTICS_VIEW` | ANALYTICS | Xem phân tích mọi dự án | SYSTEM | đã có |

Các quyền theo dự án (`PROJECT_MANAGE`, `MEMBERS_MANAGE`, `TASKS_MANAGE`, `TASKS_REVIEW`, `ALERTS_MANAGE`) **không nằm trong `Features`**. Chúng vẫn suy ra từ `ProjectRole` như hiện tại và **không đổi** trong đợt này (`ProjectAccessDto` là việc T6 của chủ repo).

### 1.2 Quyền hiệu lực

```
if user.IsSysAdmin            → toàn bộ Features đang IsActive (node quyền)
else effective = ( ∪ Features của các nhóm Active mà user là thành viên  ∪  user.GrantedFeatures )
                 − user.RevokedFeatures
                 ∩ Features đang IsActive
```

Tắt một Feature (`IsActive = false`) sẽ rút mã đó khỏi mọi người, kể cả sysadmin.

### 1.3 Ràng buộc an toàn

- Phải luôn còn ít nhất **1 tài khoản Active có `IsSysAdmin = true`**. Không được khoá, bỏ cờ sysadmin hay gây mất sysadmin cuối cùng (422 `BUSINESS_RULE`). Ràng buộc này thay cho "admin cuối cùng" cũ.
- Chỉ sysadmin mới được đổi `IsSysAdmin` của người khác.
- **Chống leo thang quyền**: người có `PERMISSIONS_MANAGE` nhưng không phải sysadmin chỉ được thêm vào nhóm hoặc cộng riêng những mã mà chính họ đang có hiệu lực. Vi phạm trả 403 `FORBIDDEN`.
- Nhóm `IsSystem = true` (seed) không được vô hiệu hoá. Được đổi tên, đổi quyền, đổi thành viên.
- Đổi quyền của user hay nhóm **không** bump `TokenVersion`. Quyền được tính lại theo DB ở mỗi request (`RequiresPermission`) và ở `/auth/me`, nên token cũ không mang quyền cũ.

### 1.4 Migration dữ liệu từ `SystemRole`

Migration `ReplaceSystemRoleWithDynamicRbac`:
1. Tạo `Features` và seed như bảng 1.1.
2. Thêm cột `Code` (unique) và `IsSystem` vào `PermissionGroups`. Gán `Code` cho nhóm cũ bằng `'GROUP_' || left("Id", 8)`.
3. Seed 2 nhóm hệ thống, Id cố định:
   - `pg-admin`, code `ADMINISTRATORS`, "Quản trị viên": `USERS_MANAGE, ORGANIZATION_MANAGE, PERMISSIONS_MANAGE, AUDIT_VIEW, SETTINGS_MANAGE, JOBS_MANAGE, ANALYTICS_VIEW`
   - `pg-pm`, code `PROJECT_MANAGERS`, "Quản lý dự án (Leader/PM)": `PROJECT_CREATE`
4. Thêm `Users.IsSysAdmin bool default false`, `GrantedFeatures text[] default '{}'`, `RevokedFeatures text[] default '{}'`.
5. Chuyển dữ liệu: `SystemRole='Admin'` → `IsSysAdmin = true` và thành viên `pg-admin`. `SystemRole='Manager'` → thành viên `pg-pm`.
6. Xoá cột `Users.SystemRole`.

`BE/scripts/seed-admin.sql` được sửa: bỏ `SystemRole`, đặt `IsSysAdmin = true`.

### 1.5 Thực thi phía BE

Chuyển `RequiresPermissionAttribute` từ `Analytics.Api/Filters` sang `Shared.Entities/Authorization/` để cả 4 service cùng dùng. Gắn vào:

| Controller | Quyền |
|---|---|
| `UsersController`: list/get/create/update/lock/unlock/reset-password, PUT `/permissions` | `USERS_MANAGE` (riêng `/permissions` cần `PERMISSIONS_MANAGE`). **Không** gắn cho `GET /users/{id}/profile` |
| `UnitsController`, `TeamsController` (thao tác ghi; GET list/detail cũng chỉ dành cho admin, trừ lookup FE đang dùng chung, xem 1.6) | `ORGANIZATION_MANAGE` |
| `PermissionGroupsController`, `FeaturesController` | `PERMISSIONS_MANAGE` |
| `AuditLogsController` | `AUDIT_VIEW` |
| `SettingsController`, `IpWhitelistController` | `SETTINGS_MANAGE` |
| `JobsController` (Analytics.Api) | `JOBS_MANAGE` |
| `ProjectsController.Create` | `PROJECT_CREATE` |

1.6 **Lookup dùng chung**: các màn ngoài khu admin (chọn đơn vị khi lọc, chọn người khi thêm thành viên) đang gọi `GET /units` và `GET /users`. Trước khi gắn quyền, BE phải grep FE (`FE/src/features/**/hooks`) xem endpoint nào được gọi ngoài khu admin. Endpoint nào đang có caller ngoài admin thì **giữ cho mọi user đăng nhập**, ghi lại vào mục 7.

### 1.7 API

```
GET    /api/features                                  → FeatureDto[] (cây phẳng, FE tự dựng theo parentCode)
PATCH  /api/features/{code}        {isActive, reason} → FeatureDto      (If-Match)

GET    /api/permission-groups?q&status&page&pageSize  → Page<PermissionGroupDto>
GET    /api/permission-groups/{id}                    → PermissionGroupDto
POST   /api/permission-groups      {code,name,description?,features[],memberIds[]}
PATCH  /api/permission-groups/{id} {name?,description?,features?,reason?}   (If-Match)
PUT    /api/permission-groups/{id}/members {memberIds[],reason?}           (If-Match)
POST   /api/permission-groups/{id}/deactivate {reason}                     (If-Match)
POST   /api/permission-groups/{id}/activate   {reason}                     (If-Match)   ← mới

GET    /api/users/{id}/permissions                    → UserPermissionsDto
PUT    /api/users/{id}/permissions {isSysAdmin,grantedFeatures[],revokedFeatures[],groupIds[],reason}  (If-Match theo user.version)
```

DTO:

```ts
FeatureDto        { code, version, name, description|null, parentCode|null, isGroup, scope:"SYSTEM"|null, path|null, icon|null, sortOrder, isActive }
PermissionGroupDto{ id, version, createdAt, updatedAt, code, name, description|null, features:string[], memberIds:string[], members: {id,label}[], status:"ACTIVE"|"INACTIVE", isSystem }
UserPermissionsDto{ userId, version, isSysAdmin, groups:{id,label}[], grantedFeatures:string[], revokedFeatures:string[], effective:string[] }
```

### 1.8 Thay đổi `UserDto` và các request

- Bỏ `systemRole`. Thêm `isSysAdmin: boolean` và `groups: {id,label}[]` (nhóm Active mà user thuộc).
- `UserQuery`: bỏ `systemRole`, thêm `groupId?` và `isSysAdmin?`.
- `UserCreateRequest`: bỏ `systemRole`, thêm `groupIds: string[]` (mặc định `[]`). Quy tắc chống leo thang ở 1.3 áp dụng cho các nhóm được chọn.
- `UserPatchRequest`: bỏ `systemRole`. Đổi quyền đi qua `PUT /users/{id}/permissions`.
- `ProfileDto` (`GET /users/{id}/profile`): thay `systemRole` bằng `groups: string[]` (tên nhóm).
- JWT: bỏ claim `ClaimTypes.Role`.
- `SessionDto.user`: theo `UserDto` mới. `session.permissions` = quyền hiệu lực ở 1.2.

---

## 2. Nhật ký hệ thống

Bảng `AuditLogs` giữ nguyên schema (`Id, EntityType, EntityId, ActorId, Action, At, BeforeJson, AfterJson, Reason`). Thêm index `(At desc)` và `(ActorId, At)`.

```
GET /api/audit-logs?q&entityType&actorId&action&from&to&page&pageSize  → Page<AuditLogRowDto>   (sắp At desc)
GET /api/audit-logs/{id}                                              → AuditLogDto
GET /api/audit-logs/entity-types                                      → string[] (distinct, cho bộ lọc)
```

```ts
AuditLogRowDto { id, at, entityType, entityId, action, actor:{id,label}, reason|null }
AuditLogDto    = AuditLogRowDto & { before: unknown|null, after: unknown|null }   // parse từ *Json
```

- `q` tìm trong `EntityId`, `Action`, `Reason`.
- `actor.label` là `DisplayName`. `ActorId = "SYSTEM"` → label "Hệ thống".
- Đặt ở Identity.Api.

---

## 3. Job nền

### 3.1 Bảng

```
BackgroundJobs  Code PK, Name, Description, IsEnabled, IntervalMinutes (1..1440), LastRunAt?, NextRunAt?, LastStatus? ("SUCCEEDED"|"FAILED"|"RUNNING"), Version, UpdatedAt
JobRuns         Id PK, JobCode FK, StartedAt, FinishedAt?, Status, Trigger ("SCHEDULE"|"MANUAL"), TriggeredBy?, SummaryJson?, Error? (≤4000)
```

Seed job `ALERT_GENERATION` ("Sinh cảnh báo tự động"), enabled, interval 15. Lần đầu khởi động, nếu chưa có cấu hình trong DB thì lấy `AlertGeneration:*` trong appsettings làm mặc định. Sau đó **DB là nguồn sự thật**.

### 3.2 Hành vi

- `AlertGenerationBackgroundService` đổi thành vòng lặp tick 30 giây. Mỗi tick đọc `BackgroundJobs`, chạy job nào `IsEnabled && now >= NextRunAt`.
- Mỗi lần chạy ghi một `JobRuns` (RUNNING → SUCCEEDED/FAILED), cập nhật `LastRunAt`, `LastStatus`, `NextRunAt = now + interval`.
- `GenerateAsync` trả summary `{created, updated, deactivated}`, lưu vào `SummaryJson`.
- Chạy thủ công: chạy **đồng bộ trong request**, dùng chung một `SemaphoreSlim` tĩnh với background service để không chạy trùng. Nếu đang chạy thì trả 409 `CONFLICT` "Job đang chạy".
- Giữ tối đa 200 `JobRuns` gần nhất cho mỗi job, dọn sau mỗi lần chạy.

### 3.3 API (Analytics.Api, route `/api/jobs`)

```
GET   /api/jobs                               → BackgroundJobDto[]
PATCH /api/jobs/{code} {isEnabled?, intervalMinutes?, reason?}  (If-Match) → BackgroundJobDto
POST  /api/jobs/{code}/run                    → JobRunDto
GET   /api/jobs/{code}/runs?page&pageSize&status → Page<JobRunDto>
```

```ts
BackgroundJobDto { code, version, name, description|null, isEnabled, intervalMinutes, lastRunAt|null, nextRunAt|null, lastStatus|null, updatedAt }
JobRunDto        { id, jobCode, startedAt, finishedAt|null, durationMs|null, status, trigger, triggeredBy:{id,label}|null, summary: Record<string,number>|null, error|null }
```

PATCH ghi `AuditLogs` (EntityType `BackgroundJob`).

---

## 4. Cấu hình tập trung (cập nhật 03/11/2026 theo yêu cầu người dùng)

Mô phỏng `UD_CAUHINH` của DVCLT: cấu hình nằm trong DB, mọi service đọc qua một thư viện dùng chung. Khác DVCLT:
- **Chỉ một cột giá trị `Value`.** DVCLT tách `GIA_TRI_PRODUCTION/C06/DEV/LOCAL`; DATN coi mỗi môi trường là một DB riêng.
- Bỏ `IS_GIAIMA`/`ENCRYPTION_TYPE`: không lưu secret.
- Bỏ cặp cột soft-delete, dùng `IsActive` thay.
- Không có cột `DefaultValue`/`Min`/`Max`. Ràng buộc của các key đã biết nằm trong code (`ConfigCatalog`).

### 4.1 Bảng `SystemConfigs` (thay `SystemSettings` của bản trước)

```
Id PK (string), Key (varchar 200, đường dẫn IConfiguration, ví dụ "Auth:MaxFailedAttempts"),
ServiceType (varchar 50: "Global" | "Gateway" | "Identity.Api" | "Projects.Api" | "Tasks.Api" | "Analytics.Api"),
Group (varchar 50), Name (varchar 255), Description?, DataType ("INT"|"BOOL"|"STRING"),
Value (text)  ← cột giá trị DUY NHẤT
IsActive, Version, CreatedAt, UpdatedAt, UpdatedBy?
UNIQUE (Key, ServiceType)
```

Seed:

| Key | ServiceType | Group | DataType | Value | Ràng buộc (ConfigCatalog) | Nơi dùng |
|---|---|---|---|---|---|---|
| `Jwt:Issuer` | Global | JWT | STRING | `datn-identity` | khởi động lại | mọi service + Gateway |
| `Jwt:Audience` | Global | JWT | STRING | `datn-clients` | khởi động lại | mọi service + Gateway |
| `Jwt:AccessTokenHours` | Identity.Api | JWT | INT | 8 | 1–24 | `TokenService` |
| `Auth:MaxFailedAttempts` | Identity.Api | AUTH | INT | 5 | 3–20 | `AuthService` (`IOptionsMonitor<AuthOptions>`) |
| `Security:AdminIpWhitelistEnabled` | Global | SECURITY | BOOL | false | — | `[AdminArea]` |
| `Serilog:MinimumLevel` | Global | LOGGING | STRING | Information | Verbose/Debug/Information/Warning/Error/Fatal, khởi động lại | Serilog |

**Cấm lưu secret**: key khớp `(?i)(^ConnectionStrings:|password|secret|signingkey|apikey|privatekey)` hoặc bắt đầu bằng `CentralConfig:`/`Kestrel:` bị từ chối (422).

### 4.2 Thư viện dùng chung `BE/Shared/Shared.Configuration`

- `builder.AddCentralConfiguration("<ServiceType>")` được gọi ở `Program.cs` của cả 5 tiến trình (Gateway + 4 service).
  1. Nạp **file bootstrap chung** `BE/appsettings.Shared.json`. File này **gitignore**; có `appsettings.Shared.example.json` đi kèm làm mẫu. Nó chứa đúng những thứ không thể nằm trong DB: `ConnectionStrings:DefaultConnection`, `Jwt:SigningKey`. Đường dẫn tìm bằng cách đi ngược từ content root lên, hoặc đặt qua biến `DATN_SHARED_SETTINGS`.
  2. Nạp các dòng `IsActive` có `ServiceType IN ('Global', <service>)` từ `SystemConfigs` bằng Npgsql thuần (không qua EF). Dòng theo service ghi đè dòng `Global`.
  3. **Thứ tự ưu tiên** từ thấp lên cao: `appsettings.json` của service → `appsettings.Shared.json` → **DB** → user-secrets → biến môi trường. Nhờ vậy secret và cấu hình cứu hộ qua biến môi trường luôn thắng DB.
  4. Tự reload sau mỗi `CentralConfig:ReloadSeconds` giây (mặc định 30), chỉ phát `OnReload` khi dữ liệu thật sự đổi. Code đọc qua `IConfiguration`/`IOptionsMonitor` nên thấy giá trị mới mà không cần khởi động lại, trừ các key có cờ "khởi động lại".
  5. Nếu bảng chưa tồn tại (trước migration) hoặc DB lỗi lúc khởi động thì ghi cảnh báo, chạy tiếp bằng file cấu hình.
- `ICentralConfigReloader.Reload()` (singleton) để Identity.Api nạp lại ngay sau khi PATCH.
- `ConfigCatalog` định nghĩa các key đã biết: DataType, min/max, danh sách giá trị cho phép, `RequiresRestart`, mô tả.
- `ISettingsProvider` của bản trước **bị bỏ**. Code đọc thẳng `IConfiguration`.

### 4.3 API (Identity.Api, quyền `SETTINGS_MANAGE`, `[AdminArea]`)

```
GET   /api/settings?serviceType&group&q                     → SystemConfigDto[]   (sắp ServiceType, Group, Key)
POST  /api/settings {key, serviceType, group, name, description?, dataType, value}   → SystemConfigDto (200, cùng quy ước các API tạo khác)
PATCH /api/settings/{id} {value?, name?, description?, isActive?, reason}  (If-Match) → SystemConfigDto
```

```ts
SystemConfigDto { id, version, key, serviceType, group, name, description|null, dataType:"INT"|"BOOL"|"STRING", value:string, isActive,
                  known:boolean, requiresRestart:boolean, minValue:number|null, maxValue:number|null, allowedValues:string[]|null,
                  createdAt, updatedAt, updatedBy:{id,label}|null }
```

- `known`, `requiresRestart`, `minValue`, `maxValue`, `allowedValues` được **tính từ `ConfigCatalog`**, không phải cột DB.
- Validate theo DataType và catalog. Sai trả 422 kèm `fieldErrors` path `["value"]`. Key đã tồn tại với cùng ServiceType trả 409 `CONFLICT`. Key bị cấm trả 422 path `["key"]`.
- Không cho tắt (`isActive=false`) key `known` có `RequiresRestart` thuộc nhóm JWT (422).
- Ghi `AuditLogs` (EntityType `SystemConfig`). Sau khi lưu gọi `ICentralConfigReloader.Reload()`.
- Bật `Security:AdminIpWhitelistEnabled` thì áp dụng chống tự khoá ở mục 5.3.

---

## 5. IP whitelist khu admin

### 5.1 Bảng `IpWhitelistEntries`

```
Id PK, Cidr (varchar 64, IPv4/IPv6 hoặc CIDR, ví dụ "10.0.0.0/24", "::1/128", "203.113.1.5"), Description?, IsActive, Version, CreatedAt, UpdatedAt, CreatedBy
```

### 5.2 API (Identity.Api, quyền `SETTINGS_MANAGE`)

```
GET    /api/ip-whitelist                    → { enabled:boolean, settingId:string, settingVersion:number, currentIp:string, entries: IpWhitelistEntryDto[] }
       (bật/tắt = PATCH /api/settings/{settingId} {value:"true"|"false", reason} với If-Match settingVersion)
POST   /api/ip-whitelist  {cidr, description?}            → IpWhitelistEntryDto
PATCH  /api/ip-whitelist/{id} {cidr?, description?, isActive?, reason?} (If-Match)
DELETE /api/ip-whitelist/{id}  (If-Match)
```

```ts
IpWhitelistEntryDto { id, version, cidr, description|null, isActive, createdAt, updatedAt, createdBy:{id,label}|null }
```

`currentIp` để admin biết IP của mình trước khi bật whitelist.

### 5.3 Thực thi

- Attribute `[AdminArea]` (`Shared.Entities/Authorization/AdminAreaAttribute.cs`) gắn vào mọi controller/action quản trị ở 1.5 (trừ `GET /users/{id}/profile` và các lookup ở 1.6) và `JobsController`.
- Khi `Security:AdminIpWhitelistEnabled = true`: IP client phải khớp ít nhất một entry `IsActive`. Không khớp → 403 `{ code: "IP_NOT_ALLOWED", message: "Địa chỉ IP của bạn không được phép truy cập khu quản trị." }`.
- IP client: dùng `UseForwardedHeaders` chuẩn với `ForwardedHeaders.XForwardedFor`, `KnownProxies` = loopback, vì Gateway YARP chạy cùng máy và forward `X-Forwarded-For`. **Không** tự parse header ở nhiều nơi (anti-pattern C.10 trong `REFERENCE_PATTERNS.md`).
- **Chống tự khoá**: nếu thay đổi khiến IP hiện tại của người thao tác không còn khớp entry Active nào trong khi whitelist đang hoặc sắp được bật (bật setting, tắt/xoá/sửa entry), BE trả 422 `BUSINESS_RULE` "Thao tác này sẽ chặn chính IP hiện tại của bạn (x.x.x.x)."
- Cứu hộ khi bị khoá: `UPDATE "SystemConfigs" SET "Value"='false' WHERE "Key"='Security:AdminIpWhitelistEnabled';` (ghi trong `docs/DATABASE.md`), hoặc đặt biến môi trường `Security__AdminIpWhitelistEnabled=false`, vì biến môi trường thắng DB.

---

## 6. FE

### 6.1 Điều hướng khu admin

Giữ khu `(admin)` tách riêng (T2 đã chốt). Sidebar admin chia nhóm:

```
Tổng quan                 /admin                   (bất kỳ quyền ADMIN nào)
Người dùng & tổ chức
  Người dùng              /admin/users              USERS_MANAGE
  Đơn vị                  /admin/organization       ORGANIZATION_MANAGE
  Team                    /admin/teams              ORGANIZATION_MANAGE
Phân quyền
  Nhóm quyền              /admin/permission-groups  PERMISSIONS_MANAGE
  Danh mục chức năng      /admin/features           PERMISSIONS_MANAGE
Giám sát
  Nhật ký hệ thống        /admin/audit-logs         AUDIT_VIEW
  Job nền                 /admin/jobs               JOBS_MANAGE
Cấu hình
  Cấu hình tập trung      /admin/settings           SETTINGS_MANAGE
  IP whitelist            /admin/ip-whitelist       SETTINGS_MANAGE
```

`canAdminister` = có ít nhất một mã trong nhóm ADMIN.

### 6.2 Màn hình

Tất cả màn dùng lại `DataTable`, `Panel`, `Form`, các trạng thái loading/error/empty, `HashDialog` và `ActionButton` đang có, theo typography trong `FE/AGENTS.md`. Không thêm thư viện UI.

- **Tổng quan `/admin`**: thay `AdminIndex` (trước đây chỉ redirect). Hiển thị một hàng KPI (tài khoản hoạt động/bị khoá, nhóm quyền, trạng thái IP whitelist), thẻ "Job nền" (trạng thái lần chạy cuối của từng job), "Thao tác gần đây" (10 audit log mới nhất) và lối tắt tới từng mục. Mỗi khối chỉ hiện khi có quyền tương ứng. Dữ liệu ghép từ các API sẵn có, **không thêm endpoint overview**.
- **Nhóm quyền** (list + detail/editor): list có cột mã, tên, số thành viên, số quyền, trạng thái, "Hệ thống". Detail có 2 tab:
  - "Quyền": cây Feature có checkbox. Tick node nhóm sẽ tick/bỏ tick toàn bộ con, trạng thái nửa chọn (indeterminate) khi chỉ chọn một phần. Mã đã bị tắt hiện mờ kèm nhãn "Đang tắt".
  - "Thành viên": chọn nhiều user.
- **Danh mục chức năng**: cây đọc, bật/tắt từng mã (bắt buộc nhập lý do, dialog xác nhận).
- **Người dùng**:
  - List: bỏ bộ lọc vai trò, thêm lọc nhóm quyền. Cột "Nhóm quyền" hiện tối đa 2 nhãn + "+n". Badge "Sysadmin".
  - Form tạo: chọn nhóm quyền.
  - Chi tiết: thêm tab "Phân quyền" gồm cờ sysadmin (chỉ sysadmin thấy công tắc), chọn nhóm, cây quyền 3 trạng thái cho từng mã (Theo nhóm / Cộng thêm / Thu hồi) và cột "Hiệu lực" để xem trước.
- **Nhật ký hệ thống**: bảng có lọc thời gian (from/to), loại đối tượng, người thao tác, hành động, ô tìm kiếm. Bấm một dòng mở drawer 420px (pattern drawer lịch sử đang có) so sánh before/after theo từng field, field thay đổi được tô nổi.
- **Job nền**: bảng job (bật/tắt, chu kỳ, lần chạy cuối, lần kế tiếp, trạng thái), nút "Chạy ngay" (ActionButton có pending). Bấm một job mở bảng lịch sử chạy (thời lượng, trigger, summary, lỗi mở bằng details).
- **Cấu hình tập trung** (`/admin/settings`, tên menu "Cấu hình tập trung"): lọc theo ServiceType (Global/Gateway/Identity…), Group và ô tìm key. Bảng nhóm theo Group, cột gồm Key (mono), ServiceType, Tên/mô tả, Giá trị, Trạng thái, cùng badge "Cần khởi động lại" và "Tuỳ biến" (`known=false`). Sửa trong dialog: input theo DataType (BOOL dùng switch, có `allowedValues` thì dùng select, INT dùng number có min/max), bắt buộc nhập lý do. 412 hiện lỗi xung đột theo pattern sẵn có. Nút "Thêm cấu hình" mở form tạo key mới. Bật/tắt dòng. **Không** có "Khôi phục mặc định" vì DB chỉ có một cột giá trị.
- **IP whitelist**: banner trạng thái (bật/tắt + IP hiện tại của bạn), công tắc bật/tắt (thực chất `PATCH /settings/{settingId}`), bảng entry (thêm/sửa/tắt/xoá). Nút "Thêm IP hiện tại". Lỗi 422 chống tự khoá hiện ngay tại form.
- Lỗi `IP_NOT_ALLOWED` ở bất kỳ màn admin nào hiện trạng thái lỗi quyền riêng: "IP của bạn không được phép…", kèm IP nếu có.

### 6.3 Mock (MSW)

Theo `FE/AGENTS.md`: seed/policy trong `data.json`, logic trong `db.ts`, handler mỏng.
- `permissionPolicy.system` (theo role) **bị bỏ**. Thay bằng `features` và `permissionGroups` có `code/name/isSystem/memberIds`, cùng `users[].isSysAdmin/grantedFeatures/revokedFeatures`.
- Chuyển seed: `u-admin` → sysadmin + `ADMINISTRATORS`. `u-pm`, `u-other` → `PROJECT_MANAGERS`. Còn lại không nhóm.
- `projectPermissions`: điều kiện "MANAGER chỉ hiệu lực với systemRole MANAGER" đổi thành "có `PROJECT_CREATE` hiệu lực".
- Mock cho audit logs (đọc `db.audits`), jobs (job giả có lịch sử, "Chạy ngay" sinh một run SUCCEEDED), settings, ip-whitelist (`currentIp` cố định `127.0.0.1`).

---

## 7. Ghi chú triển khai

(BE/FE bổ sung khi làm: lookup giữ công khai, quyết định lệch so với thiết kế, việc còn dở.)

### 7.1 BE (03/11/2026)

- **Lookup (1.6)**: grep `FE/src/features/**` cho thấy `GET /users`, `/units`, `/teams` **chỉ** được gọi từ màn trong `(admin)` (users, organization, teams, editor đơn vị/team/user). Màn ngoài admin chỉ gọi `GET /users/{id}/profile`. Vì vậy không endpoint nào giữ mở cho mọi user; thay vào đó các picker chéo giữa các màn admin nhận **một trong nhiều** quyền:
  - `GET /users` (list): `USERS_MANAGE` | `ORGANIZATION_MANAGE` | `PERMISSIONS_MANAGE` (picker trưởng đơn vị, thành viên team, thành viên nhóm quyền).
  - `GET /units` (list): `ORGANIZATION_MANAGE` | `USERS_MANAGE` (lọc/chọn đơn vị ở màn người dùng).
  - `GET /permission-groups` (list): `PERMISSIONS_MANAGE` | `USERS_MANAGE` (chọn nhóm khi tạo user, lọc theo nhóm).
  - Còn lại đúng bảng 1.5. `GET /users/{id}/profile` chỉ cần đăng nhập, không `[AdminArea]`.
- **`GET /users/{id}/profile`** trước đây BE chưa có (FE đã gọi) — nay có, trả `ProfileDto {id, displayName, avatarUrl:null, email, unit:<tên đơn vị>, groups:<tên nhóm Active>[]}`.
- **422 `BUSINESS_RULE`** là mã mới (`UnprocessableRuleException`): sysadmin cuối cùng, chống tự khoá IP, vô hiệu hoá nhóm hệ thống, bật/tắt node nhóm Feature. Các `BusinessRuleException` cũ vẫn là 409 `CONFLICT` (kể cả "Job đang chạy").
- **Lệch thiết kế**:
  - Không cho tắt `PERMISSIONS_MANAGE` (422) — tắt nó rút quyền cả sysadmin và không ai bật lại được qua UI. Node nhóm (`ADMIN`, `WORK`, `ANALYTICS`) không PATCH được (422).
  - `PATCH /alerts/{id}` đổi từ `ALERTS_MANAGE` sang `ANALYTICS_VIEW`: `ALERTS_MANAGE` là quyền theo dự án, không còn cấp hệ thống được qua `Features`; chờ T6 (`ProjectAccessDto`) để suy theo `ProjectRole`.
  - Migration tên `AdminModulesAndDynamicRbac` (gộp 1.4 với bảng của mục 2–5), không phải `ReplaceSystemRoleWithDynamicRbac`.
  - `[AdminArea]` không gắn cho `POST /projects` (tạo dự án là màn workspace, không phải khu admin) — chỉ gắn `RequiresPermission(PROJECT_CREATE)`.
  - Chống leo thang chỉ xét **phần thêm mới**: mã thêm vào nhóm, mã cộng riêng mới, nhóm mới gán cho user, và toàn bộ quyền của nhóm khi thêm thành viên mới / kích hoạt lại nhóm.
  - Job `ALERT_GENERATION` không seed bằng `HasData`: lần khởi động đầu Analytics.Api tạo dòng từ `AlertGeneration:*` (mặc định enabled/15). Lần chạy còn `RUNNING` lúc khởi động được đánh `FAILED`. Chạy job (thủ công hay theo lịch) không tăng `version` của job.
  - `DELETE /ip-whitelist/{id}` trả `{ ok: true }`. `IP_NOT_ALLOWED` kèm `details: { ip }`.
  - `before`/`after` của audit log giữ nguyên key như lúc ghi (PascalCase, ví dụ `DisplayName`).
- **Còn dở**: nhóm cũ có mã quyền theo dự án (ví dụ `ALERTS_MANAGE`) trong `Features` vẫn giữ nguyên trong DB — evaluator bỏ qua, nhưng PATCH nhóm đó gửi lại nguyên danh sách sẽ bị 422 tới khi bỏ các mã đó.

### 7.2 Cấu hình tập trung + Neon (03/11/2026)

- `SystemSettings` (bản BE đầu) được thay bằng `SystemConfigs` qua migration `CentralSystemConfigs` (migration riêng, không sửa `AdminModulesAndDynamicRbac` vì đã có data move viết tay). `ISettingsProvider` bị xoá; `AuthService`/`TokenService` dùng `IOptionsMonitor<AuthOptions/JwtOptions>`, `[AdminArea]` đọc `IConfiguration`.
- Thư viện `BE/Shared/Shared.Configuration`: `CentralConfigurationProvider` (Npgsql thuần, reload 30s, chỉ `OnReload` khi đổi), `ConfigCatalog`, `AddCentralConfiguration`, `ICentralConfigReloader`. `Shared.Entities` tham chiếu nó; Gateway tham chiếu trực tiếp.
- Khối `ConnectionStrings`/`Jwt`/`Auth` bị bỏ khỏi `appsettings.json` của 5 tiến trình → `BE/appsettings.Shared.json` (gitignore) + bảng `SystemConfigs`.
- DB thật: Neon PostgreSQL, đã áp 5 migration và nạp dữ liệu mẫu bằng `BE/Tools/DataSeeder` (nguồn `FE/src/mocks/data.json`).
- **Đã kiểm chứng chạy thật** (5 tiến trình + Neon, qua Gateway): đăng nhập 3 vai; quyền hiệu lực admin/minh đúng; lan bị 403 ở `/users`, `/settings`, `/jobs`, `/audit-logs` nhưng vẫn 200 ở `/projects` và profile; sửa `Jwt:AccessTokenHours` 8→2 thì token mới hết hạn sau 2h **không cần khởi động lại**; ngoài khoảng → 422 path `value`; If-Match cũ → 412; key `Smtp:Password` → 422 path `key`; trùng key → 409; chạy job thủ công → SUCCEEDED, sinh 5 cảnh báo thật; bật whitelist → API admin vẫn 200 với IP 127.0.0.1, tắt entry duy nhất khớp → 422 `BUSINESS_RULE`; FE zod schema parse được response thật của 17 endpoint (test tạm, đã xoá).

### 7.3 FE (03/11/2026, tóm tắt báo cáo của agent FE)

- `systemRole` bị bỏ toàn bộ; mock có `features`, 3 nhóm (`pg-admin`, `pg-pm`, `pg-analytics`), 6 dòng cấu hình + `configPolicy`, IP whitelist, job + lịch sử chạy; 25 route mock mới (tổng 108), đã thêm vào `fe-specs/api/API_CATALOG.md`.
- Thay đổi hành vi cần biết: sysadmin nhận mọi mã đang bật nên `u-admin` giờ xem được phân tích và tạo dự án (khác quy tắc 30/10 trong `FE/AGENTS.md` "admin không có analytics"); bỏ luật mock cũ chặn hạ vai trò người còn quản lý dự án (`HANDOVER_REQUIRED`).
- Lựa chọn khi đặc tả chưa nói: mã quyền lạ → 422 `VALIDATION_ERROR`; trùng mã nhóm → 409 trên field `code`; mã nhóm chỉ gồm chữ in hoa/số/`_`; bộ lọc audit `from`/`to` là timestamp đầy đủ theo giờ VN, `action` so khớp chính xác; tắt/bật dòng cấu hình là thao tác riêng với sửa giá trị.
- Bộ lọc theo quyền: lọc "người thao tác" ở nhật ký cần `USERS_MANAGE`; lọc/chọn nhóm ở màn người dùng cần `PERMISSIONS_MANAGE`.
- Còn lại: mock chạy job đồng bộ (409 "đang chạy" chỉ test bằng cách ép trạng thái); IPv6 ở mock chỉ so khớp chính xác; picker người dùng/nhóm tải tối đa 100 bản ghi; chưa QA trên trình duyệt (theo `FE/AGENTS.md`).


---

## 8. Dấu vết tạo/sửa (CreatedBy/UpdatedBy) — bổ sung 03/11/2026

Ý tưởng lấy từ bộ cột `NGUOI_TAO/NGAY_TAO/NGUOI_SUA/NGAY_SUA` của DVCLT (`NGUOI_DUNG`, `DM_NHOM_QUYEN`, `DM_NGAYLAMVIEC`…). Khác DVCLT: DATN **không** để từng service tự gán. Một `SaveChangesInterceptor` dùng chung tự điền, nên không chỗ nào quên được.

### 8.1 Phân tích theo bảng

Nguyên tắc: chỉ thêm khi bảng **sửa được**, có thể **do người khác** với người tạo sửa, và **chưa có** cột người thao tác nào trả lời được câu hỏi "ai tạo, ai sửa cuối".

| Nhóm | Bảng | Thêm | Lý do |
|---|---|---|---|
| **A. Thêm `CreatedBy` + `UpdatedBy`** | `Users` | cả hai | Admin tạo/sửa/khoá/mở khoá; khoá tự động do sai mật khẩu ghi là `SYSTEM` |
| | `Units`, `Teams` | cả hai | Dữ liệu tổ chức, nhiều admin cùng sửa |
| | `PermissionGroups` | cả hai | Thay đổi quyền cần biết ai làm (DVCLT `DM_NHOM_QUYEN` có NGUOI_TAO/NGUOI_SUA) |
| | `Projects` | cả hai | `OwnerId` là người phụ trách, **không phải** người tạo (admin/PM có thể tạo hộ); sửa kế hoạch, kích hoạt, đóng, huỷ do nhiều người |
| | `ProjectMemberships` | cả hai | Ai thêm thành viên, ai đổi vai trò hoặc kết thúc tư cách |
| | `Tasks` | cả hai | Hiện **không có** cột người tạo; sửa nội dung, đổi hạn, ước lượng do quản lý; trạng thái do người nhận |
| | `Alerts` | cả hai | Tạo bởi job (`SYSTEM`), cập nhật bởi job hoặc người xử lý. `HandledBy` chỉ ghi lần xử lý |
| **B. Bổ sung cột còn thiếu** | `SystemConfigs` | `CreatedBy` | Đã có `UpdatedBy`; cần biết ai thêm key tuỳ biến |
| | `IpWhitelistEntries` | `UpdatedBy` | Đã có `CreatedBy`; ai bật/tắt/sửa entry |
| | `Features` | `UpdatedBy` | Seed bằng migration nên không có người tạo; ai bật/tắt mã quyền |
| | `BackgroundJobs` | `UpdatedBy` | Tạo khi khởi động; ai đổi chu kỳ hoặc bật/tắt |
| **C. Không thêm** | `TimeLogs` | — | Chỉ chủ nhật ký được tạo/sửa/loại (`UserId` = người tạo = người sửa) |
| | `Reports` | — | Chỉ tác giả thao tác (`AuthorId`) |
| | `Submissions` | — | `SubmittedBy`/`SubmittedAt` + `ReviewedBy`/`ReviewedAt` đã đủ |
| | `Attachments` | — | `UploadedBy`, không sửa sau khi tải lên |
| | `TaskAssignments` | — | Chỉ thêm, có `AssignedBy` + `StartedAt` |
| | `AuditLogs`, `JobRuns` | — | Bản thân là nhật ký (`ActorId`, `TriggeredBy`) |
| | `TeamMembers`, `PermissionGroupMembers` | — | Bảng nối, thay đổi ghi vào `UpdatedBy` + audit log của bảng cha |

### 8.2 Cách điền (BE)

- Cột `CreatedBy`/`UpdatedBy`: `text NULL`, giá trị là `Users.Id` hoặc `"SYSTEM"`. Không có FK, vì có `"SYSTEM"` và cần giữ lịch sử khi xoá người.
- Interface `ICreateStamped { CreatedAt, CreatedBy }` và `IUpdateStamped { UpdatedAt, UpdatedBy }` trong `Shared.Entities`.
- `AuditStampInterceptor` (đăng ký trong `AddEntityServices`):
  - Khi Added: điền `CreatedAt` (nếu chưa có), `CreatedBy`, `UpdatedAt`, `UpdatedBy`.
  - Khi Modified: điền `UpdatedAt` và `UpdatedBy`.
  - Người thao tác lấy từ claim `NameIdentifier` của request hiện tại. Không có request (job nền, khoá tự động khi đăng nhập sai) thì ghi `"SYSTEM"`.
- Cột kỹ thuật gắn `[NoAuditStamp]`: nếu một lần lưu **chỉ** đổi các cột này thì không đóng dấu, để đăng nhập hay chạy job không ghi đè người sửa thật. Gồm `User.FailedLoginCount`, `User.TokenVersion`, `BackgroundJob.LastRunAt/NextRunAt/LastStatus`.
- Migration `AddAuditStamps` **backfill** từ `AuditLogs`: `CreatedBy` = actor của bản ghi sớm nhất theo `(EntityType, EntityId)`, `UpdatedBy` = actor của bản ghi mới nhất. Dòng không có lịch sử giữ `NULL` (FE hiển thị "Không rõ").
- `DataSeeder` gán người tạo hợp lý cho dữ liệu mẫu:
  - đơn vị, team, tài khoản, nhóm quyền → `u-admin`
  - dự án và thành viên → `ownerId` của dự án
  - công việc → owner dự án; `UpdatedBy` = người nhận nếu việc đã bắt đầu
  - cảnh báo → `SYSTEM`; `UpdatedBy` = `handledBy` nếu có

### 8.3 Hợp đồng API

Mọi dấu vết người dùng **một hình dạng**: `{ id, label } | null`. `"SYSTEM"` trả `{ id: "SYSTEM", label: "Hệ thống" }`. Người đã bị xoá trả `{ id, label: id }`.

| DTO | Thêm field |
|---|---|
| `UserDto`, `UnitDto`, `TeamDto`, `PermissionGroupDto` (Identity) | `createdBy`, `updatedBy` |
| `ProjectDto` (Projects), `TaskDto` (Tasks), `AlertDto` (Analytics) | `createdBy`, `updatedBy` |
| `MembershipDto` (Projects) | `createdAt`, `createdBy`, `updatedAt`, `updatedBy` |
| `SystemConfigDto` | `createdBy` |
| `IpWhitelistEntryDto` | `updatedBy` |
| `FeatureDto` | `updatedAt`, `updatedBy` |
| `BackgroundJobDto` | `updatedBy` |

Session (`/auth/me`), `ProfileDto` và các DTO dạng row riêng **không** thêm dấu vết.

### 8.4 FE

- Thêm `createdBy`/`updatedBy` (`refSchema.nullable()`) và các mốc thời gian còn thiếu vào schema tương ứng. Schema `.strict()` (ví dụ alert) bắt buộc phải thêm.
- Component dùng chung `RecordStamp` (`components/ui`): "Tạo bởi **X** · dd/MM/yyyy HH:mm" và "Cập nhật lần cuối bởi **Y** · dd/MM/yyyy HH:mm", `null` hiển thị "Không rõ", metadata 12–13px theo `FE/AGENTS.md`. Đặt ở:
  - trang chi tiết user, đơn vị, team, nhóm quyền (admin)
  - tổng quan dự án, cột ngữ cảnh chi tiết công việc, chi tiết cảnh báo
- Bảng có cột hoặc tooltip "Cập nhật bởi": cấu hình tập trung, IP whitelist, job nền, danh mục chức năng. Bảng thành viên dự án có cột "Thêm bởi".
- Mock `db.ts` đóng dấu khi tạo/sửa bằng viewer hiện tại; seed `data.json` gán người tạo giống `DataSeeder` (8.2).

---

## 9. Mẫu giao diện Xem/Sửa/Thêm bằng dialog (yêu cầu người dùng 03/11/2026)

Người dùng thấy drawer bên phải và trang chi tiết riêng bất tiện. Khu quản trị chuyển sang mẫu của DVCLT: **một dialog (modal) dùng chung cho Thêm mới, Sửa và Xem**; ở chế độ Xem mọi trường bị disable.

- Mỗi thực thể có **một** component form nhận `mode: "create" | "edit" | "view"`, bọc trong dialog chung (dựng trên `HashDialog`/Radix sẵn có):
  - Chế độ Xem: `<fieldset disabled>`, footer có [Đóng] và [Chỉnh sửa] (chỉ khi có quyền).
  - Chế độ Sửa/Thêm: footer có [Huỷ] và [Lưu].
  - Header gồm tiêu đề, trạng thái và `RecordStamp`.
  - Đóng khi form dirty thì dùng `confirmDiscard` như hiện tại.
- Kích thước: `md` ~640px cho form đơn giản; `lg` ~960px cho form có tab hoặc cây quyền. Chiều cao tối đa 85vh, header/footer dính, thân cuộn.
- Trạng thái nằm trên URL để F5, Back và chia sẻ link vẫn đúng: `?dialog=create`, `?dialog=view&id=…`, `?dialog=edit&id=…`. Các route cũ (`/admin/users/new`, `/admin/users/[id]`, `/admin/organization/[unitId]`, `/admin/teams/[teamId]`, `/admin/permission-groups/[groupId]`, `…/new`) chuyển hướng về trang danh sách kèm tham số dialog tương ứng.
- Trang danh sách: nút "Thêm mới" ở header; cột Hành động có [Xem] và [Sửa]. Các thao tác đặc thù (khoá/mở khoá, cấp lại mật khẩu, ngừng sử dụng, bật/tắt, chạy job, xoá) giữ dạng confirm dialog nhỏ như hiện tại, gọi được từ dialog Xem.
- Áp dụng cho:
  - **Người dùng**: tab Thông tin / Phân quyền trong dialog.
  - **Đơn vị**, **Team**.
  - **Nhóm quyền**: tab Thông tin / Quyền (cây) / Thành viên.
  - **Cấu hình tập trung**: form tạo và sửa dùng chung; ở chế độ Sửa thì `key`, `serviceType`, `dataType` bị khoá.
  - **IP whitelist**.
  - **Danh mục chức năng**: Xem + bật/tắt.
  - **Job nền**: Xem gồm thông tin + lịch sử chạy; Sửa gồm bật/tắt + chu kỳ.
  - **Nhật ký hệ thống**: dialog chỉ xem, **thay drawer bên phải**.
- Không đổi trong đợt này: trang chi tiết dự án/công việc ở khu làm việc và drawer lịch sử 420px của chúng (quy tắc riêng trong `FE/AGENTS.md`) — chờ người dùng quyết định.

---

## 10. Theo dõi IP chưa có rule + thông báo truy cập rõ ràng (yêu cầu người dùng 03/11/2026)

### 10.1 Phạm vi whitelist

Thêm cấu hình `Security:IpWhitelistScope` (Global, STRING, `ADMIN` | `SYSTEM`, mặc định `ADMIN`):

- `ADMIN`: như cũ, chỉ chặn API khu quản trị (`[AdminArea]`).
- `SYSTEM`: chặn **mọi** API ở cả 4 service, kể cả `POST /auth/login`. Người ngoài danh sách không đăng nhập được.

Chống tự khoá (§5.3) áp dụng cho cả hai phạm vi. Cứu hộ: biến môi trường `Security__AdminIpWhitelistEnabled=false`.

### 10.2 Nhật ký IP chưa có rule — bảng `IpAccessLogs`

Một dòng gộp cho mỗi cặp `(Ip, Scope)`:

```
Id, Version, Ip, Scope ("ADMIN"|"SYSTEM"), FirstSeenAt, LastSeenAt, HitCount, BlockedCount,
LastUserId?, LastUsername?, LastPath, Status ("PENDING"|"ALLOWED"|"DISMISSED"), ResolvedBy?, ResolvedAt?, ResolveNote?
UNIQUE (Ip, Scope)
```

- **Ghi khi nào:** khi một request có IP **không khớp** entry Active nào. Ghi **cả lúc whitelist đang tắt** (`BlockedCount` không tăng) để admin xem trước những IP sẽ bị chặn nếu bật.
  - Vào API `[AdminArea]` → Scope `ADMIN`.
  - Đăng nhập (`/auth/login`, kể cả khi sai mật khẩu, lưu username đã thử) → Scope `SYSTEM`.
  - Khi phạm vi là `SYSTEM`, mọi API khác cũng → Scope `SYSTEM`.
- **Giảm tải ghi:** mỗi `(Ip, Scope)` ghi DB tối đa một lần mỗi 30 giây; số lượt cộng dồn trong bộ nhớ rồi xả xuống DB.
- **Đổi trạng thái:** IP đã `ALLOWED`/`DISMISSED` mà vẫn truy cập không khớp rule (ví dụ entry bị xoá) → quay lại `PENDING`.

API (Identity.Api, `SETTINGS_MANAGE`, `[AdminArea]`):

```
GET  /api/ip-access-logs?status&scope&q&page&pageSize      → Page<IpAccessLogDto>   (mặc định sắp LastSeenAt desc)
POST /api/ip-access-logs/{id}/allow   {cidr?, description?, reason}  (If-Match) → { log: IpAccessLogDto, entry: IpWhitelistEntryDto }
POST /api/ip-access-logs/{id}/dismiss {reason}                        (If-Match) → IpAccessLogDto
```

```ts
IpAccessLogDto { id, version, ip, scope, firstSeenAt, lastSeenAt, hitCount, blockedCount,
                 lastUser:{id,label}|null, lastUsername|null, lastPath, status, resolvedBy:{id,label}|null, resolvedAt|null, resolveNote|null }
```

- `allow`: tạo entry whitelist (`cidr` mặc định = `ip`, mô tả mặc định "Cho phép từ nhật ký truy cập · <username>") rồi đặt `ALLOWED`. Cả hai bước nằm trong một transaction và ghi `AuditLogs`.
- `GET /api/ip-whitelist` trả thêm `scope`, `scopeSettingId`, `scopeSettingVersion`, `pendingCount`.

### 10.3 Thông báo lỗi (BE là nguồn duy nhất, FE hiển thị nguyên văn kèm hướng dẫn)

| Tình huống | HTTP / code | Message |
|---|---|---|
| Sai tài khoản/mật khẩu | 401 `UNAUTHORIZED` | "Sai tên đăng nhập hoặc mật khẩu." (không tiết lộ số lần còn lại để tránh dò tài khoản) |
| Tài khoản đang bị khoá | 403 `ACCOUNT_LOCKED` | "Tài khoản của bạn đang bị khoá (<lý do>). Vui lòng liên hệ quản trị viên để được mở khoá." |
| Vừa bị khoá do sai quá ngưỡng | 403 `ACCOUNT_LOCKED` | "Bạn đã nhập sai mật khẩu quá <N> lần nên tài khoản đã bị khoá. Vui lòng liên hệ quản trị viên để được mở khoá." |
| IP không được phép (phạm vi SYSTEM, lúc đăng nhập hoặc gọi API) | 403 `IP_NOT_ALLOWED` | "Bạn không có quyền truy cập hệ thống từ địa chỉ IP <ip>. Vui lòng liên hệ quản trị viên để được cấp quyền truy cập." `details: {ip, scope:"SYSTEM"}` |
| IP không được phép vào khu quản trị | 403 `IP_NOT_ALLOWED` | "Địa chỉ IP <ip> không được phép truy cập khu quản trị. Vui lòng liên hệ quản trị viên." `details: {ip, scope:"ADMIN"}` |
| Thiếu mã quyền | 403 `FORBIDDEN` | "Bạn không có quyền sử dụng chức năng này (cần quyền: <tên quyền>). Vui lòng liên hệ quản trị viên." `details: {required:[codes]}` |

FE:
- Trang đăng nhập hiện khối thông báo riêng (tiêu đề "Không thể đăng nhập") cho `ACCOUNT_LOCKED` và `IP_NOT_ALLOWED`, kèm IP nếu có.
- Đang dùng mà nhận `IP_NOT_ALLOWED` với `scope=SYSTEM` → đăng xuất, đưa về `/login`, giữ thông báo.
- Mở khu quản trị mà không có quyền → "Bạn không có quyền truy cập khu quản trị. Vui lòng liên hệ quản trị viên." (không trang trắng/404).
- Màn IP whitelist có tab **"IP chưa có rule"**:
  - bảng IP, phạm vi, tài khoản gần nhất, lần đầu/lần cuối, số lượt, số lượt bị chặn, trạng thái;
  - nút **[Cho phép]** mở dialog tạo entry đã điền sẵn IP; nút **[Bỏ qua]**;
  - menu và trang tổng quan hiện số IP đang chờ xử lý.
- Màn IP whitelist chọn được phạm vi (Chỉ khu quản trị / Toàn hệ thống).

---

## 11. Phân quyền theo dự án (yêu cầu người dùng 04/11/2026)

Câu hỏi của người dùng: công ty phân cấp bậc **theo dự án**, mỗi dự án thêm thành viên khác nhau, một leader có thể phụ trách nhiều dự án không? → **Có.** Phần này chốt mô hình và sửa lỗ hổng: trước 04/11, Projects.Api/Tasks.Api **không** kiểm tra quyền theo dự án (ai đăng nhập cũng sửa/đóng được mọi dự án, giao việc, nghiệm thu), còn session `projectAccess[]` không mang `permissions` nên FE (chế độ http) coi Owner/Manager như không có quyền gì. Mock FE (`FE/src/mocks/db.ts`) đã cài đúng chính sách và là **bản tham chiếu**; BE làm theo.

### 11.1 Mô hình hai lớp

| Lớp | Nguồn | Quyết định |
|---|---|---|
| Hệ thống (§1) | `Features` + `PermissionGroups` + `Granted/RevokedFeatures`, sysadmin | Chức năng quản trị; ai là **Leader/PM** (`PROJECT_CREATE`, nhóm "Quản lý dự án (Leader/PM)"); ai xem phân tích **mọi** dự án (`ANALYTICS_VIEW` hệ thống, chỉ xem) |
| Dự án (mới) | `ProjectMemberships` (một người – một dự án – một vai trò, đang hoạt động khi `EndedAt` null) + ma trận `ProjectRolePolicies` | Quyền **trong từng dự án** |

- Một người giữ vai trò khác nhau ở nhiều dự án cùng lúc: Leader có thể là OWNER ở dự án A, MANAGER ở B và MEMBER ở C. Quyền tính theo cặp (người, dự án) ở **mỗi request** từ DB, không nằm trong token.
- Thứ bậc trong một dự án: **OWNER** (Chủ dự án/PM, là `Project.OwnerId`, chịu trách nhiệm) > **MANAGER** (Leader/Quản lý) > **MEMBER** (Thành viên).
- Điều kiện giữ vai trò quản lý (giữ nguyên): OWNER/MANAGER chỉ có hiệu lực khi người đó đang có `PROJECT_CREATE` hiệu lực. Mất `PROJECT_CREATE` thì các vai trò quản lý của họ **không** cho quyền gì (fail-closed), thành viên thường vẫn làm việc được giao.
- Sysadmin/quản trị **không** mặc nhiên có quyền ghi nghiệp vụ dự án (`FE/AGENTS.md` mục 55, 59). Ngoại lệ có kiểm soát: bàn giao chủ dự án ở khu quản trị (11.7).

### 11.2 Mã quyền dự án (cố định trong code, `Shared.Entities/Authorization/ProjectPermissions.cs`)

| Code | Tên hiển thị | Cho phép |
|---|---|---|
| `PROJECT_MANAGE` | Quản lý kế hoạch dự án | Sửa thông tin/kế hoạch, kích hoạt, hoàn thành, huỷ dự án, đổi chủ dự án |
| `MEMBERS_MANAGE` | Quản lý thành viên | Thêm thành viên, đổi vai trò, kết thúc tư cách thành viên |
| `TASKS_MANAGE` | Quản lý công việc | Tạo, sửa, huỷ, giao/bàn giao công việc |
| `TASKS_REVIEW` | Nghiệm thu | Duyệt / yêu cầu sửa kết quả (không tự nghiệm thu kết quả của mình) |
| `ANALYTICS_VIEW` | Xem phân tích dự án | Dashboard, rủi ro, khối lượng, điểm nghẽn **trong phạm vi các dự án có quyền** |
| `ALERTS_MANAGE` | Xử lý cảnh báo | Nhận và xử lý cảnh báo của mọi công việc trong dự án |

Việc gắn với chính người đó **không cần mã**: người được giao bắt đầu/tạm dừng/ghi giờ/nộp kết quả; tác giả sửa báo cáo của mình; thành viên xem dự án mình tham gia.

### 11.3 Ma trận vai trò — bảng `ProjectRolePolicies`

```
Role PK varchar(20) ("OWNER"|"MANAGER"|"MEMBER"), Name varchar(100), Description text?, Permissions text[],
Version int, CreatedAt, CreatedBy?, UpdatedAt, UpdatedBy?        (ICreateStamped/IUpdateStamped)
```

Seed bằng `HasData` (migration `ProjectRolePolicies`), mặc định **phân cấp**:

| Vai trò | Tên | Quyền mặc định | Sửa được? |
|---|---|---|---|
| OWNER | Chủ dự án (PM) | cả 6 mã | **Không** (khoá — mọi dự án luôn có người quản lý được) |
| MANAGER | Leader / Quản lý | `MEMBERS_MANAGE, TASKS_MANAGE, TASKS_REVIEW, ANALYTICS_VIEW, ALERTS_MANAGE` (không có `PROJECT_MANAGE`: kế hoạch, đóng/huỷ, đổi chủ là việc của PM) | Có |
| MEMBER | Thành viên | (không mã nào) | Có |

Khác bản 30/10: trước đây MANAGER = OWNER. Công ty muốn Leader sửa được kế hoạch thì bật `PROJECT_MANAGE` cho MANAGER ở màn "Vai trò dự án" (11.8).

### 11.4 Bộ tính quyền BE — `ProjectAccessEvaluator` (Shared.Entities/Authorization, scoped, đăng ký trong `AddEntityServices`)

- `CurrentUserAsync()`: user của request (claim NameIdentifier), cache trong instance.
- `ReadsEveryProjectAsync()`: user có `ANALYTICS_VIEW` **hệ thống** hiệu lực (`PermissionEvaluator`).
- `GetAccessAsync()` → `projectId → (Role, Permissions[])` cho mọi membership đang hoạt động; áp điều kiện `PROJECT_CREATE` của 11.1 và ma trận 11.3 (đọc `ProjectRolePolicies` một lần/request).
- `GetPermissionsAsync(projectId)`, `HasAsync(projectId, code)` (đúng khi có mã trong dự án, hoặc `code == ANALYTICS_VIEW` và `ReadsEveryProject`), `CanReadProjectAsync(projectId)` (thành viên đang hoạt động hoặc `ReadsEveryProject`), `ProjectIdsWithAsync(code)` (để lọc danh sách/phân tích).
- `EnsureAsync(projectId, code?)`: dự án không tồn tại → 404 `NOT_FOUND` "Không tìm thấy dự án."; không đọc được / thiếu mã → 403 `FORBIDDEN` "Bạn không có quyền thực hiện trong dự án." (giống `requireProject` của mock).

### 11.5 Session

`ProjectAccessDto { projectId, projectRole, permissions: string[] }` cho mọi membership đang hoạt động (kể cả MEMBER với `permissions: []`). FE giữ schema hiện tại (`projectId`, `permissions`; trường thừa bị bỏ qua).

### 11.6 Thực thi ở các service (bám mock; bảng chi tiết từng endpoint ở 11.10)

- **Projects.Api**: list chỉ trả dự án người xem đang tham gia (hoặc tất cả nếu `ReadsEveryProject`); đọc chi tiết/closure-checks/lịch sử/thành viên cần `CanReadProject`; tạo cần `PROJECT_CREATE`; PATCH/activate/complete/cancel cần `PROJECT_MANAGE`; thêm/đổi vai trò/kết thúc thành viên cần `MEMBERS_MANAGE`.
- **Tasks.Api**: thấy công việc khi `ReadsEveryProject` hoặc (là thành viên và (có ít nhất một mã trong dự án hoặc là người được giao/từng được giao)); tạo/sửa/huỷ/giao việc cần `TASKS_MANAGE`; duyệt/yêu cầu sửa cần `TASKS_REVIEW` (giữ cấm tự nghiệm thu); hàng chờ nghiệm thu chỉ gồm dự án có `TASKS_REVIEW`; báo cáo, tệp, giờ công theo quy tắc mock.
- **Analytics.Api**: dashboard/risks/workload/bottlenecks/filter-options mở cho người có `ANALYTICS_VIEW` hệ thống **hoặc** ở ít nhất một dự án; dữ liệu giới hạn trong các dự án được phép; lọc `projectId` ngoài phạm vi → 403; lọc theo đơn vị chỉ dành cho phạm vi hệ thống (theo mock).
- **Cảnh báo**: người nhận = người được giao **hoặc** người có `ALERTS_MANAGE` trong dự án (thay cho kiểm tra tên vai trò Owner/Manager).

### 11.7 API quản trị mới (Identity.Api trừ khi ghi khác, đều `[AdminArea]`)

```
GET   /api/project-roles                                   → ProjectRoleDto[]        (PERMISSIONS_MANAGE | USERS_MANAGE)
PATCH /api/project-roles/{role} {permissions[], reason}    (If-Match) → ProjectRoleDto (PERMISSIONS_MANAGE và phải là sysadmin, khác → 403)
GET   /api/users/{userId}/projects                         → UserProjectDto[]         (USERS_MANAGE | PERMISSIONS_MANAGE)
POST  /api/users/{userId}/revoke-sessions {reason}         (If-Match user.version) → { ok: true }   (USERS_MANAGE)
POST  /api/projects/{projectId}/owner-transfer {ownerId, reason}  (Projects.Api, If-Match project.version) → ProjectDto  (USERS_MANAGE)
```

```ts
ProjectRoleDto { role: "OWNER"|"MANAGER"|"MEMBER", version, name, description|null, permissions: string[], locked: boolean,
                 updatedAt, updatedBy: {id,label}|null }
UserProjectDto { membershipId, project: {id, name}, unitId, projectStatus: "PLANNED"|"ACTIVE"|"COMPLETED"|"CANCELLED",
                 projectRole: "OWNER"|"MANAGER"|"MEMBER", isOwner: boolean, permissions: string[] /* hiệu lực ngay lúc này */,
                 startedAt /* membership.createdAt */, endedAt|null }
```

- `PATCH /project-roles/OWNER` → 422 `BUSINESS_RULE` "Vai trò Chủ dự án luôn có toàn quyền trong dự án."; mã lạ → 422 `VALIDATION` path `["permissions"]`; ghi `AuditLogs` (EntityType `ProjectRole`).
- `/users/{id}/projects`: mọi membership (đang hoạt động trước, sắp theo tên dự án; đã kết thúc sau, `endedAt` giảm dần).
- `revoke-sessions`: tăng `TokenVersion` (mọi token đang cấp mất hiệu lực ngay), ghi audit `REVOKE_SESSIONS`; không áp cho chính mình (422 `BUSINESS_RULE`).
- `owner-transfer`: dùng lại logic đổi chủ của `PATCH /projects/{id}` (chủ mới phải ACTIVE, cùng đơn vị, có `PROJECT_CREATE` → 422 `INVALID_OWNER`; dự án phải PLANNED/ACTIVE → 409 `PROJECT_READ_ONLY`); chủ cũ còn tư cách thì thành MANAGER; ghi audit trên `Project`. Dùng khi PM nghỉ việc/bị khoá.

### 11.8 FE

- Khu admin, nhóm "Phân quyền": thêm **"Vai trò dự án"** `/admin/project-roles` (mở với `PERMISSIONS_MANAGE` hoặc `USERS_MANAGE`). Bảng ma trận: hàng = 6 mã quyền dự án (tên + mô tả), cột = OWNER/MANAGER/MEMBER, ô có dấu ✓. Tiêu đề cột vai trò có [Xem]/[Sửa]; Sửa mở dialog chung (mẫu §9) với danh sách checkbox + lý do; chỉ sysadmin thấy [Sửa]; OWNER chỉ xem kèm ghi chú khoá. Có đoạn giải thích ngắn mô hình 11.1.
- Dialog người dùng: thêm tab **"Dự án"**: bảng Dự án / Vai trò / Trạng thái dự án / Quyền trong dự án / Từ ngày–Đến ngày; dòng OWNER ở dự án PLANNED/ACTIVE có [Bàn giao] mở dialog chọn chủ mới (lookup người dùng cùng đơn vị, BE kiểm tra lần cuối) + lý do. Dialog khoá tài khoản cảnh báo nếu người đó đang là chủ dự án PLANNED/ACTIVE.
- Dialog người dùng (chế độ Xem): thao tác **"Thu hồi phiên đăng nhập"** (confirm + lý do), ẩn với chính mình.
- Mock: `permissionPolicy.project` trong `data.json` chuyển thành `projectRoles` (đúng 11.3); `projectPermissions` đọc `db.projectRoles`; thêm handler cho 5 endpoint 11.7; HTTP test + screen test; cập nhật `fe-specs/api/API_CATALOG.md`.

### 11.9 Câu trả lời ngắn: "leader có nhiều dự án được không"

Có. Admin cấp tư cách Leader/PM bằng nhóm "Quản lý dự án (Leader/PM)" (một lần). Sau đó mỗi dự án tự thêm thành viên và chọn vai trò (OWNER do kế hoạch dự án quyết định, MANAGER/MEMBER do người có `MEMBERS_MANAGE`). Admin xem một người đang giữ vai trò gì ở những dự án nào ở tab "Dự án" của dialog người dùng, và chỉnh "mỗi vai trò được làm gì" ở màn "Vai trò dự án".

### 11.10 Bảng quy tắc từng endpoint (đã cài ở BE, khớp mock)

| Endpoint | Điều kiện | Sai → |
|---|---|---|
| `GET /projects` | thành viên đang hoạt động, hoặc `ANALYTICS_VIEW` hệ thống (xem tất cả) | lọc bớt |
| `GET /projects/:id`, `/closure-checks`, `/history`, `GET /projects/:id/members` | đọc được dự án (như trên) | 404 không có / 403 |
| `POST /projects` | `PROJECT_CREATE` hệ thống, `unitId` = đơn vị người tạo; chủ dự án là Leader/PM đang hoạt động cùng đơn vị | 403 / 422 `INVALID_OWNER` |
| `PATCH /projects/:id`, `/activate`, `/complete`, `/cancel` | `PROJECT_MANAGE` trong dự án; **đổi `ownerId` chỉ do chủ dự án hiện tại**, chủ mới là Leader/PM cùng đơn vị, chủ cũ ở lại với vai trò MANAGER | 403 / 422 `INVALID_OWNER` |
| `POST/PATCH /projects/:id/members…`, `/end` | `MEMBERS_MANAGE` trong dự án | 403 |
| `GET /tasks`, `GET /tasks/:id` (+ `/history`, `/submissions`, `/time-logs`) | `ANALYTICS_VIEW` hệ thống, hoặc thành viên và (có quyền nào đó trong dự án, hoặc đang/từng được giao việc) | lọc bớt / 403 |
| `POST /projects/:id/tasks`, `PATCH /tasks/:id`, `/cancel`, `/assignments` | `TASKS_MANAGE` trong dự án | 403 |
| `/start`, `/pause`, `/remaining-estimate`, ghi giờ, nộp kết quả, tải minh chứng | thấy được việc + là người được giao (quy tắc nghiệp vụ cũ) | 403 / 409 |
| `POST …/approve`, `…/request-revision` | `TASKS_REVIEW` trong dự án, không tự xét | 403 |
| `GET /review-queue` | chỉ dự án có `TASKS_REVIEW`, bỏ lần nộp của chính mình | lọc bớt |
| `GET /reports`, `GET /reports/:id` | tác giả; hoặc bản đã gửi trong dự án người xem có `PROJECT_MANAGE`/`TASKS_MANAGE`/`ANALYTICS_VIEW` | lọc bớt / 403 |
| `GET /report-previews`, `POST /reports` | thành viên đang hoạt động của dự án | 403 |
| `GET /attachments/:id(/content)` | người tải lên, hoặc thấy được công việc chứa tệp | 403 |
| `/dashboard`, `/analytics/*` | `ANALYTICS_VIEW` hệ thống (mọi dự án) hoặc ở ít nhất một dự án (dữ liệu giới hạn trong các dự án đó; lọc dự án/đơn vị ngoài phạm vi → 403); danh mục lọc khi chưa có dự án nào trả rỗng | 403 |
| `/alerts` | xem: người nhận hoặc `ANALYTICS_VIEW` hệ thống; xử lý: người nhận (người được giao hoặc `ALERTS_MANAGE` trong dự án) hoặc sysadmin | 404 / 403 |
| `/notifications` | chỉ của người nhận trong phiên, đối tượng vẫn thấy được | 404 |

Sysadmin không có quyền ghi nghiệp vụ dự án chỉ vì cờ sysadmin (giống mock); muốn ghi phải là thành viên với vai trò tương ứng.

### 11.11 Trạng thái triển khai (04/11/2026)

- **Đã cài**: `Shared.Entities/Authorization/ProjectAccess.cs` (tính quyền theo từng dự án mỗi request), thực thi ở Projects/Tasks/Analytics theo bảng 11.10, session `projectAccess[].permissions`, người nhận cảnh báo theo `ALERTS_MANAGE`, `GET /users/:id/projects` + tab **Dự án** trong dialog người dùng, `POST /users/:id/revoke-sessions` + nút **Thu hồi phiên đăng nhập** (ẩn với chính mình, BE trả 422), cấp lại mật khẩu cũng thu hồi phiên cũ, API thông báo thật (`FE/fe-specs/api/NOTIFICATIONS.md`).
- **Khác 11.3 (chọn bản gọn hơn)**: ma trận vai trò cố định trong code (`ProjectAccess.ByRole`, trùng `permissionPolicy.project` của mock), **chưa** có bảng `ProjectRolePolicies`/màn "Vai trò dự án". OWNER và MANAGER cùng 6 mã quyền; thứ bậc OWNER > MANAGER thể hiện ở chỗ chỉ OWNER bàn giao dự án và OWNER không bị kết thúc/đổi vai trò. Muốn Leader không sửa kế hoạch: bỏ `PROJECT_MANAGE` khỏi `ByRole[Manager]` (và mock `data.json`).
- **Chưa làm**: `/project-roles`, `/projects/:id/owner-transfer` cho admin khi chủ dự án nghỉ (hiện chủ dự án tự bàn giao qua sửa kế hoạch), cảnh báo trong dialog khoá khi người đó đang là chủ dự án.
- **Bảo mật** đã sửa cùng đợt: không sửa/khoá/mở khoá/cấp lại mật khẩu/đổi phân quyền tài khoản có quyền cao hơn mình (`EnsureCanManageAsync`); đăng nhập tài khoản bị khoá chỉ báo "đang khoá" (kèm lý do) khi đúng mật khẩu.
