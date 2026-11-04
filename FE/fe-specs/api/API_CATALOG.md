# Đặc tả API, DTO và trường được thay đổi

Hợp đồng hiện hành **87 endpoint HTTP**, cập nhật 04/11/2026: 83 endpoint sẵn có, 3 endpoint thông báo cá nhân và GET hồ sơ riêng. Phần nghiệp vụ/LLM tiếp tục hợp đồng 0.3.0, tài liệu 0.4; thông báo được ghi riêng ở NOTIFICATIONS.md. Mọi request vẫn đi qua public Gateway.

Rà ngày 31/10/2026: vẫn 83 route hiện hành; không triển khai /permission-groups và đã bỏ service dự phòng không có caller/handler. Response theo schema: LoginResponse chỉ session/accessToken; Session.projectAccess chỉ projectId/permissions; snapshot.scope chỉ from/to và AnalysisMeasure không có basis (model vẫn giữ dữ liệu nguồn); AlertDto.handler là PersonRef|null thay handledBy. GET lần nộp thêm sort=sequence|-sequence, sắp xếp trước pagination; khung báo cáo dùng 5 lần/trang và chọn từng tệp.

Điều chỉnh theo yêu cầu ngày 25/10/2026: JSON thành công trả ResponseDTO trực tiếp; danh sách là {items, pagination}, lỗi là ErrorDTO phẳng {code, message, fieldErrors?, details?}. Không bọc data/meta hoặc error/meta, không gửi requestId/serverTime. GET không gửi body. Request DTO gồm params/query/body tách biệt. Dữ liệu nested theo DTO_MODELS.md. Tất cả field label/ref mới là read-only; không thêm vào request create/update.

LLM có sẵn chạy qua adapter BE. Số liệu do BE tính. GET tổng quan/danh sách/chi tiết không gọi LLM; mở S43 có thể chủ động gọi createAnalysisJob REUSE_OR_CREATE một lần nếu BE cho phép và chưa có kết quả/job. Xem LLM_ANALYSIS.md và API_CHANGELOG_LLM.md.

## Ma trận nhanh

Bổ sung theo yêu cầu tiếp tục ngày 03/11/2026: **86 endpoint HTTP**. Chuông cá nhân gọi API thông báo của mock BE, không thêm trang inbox hoặc quyền quản trị mới. Hợp đồng mới và các quy tắc nhận/đọc ở [NOTIFICATIONS.md](NOTIFICATIONS.md); backend thật cần triển khai ba endpoint này.

| Operation | Method và path | HTTP | Cách gọi | Màn |
|---|---|---|---|---|
| listNotifications | `GET /api/notifications` | 200 | useQuery khi mở chuông | Header |
| getNotificationSummary | `GET /api/notifications/summary` | 200 | useQuery, poll 30 giây | Header |
| readNotification | `PATCH /api/notifications/:notificationId` | 200 | useMutation, idempotency | Chuông |
| [login](#login) | `POST /api/auth/login` | 200 | useMutation | S01 |
| [logout](#logout) | `POST /api/auth/logout` | 200 | useMutation | S01, S02 |
| [refreshSession](#refreshsession) | `POST /api/auth/refresh` | 200 | Auth adapter single-flight; không tạo query định kỳ | S01, S02 |
| [getSession](#getsession) | `GET /api/auth/me` | 200 | useQuery | S02 |
| [getPersonalProfile](#getpersonalprofile) | `GET /api/auth/me/profile` | 200 | useQuery | Hồ sơ cá nhân |
| [updateProfile](#updateprofile) | `PATCH /api/auth/me` | 200 | useMutation, multipart | Hồ sơ cá nhân |
| [changePassword](#changepassword) | `PUT /api/auth/me/password` | 200 | useMutation | Hồ sơ / Đổi mật khẩu |
| [getAvatar](#getavatar) | `GET /api/avatars/:avatarId` | 200 | Image src từ avatarUrl | Hồ sơ, menu tài khoản, quản trị |
| [listUsers](#listusers) | `GET /api/users` | 200 | useQuery | S03 |
| [getUser](#getuser) | `GET /api/users/:userId` | 200 | useQuery | S05 |
| [getProfile](#getprofile) | `GET /api/users/:userId/profile` | 200 | useQuery | Hồ sơ công khai nội bộ |
| [createUser](#createuser) | `POST /api/users` | 201 | useMutation | S04 |
| [updateUser](#updateuser) | `PATCH /api/users/:userId` | 200 | useMutation | S05 |
| [lockUser](#lockuser) | `POST /api/users/:userId/lock` | 200 | useMutation | S05 |
| [unlockUser](#unlockuser) | `POST /api/users/:userId/unlock` | 200 | useMutation | S05 |
| [resetUserPassword](#resetuserpassword) | `POST /api/users/:userId/reset-password` | 200 | useMutation | S05 |
| [listUnits](#listunits) | `GET /api/units` | 200 | useQuery | S06 |
| [getUnit](#getunit) | `GET /api/units/:unitId` | 200 | useQuery | S06 |
| [createUnit](#createunit) | `POST /api/units` | 201 | useMutation | S06 |
| [updateUnit](#updateunit) | `PATCH /api/units/:unitId` | 200 | useMutation | S06 |
| [deactivateUnit](#deactivateunit) | `POST /api/units/:unitId/deactivate` | 200 | useMutation | S06 |
| [listTeams](#listteams) | `GET /api/teams` | 200 | useQuery | S07 |
| [getTeam](#getteam) | `GET /api/teams/:teamId` | 200 | useQuery | S07 |
| [createTeam](#createteam) | `POST /api/teams` | 201 | useMutation | S07 |
| [updateTeam](#updateteam) | `PATCH /api/teams/:teamId` | 200 | useMutation | S07 |
| [replaceTeamMembers](#replaceteammembers) | `PUT /api/teams/:teamId/members` | 200 | useMutation | S07 |
| [deactivateTeam](#deactivateteam) | `POST /api/teams/:teamId/deactivate` | 200 | useMutation | S07 |
| [listProjects](#listprojects) | `GET /api/projects` | 200 | useQuery | S02, S08 |
| [getProject](#getproject) | `GET /api/projects/:projectId` | 200 | useQuery | S10 |
| [createProject](#createproject) | `POST /api/projects` | 201 | useMutation | S09 |
| [updateProject](#updateproject) | `PATCH /api/projects/:projectId` | 200 | useMutation | S11 |
| [activateProject](#activateproject) | `POST /api/projects/:projectId/activate` | 200 | useMutation | S10 |
| [getProjectClosureChecks](#getprojectclosurechecks) | `GET /api/projects/:projectId/closure-checks` | 200 | useQuery | S14 |
| [completeProject](#completeproject) | `POST /api/projects/:projectId/complete` | 200 | useMutation | S14 |
| [cancelProject](#cancelproject) | `POST /api/projects/:projectId/cancel` | 200 | useMutation | S14 |
| [listProjectHistory](#listprojecthistory) | `GET /api/projects/:projectId/history` | 200 | useQuery | S10 |
| [listProjectMembers](#listprojectmembers) | `GET /api/projects/:projectId/members` | 200 | useQuery | S12 |
| [addProjectMember](#addprojectmember) | `POST /api/projects/:projectId/members` | 201 | useMutation | S12 |
| [updateProjectMemberRole](#updateprojectmemberrole) | `PATCH /api/projects/:projectId/members/:membershipId` | 200 | useMutation | S13 |
| [endProjectMembership](#endprojectmembership) | `POST /api/projects/:projectId/members/:membershipId/end` | 200 | useMutation | S12 |
| [listTasks](#listtasks) | `GET /api/tasks` | 200 | useQuery | S02, S15, S16, S26 |
| [getTask](#gettask) | `GET /api/tasks/:taskId` | 200 | useQuery | S18 |
| [createTask](#createtask) | `POST /api/projects/:projectId/tasks` | 201 | useMutation | S17 |
| [updateTask](#updatetask) | `PATCH /api/tasks/:taskId` | 200 | useMutation | S19 |
| [assignTask](#assigntask) | `POST /api/tasks/:taskId/assignments` | 200 | useMutation | S20 |
| [startTask](#starttask) | `POST /api/tasks/:taskId/start` | 200 | useMutation | S21 |
| [pauseTask](#pausetask) | `POST /api/tasks/:taskId/pause` | 200 | useMutation | S21 |
| [cancelTask](#canceltask) | `POST /api/tasks/:taskId/cancel` | 200 | useMutation | S21 |
| [updateRemainingEstimate](#updateremainingestimate) | `PATCH /api/tasks/:taskId/remaining-estimate` | 200 | useMutation | S18 |
| [listTaskHistory](#listtaskhistory) | `GET /api/tasks/:taskId/history` | 200 | useQuery | S28 |
| [listTimeLogs](#listtimelogs) | `GET /api/tasks/:taskId/time-logs` | 200 | useQuery | S22 |
| [createTimeLog](#createtimelog) | `POST /api/tasks/:taskId/time-logs` | 201 | useMutation | S23 |
| [updateTimeLog](#updatetimelog) | `PATCH /api/time-logs/:timeLogId` | 200 | useMutation | S23 |
| [voidTimeLog](#voidtimelog) | `POST /api/time-logs/:timeLogId/void` | 200 | useMutation | S23 |
| [listSubmissions](#listsubmissions) | `GET /api/tasks/:taskId/submissions` | 200 | useQuery | S25 |
| [getSubmission](#getsubmission) | `GET /api/tasks/:taskId/submissions/:submissionId` | 200 | useQuery | S27 |
| [createSubmission](#createsubmission) | `POST /api/tasks/:taskId/submissions` | 201 | useMutation | S24 |
| [approveSubmission](#approvesubmission) | `POST /api/tasks/:taskId/submissions/:submissionId/approve` | 200 | useMutation | S27 |
| [requestSubmissionRevision](#requestsubmissionrevision) | `POST /api/tasks/:taskId/submissions/:submissionId/request-revision` | 200 | useMutation | S27 |
| [listReviewQueue](#listreviewqueue) | `GET /api/review-queue` | 200 | useQuery | S26 |
| [listReports](#listreports) | `GET /api/reports` | 200 | useQuery | S29 |
| [getReportPreview](#getreportpreview) | `GET /api/report-previews` | 200 | useQuery | S30, S31 |
| [getReport](#getreport) | `GET /api/reports/:reportId` | 200 | useQuery | S31, S32 |
| [createReportDraft](#createreportdraft) | `POST /api/reports` | 201 | useMutation | S30 |
| [updateReportDraft](#updatereportdraft) | `PATCH /api/reports/:reportId` | 200 | useMutation | S31 |
| [refreshReportDraft](#refreshreportdraft) | `POST /api/reports/:reportId/refresh` | 200 | useMutation | S31 |
| [submitReport](#submitreport) | `POST /api/reports/:reportId/submit` | 200 | useMutation | S31 |
| [getUploadPolicy](#getuploadpolicy) | `GET /api/attachments/policy` | 200 | useQuery | S41 |
| [uploadAttachment](#uploadattachment) | `POST /api/attachments` | 201 | useMutation | S41 |
| [getAttachment](#getattachment) | `GET /api/attachments/:attachmentId` | 200 | useQuery | S24, S27, S41 |
| [downloadAttachment](#downloadattachment) | `GET /api/attachments/:attachmentId/content` | 200 | useMutation theo click (GET binary); không cache Blob | S27 |
| [getDashboard](#getdashboard) | `GET /api/dashboard` | 200 | useQuery | S33 |
| [getDeadlineRisks](#getdeadlinerisks) | `GET /api/analytics/risks` | 200 | useQuery | S34 |
| [getWorkload](#getworkload) | `GET /api/analytics/workload` | 200 | useQuery | S35 |
| [getBottlenecks](#getbottlenecks) | `GET /api/analytics/bottlenecks` | 200 | useQuery | S36 |
| [getAnalysisSummary](#getanalysissummary) | `GET /api/analytics/summary` | 200 | useQuery | S39 |
| [createAnalysisJob](#createanalysisjob) | `POST /api/analytics/jobs` | 200 / 202 | useMutation | S40, S43 |
| [getAnalysisJob](#getanalysisjob) | `GET /api/analytics/jobs/:jobId` | 200 | useQuery | S40, S43 |
| [listAlerts](#listalerts) | `GET /api/alerts` | 200 | useQuery | S37 |
| [getAlert](#getalert) | `GET /api/alerts/:alertId` | 200 | useQuery | S38 |
| [updateAlert](#updatealert) | `PATCH /api/alerts/:alertId` | 200 | useMutation | S38 |
| [getAnalysisDetail](#getanalysisdetail) | `GET /api/analytics/details/:analysisId` | 200 | useQuery | S43 |

## login

`POST /api/auth/login` → HTTP 200

- Feature `auth` · Màn S01 · UC UC-A01.
- DTO đích: `LoginRequestDTO`, `LoginResponseDTO`.
- Phiên: login không cần token; refresh dùng cookie phiên. Quyền bổ sung: theo người sở hữu và phạm vi tài nguyên.
- If-Match: không yêu cầu. Idempotency-Key: không yêu cầu.
- Cách gọi: useMutation; hook/adapter đề nghị `useLoginMutation`.

### Params DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `username` | string | Có | độ dài ≥ 1; độ dài ≤ 64; Tên đăng nhập nội bộ; trim đầu/cuối, giữ quy ước hoa/thường đã chốt. |
| `password` | string | Có | độ dài ≥ 1; độ dài ≤ 128; Giữ nguyên chuỗi đăng nhập; không trim/log/persist. |

FE chỉ được gửi: `username`, `password`.

### Response DTO

`Auth.LoginResponseDTO`; xem [từ điển DTO](DTO_MODELS.md#authloginresponsedto).

### Trường thay đổi phía BE / mock

`session`, `accessToken`, `expiresAt`.
Entity thực sự thay đổi tăng version/updatedAt và lưu audit theo nghiệp vụ; giữ giá trị gốc và createdAt. Các projection nhãn được dựng từ nguồn ID, không nhận từ FE.

### Điều kiện và lỗi

- Không sửa password trước khi gửi
- Sai thông tin trả 401; tài khoản khóa trả 403
- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.

### Cache sau thao tác

`all-session-cache`; ánh xạ đúng scope trong ma trận React Query.

## logout

`POST /api/auth/logout` → HTTP 200

- Feature `auth` · Màn S01, S02 · UC UC-A02.
- DTO đích: `LogoutRequestDTO`, `LogoutResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: theo người sở hữu và phạm vi tài nguyên.
- If-Match: không yêu cầu. Idempotency-Key: không yêu cầu.
- Cách gọi: useMutation; hook/adapter đề nghị `useLogoutMutation`.

### Params DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

Object rỗng `{}`; không có trường nghiệp vụ.

FE chỉ được gửi: Không có..

### Response DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `ok` | true | Có | Theo đúng kiểu và khả năng null đã ghi. |


### Trường thay đổi phía BE / mock

`session.revokedAt`.
Entity thực sự thay đổi tăng version/updatedAt và lưu audit theo nghiệp vụ; giữ giá trị gốc và createdAt. Các projection nhãn được dựng từ nguồn ID, không nhận từ FE.

### Điều kiện và lỗi

- Kết thúc phiên hiện tại; FE xóa token bộ nhớ và toàn bộ cache theo phiên
- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.

### Cache sau thao tác

`all-session-cache`; ánh xạ đúng scope trong ma trận React Query.

## refreshSession

`POST /api/auth/refresh` → HTTP 200

- Feature `auth` · Màn S01, S02 · UC UC-A01.
- DTO đích: `RefreshSessionRequestDTO`, `RefreshSessionResponseDTO`.
- Phiên: login không cần token; refresh dùng cookie phiên. Quyền bổ sung: theo người sở hữu và phạm vi tài nguyên.
- If-Match: không yêu cầu. Idempotency-Key: không yêu cầu.
- Cách gọi: Auth adapter single-flight; không tạo query định kỳ; hook/adapter đề nghị `refreshSessionSingleFlight`.

### Params DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

Object rỗng `{}`; không có trường nghiệp vụ.

FE chỉ được gửi: Không có..

### Response DTO

`Auth.LoginResponseDTO`; xem [từ điển DTO](DTO_MODELS.md#authloginresponsedto).

### Trường thay đổi phía BE / mock

`accessToken`, `expiresAt`.
Entity thực sự thay đổi tăng version/updatedAt và lưu audit theo nghiệp vụ; giữ giá trị gốc và createdAt. Các projection nhãn được dựng từ nguồn ID, không nhận từ FE.

### Điều kiện và lỗi

- Đề xuất refresh cookie HttpOnly; phải chốt với BE
- Mock dùng cookie mock_refresh riêng cho môi trường phát triển
- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.

### Cache sau thao tác

`auth`; ánh xạ đúng scope trong ma trận React Query.

## getSession

`GET /api/auth/me` → HTTP 200

- Feature `auth` · Màn S02 · UC UC-A01.
- DTO đích: `GetSessionRequestDTO`, `GetSessionResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: theo người sở hữu và phạm vi tài nguyên.
- If-Match: không yêu cầu. Idempotency-Key: không yêu cầu.
- Cách gọi: useQuery; hook/adapter đề nghị `useGetSessionQuery`.

### Params DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

Không có body.

FE chỉ được gửi: Không có..

### Response DTO

`Auth.SessionDTO`; xem [từ điển DTO](DTO_MODELS.md#authsessiondto).

### Trường thay đổi phía BE / mock

Chỉ đọc, không cập nhật dữ liệu nghiệp vụ..

### Điều kiện và lỗi


- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.

### Cache sau thao tác

Cache theo query key riêng, không có mutation invalidation.

## listUsers

`GET /api/users` → HTTP 200

- Feature `users` · Màn S03 · UC UC-A03, UC-A04.
- DTO đích: `ListUsersRequestDTO`, `ListUsersResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: USERS_MANAGE.
- If-Match: không yêu cầu. Idempotency-Key: không yêu cầu.
- Cách gọi: useQuery; hook/adapter đề nghị `useListUsersQuery`.

### Params DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Query DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `page` | integer | Không; có mặc định | ≥ 1; mặc định 1; Trang bắt đầu từ 1. |
| `pageSize` | integer | Không; có mặc định | ≥ 1; ≤ 100; mặc định 20; Số dòng mỗi trang, mặc định 20 và tối đa 100. |
| `q` | string | Không | độ dài ≤ 255; Từ khóa tìm kiếm, trim đầu/cuối. |
| `unitId` | string | Không | độ dài ≥ 1; độ dài ≤ 100; ID đơn vị trong phạm vi được phép. |
| `systemRole` | Users.SystemRoleDTO | Không | Vai trò hệ thống, không tự cấp quyền mọi dự án. |
| `status` | Users.UserStatusDTO | Không | Trạng thái theo enum của đúng model; không dùng chung enum cho mọi phân hệ. |

### Body DTO và whitelist

Không có body.

FE chỉ được gửi: Không có..

### Response DTO

`PageDTO<Users.UserDTO>`; gồm `items` và `pagination`. Item theo [từ điển DTO](DTO_MODELS.md#usersuserdto).

### Trường thay đổi phía BE / mock

Chỉ đọc, không cập nhật dữ liệu nghiệp vụ..

### Điều kiện và lỗi


- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.

### Cache sau thao tác

Cache theo query key riêng, không có mutation invalidation.

## getUser

`GET /api/users/:userId` → HTTP 200

- Feature `users` · Màn S05 · UC UC-A04.
- DTO đích: `GetUserRequestDTO`, `GetUserResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: USERS_MANAGE.
- If-Match: không yêu cầu. Idempotency-Key: không yêu cầu.
- Cách gọi: useQuery; hook/adapter đề nghị `useGetUserQuery`.

### Params DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `userId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Tài khoản của thành viên/người ghi theo đúng model. |

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

Không có body.

FE chỉ được gửi: Không có..

### Response DTO

`Users.UserDTO`; xem [từ điển DTO](DTO_MODELS.md#usersuserdto).

### Trường thay đổi phía BE / mock

Chỉ đọc, không cập nhật dữ liệu nghiệp vụ..

### Điều kiện và lỗi


- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.

### Cache sau thao tác

Cache theo query key riêng, không có mutation invalidation.

## createUser

`POST /api/users` → HTTP 201

- Feature `users` · Màn S04 · UC UC-A03.
- DTO đích: `CreateUserRequestDTO`, `CreateUserResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: USERS_MANAGE.
- If-Match: không yêu cầu. Idempotency-Key: bắt buộc, giữ khi retry cùng payload.
- Cách gọi: useMutation; hook/adapter đề nghị `useCreateUserMutation`.

### Params DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `username` | string | Có | độ dài ≥ 3; độ dài ≤ 64; mẫu: ^[a-zA-Z0-9._-]+$; Tên đăng nhập nội bộ; trim đầu/cuối, giữ quy ước hoa/thường đã chốt. |
| `displayName` | string | Có | độ dài ≥ 1; độ dài ≤ 255; Họ tên hiển thị. |
| `email` | string | Có | Email; request trim rồi lowercase. |
| `unitId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; ID đơn vị trong phạm vi được phép. |
| `systemRole` | Users.SystemRoleDTO | Có | Vai trò hệ thống, không tự cấp quyền mọi dự án. |
| `initialPassword` | string | Có | độ dài ≥ 8; độ dài ≤ 128; Mật khẩu tạm khi cấp tài khoản; không trả về UserDTO. |

FE chỉ được gửi: `username`, `displayName`, `email`, `unitId`, `systemRole`, `initialPassword` và các trường cá nhân tùy chọn `gender`, `birthDate`, `phone`, `permanentAddress`, `temporaryAddress`. Username chỉ khai báo khi cấp tài khoản, không được thay đổi ở API cập nhật.

### Response DTO

`Users.UserDTO`; xem [từ điển DTO](DTO_MODELS.md#usersuserdto).

### Trường thay đổi phía BE / mock

`id`, `status`, `version`, `createdAt`, `updatedAt`.
Entity thực sự thay đổi tăng version/updatedAt và lưu audit theo nghiệp vụ; giữ giá trị gốc và createdAt. Các projection nhãn được dựng từ nguồn ID, không nhận từ FE.

### Điều kiện và lỗi

- Username và email duy nhất
- Vai trò và đơn vị trong thẩm quyền; không trả mật khẩu
- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.

### Cache sau thao tác

`users`; ánh xạ đúng scope trong ma trận React Query.

## updateUser

`PATCH /api/users/:userId` → HTTP 200

- Feature `users` · Màn S05 · UC UC-A04.
- DTO đích: `UpdateUserRequestDTO`, `UpdateUserResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: USERS_MANAGE.
- If-Match: bắt buộc; thiếu 428, version cũ 412. Idempotency-Key: bắt buộc, giữ khi retry cùng payload.
- Cách gọi: useMutation; hook/adapter đề nghị `useUpdateUserMutation`.

### Params DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `userId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Tài khoản của thành viên/người ghi theo đúng model. |

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `displayName` | string | Không | độ dài ≥ 1; độ dài ≤ 255; Họ tên hiển thị. |
| `email` | string | Không | Email; request trim rồi lowercase. |
| `unitId` | string | Không | độ dài ≥ 1; độ dài ≤ 100; ID đơn vị trong phạm vi được phép. |
| `systemRole` | Users.SystemRoleDTO | Không | Vai trò hệ thống, không tự cấp quyền mọi dự án. |
| `reason` | string | Không | độ dài ≥ 1; độ dài ≤ 2000; Lý do của thao tác; ghi audit, không mass assign vào entity. |

FE chỉ được gửi: `displayName`, `email`, `unitId`, `systemRole`, `reason`.

### Response DTO

`Users.UserDTO`; xem [từ điển DTO](DTO_MODELS.md#usersuserdto).

### Trường thay đổi phía BE / mock

`version`, `updatedAt`, `audit`.
Entity thực sự thay đổi tăng version/updatedAt và lưu audit theo nghiệp vụ; giữ giá trị gốc và createdAt. Các projection nhãn được dựng từ nguồn ID, không nhận từ FE.

### Điều kiện và lỗi

- Đổi systemRole cần reason
- Không được nâng quyền vượt thẩm quyền
- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.
- Nguồn version cho If-Match: **User** đang hiển thị.

### Cache sau thao tác

`users`, `auth`, `project-members`; ánh xạ đúng scope trong ma trận React Query.

## lockUser

`POST /api/users/:userId/lock` → HTTP 200

- Feature `users` · Màn S05 · UC UC-A04.
- DTO đích: `LockUserRequestDTO`, `LockUserResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: USERS_MANAGE.
- If-Match: bắt buộc; thiếu 428, version cũ 412. Idempotency-Key: bắt buộc, giữ khi retry cùng payload.
- Cách gọi: useMutation; hook/adapter đề nghị `useLockUserMutation`.

### Params DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `userId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Tài khoản của thành viên/người ghi theo đúng model. |

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `reason` | string | Có | độ dài ≥ 1; độ dài ≤ 2000; Lý do của thao tác; ghi audit, không mass assign vào entity. |
| `mode` | enum(NORMAL, EMERGENCY) | Có | NORMAL cần bàn giao; EMERGENCY thu hồi truy cập ngay. |

FE chỉ được gửi: `reason`, `mode`.

### Response DTO

`Users.UserDTO`; xem [từ điển DTO](DTO_MODELS.md#usersuserdto).

### Trường thay đổi phía BE / mock

`status=LOCKED`, `version`, `updatedAt`, `sessions.revokedAt`, `audit`.
Entity thực sự thay đổi tăng version/updatedAt và lưu audit theo nghiệp vụ; giữ giá trị gốc và createdAt. Các projection nhãn được dựng từ nguồn ID, không nhận từ FE.

### Điều kiện và lỗi

- NORMAL cần bàn giao việc mở
- EMERGENCY khóa ngay và giữ lịch sử; không tự chuyển người nhận
- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.
- Nguồn version cho If-Match: **User** đang hiển thị.

### Cache sau thao tác

`users`, `auth`, `tasks`, `project-members`; ánh xạ đúng scope trong ma trận React Query.

## unlockUser

`POST /api/users/:userId/unlock` → HTTP 200

- Feature `users` · Màn S05 · UC UC-A04.
- DTO đích: `UnlockUserRequestDTO`, `UnlockUserResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: USERS_MANAGE.
- If-Match: bắt buộc; thiếu 428, version cũ 412. Idempotency-Key: bắt buộc, giữ khi retry cùng payload.
- Cách gọi: useMutation; hook/adapter đề nghị `useUnlockUserMutation`.

### Params DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `userId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Tài khoản của thành viên/người ghi theo đúng model. |

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `reason` | string | Có | độ dài ≥ 1; độ dài ≤ 2000; Lý do của thao tác; ghi audit, không mass assign vào entity. |

FE chỉ được gửi: `reason`.

### Response DTO

`Users.UserDTO`; xem [từ điển DTO](DTO_MODELS.md#usersuserdto).

### Trường thay đổi phía BE / mock

`status=ACTIVE`, `version`, `updatedAt`, `audit`.
Entity thực sự thay đổi tăng version/updatedAt và lưu audit theo nghiệp vụ; giữ giá trị gốc và createdAt. Các projection nhãn được dựng từ nguồn ID, không nhận từ FE.

### Điều kiện và lỗi

- Không khôi phục các phiên cũ đã thu hồi
- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.
- Nguồn version cho If-Match: **User** đang hiển thị.

### Cache sau thao tác

`users`, `auth`; ánh xạ đúng scope trong ma trận React Query.

## resetUserPassword

`POST /api/users/:userId/reset-password` → HTTP 200

- Feature `users` · Màn S05 · UC UC-A04.
- DTO đích: `ResetUserPasswordRequestDTO`, `ResetUserPasswordResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: USERS_MANAGE.
- If-Match: bắt buộc; thiếu 428, version cũ 412. Idempotency-Key: bắt buộc, giữ khi retry cùng payload.
- Cách gọi: useMutation; hook/adapter đề nghị `useResetUserPasswordMutation`.

### Params DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `userId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Tài khoản của thành viên/người ghi theo đúng model. |

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `temporaryPassword` | string | Có | độ dài ≥ 8; độ dài ≤ 128; Mật khẩu tạm do người có quyền cấp lại; không lưu trong cache giao diện. |
| `reason` | string | Có | độ dài ≥ 1; độ dài ≤ 2000; Lý do của thao tác; ghi audit, không mass assign vào entity. |

FE chỉ được gửi: `temporaryPassword`, `reason`.

### Response DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `ok` | true | Có | Theo đúng kiểu và khả năng null đã ghi. |


### Trường thay đổi phía BE / mock

`credential`, `sessions.revokedAt`, `version`, `updatedAt`, `audit`.
Entity thực sự thay đổi tăng version/updatedAt và lưu audit theo nghiệp vụ; giữ giá trị gốc và createdAt. Các projection nhãn được dựng từ nguồn ID, không nhận từ FE.

### Điều kiện và lỗi

- Chức năng hỗ trợ quản lý tài khoản; cần BE xác nhận cơ chế cấp lại
- Không đưa mật khẩu vào log, cache hoặc response
- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.
- Nguồn version cho If-Match: **User** đang hiển thị.

### Cache sau thao tác

`users`, `auth`; ánh xạ đúng scope trong ma trận React Query.

## listUnits

`GET /api/units` → HTTP 200

- Feature `organization` · Màn S06 · UC UC-A05.
- DTO đích: `ListUnitsRequestDTO`, `ListUnitsResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: theo người sở hữu và phạm vi tài nguyên.
- If-Match: không yêu cầu. Idempotency-Key: không yêu cầu.
- Cách gọi: useQuery; hook/adapter đề nghị `useListUnitsQuery`.

### Params DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Query DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `page` | integer | Không; có mặc định | ≥ 1; mặc định 1; Trang bắt đầu từ 1. |
| `pageSize` | integer | Không; có mặc định | ≥ 1; ≤ 100; mặc định 20; Số dòng mỗi trang, mặc định 20 và tối đa 100. |
| `q` | string | Không | độ dài ≤ 255; Từ khóa tìm kiếm, trim đầu/cuối. |
| `status` | enum(ACTIVE, INACTIVE) | Không | Trạng thái theo enum của đúng model; không dùng chung enum cho mọi phân hệ. |

### Body DTO và whitelist

Không có body.

FE chỉ được gửi: Không có..

### Response DTO

`PageDTO<Organization.UnitDTO>`; gồm `items` và `pagination`. Item theo [từ điển DTO](DTO_MODELS.md#organizationunitdto).

### Trường thay đổi phía BE / mock

Chỉ đọc, không cập nhật dữ liệu nghiệp vụ..

### Điều kiện và lỗi


- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.

### Cache sau thao tác

Cache theo query key riêng, không có mutation invalidation.

## getUnit

`GET /api/units/:unitId` → HTTP 200

- Feature `organization` · Màn S06 · UC UC-A05.
- DTO đích: `GetUnitRequestDTO`, `GetUnitResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: theo người sở hữu và phạm vi tài nguyên.
- If-Match: không yêu cầu. Idempotency-Key: không yêu cầu.
- Cách gọi: useQuery; hook/adapter đề nghị `useGetUnitQuery`.

### Params DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `unitId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; ID đơn vị trong phạm vi được phép. |

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

Không có body.

FE chỉ được gửi: Không có..

### Response DTO

`Organization.UnitDTO`; xem [từ điển DTO](DTO_MODELS.md#organizationunitdto).

### Trường thay đổi phía BE / mock

Chỉ đọc, không cập nhật dữ liệu nghiệp vụ..

### Điều kiện và lỗi


- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.

### Cache sau thao tác

Cache theo query key riêng, không có mutation invalidation.

## createUnit

`POST /api/units` → HTTP 201

- Feature `organization` · Màn S06 · UC UC-A05.
- DTO đích: `CreateUnitRequestDTO`, `CreateUnitResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: ORGANIZATION_MANAGE.
- If-Match: không yêu cầu. Idempotency-Key: bắt buộc, giữ khi retry cùng payload.
- Cách gọi: useMutation; hook/adapter đề nghị `useCreateUnitMutation`.

### Params DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `name` | string | Có | độ dài ≥ 1; độ dài ≤ 255; Tên hiển thị sau trim. |
| `parentId` | string / null | Có | Đơn vị cấp trên; null là không có. |
| `managerId` | string / null | Có | Người quản lý đơn vị; null là chưa chỉ định. |

FE chỉ được gửi: `name`, `parentId`, `managerId`.

### Response DTO

`Organization.UnitDTO`; xem [từ điển DTO](DTO_MODELS.md#organizationunitdto).

### Trường thay đổi phía BE / mock

`id`, `status=ACTIVE`, `version`, `createdAt`, `updatedAt`.
Entity thực sự thay đổi tăng version/updatedAt và lưu audit theo nghiệp vụ; giữ giá trị gốc và createdAt. Các projection nhãn được dựng từ nguồn ID, không nhận từ FE.

### Điều kiện và lỗi

- Cấp trên tồn tại; không tạo chu trình đơn vị
- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.

### Cache sau thao tác

`organization`; ánh xạ đúng scope trong ma trận React Query.

## updateUnit

`PATCH /api/units/:unitId` → HTTP 200

- Feature `organization` · Màn S06 · UC UC-A05.
- DTO đích: `UpdateUnitRequestDTO`, `UpdateUnitResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: ORGANIZATION_MANAGE.
- If-Match: bắt buộc; thiếu 428, version cũ 412. Idempotency-Key: bắt buộc, giữ khi retry cùng payload.
- Cách gọi: useMutation; hook/adapter đề nghị `useUpdateUnitMutation`.

### Params DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `unitId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; ID đơn vị trong phạm vi được phép. |

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `name` | string | Không | độ dài ≥ 1; độ dài ≤ 255; Tên hiển thị sau trim. |
| `parentId` | string / null | Không | Đơn vị cấp trên; null là không có. |
| `managerId` | string / null | Không | Người quản lý đơn vị; null là chưa chỉ định. |
| `reason` | string | Có | độ dài ≥ 1; độ dài ≤ 2000; Lý do của thao tác; ghi audit, không mass assign vào entity. |

FE chỉ được gửi: `name`, `parentId`, `managerId`, `reason`.

### Response DTO

`Organization.UnitDTO`; xem [từ điển DTO](DTO_MODELS.md#organizationunitdto).

### Trường thay đổi phía BE / mock

`version`, `updatedAt`, `audit`.
Entity thực sự thay đổi tăng version/updatedAt và lưu audit theo nghiệp vụ; giữ giá trị gốc và createdAt. Các projection nhãn được dựng từ nguồn ID, không nhận từ FE.

### Điều kiện và lỗi

- Không tạo chu trình; parentId và managerId nhận null để bỏ liên kết
- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.
- Nguồn version cho If-Match: **Unit** đang hiển thị.

### Cache sau thao tác

`organization`; ánh xạ đúng scope trong ma trận React Query.

## deactivateUnit

`POST /api/units/:unitId/deactivate` → HTTP 200

- Feature `organization` · Màn S06 · UC UC-A05.
- DTO đích: `DeactivateUnitRequestDTO`, `DeactivateUnitResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: ORGANIZATION_MANAGE.
- If-Match: bắt buộc; thiếu 428, version cũ 412. Idempotency-Key: bắt buộc, giữ khi retry cùng payload.
- Cách gọi: useMutation; hook/adapter đề nghị `useDeactivateUnitMutation`.

### Params DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `unitId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; ID đơn vị trong phạm vi được phép. |

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `reason` | string | Có | độ dài ≥ 1; độ dài ≤ 2000; Lý do của thao tác; ghi audit, không mass assign vào entity. |

FE chỉ được gửi: `reason`.

### Response DTO

`Organization.UnitDTO`; xem [từ điển DTO](DTO_MODELS.md#organizationunitdto).

### Trường thay đổi phía BE / mock

`status=INACTIVE`, `version`, `updatedAt`, `audit`.
Entity thực sự thay đổi tăng version/updatedAt và lưu audit theo nghiệp vụ; giữ giá trị gốc và createdAt. Các projection nhãn được dựng từ nguồn ID, không nhận từ FE.

### Điều kiện và lỗi

- Chặn nếu còn đơn vị con, nhân sự, nhóm hoặc dự án đang hoạt động
- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.
- Nguồn version cho If-Match: **Unit** đang hiển thị.

### Cache sau thao tác

`organization`; ánh xạ đúng scope trong ma trận React Query.

## listTeams

`GET /api/teams` → HTTP 200

- Feature `organization` · Màn S07 · UC UC-A05.
- DTO đích: `ListTeamsRequestDTO`, `ListTeamsResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: theo người sở hữu và phạm vi tài nguyên.
- If-Match: không yêu cầu. Idempotency-Key: không yêu cầu.
- Cách gọi: useQuery; hook/adapter đề nghị `useListTeamsQuery`.

### Params DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Query DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `page` | integer | Không; có mặc định | ≥ 1; mặc định 1; Trang bắt đầu từ 1. |
| `pageSize` | integer | Không; có mặc định | ≥ 1; ≤ 100; mặc định 20; Số dòng mỗi trang, mặc định 20 và tối đa 100. |
| `q` | string | Không | độ dài ≤ 255; Từ khóa tìm kiếm, trim đầu/cuối. |
| `unitId` | string | Không | độ dài ≥ 1; độ dài ≤ 100; ID đơn vị trong phạm vi được phép. |

### Body DTO và whitelist

Không có body.

FE chỉ được gửi: Không có..

### Response DTO

`PageDTO<Organization.TeamDTO>`; gồm `items` và `pagination`. Item theo [từ điển DTO](DTO_MODELS.md#organizationteamdto).

### Trường thay đổi phía BE / mock

Chỉ đọc, không cập nhật dữ liệu nghiệp vụ..

### Điều kiện và lỗi


- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.

### Cache sau thao tác

Cache theo query key riêng, không có mutation invalidation.

## getTeam

`GET /api/teams/:teamId` → HTTP 200

- Feature `organization` · Màn S07 · UC UC-A05.
- DTO đích: `GetTeamRequestDTO`, `GetTeamResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: theo người sở hữu và phạm vi tài nguyên.
- If-Match: không yêu cầu. Idempotency-Key: không yêu cầu.
- Cách gọi: useQuery; hook/adapter đề nghị `useGetTeamQuery`.

### Params DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `teamId` | string | Có | độ dài ≥ 1; độ dài ≤ 100 |

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

Không có body.

FE chỉ được gửi: Không có..

### Response DTO

`Organization.TeamDTO`; xem [từ điển DTO](DTO_MODELS.md#organizationteamdto).

### Trường thay đổi phía BE / mock

Chỉ đọc, không cập nhật dữ liệu nghiệp vụ..

### Điều kiện và lỗi


- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.

### Cache sau thao tác

Cache theo query key riêng, không có mutation invalidation.

## createTeam

`POST /api/teams` → HTTP 201

- Feature `organization` · Màn S07 · UC UC-A05.
- DTO đích: `CreateTeamRequestDTO`, `CreateTeamResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: ORGANIZATION_MANAGE.
- If-Match: không yêu cầu. Idempotency-Key: bắt buộc, giữ khi retry cùng payload.
- Cách gọi: useMutation; hook/adapter đề nghị `useCreateTeamMutation`.

### Params DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `name` | string | Có | độ dài ≥ 1; độ dài ≤ 255; Tên hiển thị sau trim. |
| `unitId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; ID đơn vị trong phạm vi được phép. |
| `memberIds` | array<string> | Có | Danh sách ID tài khoản thuộc nhóm; không tạo quyền dự án. |

FE chỉ được gửi: `name`, `unitId`, `memberIds`.

### Response DTO

`Organization.TeamDTO`; xem [từ điển DTO](DTO_MODELS.md#organizationteamdto).

### Trường thay đổi phía BE / mock

`id`, `status=ACTIVE`, `version`, `createdAt`, `updatedAt`.
Entity thực sự thay đổi tăng version/updatedAt và lưu audit theo nghiệp vụ; giữ giá trị gốc và createdAt. Các projection nhãn được dựng từ nguồn ID, không nhận từ FE.

### Điều kiện và lỗi

- Thành viên tồn tại trong đơn vị và không trùng
- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.

### Cache sau thao tác

`organization`; ánh xạ đúng scope trong ma trận React Query.

## updateTeam

`PATCH /api/teams/:teamId` → HTTP 200

- Feature `organization` · Màn S07 · UC UC-A05.
- DTO đích: `UpdateTeamRequestDTO`, `UpdateTeamResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: ORGANIZATION_MANAGE.
- If-Match: bắt buộc; thiếu 428, version cũ 412. Idempotency-Key: bắt buộc, giữ khi retry cùng payload.
- Cách gọi: useMutation; hook/adapter đề nghị `useUpdateTeamMutation`.

### Params DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `teamId` | string | Có | độ dài ≥ 1; độ dài ≤ 100 |

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `name` | string | Không | độ dài ≥ 1; độ dài ≤ 255; Tên hiển thị sau trim. |
| `unitId` | string | Không | độ dài ≥ 1; độ dài ≤ 100; ID đơn vị trong phạm vi được phép. |
| `reason` | string | Có | độ dài ≥ 1; độ dài ≤ 2000; Lý do của thao tác; ghi audit, không mass assign vào entity. |

FE chỉ được gửi: `name`, `unitId`, `reason`.

### Response DTO

`Organization.TeamDTO`; xem [từ điển DTO](DTO_MODELS.md#organizationteamdto).

### Trường thay đổi phía BE / mock

`version`, `updatedAt`, `audit`.
Entity thực sự thay đổi tăng version/updatedAt và lưu audit theo nghiệp vụ; giữ giá trị gốc và createdAt. Các projection nhãn được dựng từ nguồn ID, không nhận từ FE.

### Điều kiện và lỗi

- Đổi đơn vị phải kiểm tra lại mọi thành viên
- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.
- Nguồn version cho If-Match: **Team** đang hiển thị.

### Cache sau thao tác

`organization`; ánh xạ đúng scope trong ma trận React Query.

## replaceTeamMembers

`PUT /api/teams/:teamId/members` → HTTP 200

- Feature `organization` · Màn S07 · UC UC-A05.
- DTO đích: `ReplaceTeamMembersRequestDTO`, `ReplaceTeamMembersResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: ORGANIZATION_MANAGE.
- If-Match: bắt buộc; thiếu 428, version cũ 412. Idempotency-Key: bắt buộc, giữ khi retry cùng payload.
- Cách gọi: useMutation; hook/adapter đề nghị `useReplaceTeamMembersMutation`.

### Params DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `teamId` | string | Có | độ dài ≥ 1; độ dài ≤ 100 |

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `memberIds` | array<string> | Có | Danh sách ID tài khoản thuộc nhóm; không tạo quyền dự án. |
| `reason` | string | Có | độ dài ≥ 1; độ dài ≤ 2000; Lý do của thao tác; ghi audit, không mass assign vào entity. |

FE chỉ được gửi: `memberIds`, `reason`.

### Response DTO

`Organization.TeamDTO`; xem [từ điển DTO](DTO_MODELS.md#organizationteamdto).

### Trường thay đổi phía BE / mock

`version`, `updatedAt`, `audit`.
Entity thực sự thay đổi tăng version/updatedAt và lưu audit theo nghiệp vụ; giữ giá trị gốc và createdAt. Các projection nhãn được dựng từ nguồn ID, không nhận từ FE.

### Điều kiện và lỗi

- Thay toàn bộ tập thành viên; không cấp quyền dự án
- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.
- Nguồn version cho If-Match: **Team** đang hiển thị.

### Cache sau thao tác

`organization`; ánh xạ đúng scope trong ma trận React Query.

## deactivateTeam

`POST /api/teams/:teamId/deactivate` → HTTP 200

- Feature `organization` · Màn S07 · UC UC-A05.
- DTO đích: `DeactivateTeamRequestDTO`, `DeactivateTeamResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: ORGANIZATION_MANAGE.
- If-Match: bắt buộc; thiếu 428, version cũ 412. Idempotency-Key: bắt buộc, giữ khi retry cùng payload.
- Cách gọi: useMutation; hook/adapter đề nghị `useDeactivateTeamMutation`.

### Params DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `teamId` | string | Có | độ dài ≥ 1; độ dài ≤ 100 |

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `reason` | string | Có | độ dài ≥ 1; độ dài ≤ 2000; Lý do của thao tác; ghi audit, không mass assign vào entity. |

FE chỉ được gửi: `reason`.

### Response DTO

`Organization.TeamDTO`; xem [từ điển DTO](DTO_MODELS.md#organizationteamdto).

### Trường thay đổi phía BE / mock

`status=INACTIVE`, `version`, `updatedAt`, `audit`.
Entity thực sự thay đổi tăng version/updatedAt và lưu audit theo nghiệp vụ; giữ giá trị gốc và createdAt. Các projection nhãn được dựng từ nguồn ID, không nhận từ FE.

### Điều kiện và lỗi

- Giữ lịch sử; không tự kết thúc thành viên dự án
- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.
- Nguồn version cho If-Match: **Team** đang hiển thị.

### Cache sau thao tác

`organization`; ánh xạ đúng scope trong ma trận React Query.

## listProjects

`GET /api/projects` → HTTP 200

- Feature `projects` · Màn S02, S08 · UC UC-P03.
- DTO đích: `ListProjectsRequestDTO`, `ListProjectsResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: theo người sở hữu và phạm vi tài nguyên.
- If-Match: không yêu cầu. Idempotency-Key: không yêu cầu.
- Cách gọi: useQuery; hook/adapter đề nghị `useListProjectsQuery`.

### Params DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Query DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `page` | integer | Không; có mặc định | ≥ 1; mặc định 1; Trang bắt đầu từ 1. |
| `pageSize` | integer | Không; có mặc định | ≥ 1; ≤ 100; mặc định 20; Số dòng mỗi trang, mặc định 20 và tối đa 100. |
| `q` | string | Không | độ dài ≤ 255; Từ khóa tìm kiếm, trim đầu/cuối. |
| `unitId` | string | Không | độ dài ≥ 1; độ dài ≤ 100; ID đơn vị trong phạm vi được phép. |
| `status` | Projects.ProjectStatusDTO | Không | Trạng thái theo enum của đúng model; không dùng chung enum cho mọi phân hệ. |

### Body DTO và whitelist

Không có body.

FE chỉ được gửi: Không có..

### Response DTO

`PageDTO<Projects.ProjectRow>`; gồm `items` và `pagination`. Item theo [response danh sách hiện hành](DTO_MODELS.md#projectsprojectrow): id/name/startDate/dueAt/status/owner/unit; không trả code/objective.

### Trường thay đổi phía BE / mock

Chỉ đọc, không cập nhật dữ liệu nghiệp vụ..

### Điều kiện và lỗi


- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.

### Cache sau thao tác

Cache theo query key riêng, không có mutation invalidation.

## getProject

`GET /api/projects/:projectId` → HTTP 200

- Feature `projects` · Màn S10 · UC UC-P03.
- DTO đích: `GetProjectRequestDTO`, `GetProjectResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: theo người sở hữu và phạm vi tài nguyên.
- If-Match: không yêu cầu. Idempotency-Key: không yêu cầu.
- Cách gọi: useQuery; hook/adapter đề nghị `useGetProjectQuery`.

### Params DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `projectId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; ID dự án; không đồng nghĩa ID service. |

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

Không có body.

FE chỉ được gửi: Không có..

### Response DTO

`Projects.ProjectDTO`; xem [từ điển DTO](DTO_MODELS.md#projectsprojectdto).

### Trường thay đổi phía BE / mock

Chỉ đọc, không cập nhật dữ liệu nghiệp vụ..

### Điều kiện và lỗi


- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.

### Cache sau thao tác

Cache theo query key riêng, không có mutation invalidation.

## createProject

`POST /api/projects` → HTTP 201

- Feature `projects` · Màn S09 · UC UC-P01.
- DTO đích: `CreateProjectRequestDTO`, `CreateProjectResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: PROJECT_CREATE.
- If-Match: không yêu cầu. Idempotency-Key: bắt buộc, giữ khi retry cùng payload.
- Cách gọi: useMutation; hook/adapter đề nghị `useCreateProjectMutation`.

### Params DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `code` | string | Có | độ dài ≥ 2; độ dài ≤ 32; mẫu: ^[A-Z0-9_-]+$; Mã dự án duy nhất; không sửa bằng ProjectPatch. |
| `name` | string | Có | độ dài ≥ 1; độ dài ≤ 255; Tên hiển thị sau trim. |
| `objective` | string | Có | độ dài ≥ 1; độ dài ≤ 2000; Mục tiêu dự án. |
| `unitId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; ID đơn vị trong phạm vi được phép. |
| `ownerId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Người phụ trách hoạt động; đổi owner đồng bộ tư cách và quyền trên dự án. |
| `startDate` | string · YYYY-MM-DD | Có | Ngày bắt đầu kế hoạch theo ngày Việt Nam. |
| `dueAt` | string · UTC ISO 8601 có Z | Có | Hạn hiện tại đủ ngày/giờ, ISO UTC có Z. |

FE chỉ được gửi: `code`, `name`, `objective`, `unitId`, `ownerId`, `startDate`, `dueAt`.

### Response DTO

`Projects.ProjectDTO`; xem [từ điển DTO](DTO_MODELS.md#projectsprojectdto).

### Trường thay đổi phía BE / mock

`id`, `status=PLANNED`, `ownerMembership`, `version`, `createdAt`, `updatedAt`.
Entity thực sự thay đổi tăng version/updatedAt và lưu audit theo nghiệp vụ; giữ giá trị gốc và createdAt. Các projection nhãn được dựng từ nguồn ID, không nhận từ FE.

### Điều kiện và lỗi

- Mã duy nhất; người phụ trách hoạt động trong đơn vị
- startDate không sau ngày hạn; dueAt ở tương lai
- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.

### Cache sau thao tác

`projects`, `project-members`, `auth`; ánh xạ đúng scope trong ma trận React Query.

## updateProject

`PATCH /api/projects/:projectId` → HTTP 200

- Feature `projects` · Màn S11 · UC UC-P02.
- DTO đích: `UpdateProjectRequestDTO`, `UpdateProjectResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: PROJECT_MANAGE.
- If-Match: bắt buộc; thiếu 428, version cũ 412. Idempotency-Key: bắt buộc, giữ khi retry cùng payload.
- Cách gọi: useMutation; hook/adapter đề nghị `useUpdateProjectMutation`.

### Params DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `projectId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; ID dự án; không đồng nghĩa ID service. |

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `name` | string | Không | độ dài ≥ 1; độ dài ≤ 255; Tên hiển thị sau trim. |
| `objective` | string | Không | độ dài ≥ 1; độ dài ≤ 2000; Mục tiêu dự án. |
| `ownerId` | string | Không | độ dài ≥ 1; độ dài ≤ 100; Người phụ trách hoạt động; đổi owner đồng bộ tư cách và quyền trên dự án. |
| `startDate` | string · YYYY-MM-DD | Không | Ngày bắt đầu kế hoạch theo ngày Việt Nam. |
| `dueAt` | string · UTC ISO 8601 có Z | Không | Hạn hiện tại đủ ngày/giờ, ISO UTC có Z. |
| `changeReason` | string | Có | độ dài ≥ 1; độ dài ≤ 2000; Lý do đổi kế hoạch; bắt buộc theo điều kiện API và dữ liệu hiện tại. |

FE chỉ được gửi: `name`, `objective`, `ownerId`, `startDate`, `dueAt`, `changeReason`.

### Response DTO

`Projects.ProjectDTO`; xem [từ điển DTO](DTO_MODELS.md#projectsprojectdto).

### Trường thay đổi phía BE / mock

`ownerMembership`, `version`, `updatedAt`, `audit`.
Entity thực sự thay đổi tăng version/updatedAt và lưu audit theo nghiệp vụ; giữ giá trị gốc và createdAt. Các projection nhãn được dựng từ nguồn ID, không nhận từ FE.

### Điều kiện và lỗi

- Không đổi unitId hoặc code trong contract này
- Không rút hạn trước hạn công việc; người phụ trách mới phải hoạt động
- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.
- Nguồn version cho If-Match: **Project** đang hiển thị.

### Cache sau thao tác

`projects`, `project-members`, `auth`, `analytics`; ánh xạ đúng scope trong ma trận React Query.

## activateProject

`POST /api/projects/:projectId/activate` → HTTP 200

- Feature `projects` · Màn S10 · UC UC-P02.
- DTO đích: `ActivateProjectRequestDTO`, `ActivateProjectResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: PROJECT_MANAGE.
- If-Match: bắt buộc; thiếu 428, version cũ 412. Idempotency-Key: bắt buộc, giữ khi retry cùng payload.
- Cách gọi: useMutation; hook/adapter đề nghị `useActivateProjectMutation`.

### Params DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `projectId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; ID dự án; không đồng nghĩa ID service. |

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

Object rỗng `{}`; không có trường nghiệp vụ.

FE chỉ được gửi: Không có..

### Response DTO

`Projects.ProjectDTO`; xem [từ điển DTO](DTO_MODELS.md#projectsprojectdto).

### Trường thay đổi phía BE / mock

`status=ACTIVE`, `version`, `updatedAt`, `audit`.
Entity thực sự thay đổi tăng version/updatedAt và lưu audit theo nghiệp vụ; giữ giá trị gốc và createdAt. Các projection nhãn được dựng từ nguồn ID, không nhận từ FE.

### Điều kiện và lỗi

- Chỉ PLANNED → ACTIVE; phải có người phụ trách hoạt động
- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.
- Nguồn version cho If-Match: **Project** đang hiển thị.

### Cache sau thao tác

`projects`; ánh xạ đúng scope trong ma trận React Query.

## getProjectClosureChecks

`GET /api/projects/:projectId/closure-checks` → HTTP 200

- Feature `projects` · Màn S14 · UC UC-P02.
- DTO đích: `GetProjectClosureChecksRequestDTO`, `GetProjectClosureChecksResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: PROJECT_MANAGE.
- If-Match: không yêu cầu. Idempotency-Key: không yêu cầu.
- Cách gọi: useQuery; hook/adapter đề nghị `useGetProjectClosureChecksQuery`.

### Params DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `projectId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; ID dự án; không đồng nghĩa ID service. |

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

Không có body.

FE chỉ được gửi: Không có..

### Response DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `openTaskCount` | integer | Có | ≥ 0; Số TODO/IN_PROGRESS đang được giao. |
| `pendingReviewCount` | integer | Có | ≥ 0; Việc chờ nghiệm thu được tách riêng. |
| `pendingReportCount` | integer | Có | ≥ 0 |
| `canClose` | boolean | Có | Theo đúng kiểu và khả năng null đã ghi. |


### Trường thay đổi phía BE / mock

Chỉ đọc, không cập nhật dữ liệu nghiệp vụ..

### Điều kiện và lỗi


- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.

### Cache sau thao tác

Cache theo query key riêng, không có mutation invalidation.

## completeProject

`POST /api/projects/:projectId/complete` → HTTP 200

- Feature `projects` · Màn S14 · UC UC-P02.
- DTO đích: `CompleteProjectRequestDTO`, `CompleteProjectResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: PROJECT_MANAGE.
- If-Match: bắt buộc; thiếu 428, version cũ 412. Idempotency-Key: bắt buộc, giữ khi retry cùng payload.
- Cách gọi: useMutation; hook/adapter đề nghị `useCompleteProjectMutation`.

### Params DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `projectId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; ID dự án; không đồng nghĩa ID service. |

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

Object rỗng `{}`; không có trường nghiệp vụ.

FE chỉ được gửi: Không có..

### Response DTO

`Projects.ProjectDTO`; xem [từ điển DTO](DTO_MODELS.md#projectsprojectdto).

### Trường thay đổi phía BE / mock

`status=COMPLETED`, `completedAt`, `version`, `updatedAt`, `audit`.
Entity thực sự thay đổi tăng version/updatedAt và lưu audit theo nghiệp vụ; giữ giá trị gốc và createdAt. Các projection nhãn được dựng từ nguồn ID, không nhận từ FE.

### Điều kiện và lỗi

- ACTIVE; không còn việc mở, lần nộp chờ xét hoặc báo cáo cần gửi
- Không mở lại
- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.
- Nguồn version cho If-Match: **Project** đang hiển thị.

### Cache sau thao tác

`projects`, `tasks`, `reports`, `analytics`; ánh xạ đúng scope trong ma trận React Query.

## cancelProject

`POST /api/projects/:projectId/cancel` → HTTP 200

- Feature `projects` · Màn S14 · UC UC-P02.
- DTO đích: `CancelProjectRequestDTO`, `CancelProjectResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: PROJECT_MANAGE.
- If-Match: bắt buộc; thiếu 428, version cũ 412. Idempotency-Key: bắt buộc, giữ khi retry cùng payload.
- Cách gọi: useMutation; hook/adapter đề nghị `useCancelProjectMutation`.

### Params DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `projectId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; ID dự án; không đồng nghĩa ID service. |

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `reason` | string | Có | độ dài ≥ 1; độ dài ≤ 2000; Lý do của thao tác; ghi audit, không mass assign vào entity. |

FE chỉ được gửi: `reason`.

### Response DTO

`Projects.ProjectDTO`; xem [từ điển DTO](DTO_MODELS.md#projectsprojectdto).

### Trường thay đổi phía BE / mock

`status=CANCELLED`, `cancelledAt`, `version`, `updatedAt`, `audit`.
Entity thực sự thay đổi tăng version/updatedAt và lưu audit theo nghiệp vụ; giữ giá trị gốc và createdAt. Các projection nhãn được dựng từ nguồn ID, không nhận từ FE.

### Điều kiện và lỗi

- PLANNED hoặc ACTIVE; xử lý việc và báo cáo tồn đọng trước
- Không hủy dây chuyền ngầm
- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.
- Nguồn version cho If-Match: **Project** đang hiển thị.

### Cache sau thao tác

`projects`, `tasks`, `reports`, `analytics`; ánh xạ đúng scope trong ma trận React Query.

## listProjectHistory

`GET /api/projects/:projectId/history` → HTTP 200

- Feature `projects` · Màn S10 · UC UC-P02.
- DTO đích: `ListProjectHistoryRequestDTO`, `ListProjectHistoryResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: theo người sở hữu và phạm vi tài nguyên.
- If-Match: không yêu cầu. Idempotency-Key: không yêu cầu.
- Cách gọi: useQuery; hook/adapter đề nghị `useListProjectHistoryQuery`.

### Params DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `projectId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; ID dự án; không đồng nghĩa ID service. |

### Query DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `page` | integer | Không; có mặc định | ≥ 1; mặc định 1; Trang bắt đầu từ 1. |
| `pageSize` | integer | Không; có mặc định | ≥ 1; ≤ 100; mặc định 20; Số dòng mỗi trang, mặc định 20 và tối đa 100. |
| `q` | string | Không | độ dài ≤ 255; Từ khóa tìm kiếm, trim đầu/cuối. |

### Body DTO và whitelist

Không có body.

FE chỉ được gửi: Không có..

### Response DTO

`PageDTO<Tasks.AuditDTO>`; xem [từ điển DTO](DTO_MODELS.md#tasksauditdto).

### Trường thay đổi phía BE / mock

Chỉ đọc, không cập nhật dữ liệu nghiệp vụ..

### Điều kiện và lỗi


- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.

### Cache sau thao tác

Cache theo query key riêng, không có mutation invalidation.

## listProjectMembers

`GET /api/projects/:projectId/members` → HTTP 200

- Feature `project-members` · Màn S12 · UC UC-P04.
- DTO đích: `ListProjectMembersRequestDTO`, `ListProjectMembersResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: theo người sở hữu và phạm vi tài nguyên.
- If-Match: không yêu cầu. Idempotency-Key: không yêu cầu.
- Cách gọi: useQuery; hook/adapter đề nghị `useListProjectMembersQuery`.

### Params DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `projectId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; ID dự án; không đồng nghĩa ID service. |

### Query DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `page` | integer | Không; có mặc định | ≥ 1; mặc định 1; Trang bắt đầu từ 1. |
| `pageSize` | integer | Không; có mặc định | ≥ 1; ≤ 100; mặc định 20; Số dòng mỗi trang, mặc định 20 và tối đa 100. |
| `q` | string | Không | độ dài ≤ 255; Từ khóa tìm kiếm, trim đầu/cuối. |

### Body DTO và whitelist

Không có body.

FE chỉ được gửi: Không có..

### Response DTO

`PageDTO<Members.MembershipDTO>`; gồm `items` và `pagination`. Item theo [từ điển DTO](DTO_MODELS.md#membersmembershipdto).

### Trường thay đổi phía BE / mock

Chỉ đọc, không cập nhật dữ liệu nghiệp vụ..

### Điều kiện và lỗi


- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.

### Cache sau thao tác

Cache theo query key riêng, không có mutation invalidation.

## addProjectMember

`POST /api/projects/:projectId/members` → HTTP 201

- Feature `project-members` · Màn S12 · UC UC-P04.
- DTO đích: `AddProjectMemberRequestDTO`, `AddProjectMemberResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: MEMBERS_MANAGE.
- If-Match: không yêu cầu. Idempotency-Key: bắt buộc, giữ khi retry cùng payload.
- Cách gọi: useMutation; hook/adapter đề nghị `useAddProjectMemberMutation`.

### Params DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `projectId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; ID dự án; không đồng nghĩa ID service. |

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `userId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Tài khoản của thành viên/người ghi theo đúng model. |
| `projectRole` | enum(MANAGER, MEMBER) | Có | Vai trò xác định thao tác cố định trong dự án; OWNER/MANAGER chỉ dành cho tài khoản Leader/PM. |

FE chỉ được gửi: `userId`, `projectRole`.

### Response DTO

`Members.MembershipDTO`; xem [từ điển DTO](DTO_MODELS.md#membersmembershipdto).

### Trường thay đổi phía BE / mock

`id`, `projectId`, `userId`, `projectRole`, `endedAt=null`, `version`, `audit`.
Tăng version và ghi audit; giữ ID và lịch sử tư cách. Nhãn người được dựng từ userId, không nhận từ FE.

### Điều kiện và lỗi

- Tài khoản hoạt động; không trùng thành viên đang hoạt động
- MANAGER chỉ dành cho tài khoản Leader/PM; OWNER chỉ qua thay đổi người phụ trách dự án
- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.

### Cache sau thao tác

`project-members`, `auth`; ánh xạ đúng scope trong ma trận React Query.

## updateProjectMemberRole

`PATCH /api/projects/:projectId/members/:membershipId` → HTTP 200

- Feature `project-members` · Màn S13 · UC UC-P05.
- DTO đích: `UpdateProjectMemberRoleRequestDTO`, `UpdateProjectMemberRoleResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: MEMBERS_MANAGE.
- If-Match: bắt buộc; thiếu 428, version cũ 412. Idempotency-Key: bắt buộc, giữ khi retry cùng payload.
- Cách gọi: useMutation; hook/adapter đề nghị `useUpdateProjectMemberRoleMutation`.

### Params DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `projectId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; ID dự án; không đồng nghĩa ID service. |
| `membershipId` | string | Có | độ dài ≥ 1; độ dài ≤ 100 |

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `projectRole` | enum(MANAGER, MEMBER) | Có | Vai trò xác định thao tác cố định trong dự án; OWNER/MANAGER chỉ dành cho tài khoản Leader/PM. |
| `reason` | string | Có | độ dài ≥ 1; độ dài ≤ 2000; Lý do của thao tác; ghi audit, không mass assign vào entity. |

FE chỉ được gửi: `projectRole`, `reason`.

### Response DTO

`Members.MembershipDTO`; xem [từ điển DTO](DTO_MODELS.md#membersmembershipdto).

### Trường thay đổi phía BE / mock

`projectRole`, `version`, `audit`.
Tăng version và ghi audit; giữ ID và lịch sử tư cách. Nhãn người được dựng từ userId, không nhận từ FE.

### Điều kiện và lỗi

- Không sửa OWNER bằng API này
- Vai trò MANAGER chỉ dành cho tài khoản Leader/PM; không cấp từng quyền riêng. Giữ người phụ trách hiện tại
- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.
- Nguồn version cho If-Match: **Membership** đang hiển thị.

### Cache sau thao tác

`project-members`, `auth`; ánh xạ đúng scope trong ma trận React Query.

## endProjectMembership

`POST /api/projects/:projectId/members/:membershipId/end` → HTTP 200

- Feature `project-members` · Màn S12 · UC UC-P04.
- DTO đích: `EndProjectMembershipRequestDTO`, `EndProjectMembershipResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: MEMBERS_MANAGE.
- If-Match: bắt buộc; thiếu 428, version cũ 412. Idempotency-Key: bắt buộc, giữ khi retry cùng payload.
- Cách gọi: useMutation; hook/adapter đề nghị `useEndProjectMembershipMutation`.

### Params DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `projectId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; ID dự án; không đồng nghĩa ID service. |
| `membershipId` | string | Có | độ dài ≥ 1; độ dài ≤ 100 |

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `reason` | string | Có | độ dài ≥ 1; độ dài ≤ 2000; Lý do của thao tác; ghi audit, không mass assign vào entity. |

FE chỉ được gửi: `reason`.

### Response DTO

`Members.MembershipDTO`; xem [từ điển DTO](DTO_MODELS.md#membersmembershipdto).

### Trường thay đổi phía BE / mock

`endedAt`, `version`, `audit`.
Tăng version và ghi audit; giữ ID và lịch sử tư cách. Nhãn người được dựng từ userId, không nhận từ FE.

### Điều kiện và lỗi

- Bàn giao việc mở trước; không kết thúc người phụ trách hiện tại
- Giữ lịch sử phân công và giờ công
- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.
- Nguồn version cho If-Match: **Membership** đang hiển thị.

### Cache sau thao tác

`project-members`, `auth`, `tasks`; ánh xạ đúng scope trong ma trận React Query.

## listTasks

`GET /api/tasks` → HTTP 200

- Feature `tasks` · Màn S02, S15, S16, S26 · UC UC-T04.
- DTO đích: `ListTasksRequestDTO`, `ListTasksResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: theo người sở hữu và phạm vi tài nguyên.
- If-Match: không yêu cầu. Idempotency-Key: không yêu cầu.
- Cách gọi: useQuery; hook/adapter đề nghị `useListTasksQuery`.

### Params DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Query DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `page` | integer | Không; có mặc định | ≥ 1; mặc định 1; Trang bắt đầu từ 1. |
| `pageSize` | integer | Không; có mặc định | ≥ 1; ≤ 100; mặc định 20; Số dòng mỗi trang, mặc định 20 và tối đa 100. |
| `q` | string | Không | độ dài ≤ 255; Từ khóa tìm kiếm, trim đầu/cuối. |
| `projectId` | string | Không | độ dài ≥ 1; độ dài ≤ 100; ID dự án; không đồng nghĩa ID service. |
| `assigneeId` | string | Không | độ dài ≥ 1; độ dài ≤ 100; Người chịu trách nhiệm hiện tại với việc mở; với việc kết thúc, giữ người phụ trách cuối theo D15. |
| `status` | Tasks.TaskStatusDTO | Không | Trạng thái theo enum của đúng model; không dùng chung enum cho mọi phân hệ. |
| `priority` | Tasks.PriorityDTO | Không | LOW/NORMAL/HIGH/URGENT; UI ánh xạ nhãn Việt. |
| `overdue` | boolean | Không | Boolean; URL string false phải được parse thành false. |
| `dueFrom` | string · UTC ISO 8601 có Z | Không | Giới hạn dưới của deadline ISO UTC. |
| `dueTo` | string · UTC ISO 8601 có Z | Không | Giới hạn trên của deadline ISO UTC. |
| `sort` | enum(dueAt, -dueAt, updatedAt, -updatedAt) | Không; có mặc định | mặc định dueAt; Trường sắp xếp trong allowlist, dấu - là giảm dần. |

### Body DTO và whitelist

Không có body.

FE chỉ được gửi: Không có..

### Response DTO

`PageDTO<Tasks.TaskDTO>`; gồm `items` và `pagination`. Item theo [từ điển DTO](DTO_MODELS.md#taskstaskdto).

### Trường thay đổi phía BE / mock

Chỉ đọc, không cập nhật dữ liệu nghiệp vụ..

### Điều kiện và lỗi


- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.

### Cache sau thao tác

Cache theo query key riêng, không có mutation invalidation.

## getTask

`GET /api/tasks/:taskId` → HTTP 200

- Feature `tasks` · Màn S18 · UC UC-T04.
- DTO đích: `GetTaskRequestDTO`, `GetTaskResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: theo người sở hữu và phạm vi tài nguyên.
- If-Match: không yêu cầu. Idempotency-Key: không yêu cầu.
- Cách gọi: useQuery; hook/adapter đề nghị `useGetTaskQuery`.

### Params DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `taskId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Công việc liên quan; phải đúng dự án và phạm vi. |

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

Không có body.

FE chỉ được gửi: Không có..

### Response DTO

`Tasks.TaskDTO`; xem [từ điển DTO](DTO_MODELS.md#taskstaskdto).

### Trường thay đổi phía BE / mock

Chỉ đọc, không cập nhật dữ liệu nghiệp vụ..

### Điều kiện và lỗi


- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.

### Cache sau thao tác

Cache theo query key riêng, không có mutation invalidation.

## createTask

`POST /api/projects/:projectId/tasks` → HTTP 201

- Feature `tasks` · Màn S17 · UC UC-T01.
- DTO đích: `CreateTaskRequestDTO`, `CreateTaskResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: TASKS_MANAGE.
- If-Match: không yêu cầu. Idempotency-Key: bắt buộc, giữ khi retry cùng payload.
- Cách gọi: useMutation; hook/adapter đề nghị `useCreateTaskMutation`.

### Params DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `projectId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; ID dự án; không đồng nghĩa ID service. |

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `title` | string | Có | độ dài ≥ 1; độ dài ≤ 255; Tên công việc 1–255 ký tự sau trim. |
| `description` | string / null | Không | Mô tả; task nhận null để bỏ mô tả. |
| `acceptanceCriteria` | string | Có | độ dài ≥ 1; độ dài ≤ 2000; Tiêu chí dùng đối chiếu khi nghiệm thu. |
| `priority` | Tasks.PriorityDTO | Có | LOW/NORMAL/HIGH/URGENT; UI ánh xạ nhãn Việt. |
| `dueAt` | string · UTC ISO 8601 có Z | Có | Hạn hiện tại đủ ngày/giờ, ISO UTC có Z. |
| `estimatedMinutes` | integer | Có | > 0; ≤ 5256000; Phút dự kiến hiện tại, số nguyên dương. |

FE chỉ được gửi: `title`, `description`, `acceptanceCriteria`, `priority`, `dueAt`, `estimatedMinutes`.

### Response DTO

`Tasks.TaskDTO`; xem [từ điển DTO](DTO_MODELS.md#taskstaskdto).

### Trường thay đổi phía BE / mock

`id`, `projectId`, `status=NEW`, `assigneeId=null`, `originalDueAt`, `originalEstimatedMinutes`, `remainingMinutes=null`, `actualMinutes=0`, `version`, `createdAt`, `updatedAt`, `statusChangedAt`.
Entity thực sự thay đổi tăng version/updatedAt và lưu audit theo nghiệp vụ; giữ giá trị gốc và createdAt. Các projection nhãn được dựng từ nguồn ID, không nhận từ FE.

### Điều kiện và lỗi

- Dự án ACTIVE; hạn tương lai và không vượt dự án
- Không nhận status, assigneeId hoặc actualMinutes từ FE
- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.

### Cache sau thao tác

`tasks`, `projects`, `analytics`; ánh xạ đúng scope trong ma trận React Query.

## updateTask

`PATCH /api/tasks/:taskId` → HTTP 200

- Feature `tasks` · Màn S19 · UC UC-T03.
- DTO đích: `UpdateTaskRequestDTO`, `UpdateTaskResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: TASKS_MANAGE.
- If-Match: bắt buộc; thiếu 428, version cũ 412. Idempotency-Key: bắt buộc, giữ khi retry cùng payload.
- Cách gọi: useMutation; hook/adapter đề nghị `useUpdateTaskMutation`.

### Params DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `taskId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Công việc liên quan; phải đúng dự án và phạm vi. |

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `title` | string | Không | độ dài ≥ 1; độ dài ≤ 255; Tên công việc 1–255 ký tự sau trim. |
| `description` | string / null | Không | Mô tả; task nhận null để bỏ mô tả. |
| `acceptanceCriteria` | string | Không | độ dài ≥ 1; độ dài ≤ 2000; Tiêu chí dùng đối chiếu khi nghiệm thu. |
| `priority` | Tasks.PriorityDTO | Không | LOW/NORMAL/HIGH/URGENT; UI ánh xạ nhãn Việt. |
| `dueAt` | string · UTC ISO 8601 có Z | Không | Hạn hiện tại đủ ngày/giờ, ISO UTC có Z. |
| `estimatedMinutes` | integer | Không | > 0; ≤ 5256000; Phút dự kiến hiện tại, số nguyên dương. |
| `changeReason` | string | Không | độ dài ≥ 1; độ dài ≤ 2000; Lý do đổi kế hoạch; bắt buộc theo điều kiện API và dữ liệu hiện tại. |

FE chỉ được gửi: `title`, `description`, `acceptanceCriteria`, `priority`, `dueAt`, `estimatedMinutes`, `changeReason`.

### Response DTO

`Tasks.TaskDTO`; xem [từ điển DTO](DTO_MODELS.md#taskstaskdto).

### Trường thay đổi phía BE / mock

`version`, `updatedAt`, `isOverdue`, `audit`.
Entity thực sự thay đổi tăng version/updatedAt và lưu audit theo nghiệp vụ; giữ giá trị gốc và createdAt. Các projection nhãn được dựng từ nguồn ID, không nhận từ FE.

### Điều kiện và lỗi

- Chỉ NEW/TODO/IN_PROGRESS trong dự án ACTIVE
- Đổi hạn hoặc dự kiến sau khi giao cần lý do và giữ giá trị gốc
- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.
- Nguồn version cho If-Match: **Task** đang hiển thị.

### Cache sau thao tác

`tasks`, `projects`, `analytics`, `alerts`; ánh xạ đúng scope trong ma trận React Query.

## assignTask

`POST /api/tasks/:taskId/assignments` → HTTP 200

- Feature `tasks` · Màn S20 · UC UC-T02.
- DTO đích: `AssignTaskRequestDTO`, `AssignTaskResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: TASKS_MANAGE.
- If-Match: bắt buộc; thiếu 428, version cũ 412. Idempotency-Key: bắt buộc, giữ khi retry cùng payload.
- Cách gọi: useMutation; hook/adapter đề nghị `useAssignTaskMutation`.

### Params DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `taskId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Công việc liên quan; phải đúng dự án và phạm vi. |

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `assigneeId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Người chịu trách nhiệm hiện tại với việc mở; với việc kết thúc, giữ người phụ trách cuối theo D15. |
| `reason` | string | Không | độ dài ≥ 1; độ dài ≤ 2000; Lý do của thao tác; ghi audit, không mass assign vào entity. |

FE chỉ được gửi: `assigneeId`, `reason`.

### Response DTO

`Tasks.TaskDTO`; xem [từ điển DTO](DTO_MODELS.md#taskstaskdto).

### Trường thay đổi phía BE / mock

`assigneeId`, `status=TODO`, `assignmentHistory`, `version`, `updatedAt`, `audit`, `statusChangedAt`.
Entity thực sự thay đổi tăng version/updatedAt và lưu audit theo nghiệp vụ; giữ giá trị gốc và createdAt. Các projection nhãn được dựng từ nguồn ID, không nhận từ FE.

### Điều kiện và lỗi

- Người nhận là thành viên hoạt động; bàn giao cần reason
- IN_PROGRESS khi bàn giao trở về TODO; firstStartedAt vẫn giữ
- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.
- Nguồn version cho If-Match: **Task** đang hiển thị.

### Cache sau thao tác

`tasks`, `project-members`, `analytics`, `alerts`; ánh xạ đúng scope trong ma trận React Query.

## startTask

`POST /api/tasks/:taskId/start` → HTTP 200

- Feature `tasks` · Màn S21 · UC UC-T05.
- DTO đích: `StartTaskRequestDTO`, `StartTaskResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: theo người sở hữu và phạm vi tài nguyên.
- If-Match: bắt buộc; thiếu 428, version cũ 412. Idempotency-Key: bắt buộc, giữ khi retry cùng payload.
- Cách gọi: useMutation; hook/adapter đề nghị `useStartTaskMutation`.

### Params DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `taskId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Công việc liên quan; phải đúng dự án và phạm vi. |

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

Object rỗng `{}`; không có trường nghiệp vụ.

FE chỉ được gửi: Không có..

### Response DTO

`Tasks.TaskDTO`; xem [từ điển DTO](DTO_MODELS.md#taskstaskdto).

### Trường thay đổi phía BE / mock

`status=IN_PROGRESS`, `firstStartedAt nếu chưa có`, `version`, `updatedAt`, `audit`, `statusChangedAt`.
Entity thực sự thay đổi tăng version/updatedAt và lưu audit theo nghiệp vụ; giữ giá trị gốc và createdAt. Các projection nhãn được dựng từ nguồn ID, không nhận từ FE.

### Điều kiện và lỗi

- Chỉ người nhận hiện tại; TODO; dự án ACTIVE
- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.
- Nguồn version cho If-Match: **Task** đang hiển thị.

### Cache sau thao tác

`tasks`, `analytics`; ánh xạ đúng scope trong ma trận React Query.

## pauseTask

`POST /api/tasks/:taskId/pause` → HTTP 200

- Feature `tasks` · Màn S21 · UC UC-T05.
- DTO đích: `PauseTaskRequestDTO`, `PauseTaskResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: theo người sở hữu và phạm vi tài nguyên.
- If-Match: bắt buộc; thiếu 428, version cũ 412. Idempotency-Key: bắt buộc, giữ khi retry cùng payload.
- Cách gọi: useMutation; hook/adapter đề nghị `usePauseTaskMutation`.

### Params DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `taskId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Công việc liên quan; phải đúng dự án và phạm vi. |

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `reason` | string | Có | độ dài ≥ 1; độ dài ≤ 2000; Lý do của thao tác; ghi audit, không mass assign vào entity. |

FE chỉ được gửi: `reason`.

### Response DTO

`Tasks.TaskDTO`; xem [từ điển DTO](DTO_MODELS.md#taskstaskdto).

### Trường thay đổi phía BE / mock

`status=TODO`, `version`, `updatedAt`, `audit`, `statusChangedAt`.
Entity thực sự thay đổi tăng version/updatedAt và lưu audit theo nghiệp vụ; giữ giá trị gốc và createdAt. Các projection nhãn được dựng từ nguồn ID, không nhận từ FE.

### Điều kiện và lỗi

- Chỉ người nhận hiện tại; IN_PROGRESS
- Không tự tính giờ công từ lúc bắt đầu/tạm dừng
- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.
- Nguồn version cho If-Match: **Task** đang hiển thị.

### Cache sau thao tác

`tasks`, `analytics`; ánh xạ đúng scope trong ma trận React Query.

## cancelTask

`POST /api/tasks/:taskId/cancel` → HTTP 200

- Feature `tasks` · Màn S21 · UC UC-T03.
- DTO đích: `CancelTaskRequestDTO`, `CancelTaskResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: TASKS_MANAGE.
- If-Match: bắt buộc; thiếu 428, version cũ 412. Idempotency-Key: bắt buộc, giữ khi retry cùng payload.
- Cách gọi: useMutation; hook/adapter đề nghị `useCancelTaskMutation`.

### Params DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `taskId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Công việc liên quan; phải đúng dự án và phạm vi. |

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `reason` | string | Có | độ dài ≥ 1; độ dài ≤ 2000; Lý do của thao tác; ghi audit, không mass assign vào entity. |

FE chỉ được gửi: `reason`.

### Response DTO

`Tasks.TaskDTO`; xem [từ điển DTO](DTO_MODELS.md#taskstaskdto).

### Trường thay đổi phía BE / mock

`status=CANCELLED`, `cancelledAt`, `assignmentHistory`, `version`, `updatedAt`, `audit`, `statusChangedAt`.
Entity thực sự thay đổi tăng version/updatedAt và lưu audit theo nghiệp vụ; giữ giá trị gốc và createdAt. Các projection nhãn được dựng từ nguồn ID, không nhận từ FE.

### Điều kiện và lỗi

- Chỉ NEW/TODO/IN_PROGRESS; có quyền quản lý; không mở lại
- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.
- Nguồn version cho If-Match: **Task** đang hiển thị.

### Cache sau thao tác

`tasks`, `projects`, `analytics`, `alerts`; ánh xạ đúng scope trong ma trận React Query.

## updateRemainingEstimate

`PATCH /api/tasks/:taskId/remaining-estimate` → HTTP 200

- Feature `tasks` · Màn S18 · UC UC-D03.
- DTO đích: `UpdateRemainingEstimateRequestDTO`, `UpdateRemainingEstimateResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: theo người sở hữu và phạm vi tài nguyên.
- If-Match: bắt buộc; thiếu 428, version cũ 412. Idempotency-Key: bắt buộc, giữ khi retry cùng payload.
- Cách gọi: useMutation; hook/adapter đề nghị `useUpdateRemainingEstimateMutation`.

### Params DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `taskId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Công việc liên quan; phải đúng dự án và phạm vi. |

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `remainingMinutes` | integer | Có | ≥ 0; ≤ 5256000; Phút còn lại được nhập riêng; null là chưa cập nhật, không tự suy bằng phép trừ. |

FE chỉ được gửi: `remainingMinutes`.

### Response DTO

`Tasks.TaskDTO`; xem [từ điển DTO](DTO_MODELS.md#taskstaskdto).

### Trường thay đổi phía BE / mock

`version`, `updatedAt`, `audit`.
Entity thực sự thay đổi tăng version/updatedAt và lưu audit theo nghiệp vụ; giữ giá trị gốc và createdAt. Các projection nhãn được dựng từ nguồn ID, không nhận từ FE.

### Điều kiện và lỗi

- Đề xuất API hỗ trợ dữ liệu tải công việc; cần BE chốt
- Chỉ người nhận hiện tại ở IN_PROGRESS; không tự lấy dự kiến trừ giờ đã ghi
- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.
- Nguồn version cho If-Match: **Task** đang hiển thị.

### Cache sau thao tác

`tasks`, `analytics`, `alerts`; ánh xạ đúng scope trong ma trận React Query.

## listTaskHistory

`GET /api/tasks/:taskId/history` → HTTP 200

- Feature `tasks` · Màn S28 · UC UC-T11.
- DTO đích: `ListTaskHistoryRequestDTO`, `ListTaskHistoryResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: theo người sở hữu và phạm vi tài nguyên.
- If-Match: không yêu cầu. Idempotency-Key: không yêu cầu.
- Cách gọi: useQuery; hook/adapter đề nghị `useListTaskHistoryQuery`.

### Params DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `taskId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Công việc liên quan; phải đúng dự án và phạm vi. |

### Query DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `page` | integer | Không; có mặc định | ≥ 1; mặc định 1; Trang bắt đầu từ 1. |
| `pageSize` | integer | Không; có mặc định | ≥ 1; ≤ 100; mặc định 20; Số dòng mỗi trang, mặc định 20 và tối đa 100. |
| `q` | string | Không | độ dài ≤ 255; Từ khóa tìm kiếm, trim đầu/cuối. |

### Body DTO và whitelist

Không có body.

FE chỉ được gửi: Không có..

### Response DTO

`PageDTO<Tasks.AuditDTO>`; xem [từ điển DTO](DTO_MODELS.md#tasksauditdto).

### Trường thay đổi phía BE / mock

Chỉ đọc, không cập nhật dữ liệu nghiệp vụ..

### Điều kiện và lỗi


- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.

### Cache sau thao tác

Cache theo query key riêng, không có mutation invalidation.

## listTimeLogs

`GET /api/tasks/:taskId/time-logs` → HTTP 200

- Feature `time-logs` · Màn S22 · UC UC-T06.
- DTO đích: `ListTimeLogsRequestDTO`, `ListTimeLogsResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: theo người sở hữu và phạm vi tài nguyên.
- If-Match: không yêu cầu. Idempotency-Key: không yêu cầu.
- Cách gọi: useQuery; hook/adapter đề nghị `useListTimeLogsQuery`.

### Params DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `taskId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Công việc liên quan; phải đúng dự án và phạm vi. |

### Query DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `page` | integer | Không; có mặc định | ≥ 1; mặc định 1; Trang bắt đầu từ 1. |
| `pageSize` | integer | Không; có mặc định | ≥ 1; ≤ 100; mặc định 20; Số dòng mỗi trang, mặc định 20 và tối đa 100. |
| `q` | string | Không | độ dài ≤ 255; Từ khóa tìm kiếm, trim đầu/cuối. |

### Body DTO và whitelist

Không có body.

FE chỉ được gửi: Không có..

### Response DTO

`PageDTO<Logs.TimeLogDTO>`; gồm `items` và `pagination`. Item theo [từ điển DTO](DTO_MODELS.md#logstimelogdto).

### Trường thay đổi phía BE / mock

Chỉ đọc, không cập nhật dữ liệu nghiệp vụ..

### Điều kiện và lỗi


- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.

### Cache sau thao tác

Cache theo query key riêng, không có mutation invalidation.

## createTimeLog

`POST /api/tasks/:taskId/time-logs` → HTTP 201

- Feature `time-logs` · Màn S23 · UC UC-T06.
- DTO đích: `CreateTimeLogRequestDTO`, `CreateTimeLogResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: theo người sở hữu và phạm vi tài nguyên.
- If-Match: bắt buộc; thiếu 428, version cũ 412. Idempotency-Key: bắt buộc, giữ khi retry cùng payload.
- Cách gọi: useMutation; hook/adapter đề nghị `useCreateTimeLogMutation`.

### Params DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `taskId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Công việc liên quan; phải đúng dự án và phạm vi. |

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `workDate` | string · YYYY-MM-DD | Có | Ngày làm việc YYYY-MM-DD theo Asia/Ho_Chi_Minh. |
| `minutes` | integer | Có | > 0; ≤ 1440; Phút nguyên dương; từng log ≤1440, tổng mọi log/người/ngày do BE kiểm tra. |
| `description` | string | Có | độ dài ≥ 1; độ dài ≤ 2000; Mô tả; task nhận null để bỏ mô tả. |

FE chỉ được gửi: `workDate`, `minutes`, `description`.

### Response DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `timeLog` | Logs.TimeLogDTO | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `task` | Tasks.TaskDTO | Có | Theo đúng kiểu và khả năng null đã ghi. |


### Trường thay đổi phía BE / mock

`timeLog.id`, `userId`, `taskId`, `status=ACTIVE`, `task.actualMinutes`, `version`, `updatedAt`, `audit`.
Entity thực sự thay đổi tăng version/updatedAt và lưu audit theo nghiệp vụ; giữ giá trị gốc và createdAt. Các projection nhãn được dựng từ nguồn ID, không nhận từ FE.

### Điều kiện và lỗi

- Chỉ người nhận ở IN_PROGRESS; ngày trong lần phân công, từ firstStartedAt đến hôm nay Việt Nam
- Tổng mọi việc cùng người/ngày không vượt 1440; kiểm tra nguyên tử
- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.
- Nguồn version cho If-Match: **Task** đang hiển thị.

### Cache sau thao tác

`time-logs`, `tasks`, `reports`, `report-preview`, `analytics`; ánh xạ đúng scope trong ma trận React Query.

## updateTimeLog

`PATCH /api/time-logs/:timeLogId` → HTTP 200

- Feature `time-logs` · Màn S23 · UC UC-T06.
- DTO đích: `UpdateTimeLogRequestDTO`, `UpdateTimeLogResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: theo người sở hữu và phạm vi tài nguyên.
- If-Match: bắt buộc; thiếu 428, version cũ 412. Idempotency-Key: bắt buộc, giữ khi retry cùng payload.
- Cách gọi: useMutation; hook/adapter đề nghị `useUpdateTimeLogMutation`.

### Params DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `timeLogId` | string | Có | độ dài ≥ 1; độ dài ≤ 100 |

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `workDate` | string · YYYY-MM-DD | Không | Ngày làm việc YYYY-MM-DD theo Asia/Ho_Chi_Minh. |
| `minutes` | integer | Không | > 0; ≤ 1440; Phút nguyên dương; từng log ≤1440, tổng mọi log/người/ngày do BE kiểm tra. |
| `description` | string | Không | độ dài ≥ 1; độ dài ≤ 2000; Mô tả; task nhận null để bỏ mô tả. |
| `reason` | string | Có | độ dài ≥ 1; độ dài ≤ 2000; Lý do của thao tác; ghi audit, không mass assign vào entity. |

FE chỉ được gửi: `workDate`, `minutes`, `description`, `reason`.

### Response DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `timeLog` | Logs.TimeLogDTO | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `task` | Tasks.TaskDTO | Có | Theo đúng kiểu và khả năng null đã ghi. |


### Trường thay đổi phía BE / mock

`timeLog.version`, `timeLog.updatedAt`, `task.actualMinutes`, `task.version`, `task.updatedAt`, `audit`.
Entity thực sự thay đổi tăng version/updatedAt và lưu audit theo nghiệp vụ; giữ giá trị gốc và createdAt. Các projection nhãn được dựng từ nguồn ID, không nhận từ FE.

### Điều kiện và lỗi

- Chỉ nhật ký ACTIVE của người nhận hiện tại ở IN_PROGRESS
- Có lý do; tổng ngày sau sửa không vượt 1440
- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.
- Nguồn version cho If-Match: **TimeLog** đang hiển thị.

### Cache sau thao tác

`time-logs`, `tasks`, `reports`, `report-preview`, `analytics`; ánh xạ đúng scope trong ma trận React Query.

## voidTimeLog

`POST /api/time-logs/:timeLogId/void` → HTTP 200

- Feature `time-logs` · Màn S23 · UC UC-T06.
- DTO đích: `VoidTimeLogRequestDTO`, `VoidTimeLogResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: theo người sở hữu và phạm vi tài nguyên.
- If-Match: bắt buộc; thiếu 428, version cũ 412. Idempotency-Key: bắt buộc, giữ khi retry cùng payload.
- Cách gọi: useMutation; hook/adapter đề nghị `useVoidTimeLogMutation`.

### Params DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `timeLogId` | string | Có | độ dài ≥ 1; độ dài ≤ 100 |

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `reason` | string | Có | độ dài ≥ 1; độ dài ≤ 2000; Lý do của thao tác; ghi audit, không mass assign vào entity. |

FE chỉ được gửi: `reason`.

### Response DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `timeLog` | Logs.TimeLogDTO | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `task` | Tasks.TaskDTO | Có | Theo đúng kiểu và khả năng null đã ghi. |


### Trường thay đổi phía BE / mock

`timeLog.status=VOID`, `voidReason`, `task.actualMinutes`, `version`, `updatedAt`, `audit`.
Entity thực sự thay đổi tăng version/updatedAt và lưu audit theo nghiệp vụ; giữ giá trị gốc và createdAt. Các projection nhãn được dựng từ nguồn ID, không nhận từ FE.

### Điều kiện và lỗi

- Không xóa dấu vết; chỉ chủ nhật ký đang là người nhận ở IN_PROGRESS
- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.
- Nguồn version cho If-Match: **TimeLog** đang hiển thị.

### Cache sau thao tác

`time-logs`, `tasks`, `reports`, `report-preview`, `analytics`; ánh xạ đúng scope trong ma trận React Query.

## listSubmissions

`GET /api/tasks/:taskId/submissions` → HTTP 200

- Feature `submissions` · Màn S25 · UC UC-T07, UC-T11.
- DTO đích: `ListSubmissionsRequestDTO`, `ListSubmissionsResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: theo người sở hữu và phạm vi tài nguyên.
- If-Match: không yêu cầu. Idempotency-Key: không yêu cầu.
- Cách gọi: useQuery; hook/adapter đề nghị `useListSubmissionsQuery`.

### Params DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `taskId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Công việc liên quan; phải đúng dự án và phạm vi. |

### Query DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `page` | integer | Không; có mặc định | ≥ 1; mặc định 1; Trang bắt đầu từ 1. |
| `pageSize` | integer | Không; có mặc định | ≥ 1; ≤ 100; mặc định 20; Số dòng mỗi trang, mặc định 20 và tối đa 100. |
| `q` | string | Không | độ dài ≤ 255; Từ khóa tìm kiếm, trim đầu/cuối. |
| `sort` | enum(sequence, -sequence) | Không; mặc định -sequence | Cũ nhất/mới nhất trước, áp dụng trước phân trang. |

### Body DTO và whitelist

Không có body.

FE chỉ được gửi: Không có..

### Response DTO

`PageDTO<Submissions.SubmissionDTO>`; gồm `items` và `pagination`. Item theo [từ điển DTO](DTO_MODELS.md#submissionssubmissiondto).

### Trường thay đổi phía BE / mock

Chỉ đọc, không cập nhật dữ liệu nghiệp vụ..

### Điều kiện và lỗi


- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.

### Cache sau thao tác

Cache theo query key riêng, không có mutation invalidation.

## getSubmission

`GET /api/tasks/:taskId/submissions/:submissionId` → HTTP 200

- Feature `submissions` · Màn S27 · UC UC-T08, UC-T09.
- DTO đích: `GetSubmissionRequestDTO`, `GetSubmissionResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: theo người sở hữu và phạm vi tài nguyên.
- If-Match: không yêu cầu. Idempotency-Key: không yêu cầu.
- Cách gọi: useQuery; hook/adapter đề nghị `useGetSubmissionQuery`.

### Params DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `taskId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Công việc liên quan; phải đúng dự án và phạm vi. |
| `submissionId` | string | Có | độ dài ≥ 1; độ dài ≤ 100 |

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

Không có body.

FE chỉ được gửi: Không có..

### Response DTO

`Submissions.SubmissionDTO`; xem [từ điển DTO](DTO_MODELS.md#submissionssubmissiondto).

### Trường thay đổi phía BE / mock

Chỉ đọc, không cập nhật dữ liệu nghiệp vụ..

### Điều kiện và lỗi


- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.

### Cache sau thao tác

Cache theo query key riêng, không có mutation invalidation.

## createSubmission

`POST /api/tasks/:taskId/submissions` → HTTP 201

- Feature `submissions` · Màn S24 · UC UC-T07.
- DTO đích: `CreateSubmissionRequestDTO`, `CreateSubmissionResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: theo người sở hữu và phạm vi tài nguyên.
- If-Match: bắt buộc; thiếu 428, version cũ 412. Idempotency-Key: bắt buộc, giữ khi retry cùng payload.
- Cách gọi: useMutation; hook/adapter đề nghị `useCreateSubmissionMutation`.

### Params DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `taskId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Công việc liên quan; phải đúng dự án và phạm vi. |

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `summary` | string | Có | độ dài ≥ 1; độ dài ≤ 2000; Tóm tắt kết quả bắt buộc. |
| `links` | array<string> | Có | số phần tử ≤ 10; Mảng liên kết HTTP/HTTPS tùy chọn. |
| `attachmentIds` | array<string> | Có | số phần tử ≤ 10; Tệp READY đúng quyền/công việc; tối đa theo contract và policy. |

FE chỉ được gửi: `summary`, `links`, `attachmentIds`.

### Response DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `submission` | Submissions.SubmissionDTO | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `task` | Tasks.TaskDTO | Có | Theo đúng kiểu và khả năng null đã ghi. |


### Trường thay đổi phía BE / mock

`submission.id`, `sequence`, `submittedBy`, `submittedAt`, `dueAtSnapshot`, `actualMinutesSnapshot`, `status=PENDING`, `task.status=PENDING_REVIEW`, `task.latestSubmissionId`, `version`, `updatedAt`, `audit`, `statusChangedAt`.
Entity thực sự thay đổi tăng version/updatedAt và lưu audit theo nghiệp vụ; giữ giá trị gốc và createdAt. Các projection nhãn được dựng từ nguồn ID, không nhận từ FE.

### Điều kiện và lỗi

- Người nhận ở IN_PROGRESS; có giờ công ACTIVE; tệp READY đúng người và công việc
- Một lần chờ xét; lần nộp bất biến sau khi gửi
- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.
- Nguồn version cho If-Match: **Task** đang hiển thị.

### Cache sau thao tác

`submissions`, `tasks`, `reviews`, `analytics`, `alerts`; ánh xạ đúng scope trong ma trận React Query.

## approveSubmission

`POST /api/tasks/:taskId/submissions/:submissionId/approve` → HTTP 200

- Feature `submissions` · Màn S27 · UC UC-T08.
- DTO đích: `ApproveSubmissionRequestDTO`, `ApproveSubmissionResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: TASKS_REVIEW.
- If-Match: bắt buộc; thiếu 428, version cũ 412. Idempotency-Key: bắt buộc, giữ khi retry cùng payload.
- Cách gọi: useMutation; hook/adapter đề nghị `useApproveSubmissionMutation`.

### Params DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `taskId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Công việc liên quan; phải đúng dự án và phạm vi. |
| `submissionId` | string | Có | độ dài ≥ 1; độ dài ≤ 100 |

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `comment` | string | Không | độ dài ≤ 10000; Nhận xét tùy chọn khi chấp nhận. |

FE chỉ được gửi: `comment`.

### Response DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `submission` | Submissions.SubmissionDTO | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `task` | Tasks.TaskDTO | Có | Theo đúng kiểu và khả năng null đã ghi. |


### Trường thay đổi phía BE / mock

`submission.status=ACCEPTED`, `reviewedBy`, `reviewedAt`, `reviewComment`, `task.status=COMPLETED`, `task.completedAt`, `assignmentHistory`, `version`, `updatedAt`, `audit`, `statusChangedAt`.
Entity thực sự thay đổi tăng version/updatedAt và lưu audit theo nghiệp vụ; giữ giá trị gốc và createdAt. Các projection nhãn được dựng từ nguồn ID, không nhận từ FE.

### Điều kiện và lỗi

- Lần mới nhất PENDING; quyền TASKS_REVIEW; không tự nghiệm thu
- Lưu quyết định và trạng thái trong một giao dịch
- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.
- Nguồn version cho If-Match: **Submission** đang hiển thị.

### Cache sau thao tác

`submissions`, `tasks`, `reviews`, `projects`, `analytics`, `alerts`; ánh xạ đúng scope trong ma trận React Query.

## requestSubmissionRevision

`POST /api/tasks/:taskId/submissions/:submissionId/request-revision` → HTTP 200

- Feature `submissions` · Màn S27 · UC UC-T09.
- DTO đích: `RequestSubmissionRevisionRequestDTO`, `RequestSubmissionRevisionResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: TASKS_REVIEW.
- If-Match: bắt buộc; thiếu 428, version cũ 412. Idempotency-Key: bắt buộc, giữ khi retry cùng payload.
- Cách gọi: useMutation; hook/adapter đề nghị `useRequestSubmissionRevisionMutation`.

### Params DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `taskId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Công việc liên quan; phải đúng dự án và phạm vi. |
| `submissionId` | string | Có | độ dài ≥ 1; độ dài ≤ 100 |

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `reason` | string | Có | độ dài ≥ 1; độ dài ≤ 2000; Lý do của thao tác; ghi audit, không mass assign vào entity. |
| `requestedChanges` | string | Có | độ dài ≥ 1; độ dài ≤ 2000; Nội dung cần sửa; bắt buộc khi yêu cầu chỉnh sửa. |

FE chỉ được gửi: `reason`, `requestedChanges`.

### Response DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `submission` | Submissions.SubmissionDTO | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `task` | Tasks.TaskDTO | Có | Theo đúng kiểu và khả năng null đã ghi. |


### Trường thay đổi phía BE / mock

`submission.status=REVISION_REQUESTED`, `reviewedBy`, `reviewedAt`, `reviewComment`, `requestedChanges`, `task.status=IN_PROGRESS`, `version`, `updatedAt`, `audit`, `statusChangedAt`.
Entity thực sự thay đổi tăng version/updatedAt và lưu audit theo nghiệp vụ; giữ giá trị gốc và createdAt. Các projection nhãn được dựng từ nguồn ID, không nhận từ FE.

### Điều kiện và lỗi

- Không tự nghiệm thu; chỉ lần mới nhất PENDING
- Giữ hạn hiện tại và người nhận; đổi hạn qua updateTask riêng
- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.
- Nguồn version cho If-Match: **Submission** đang hiển thị.

### Cache sau thao tác

`submissions`, `tasks`, `reviews`, `analytics`, `alerts`; ánh xạ đúng scope trong ma trận React Query.

## listReviewQueue

`GET /api/review-queue` → HTTP 200

`q` tìm theo tên công việc, trim đầu/cuối và không phân biệt hoa/thường; kết hợp projectId/quyền trước khi phân trang. Response giữ ReviewRow rút gọn hiện hành, không cần tải từng task để tìm tên.

- Feature `submissions` · Màn S26 · UC UC-T08, UC-T09.
- DTO đích: `ListReviewQueueRequestDTO`, `ListReviewQueueResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: TASKS_REVIEW.
- If-Match: không yêu cầu. Idempotency-Key: không yêu cầu.
- Cách gọi: useQuery; hook/adapter đề nghị `useListReviewQueueQuery`.

### Params DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Query DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `page` | integer | Không; có mặc định | ≥ 1; mặc định 1; Trang bắt đầu từ 1. |
| `pageSize` | integer | Không; có mặc định | ≥ 1; ≤ 100; mặc định 20; Số dòng mỗi trang, mặc định 20 và tối đa 100. |
| `q` | string | Không | độ dài ≤ 255; Từ khóa tìm kiếm, trim đầu/cuối. |
| `projectId` | string | Không | độ dài ≥ 1; độ dài ≤ 100; ID dự án; không đồng nghĩa ID service. |

### Body DTO và whitelist

Không có body.

FE chỉ được gửi: Không có..

### Response DTO

`PageDTO<Submissions.SubmissionDTO>`; gồm `items` và `pagination`. Item theo [từ điển DTO](DTO_MODELS.md#submissionssubmissiondto).

### Trường thay đổi phía BE / mock

Chỉ đọc, không cập nhật dữ liệu nghiệp vụ..

### Điều kiện và lỗi


- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.

### Cache sau thao tác

Cache theo query key riêng, không có mutation invalidation.

## listReports

`GET /api/reports` → HTTP 200

- Feature `reports` · Màn S29 · UC UC-T11.
- DTO đích: `ListReportsRequestDTO`, `ListReportsResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: theo người sở hữu và phạm vi tài nguyên.
- If-Match: không yêu cầu. Idempotency-Key: không yêu cầu.
- Cách gọi: useQuery; hook/adapter đề nghị `useListReportsQuery`.

### Params DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Query DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `page` | integer | Không; có mặc định | ≥ 1; mặc định 1; Trang bắt đầu từ 1. |
| `pageSize` | integer | Không; có mặc định | ≥ 1; ≤ 100; mặc định 20; Số dòng mỗi trang, mặc định 20 và tối đa 100. |
| `q` | string | Không | độ dài ≤ 255; Từ khóa tìm kiếm, trim đầu/cuối. |
| `projectId` | string | Không | độ dài ≥ 1; độ dài ≤ 100; ID dự án; không đồng nghĩa ID service. |
| `authorId` | string | Không | độ dài ≥ 1; độ dài ≤ 100; Tác giả do server gắn theo phiên. |
| `periodType` | Reports.PeriodTypeDTO | Không | DAILY hoặc WEEKLY; tuần từ thứ Hai theo Việt Nam. |
| `status` | enum(DRAFT, SUBMITTED) | Không | Trạng thái theo enum của đúng model; không dùng chung enum cho mọi phân hệ. |
| `from` | string · YYYY-MM-DD | Không | Ngày đầu kỳ được chọn. |
| `to` | string · YYYY-MM-DD | Không | Ngày cuối kỳ được chọn. |

### Body DTO và whitelist

Không có body.

FE chỉ được gửi: Không có..

### Response DTO

`PageDTO<Reports.ReportDTO>`; gồm `items` và `pagination`. Item theo [từ điển DTO](DTO_MODELS.md#reportsreportdto).

### Trường thay đổi phía BE / mock

Chỉ đọc, không cập nhật dữ liệu nghiệp vụ..

### Điều kiện và lỗi


- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.

### Cache sau thao tác

Cache theo query key riêng, không có mutation invalidation.

## getReportPreview

`GET /api/report-previews` → HTTP 200

- Feature `reports` · Màn S30, S31 · UC UC-T10.
- DTO đích: `GetReportPreviewRequestDTO`, `GetReportPreviewResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: theo người sở hữu và phạm vi tài nguyên.
- If-Match: không yêu cầu. Idempotency-Key: không yêu cầu.
- Cách gọi: useQuery; hook/adapter đề nghị `useGetReportPreviewQuery`.

### Params DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Query DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `projectId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; ID dự án; không đồng nghĩa ID service. |
| `periodType` | Reports.PeriodTypeDTO | Có | DAILY hoặc WEEKLY; tuần từ thứ Hai theo Việt Nam. |
| `periodStart` | string · YYYY-MM-DD | Có | Ngày đầu kỳ, không ở tương lai. |

### Body DTO và whitelist

Không có body.

FE chỉ được gửi: Không có..

### Response DTO

`Reports.ReportPreviewDTO`; xem [từ điển DTO](DTO_MODELS.md#reportsreportpreviewdto).

### Trường thay đổi phía BE / mock

Chỉ đọc, không cập nhật dữ liệu nghiệp vụ..

### Điều kiện và lỗi


- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.

### Cache sau thao tác

Cache theo query key riêng, không có mutation invalidation.

## getReport

`GET /api/reports/:reportId` → HTTP 200

- Feature `reports` · Màn S31, S32 · UC UC-T11.
- DTO đích: `GetReportRequestDTO`, `GetReportResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: theo người sở hữu và phạm vi tài nguyên.
- If-Match: không yêu cầu. Idempotency-Key: không yêu cầu.
- Cách gọi: useQuery; hook/adapter đề nghị `useGetReportQuery`.

### Params DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `reportId` | string | Có | độ dài ≥ 1; độ dài ≤ 100 |

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

Không có body.

FE chỉ được gửi: Không có..

### Response DTO

`Reports.ReportDTO`; xem [từ điển DTO](DTO_MODELS.md#reportsreportdto).

### Trường thay đổi phía BE / mock

Chỉ đọc, không cập nhật dữ liệu nghiệp vụ..

### Điều kiện và lỗi


- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.

### Cache sau thao tác

Cache theo query key riêng, không có mutation invalidation.

## createReportDraft

`POST /api/reports` → HTTP 201

- Feature `reports` · Màn S30 · UC UC-T10.
- DTO đích: `CreateReportDraftRequestDTO`, `CreateReportDraftResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: theo người sở hữu và phạm vi tài nguyên.
- If-Match: không yêu cầu. Idempotency-Key: bắt buộc, giữ khi retry cùng payload.
- Cách gọi: useMutation; hook/adapter đề nghị `useCreateReportDraftMutation`.

### Params DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `projectId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; ID dự án; không đồng nghĩa ID service. |
| `periodType` | Reports.PeriodTypeDTO | Có | DAILY hoặc WEEKLY; tuần từ thứ Hai theo Việt Nam. |
| `periodStart` | string · YYYY-MM-DD | Có | Ngày đầu kỳ, không ở tương lai. |
| `achievements` | string | Không | độ dài ≤ 10000; Kết quả thực hiện; nháp được rỗng, khi gửi phải có. |
| `blockers` | string | Không | độ dài ≤ 10000; Khó khăn cần ghi nhận, được rỗng. |
| `nextPlan` | string | Không | độ dài ≤ 10000; Kế hoạch tiếp theo; nháp được rỗng, khi gửi phải có. |
| `selectedTaskIds` | array<string> | Không | ID công việc liên quan đúng tác giả/dự án/kỳ, không gửi object công việc. |

FE chỉ được gửi: `projectId`, `periodType`, `periodStart`, `achievements`, `blockers`, `nextPlan`, `selectedTaskIds`.

### Response DTO

`Reports.ReportDTO`; xem [từ điển DTO](DTO_MODELS.md#reportsreportdto).

### Trường thay đổi phía BE / mock

`id`, `authorId`, `status=DRAFT`, `snapshot=null`, `submittedAt=null`, `version`, `createdAt`, `updatedAt`.
Entity thực sự thay đổi tăng version/updatedAt và lưu audit theo nghiệp vụ; giữ giá trị gốc và createdAt. Các projection nhãn được dựng từ nguồn ID, không nhận từ FE.

### Điều kiện và lỗi

- Mỗi tác giả/dự án/loại kỳ/kỳ chỉ một báo cáo; trùng trả 409 kèm existingReportId
- Tuần bắt đầu thứ Hai Việt Nam; không chọn kỳ tương lai
- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.

### Cache sau thao tác

`reports`; ánh xạ đúng scope trong ma trận React Query.

## updateReportDraft

`PATCH /api/reports/:reportId` → HTTP 200

- Feature `reports` · Màn S31 · UC UC-T10.
- DTO đích: `UpdateReportDraftRequestDTO`, `UpdateReportDraftResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: theo người sở hữu và phạm vi tài nguyên.
- If-Match: bắt buộc; thiếu 428, version cũ 412. Idempotency-Key: bắt buộc, giữ khi retry cùng payload.
- Cách gọi: useMutation; hook/adapter đề nghị `useUpdateReportDraftMutation`.

### Params DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `reportId` | string | Có | độ dài ≥ 1; độ dài ≤ 100 |

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `achievements` | string | Không | độ dài ≤ 10000; Kết quả thực hiện; nháp được rỗng, khi gửi phải có. |
| `blockers` | string | Không | độ dài ≤ 10000; Khó khăn cần ghi nhận, được rỗng. |
| `nextPlan` | string | Không | độ dài ≤ 10000; Kế hoạch tiếp theo; nháp được rỗng, khi gửi phải có. |
| `selectedTaskIds` | array<string> | Không | ID công việc liên quan đúng tác giả/dự án/kỳ, không gửi object công việc. |
| `zeroTimeReason` | string / null | Không | Giải thích khi gửi báo cáo có tổng 0 phút. |

FE chỉ được gửi: `achievements`, `blockers`, `nextPlan`, `selectedTaskIds`, `zeroTimeReason`.

### Response DTO

`Reports.ReportDTO`; xem [từ điển DTO](DTO_MODELS.md#reportsreportdto).

### Trường thay đổi phía BE / mock

`version`, `updatedAt`, `audit`.
Entity thực sự thay đổi tăng version/updatedAt và lưu audit theo nghiệp vụ; giữ giá trị gốc và createdAt. Các projection nhãn được dựng từ nguồn ID, không nhận từ FE.

### Điều kiện và lỗi

- Chỉ tác giả; DRAFT; dự án ACTIVE
- Không gửi totalMinutes, snapshot, authorId, periodStart hoặc status
- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.
- Nguồn version cho If-Match: **Report** đang hiển thị.

### Cache sau thao tác

`reports`; ánh xạ đúng scope trong ma trận React Query.

## refreshReportDraft

`POST /api/reports/:reportId/refresh` → HTTP 200

- Feature `reports` · Màn S31 · UC UC-T10.
- DTO đích: `RefreshReportDraftRequestDTO`, `RefreshReportDraftResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: theo người sở hữu và phạm vi tài nguyên.
- If-Match: bắt buộc; thiếu 428, version cũ 412. Idempotency-Key: bắt buộc, giữ khi retry cùng payload.
- Cách gọi: useMutation; hook/adapter đề nghị `useRefreshReportDraftMutation`.

### Params DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `reportId` | string | Có | độ dài ≥ 1; độ dài ≤ 100 |

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

Object rỗng `{}`; không có trường nghiệp vụ.

FE chỉ được gửi: Không có..

### Response DTO

`Reports.ReportPreviewDTO`; xem [từ điển DTO](DTO_MODELS.md#reportsreportpreviewdto).

### Trường thay đổi phía BE / mock

`Không sửa nội dung nháp; tính lại projection tại thời điểm xem`.
Entity thực sự thay đổi tăng version/updatedAt và lưu audit theo nghiệp vụ; giữ giá trị gốc và createdAt. Các projection nhãn được dựng từ nguồn ID, không nhận từ FE.

### Điều kiện và lỗi

- Chỉ tác giả DRAFT; dùng If-Match của bản nháp
- Response là preview tạm thời, không phải snapshot đã gửi
- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.
- Nguồn version cho If-Match: **Report** đang hiển thị.

### Cache sau thao tác

`report-preview`; ánh xạ đúng scope trong ma trận React Query.

## submitReport

`POST /api/reports/:reportId/submit` → HTTP 200

- Feature `reports` · Màn S31 · UC UC-T10.
- DTO đích: `SubmitReportRequestDTO`, `SubmitReportResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: theo người sở hữu và phạm vi tài nguyên.
- If-Match: bắt buộc; thiếu 428, version cũ 412. Idempotency-Key: bắt buộc, giữ khi retry cùng payload.
- Cách gọi: useMutation; hook/adapter đề nghị `useSubmitReportMutation`.

### Params DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `reportId` | string | Có | độ dài ≥ 1; độ dài ≤ 100 |

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `zeroTimeReason` | string | Không | độ dài ≥ 1; độ dài ≤ 2000; Giải thích khi gửi báo cáo có tổng 0 phút. |

FE chỉ được gửi: `zeroTimeReason`.

### Response DTO

`Reports.ReportDTO`; xem [từ điển DTO](DTO_MODELS.md#reportsreportdto).

### Trường thay đổi phía BE / mock

`status=SUBMITTED`, `submittedAt`, `snapshot`, `totalMinutes từ snapshot`, `version`, `updatedAt`, `audit`.
Entity thực sự thay đổi tăng version/updatedAt và lưu audit theo nghiệp vụ; giữ giá trị gốc và createdAt. Các projection nhãn được dựng từ nguồn ID, không nhận từ FE.

### Điều kiện và lỗi

- Chỉ tác giả DRAFT; achievements và nextPlan không trống
- Tổng phút 0 cần lý do; server tính lại từ nhật ký gốc; không tạo thêm giờ công
- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.
- Nguồn version cho If-Match: **Report** đang hiển thị.

### Cache sau thao tác

`reports`, `report-preview`, `analytics`; ánh xạ đúng scope trong ma trận React Query.

## getUploadPolicy

`GET /api/attachments/policy` → HTTP 200

- Feature `attachments` · Màn S41 · UC UC-T07.
- DTO đích: `GetUploadPolicyRequestDTO`, `GetUploadPolicyResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: theo người sở hữu và phạm vi tài nguyên.
- If-Match: không yêu cầu. Idempotency-Key: không yêu cầu.
- Cách gọi: useQuery; hook/adapter đề nghị `useGetUploadPolicyQuery`.

### Params DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

Không có body.

FE chỉ được gửi: Không có..

### Response DTO

`Attachments.UploadPolicyDTO`; xem [từ điển DTO](DTO_MODELS.md#attachmentsuploadpolicydto).

### Trường thay đổi phía BE / mock

Chỉ đọc, không cập nhật dữ liệu nghiệp vụ..

### Điều kiện và lỗi


- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.

### Cache sau thao tác

Cache theo query key riêng, không có mutation invalidation.

## uploadAttachment

`POST /api/attachments` → HTTP 201

- Feature `attachments` · Màn S41 · UC UC-T07.
- DTO đích: `UploadAttachmentRequestDTO`, `UploadAttachmentResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: theo người sở hữu và phạm vi tài nguyên.
- If-Match: không yêu cầu. Idempotency-Key: bắt buộc, giữ khi retry cùng payload.
- Cách gọi: useMutation; hook/adapter đề nghị `useUploadAttachmentMutation`.

### Params DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `taskId` | string | Có | Công việc liên quan; phải đúng dự án và phạm vi. |
| `file` | File (multipart) | Có | File multipart; kiểm tra File, size/MIME bằng policy hiện tại. |

FE chỉ được gửi: `taskId`, `file`.

### Response DTO

`Attachments.AttachmentDTO`; xem [từ điển DTO](DTO_MODELS.md#attachmentsattachmentdto).

### Trường thay đổi phía BE / mock

`id`, `uploadedBy`, `filename`, `mimeType`, `sizeBytes`, `status=READY`, `version`, `createdAt`, `updatedAt`.
Entity thực sự thay đổi tăng version/updatedAt và lưu audit theo nghiệp vụ; giữ giá trị gốc và createdAt. Các projection nhãn được dựng từ nguồn ID, không nhận từ FE.

### Điều kiện và lỗi

- Chỉ người nhận IN_PROGRESS; loại và dung lượng theo policy
- Chỉ trả READY sau lưu hoàn tất; tải lỗi không làm nộp kết quả
- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.
- File thực trong multipart; Zod kiểm tra theo upload policy. Không JSON.stringify File và không hiển thị phần trăm tải giả.

### Cache sau thao tác

`attachments`; ánh xạ đúng scope trong ma trận React Query.

## getAttachment

`GET /api/attachments/:attachmentId` → HTTP 200

- Feature `attachments` · Màn S24, S27, S41 · UC UC-T07, UC-T08.
- DTO đích: `GetAttachmentRequestDTO`, `GetAttachmentResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: theo người sở hữu và phạm vi tài nguyên.
- If-Match: không yêu cầu. Idempotency-Key: không yêu cầu.
- Cách gọi: useQuery; hook/adapter đề nghị `useGetAttachmentQuery`.

### Params DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `attachmentId` | string | Có | độ dài ≥ 1; độ dài ≤ 100 |

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

Không có body.

FE chỉ được gửi: Không có..

### Response DTO

`Attachments.AttachmentDTO`; xem [từ điển DTO](DTO_MODELS.md#attachmentsattachmentdto).

### Trường thay đổi phía BE / mock

Chỉ đọc, không cập nhật dữ liệu nghiệp vụ..

### Điều kiện và lỗi


- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.

### Cache sau thao tác

Cache theo query key riêng, không có mutation invalidation.

## downloadAttachment

`GET /api/attachments/:attachmentId/content` → HTTP 200

- Feature `attachments` · Màn S27 · UC UC-T07, UC-T08.
- DTO đích: `DownloadAttachmentRequestDTO`, `DownloadAttachmentResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: theo người sở hữu và phạm vi tài nguyên.
- If-Match: không yêu cầu. Idempotency-Key: không yêu cầu.
- Cách gọi: useMutation theo click (GET binary); không cache Blob; hook/adapter đề nghị `useDownloadAttachmentMutation`.

### Params DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `attachmentId` | string | Có | độ dài ≥ 1; độ dài ≤ 100 |

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

Không có body.

FE chỉ được gửi: Không có..

### Response DTO

Success là Blob; kiểm tra status/Content-Type và parse error JSON riêng.

### Trường thay đổi phía BE / mock

Chỉ đọc, không cập nhật dữ liệu nghiệp vụ..

### Điều kiện và lỗi

- Zod kiểm tra params và error JSON; response binary kiểm tra status và Content-Type, không JSON.parse
- BE kiểm tra quyền theo công việc, không tin URL hoặc ID do client gửi
- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.

### Cache sau thao tác

Cache theo query key riêng, không có mutation invalidation.

## getDashboard

`GET /api/dashboard` → HTTP 200

- Feature `analytics` · Màn S33 · UC UC-D01.
- DTO đích: `GetDashboardRequestDTO`, `GetDashboardResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: ANALYTICS_VIEW.
- If-Match: không yêu cầu. Idempotency-Key: không yêu cầu.
- Cách gọi: useQuery; hook/adapter đề nghị `useGetDashboardQuery`.

### Params DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Query DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `unitId` | string | Không | độ dài ≥ 1; độ dài ≤ 100; ID đơn vị trong phạm vi được phép. |
| `projectId` | string | Không | độ dài ≥ 1; độ dài ≤ 100; ID dự án; không đồng nghĩa ID service. |
| `ownerId` | string | Không | độ dài ≥ 1; độ dài ≤ 100; Người phụ trách hoạt động; đổi owner đồng bộ tư cách và quyền trên dự án. |
| `assigneeId` | string | Không | độ dài ≥ 1; độ dài ≤ 100; Người chịu trách nhiệm hiện tại với việc mở; với việc kết thúc, giữ người phụ trách cuối theo D15. |
| `status` | Tasks.TaskStatusDTO | Không | Trạng thái theo enum của đúng model; không dùng chung enum cho mọi phân hệ. |
| `priority` | Tasks.PriorityDTO | Không | LOW/NORMAL/HIGH/URGENT; UI ánh xạ nhãn Việt. |
| `from` | string · YYYY-MM-DD | Có | Ngày đầu kỳ được chọn. |
| `to` | string · YYYY-MM-DD | Có | Ngày cuối kỳ được chọn. |

| `teamId` | string | Không | Nhóm nhân sự hiện tại trong phạm vi; BE kiểm tra quyền. |

### Body DTO và whitelist

Không có body.

FE chỉ được gửi: Không có..

### Response DTO

`Analytics.DashboardDTO`; xem [từ điển DTO](DTO_MODELS.md#analyticsdashboarddto).

### Trường thay đổi phía BE / mock

Chỉ đọc, không cập nhật dữ liệu nghiệp vụ..

### Điều kiện và lỗi

- Phạm vi và kỳ hợp lệ; dataAsOf, calculationVersion, quality phải hiện rõ
- Thiếu mẫu số trả null; không biến dữ liệu thiếu thành 0
- Không cập nhật công việc từ kết quả AI
- Thông số được BE tính, metadata.calculationMethod=SERVER_RULES; GET không khởi tạo lời phân tích LLM.
- Trả analysisRef/overviewRef để click mở S43. Chi tiết gồm thông số snapshot và explanation có cùng snapshotId.
- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.

### Cache sau thao tác

Cache theo query key riêng, không có mutation invalidation.

## getDeadlineRisks

`GET /api/analytics/risks` → HTTP 200

- Feature `analytics` · Màn S34 · UC UC-D02.
- DTO đích: `GetDeadlineRisksRequestDTO`, `GetDeadlineRisksResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: ANALYTICS_VIEW.
- If-Match: không yêu cầu. Idempotency-Key: không yêu cầu.
- Cách gọi: useQuery; hook/adapter đề nghị `useGetDeadlineRisksQuery`.

### Params DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Query DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `unitId` | string | Không | độ dài ≥ 1; độ dài ≤ 100; ID đơn vị trong phạm vi được phép. |
| `projectId` | string | Không | độ dài ≥ 1; độ dài ≤ 100; ID dự án; không đồng nghĩa ID service. |
| `ownerId` | string | Không | độ dài ≥ 1; độ dài ≤ 100; Người phụ trách hoạt động; đổi owner đồng bộ tư cách và quyền trên dự án. |
| `assigneeId` | string | Không | độ dài ≥ 1; độ dài ≤ 100; Người chịu trách nhiệm hiện tại với việc mở; với việc kết thúc, giữ người phụ trách cuối theo D15. |
| `status` | Tasks.TaskStatusDTO | Không | Trạng thái theo enum của đúng model; không dùng chung enum cho mọi phân hệ. |
| `priority` | Tasks.PriorityDTO | Không | LOW/NORMAL/HIGH/URGENT; UI ánh xạ nhãn Việt. |
| `from` | string · YYYY-MM-DD | Có | Ngày đầu kỳ được chọn. |
| `to` | string · YYYY-MM-DD | Có | Ngày cuối kỳ được chọn. |

| `teamId` | string | Không | Nhóm nhân sự hiện tại trong phạm vi; BE kiểm tra quyền. |

### Body DTO và whitelist

Không có body.

FE chỉ được gửi: Không có..

### Response DTO

`Analytics.RisksDTO`; xem [từ điển DTO](DTO_MODELS.md#analyticsrisksdto).

### Trường thay đổi phía BE / mock

Chỉ đọc, không cập nhật dữ liệu nghiệp vụ..

### Điều kiện và lỗi

- Phạm vi và kỳ hợp lệ; dataAsOf, calculationVersion, quality phải hiện rõ
- Thiếu mẫu số trả null; không biến dữ liệu thiếu thành 0
- Không cập nhật công việc từ kết quả AI
- Thông số được BE tính, metadata.calculationMethod=SERVER_RULES; GET không khởi tạo lời phân tích LLM.
- Trả analysisRef/overviewRef để click mở S43. Chi tiết gồm thông số snapshot và explanation có cùng snapshotId.
- Bỏ score/scoreKind; riskLevel từ BUSINESS_RULES; không trình bày xác suất trễ hạn do LLM tự chấm.
- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.

### Cache sau thao tác

Cache theo query key riêng, không có mutation invalidation.

## getWorkload

`GET /api/analytics/workload` → HTTP 200

- Feature `analytics` · Màn S35 · UC UC-D03.
- DTO đích: `GetWorkloadRequestDTO`, `GetWorkloadResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: ANALYTICS_VIEW.
- If-Match: không yêu cầu. Idempotency-Key: không yêu cầu.
- Cách gọi: useQuery; hook/adapter đề nghị `useGetWorkloadQuery`.

### Params DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Query DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `unitId` | string | Không | độ dài ≥ 1; độ dài ≤ 100; ID đơn vị trong phạm vi được phép. |
| `projectId` | string | Không | độ dài ≥ 1; độ dài ≤ 100; ID dự án; không đồng nghĩa ID service. |
| `ownerId` | string | Không | độ dài ≥ 1; độ dài ≤ 100; Người phụ trách hoạt động; đổi owner đồng bộ tư cách và quyền trên dự án. |
| `assigneeId` | string | Không | độ dài ≥ 1; độ dài ≤ 100; Người chịu trách nhiệm hiện tại với việc mở; với việc kết thúc, giữ người phụ trách cuối theo D15. |
| `status` | Tasks.TaskStatusDTO | Không | Trạng thái theo enum của đúng model; không dùng chung enum cho mọi phân hệ. |
| `priority` | Tasks.PriorityDTO | Không | LOW/NORMAL/HIGH/URGENT; UI ánh xạ nhãn Việt. |
| `from` | string · YYYY-MM-DD | Có | Ngày đầu kỳ được chọn. |
| `to` | string · YYYY-MM-DD | Có | Ngày cuối kỳ được chọn. |

| `teamId` | string | Không | Nhóm nhân sự hiện tại trong phạm vi; BE kiểm tra quyền. |

### Body DTO và whitelist

Không có body.

FE chỉ được gửi: Không có..

### Response DTO

`Analytics.WorkloadDTO`; xem [từ điển DTO](DTO_MODELS.md#analyticsworkloaddto).

### Trường thay đổi phía BE / mock

Chỉ đọc, không cập nhật dữ liệu nghiệp vụ..

### Điều kiện và lỗi

- Phạm vi và kỳ hợp lệ; dataAsOf, calculationVersion, quality phải hiện rõ
- Thiếu mẫu số trả null; không biến dữ liệu thiếu thành 0
- Không cập nhật công việc từ kết quả AI
- Thông số được BE tính, metadata.calculationMethod=SERVER_RULES; GET không khởi tạo lời phân tích LLM.
- Trả analysisRef/overviewRef để click mở S43. Chi tiết gồm thông số snapshot và explanation có cùng snapshotId.
- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.

### Cache sau thao tác

Cache theo query key riêng, không có mutation invalidation.

## getBottlenecks

`GET /api/analytics/bottlenecks` → HTTP 200

- Feature `analytics` · Màn S36 · UC UC-D04.
- DTO đích: `GetBottlenecksRequestDTO`, `GetBottlenecksResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: ANALYTICS_VIEW.
- If-Match: không yêu cầu. Idempotency-Key: không yêu cầu.
- Cách gọi: useQuery; hook/adapter đề nghị `useGetBottlenecksQuery`.

### Params DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Query DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `unitId` | string | Không | độ dài ≥ 1; độ dài ≤ 100; ID đơn vị trong phạm vi được phép. |
| `projectId` | string | Không | độ dài ≥ 1; độ dài ≤ 100; ID dự án; không đồng nghĩa ID service. |
| `ownerId` | string | Không | độ dài ≥ 1; độ dài ≤ 100; Người phụ trách hoạt động; đổi owner đồng bộ tư cách và quyền trên dự án. |
| `assigneeId` | string | Không | độ dài ≥ 1; độ dài ≤ 100; Người chịu trách nhiệm hiện tại với việc mở; với việc kết thúc, giữ người phụ trách cuối theo D15. |
| `status` | Tasks.TaskStatusDTO | Không | Trạng thái theo enum của đúng model; không dùng chung enum cho mọi phân hệ. |
| `priority` | Tasks.PriorityDTO | Không | LOW/NORMAL/HIGH/URGENT; UI ánh xạ nhãn Việt. |
| `from` | string · YYYY-MM-DD | Có | Ngày đầu kỳ được chọn. |
| `to` | string · YYYY-MM-DD | Có | Ngày cuối kỳ được chọn. |

| `teamId` | string | Không | Nhóm nhân sự hiện tại trong phạm vi; BE kiểm tra quyền. |

### Body DTO và whitelist

Không có body.

FE chỉ được gửi: Không có..

### Response DTO

`Analytics.BottlenecksDTO`; xem [từ điển DTO](DTO_MODELS.md#analyticsbottlenecksdto).

### Trường thay đổi phía BE / mock

Chỉ đọc, không cập nhật dữ liệu nghiệp vụ..

### Điều kiện và lỗi

- Phạm vi và kỳ hợp lệ; dataAsOf, calculationVersion, quality phải hiện rõ
- Thiếu mẫu số trả null; không biến dữ liệu thiếu thành 0
- Không cập nhật công việc từ kết quả AI
- Thông số được BE tính, metadata.calculationMethod=SERVER_RULES; GET không khởi tạo lời phân tích LLM.
- Trả analysisRef/overviewRef để click mở S43. Chi tiết gồm thông số snapshot và explanation có cùng snapshotId.
- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.

### Cache sau thao tác

Cache theo query key riêng, không có mutation invalidation.

## getAnalysisSummary

`GET /api/analytics/summary` → HTTP 200

- Feature `analytics` · Màn S39 · UC UC-D06.
- DTO đích: `GetAnalysisSummaryRequestDTO`, `GetAnalysisSummaryResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: ANALYTICS_VIEW.
- If-Match: không yêu cầu. Idempotency-Key: không yêu cầu.
- Cách gọi: useQuery; hook/adapter đề nghị `useGetAnalysisSummaryQuery`.

### Params DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Query DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `unitId` | string | Không | độ dài ≥ 1; độ dài ≤ 100; ID đơn vị trong phạm vi được phép. |
| `projectId` | string | Không | độ dài ≥ 1; độ dài ≤ 100; ID dự án; không đồng nghĩa ID service. |
| `ownerId` | string | Không | độ dài ≥ 1; độ dài ≤ 100; Người phụ trách hoạt động; đổi owner đồng bộ tư cách và quyền trên dự án. |
| `assigneeId` | string | Không | độ dài ≥ 1; độ dài ≤ 100; Người chịu trách nhiệm hiện tại với việc mở; với việc kết thúc, giữ người phụ trách cuối theo D15. |
| `status` | Tasks.TaskStatusDTO | Không | Trạng thái theo enum của đúng model; không dùng chung enum cho mọi phân hệ. |
| `priority` | Tasks.PriorityDTO | Không | LOW/NORMAL/HIGH/URGENT; UI ánh xạ nhãn Việt. |
| `from` | string · YYYY-MM-DD | Có | Ngày đầu kỳ được chọn. |
| `to` | string · YYYY-MM-DD | Có | Ngày cuối kỳ được chọn. |

| `teamId` | string | Không | Nhóm nhân sự hiện tại trong phạm vi; BE kiểm tra quyền. |

### Body DTO và whitelist

Không có body.

FE chỉ được gửi: Không có..

### Response DTO

`Analytics.SummaryDTO`; xem [từ điển DTO](DTO_MODELS.md#analyticssummarydto).

### Trường thay đổi phía BE / mock

Chỉ đọc, không cập nhật dữ liệu nghiệp vụ..

### Điều kiện và lỗi

- Phạm vi và kỳ hợp lệ; dataAsOf, calculationVersion, quality phải hiện rõ
- Thiếu mẫu số trả null; không biến dữ liệu thiếu thành 0
- Không cập nhật công việc từ kết quả AI
- Thông số được BE tính, metadata.calculationMethod=SERVER_RULES; GET không khởi tạo lời phân tích LLM.
- Trả analysisRef/overviewRef để click mở S43. Chi tiết gồm thông số snapshot và explanation có cùng snapshotId.
- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.

### Cache sau thao tác

Cache theo query key riêng, không có mutation invalidation.

## createAnalysisJob

`POST /api/analytics/jobs` → HTTP 202 khi đang chờ/chạy; HTTP 200 khi reuse kết quả đã xong

- Feature `analytics` · Màn S40, S43 · UC UC-D02, UC-D03, UC-D04, UC-D06.
- DTO đích: `CreateAnalysisJobRequestDTO`, `CreateAnalysisJobResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: ANALYTICS_VIEW.
- If-Match: không yêu cầu. Idempotency-Key: bắt buộc, giữ khi retry cùng payload.
- Cách gọi: useMutation; hook/adapter đề nghị `useCreateAnalysisJobMutation`.

### Params DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `analysisId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; ID bản phân tích được BE cấp; không phải taskId hay prompt do FE tự tạo. |
| `generationMode` | enum(REUSE_OR_CREATE, REGENERATE) | Không; có mặc định | mặc định REUSE_OR_CREATE; REUSE_OR_CREATE tận dụng kết quả/job hiện có; REGENERATE chỉ sau click Phân tích lại. |
| `locale` | enum(vi-VN) | Không; có mặc định | mặc định vi-VN |

FE chỉ được gửi: `analysisId`, `generationMode`, `locale`.

### Response DTO

`Analytics.AnalysisJobDTO`; xem [từ điển DTO](DTO_MODELS.md#analyticsanalysisjobdto).

### Trường thay đổi phía BE / mock

`job.id`, `job.analysisId`, `job.snapshotId`, `job.status`, `job.createdAt`, `job.updatedAt`, `job.completedAt`, `job.result`, `job.error`, `explanation.status`.

### Điều kiện và lỗi

- REUSE_OR_CREATE trả job đã có nếu cùng snapshot/phiên bản prompt/model/locale hợp lệ; không gọi LLM lại nếu đã READY. Kết quả đã có trả 200 với job SUCCEEDED/result hợp lệ, lượt đang chờ/chạy trả 202; wrapper FE phải nhận cả hai mã.
- Body không còn analysisType/projectId/from/to; BE lấy từ snapshot thuộc analysisId.
- Cần Idempotency-Key; nhiều lượt mở cùng snapshot được coalesce ở BE.
- Nguồn OUTDATED/đã hết hạn hoặc không đủ dữ liệu/LLM chưa cấu hình thì BE trả lỗi có mã rõ ràng; GET detail vẫn đọc thông số.
- REGENERATE chỉ do người dùng yêu cầu; không lặp tự động sau FAILED hoặc khi refocus/refetch.
- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.
- 410 SNAPSHOT_EXPIRED: tải lại tổng quan để lấy analysisRef mới. 409 SNAPSHOT_OUTDATED/ANALYSIS_IN_PROGRESS: dùng latestAnalysisId/activeJobId hợp lệ từ details, không gửi job khác vô hạn. 503 LLM_NOT_CONFIGURED/PROVIDER_UNAVAILABLE không làm mất các số liệu đã có.

### Cache sau thao tác

`analysis-detail`, `analytics-jobs`; ánh xạ đúng scope trong ma trận React Query.

## getAnalysisJob

`GET /api/analytics/jobs/:jobId` → HTTP 200

- Feature `analytics` · Màn S40, S43 · UC UC-D02, UC-D03, UC-D04, UC-D06.
- DTO đích: `GetAnalysisJobRequestDTO`, `GetAnalysisJobResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: ANALYTICS_VIEW.
- If-Match: không yêu cầu. Idempotency-Key: không yêu cầu.
- Cách gọi: useQuery; hook/adapter đề nghị `useGetAnalysisJobQuery`.

### Params DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `jobId` | string | Có | độ dài ≥ 1; độ dài ≤ 100 |

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

Không có body.

FE chỉ được gửi: Không có..

### Response DTO

`Analytics.AnalysisJobDTO`; xem [từ điển DTO](DTO_MODELS.md#analyticsanalysisjobdto).

### Trường thay đổi phía BE / mock

Chỉ đọc, không cập nhật dữ liệu nghiệp vụ..

### Điều kiện và lỗi

- Chỉ đọc trạng thái; GET/poll không tự tăng bước job hoặc gọi nhà cung cấp LLM.
- Poll theo pollAfterMs khi QUEUED/RUNNING; dừng khi SUCCEEDED/FAILED, rời màn hoặc mất quyền.
- Khi kết thúc refetch getAnalysisDetail của đúng analysisId; không lấy resultPath do LLM tạo.
- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.

### Cache sau thao tác

Cache theo query key riêng, không có mutation invalidation.

## listAlerts

`GET /api/alerts` → HTTP 200

- Feature `alerts` · Màn S37 · UC UC-D05.
- DTO đích: `ListAlertsRequestDTO`, `ListAlertsResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: ANALYTICS_VIEW.
- If-Match: không yêu cầu. Idempotency-Key: không yêu cầu.
- Cách gọi: useQuery; hook/adapter đề nghị `useListAlertsQuery`.

### Params DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Query DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `page` | integer | Không; có mặc định | ≥ 1; mặc định 1; Trang bắt đầu từ 1. |
| `pageSize` | integer | Không; có mặc định | ≥ 1; ≤ 100; mặc định 20; Số dòng mỗi trang, mặc định 20 và tối đa 100. |
| `q` | string | Không | độ dài ≤ 255; Từ khóa tìm kiếm, trim đầu/cuối. |
| `projectId` | string | Không | độ dài ≥ 1; độ dài ≤ 100; ID dự án; không đồng nghĩa ID service. |
| `status` | Alerts.AlertStatusDTO | Không | Trạng thái theo enum của đúng model; không dùng chung enum cho mọi phân hệ. |
| `severity` | enum(INFO, LOW, MEDIUM, HIGH, CRITICAL) | Không | Mức độ cảnh báo, khác trạng thái xử lý. |

### Body DTO và whitelist

Không có body.

FE chỉ được gửi: Không có..

### Response DTO

`PageDTO<Alerts.AlertDTO>`; gồm `items` và `pagination`. Item theo [từ điển DTO](DTO_MODELS.md#alertsalertdto).

### Trường thay đổi phía BE / mock

Chỉ đọc, không cập nhật dữ liệu nghiệp vụ..

### Điều kiện và lỗi


- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.

### Cache sau thao tác

Cache theo query key riêng, không có mutation invalidation.

## getAlert

`GET /api/alerts/:alertId` → HTTP 200

- Feature `alerts` · Màn S38 · UC UC-D05.
- DTO đích: `GetAlertRequestDTO`, `GetAlertResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: ANALYTICS_VIEW.
- If-Match: không yêu cầu. Idempotency-Key: không yêu cầu.
- Cách gọi: useQuery; hook/adapter đề nghị `useGetAlertQuery`.

### Params DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `alertId` | string | Có | độ dài ≥ 1; độ dài ≤ 100 |

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

Không có body.

FE chỉ được gửi: Không có..

### Response DTO

`Alerts.AlertDTO`; xem [từ điển DTO](DTO_MODELS.md#alertsalertdto).

### Trường thay đổi phía BE / mock

Chỉ đọc, không cập nhật dữ liệu nghiệp vụ..

### Điều kiện và lỗi


- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.

### Cache sau thao tác

Cache theo query key riêng, không có mutation invalidation.

## updateAlert

`PATCH /api/alerts/:alertId` → HTTP 200

- Feature `alerts` · Màn S38 · UC UC-D05.
- DTO đích: `UpdateAlertRequestDTO`, `UpdateAlertResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: ALERTS_MANAGE.
- If-Match: bắt buộc; thiếu 428, version cũ 412. Idempotency-Key: bắt buộc, giữ khi retry cùng payload.
- Cách gọi: useMutation; hook/adapter đề nghị `useUpdateAlertMutation`.

### Params DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `alertId` | string | Có | độ dài ≥ 1; độ dài ≤ 100 |

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `status` | enum(READ, IN_PROGRESS, RESOLVED, DISMISSED) | Có | Trạng thái theo enum của đúng model; không dùng chung enum cho mọi phân hệ. |
| `resolutionNote` | string | Không | độ dài ≥ 1; độ dài ≤ 2000; Hướng xử lý/lý do; bắt buộc với trạng thái xử lý khác READ. |

FE chỉ được gửi: `status`, `resolutionNote`.

### Response DTO

`Alerts.AlertDTO`; xem [từ điển DTO](DTO_MODELS.md#alertsalertdto).

### Trường thay đổi phía BE / mock

`handledBy`, `handledAt`, `version`, `updatedAt`, `audit`.
Entity thực sự thay đổi tăng version/updatedAt và lưu audit theo nghiệp vụ; giữ giá trị gốc và createdAt. Các projection nhãn được dựng từ nguồn ID, không nhận từ FE.

### Điều kiện và lỗi

- READ có thể không có ghi chú; trạng thái xử lý khác phải có lý do hoặc hướng xử lý
- Không đổi conditionActive, evidence, taskId; không tự đổi công việc
- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.
- Nguồn version cho If-Match: **Alert** đang hiển thị.

### Cache sau thao tác

`alerts`, `analytics`; ánh xạ đúng scope trong ma trận React Query.

## getAnalysisDetail

`GET /api/analytics/details/:analysisId` → HTTP 200

- Feature `analytics` · Màn S43 · UC UC-D01, UC-D02, UC-D03, UC-D04, UC-D05, UC-D06.
- DTO đích: `GetAnalysisDetailRequestDTO`, `GetAnalysisDetailResponseDTO`.
- Phiên: bắt buộc. Quyền bổ sung: ANALYTICS_VIEW.
- If-Match: không yêu cầu. Idempotency-Key: không yêu cầu.
- Cách gọi: useQuery; hook/adapter đề nghị `useGetAnalysisDetailQuery`.

### Params DTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `analysisId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; ID bản phân tích được BE cấp; không phải taskId hay prompt do FE tự tạo. |

### Query DTO

Object rỗng `{}`; không có trường nghiệp vụ.

### Body DTO và whitelist

Không có body.

FE chỉ được gửi: Không có..

### Response DTO

`Analytics.AnalysisDetailDTO`; xem [từ điển DTO](DTO_MODELS.md#analyticsanalysisdetaildto).

### Trường thay đổi phía BE / mock

Chỉ đọc, không cập nhật dữ liệu nghiệp vụ..

### Điều kiện và lỗi

- Chỉ đọc snapshot và trạng thái lời phân tích, không tự gọi LLM hoặc sửa nguồn nghiệp vụ.
- snapshot.id/analysisId phải khớp ref đã mở; lastSuccess phải khớp snapshot trước khi đưa vào cache.
- Snapshot còn trong thời gian lưu thì giữ bản cũ có nhãn OUTDATED; hết hạn trả 410 và hướng dẫn mở lại từ tổng quan.
- BE kiểm tra quyền hiện tại cho cả metric, evidence, explanation và job; analysisId không thay thế kiểm tra quyền.
- 401: sai/hết phiên; 403: thiếu quyền; 404: không tìm thấy trong phạm vi; 409: xung đột nghiệp vụ; 412: version cũ; 422: lỗi field; 429/5xx/network: giữ nội dung và thử lại có kiểm soát. Response sai DTO thành ContractError.
- 410 SNAPSHOT_EXPIRED: tải lại tổng quan để lấy analysisRef mới. 409 SNAPSHOT_OUTDATED/ANALYSIS_IN_PROGRESS: dùng latestAnalysisId/activeJobId hợp lệ từ details, không gửi job khác vô hạn. 503 LLM_NOT_CONFIGURED/PROVIDER_UNAVAILABLE không làm mất các số liệu đã có.

### Cache sau thao tác

Cache theo query key riêng, không có mutation invalidation.

## createAnalysisFeedback

`POST /api/analytics/details/:analysisId/feedback` → HTTP 201

- Feature `analytics` · Màn S43 (BOTTLENECK) · UC UC-D04, bước 6, trang 43 tài liệu nguồn.
- Phiên bắt buộc; cần ANALYTICS_VIEW và ALERTS_MANAGE trong phạm vi nhận định. Quyền xem đơn thuần không đủ ghi phản hồi.
- Idempotency-Key bắt buộc, giữ khi retry cùng payload. Không yêu cầu If-Match vì tạo bản ghi phản hồi bất biến.
- useMutation; hook `useCreateAnalysisFeedbackMutation`; retry=false.

### Params DTO

| Trường | Kiểu | Bắt buộc | Ý nghĩa |
|---|---|---|---|
| `analysisId` | ID | Có | Ref nhận định điểm nghẽn đang xem. |

### Query DTO

Object rỗng strict.

### Body DTO và whitelist

`Analytics.AnalysisFeedbackCreateDTO`: chỉ `verdict`, `comment`. Zod strict từ chối actorId, snapshotId, taskId, status và các trường khác.

### Response DTO

Analytics.AnalysisFeedbackDTO; BE cấp id, analysisId, snapshotId, actorId/actor, createdAt và audit. Xem [DTO](DTO_MODELS.md#analyticsanalysisfeedbackdto).

### Điều kiện và lỗi

- BOTTLENECK, snapshot CURRENT/chưa hết hạn, người xem có feedback.canSubmit. BE kiểm tra lại tại lúc nhận.
- 403: mất/thiếu quyền; 404: không có ref trong phạm vi; 409: loại phân tích không hỗ trợ, snapshot đã cũ hoặc cùng khóa nhưng payload khác; 410: snapshot hết hạn; 422: verdict/comment sai; 429/5xx/network: giữ input và retry theo chính sách.
- Replay cùng key trả lại receipt đã lưu, không tạo phản hồi trùng. Phản hồi mới có key mới và giữ bản trước trong lịch sử.
- Không sửa công việc/cảnh báo, không thay nhận định nguồn và không gọi LLM.

### Cache sau thao tác

Refetch đúng ['analytics', viewerId, 'detail', analysisId] để lấy feedback.latest. Không invalidate các số liệu nghiệp vụ hoặc tạo job AI.

## listAnalyticsFilterOptions

`GET /api/analytics/filter-options` → HTTP 200

- Feature `analytics` · Màn S33, S34, S35, S36, S39 · UC UC-D01, UC-D02, UC-D03, UC-D04, UC-D06.
- Phiên và ANALYTICS_VIEW trong phạm vi bắt buộc; không đòi quyền quản trị tài khoản/tổ chức.
- useQuery `useListAnalyticsFilterOptionsQuery`; không If-Match/Idempotency-Key.

### Params DTO

Object rỗng strict.

### Query DTO

| Field | Kiểu | Bắt buộc / ràng buộc |
|---|---|---|
| kind | UNIT / PROJECT / TEAM / PERSON | Có; loại lựa chọn cần tải |
| q | string | Không; trim, tối đa 255 |
| unitId | ID | Không; đơn vị cha trong quyền |
| projectId | ID | Không; dự án trong quyền và đúng quan hệ cha |
| teamId | ID | Không; nhóm hiện tại trong phạm vi, đúng quan hệ cha |
| page | integer | Không; mặc định 1, ≥1 |
| pageSize | integer | Không; mặc định 20, 1–100 |

### Body DTO và whitelist

Không có body. Chỉ gửi các query field nêu trên; không tự khai scope/quyền.

### Response DTO

PageDTO<Shared.EntityLabelDTO>. items chỉ id/name; PERSON dùng name là displayName, không lộ UserDTO. pagination có page/pageSize/total. Xem [DTO lookup](DTO_MODELS.md#dto-cho-lookup-bộ-lọc-phân-tích).

### Điều kiện, lỗi và cache

BE tìm kiếm/paginate trên tập lựa chọn được phép; không lấy trang toàn hệ thống rồi lọc ở FE. Filter cha ngoài quyền trả 403; quan hệ/query sai trả 422. Kết quả rỗng trả 200 với items=[]. Query key ['analytics-options', viewerId, normalizedQuery], staleTime 60.000 ms, enabled khi phiên/quyền và query hợp lệ. Đổi filter cha reset filter con không còn phù hợp và page. Không bỏ qua quyền ở các API dữ liệu chỉ vì một ID từng xuất hiện trong lookup.

Đổi phiên/quyền cancel/remove cache lookup. Thay thành viên/nhóm/dự án liên quan invalidate các lựa chọn và analytics cùng scope. Không gọi listUsers/listUnits/listTeams quản trị chỉ để lấy nhãn bộ lọc.

Scope tổng hợp: query thiếu unitId/projectId dùng đơn vị mặc định hợp lệ trong phiên; không có thì 422, không ngầm mở toàn hệ thống. SUMMARY có subject PROJECT hoặc UNIT; overviewRef và systemSummary phải mô tả đúng một dự án hay cả phạm vi đơn vị.

## Bổ sung hồ sơ cá nhân theo yêu cầu ngày 25/10/2026

### updateProfile

`PATCH /api/auth/me` cập nhật chính tài khoản trong phiên, không nhận userId. Body multipart chỉ gồm displayName (1–255 ký tự), gender, birthDate, phone, permanentAddress, temporaryAddress và avatar; mỗi trường tùy chọn nhưng phải có ít nhất một trường. Các trường cá nhân tùy chọn theo Users.PersonalInfoDTO, chuỗi rỗng được chuẩn hóa thành null để xóa giá trị. Mục ảnh chỉ gửi avatar. Form thông tin chỉ gửi trường đã sửa; trim họ tên và nội dung chuỗi. Username, email, đơn vị, vai trò, trạng thái, position, nhóm và dự án không nằm trong whitelist. Tên đăng nhập chỉ đọc, username chỉ được khai báo khi tạo tài khoản mới.

Avatar nhận JPG, PNG hoặc WebP, dung lượng lớn hơn 0 và tối đa 2 MB. Kiểm tra loại/dung lượng tại schema và chữ ký tệp tại DB. Tệp không hợp lệ không lưu bất kỳ thay đổi nào. Tên và avatar được cập nhật trong cùng transaction.

Yêu cầu bearer, If-Match từ phiên bản hồ sơ đang sửa (hoặc session.user.version khi đổi ảnh) và Idempotency-Key. Response 200 là SessionDTO; user có version và avatarUrl nullable. Phiên hết hạn trả 401; dữ liệu ngoài whitelist (kể cả username)/ảnh sai trả 422; version cũ 412 và giữ form để đối chiếu. Không tự retry mutation bằng khóa mới.

Thành công cập nhật Query cache phiên từ response và invalidate hồ sơ riêng cùng dữ liệu của người xem để nhãn người dùng được làm mới. Credential và byte ảnh không lưu trong MutationCache; biến mutation dùng ticket tạm. Thông tin nhận diện và thông tin cá nhân nằm chung một thẻ, mặc định chỉ xem, bấm Chỉnh sửa mới mở form; lưu/hủy trở về chế độ xem, có guard khi hủy draft. Đổi ảnh ở cột phải, chụp session.user.version tại lúc chọn ảnh để dùng phiên bản sau lần lưu hồ sơ gần nhất; vẫn giữ đối chiếu 412 nếu có cập nhật tiếp từ phiên khác. Email/bộ phận/vị trí/nhóm/dự án chỉ đọc trong hồ sơ cá nhân. Chi tiết tài khoản Admin cũng chỉ mở form sau nút Chỉnh sửa thông tin; không có field position độc lập.

### getPersonalProfile

`GET /api/auth/me/profile` đọc riêng hồ sơ của tài khoản trong phiên. Bắt buộc bearer; không nhận userId, body hoặc query (query thừa trả 422). Response 200 là Auth.PersonalProfileDTO: version, username, displayName, email, unit (tên bộ phận), systemRole, năm trường Users.PersonalInfoDTO và teams/projects dạng EntityLabel[]. Vị trí lấy từ systemRole: EMPLOYEE = Nhân viên chính thức, MANAGER = Leader, ADMIN = Admin. Không trả position, quyền, token, byte ảnh hay số liệu hiệu suất. Không có phiên trả 401.

teams chỉ chứa nhóm ACTIVE có user trong memberIds; projects chỉ chứa dự án PLANNED/ACTIVE có tư cách thành viên chưa kết thúc. Cùng projection được dùng trong UserDTO quản trị qua GET /users/:userId (vẫn cần USERS_MANAGE). Không thêm thông tin riêng tư vào SessionDTO, UserRow hoặc GET /users/:userId/profile công khai.

authService.getProfile/useProfileQuery dùng key `['auth', viewerId, 'getProfile']`, staleTime 0, chỉ chạy khi có phiên và mount một lần ở trang hồ sơ. Lưu hồ sơ cập nhật session và invalidate query này; dữ liệu cá nhân không persist vào Zustand/localStorage. Trang không dùng tab; form thông tin và mật khẩu mở độc lập, hủy chỉ xét draft của chính form đó, điều hướng vẫn giữ dirty guard và xử lý 412 như trước.

### getAvatar

`GET /api/avatars/:avatarId` phục vụ byte ảnh theo URL opaque do response cấp, dùng trực tiếp cho Image src. Không trả JSON/base64 trong SessionDTO/UserDTO/UserRow. avatarId là UUID ngẫu nhiên mới mỗi lần thay ảnh; link ảnh không chứa ID tài khoản. Thay ảnh xóa byte ảnh cũ khỏi DB mock; link cũ trả 404. Response có Content-Type ảnh, Content-Length, Cache-Control private và X-Content-Type-Options nosniff. Link ảnh là đường dẫn tài nguyên có thể đọc khi biết URL, không yêu cầu header bearer từ thẻ ảnh.

Mock giữ avatarId trong model và byte ảnh trong DB tạm; reload/reset xóa ảnh cùng các thay đổi khác. Backend thật cần lưu ảnh và cấp avatarUrl tương ứng.

### changePassword

`PUT /api/auth/me/password` đổi mật khẩu của chính tài khoản trong phiên. JSON strict chỉ gồm currentPassword (1–128 ký tự) và newPassword (8–128 ký tự), không trim mật khẩu. Mật khẩu mới phải khác mật khẩu hiện tại; DB kiểm tra currentPassword khớp mật khẩu đang lưu. Không nhận userId, vai trò, mật khẩu xác nhận hoặc các field hồ sơ.

Yêu cầu bearer và Idempotency-Key; không dùng If-Match vì currentPassword là điều kiện cập nhật. Thành công 200 {ok:true}; không trả credential hoặc cả hồ sơ. Phiên hiện tại tiếp tục hoạt động. Sai mật khẩu hiện tại trả 422 với field currentPassword; dữ liệu yếu/thừa trường trả 422; không có phiên hợp lệ trả 401/403. Request giống nhau cùng khóa replay kết quả, không đổi mật khẩu/audit lần nữa. Không thay đổi version hồ sơ vì không sửa trường hồ sơ.

Form có Mật khẩu hiện tại/Mật khẩu mới/Nhập lại mật khẩu mới, kiểm tra xác nhận ở FE rồi chỉ gửi hai trường API. Form nằm ở cột phải trang hồ sơ, chỉ mở sau nút Đổi mật khẩu; giữ nội dung khi lỗi, nhắc draft khi hủy form hoặc rời trang. Lưu/hủy thu lại form mà không bỏ bản nháp thông tin cá nhân đang mở. Hiển thị thành công bằng toast và dọn form. Mutation dùng ticket tạm, không giữ credential trong Query/Mutation cache, Zustand hoặc audit. Audit chỉ ghi sự kiện Đổi mật khẩu.

### getProfile

`GET /api/users/:userId/profile` đọc hồ sơ công khai nội bộ của một thành viên. Mọi người đã đăng nhập được gọi; không yêu cầu USERS_MANAGE. Không có body, query, If-Match hoặc Idempotency-Key. userId là ID opaque theo quy tắc chung.

Response 200 ProfileDto là object phẳng chỉ gồm id, displayName, avatarUrl nullable, unit (tên đơn vị), systemRole và email. UI hiển thị card nhận diện và thông tin liên hệ email. Không có wrapper user, stats, projects hoặc pagination.

Không trả username, unitId, version, updatedAt, byte ảnh, thống kê công việc/dự án hoặc field chưa có nguồn. Thiếu phiên trả 401; chủ hồ sơ không tồn tại/bị khóa trả 404; mọi query thừa (kể cả page/pageSize) trả 422. Người xem có thể đọc hồ sơ liên hệ của thành viên khác đơn vị; quyền dự án/task tiếp tục được kiểm tra ở endpoint riêng.

useQuery useGetProfileQuery với key ['users', viewerId, 'getProfile', userId], staleTime 0, chỉ chạy khi có phiên và ID hợp lệ. Màn /users/[userId] nằm trong workspace cần đăng nhập. Lưu hồ sơ cập nhật phiên và invalidate dữ liệu của viewer theo cơ chế hiện có.

### Mốc thời gian trong chi tiết công việc

TaskDto trả createdAt (UTC ISO datetime) và firstStartedAt (UTC ISO datetime hoặc null) cho GET chi tiết và các mutation trả TaskDto. Cả hai lấy trực tiếp từ model hiện có; createdAt do server ghi khi tạo, firstStartedAt chỉ ghi khi bắt đầu lần đầu và giữ qua tạm dừng/tiếp tục/bàn giao. Không nhận hai trường trong payload tạo/sửa. TaskRow của danh sách trả firstStartedAt cho cột Ngày bắt đầu, không trả createdAt. Không đổi cách ghi time log hoặc cách tính giờ công thực tế.

Theo yêu cầu điều chỉnh URL, mọi endpoint trong catalog dùng tiền tố /api, không có thành phần phiên bản. Axios baseURL, MSW handler, avatarUrl và kiểm thử cùng dùng tiền tố này; không giữ alias cho đường dẫn cũ. Tổng số endpoint và các quy tắc quyền/version/idempotency giữ nguyên.

Tổng HTTP route sau bổ sung: 83 (82 service request và 1 image resource).
