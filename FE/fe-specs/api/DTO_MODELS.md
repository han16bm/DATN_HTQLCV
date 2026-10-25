# Từ điển DTO và kiểu dữ liệu trao đổi

Contract 0.3.0. Các bảng là đặc tả văn bản để Codex tạo schema/DTO sau. Tên kiểu có tiền tố nhóm để tránh trùng tên. Request và response được phân biệt; không dùng Partial<EntityDTO> làm body cập nhật.

## Kiểu dùng chung

| Kiểu | Trường và ràng buộc |
|---|---|
| ID | string opaque, trim, độ dài 1–100; không parse thành number |
| Version | integer dương, an toàn trong JavaScript; gửi bằng If-Match, không đặt trong body |
| UTC | ISO 8601 đầy đủ ngày/giờ, hậu tố Z |
| LocalDate | YYYY-MM-DD, ý nghĩa ngày tại Asia/Ho_Chi_Minh |
| SuccessEnvelope<T> | data: T; meta: MetaDTO |
| MetaDTO | requestId: string không rỗng; serverTime: UTC |
| ErrorEnvelope | error: ErrorDTO; meta: MetaDTO |
| ErrorDTO | code: string không rỗng; message: string không rỗng; fieldErrors?: array<{path: string[], message: string}>; details?: JSON value |
| PageDTO<T> | items: T[]; pagination: {page: integer ≥1, pageSize: integer ≥1, total: integer ≥0} |
| EmptyDTO | object rỗng; request strict, không nhận field ngoài contract |
| OkDTO | ok: literal true |
| ReasonRequestDTO | reason: string sau trim, dài 1–2000 |
| Permission | USERS_MANAGE, ORGANIZATION_MANAGE, PROJECT_CREATE, PROJECT_MANAGE, MEMBERS_MANAGE, TASKS_MANAGE, TASKS_REVIEW, ANALYTICS_VIEW, ALERTS_MANAGE |

Với object/mảng lồng nhau, tên có dấu chấm hoặc [] là đường dẫn của trường; không gửi nguyên chuỗi đường dẫn đó làm key JSON. Bắt buộc tại trường con được hiểu khi object cha hiện diện. Các điều kiện theo trạng thái/quyền/kỳ phải áp dụng thêm rule nghiệp vụ; bảng kiểu không thay thế các điều kiện đó.

## Danh mục kiểu

- [Analytics.AnalysisFeedbackCreateDTO](#analyticsanalysisfeedbackcreatedto)
- [Analytics.AnalysisFeedbackDTO](#analyticsanalysisfeedbackdto)
- [Analytics.ProjectRiskSummaryDTO](#analyticsprojectrisksummarydto)
- [Users.ReasonRequestDTO](#usersreasonrequestdto)
- [Users.ResetPasswordDTO](#usersresetpassworddto)
- [Users.SystemRoleDTO](#userssystemroledto)
- [Users.UserCreateDTO](#usersusercreatedto)
- [Users.UserListQueryDTO](#usersuserlistquerydto)
- [Users.UserLockDTO](#usersuserlockdto)
- [Users.UserPatchDTO](#usersuserpatchdto)
- [Users.UserDTO](#usersuserdto)
- [Users.UserStatusDTO](#usersuserstatusdto)
- [Auth.LoginResponseDTO](#authloginresponsedto)
- [Auth.LoginDTO](#authlogindto)
- [Auth.SessionDTO](#authsessiondto)
- [Organization.TeamCreateDTO](#organizationteamcreatedto)
- [Organization.TeamMembersDTO](#organizationteammembersdto)
- [Organization.TeamPatchDTO](#organizationteampatchdto)
- [Organization.TeamDTO](#organizationteamdto)
- [Organization.UnitCreateDTO](#organizationunitcreatedto)
- [Organization.UnitPatchDTO](#organizationunitpatchdto)
- [Organization.UnitQueryDTO](#organizationunitquerydto)
- [Organization.UnitDTO](#organizationunitdto)
- [Projects.ProjectCreateDTO](#projectsprojectcreatedto)
- [Projects.ProjectListQueryDTO](#projectsprojectlistquerydto)
- [Projects.ProjectPatchDTO](#projectsprojectpatchdto)
- [Projects.ProjectDTO](#projectsprojectdto)
- [Projects.ProjectStatusDTO](#projectsprojectstatusdto)
- [Members.MemberCreateDTO](#membersmembercreatedto)
- [Members.MemberPermissionsDTO](#membersmemberpermissionsdto)
- [Members.MembershipDTO](#membersmembershipdto)
- [Tasks.AssignTaskDTO](#tasksassigntaskdto)
- [Tasks.AuditDTO](#tasksauditdto)
- [Tasks.PriorityDTO](#tasksprioritydto)
- [Tasks.RemainingDTO](#tasksremainingdto)
- [Tasks.TaskCreateDTO](#taskstaskcreatedto)
- [Tasks.TaskListQueryDTO](#taskstasklistquerydto)
- [Tasks.TaskPatchDTO](#taskstaskpatchdto)
- [Tasks.TaskDTO](#taskstaskdto)
- [Tasks.TaskStatusDTO](#taskstaskstatusdto)
- [Logs.TimeLogCreateDTO](#logstimelogcreatedto)
- [Logs.TimeLogPatchDTO](#logstimelogpatchdto)
- [Logs.TimeLogDTO](#logstimelogdto)
- [Submissions.ApproveDTO](#submissionsapprovedto)
- [Submissions.RevisionDTO](#submissionsrevisiondto)
- [Submissions.SubmissionCreateDTO](#submissionssubmissioncreatedto)
- [Submissions.SubmissionDTO](#submissionssubmissiondto)
- [Reports.PeriodTypeDTO](#reportsperiodtypedto)
- [Reports.ReportCreateDTO](#reportsreportcreatedto)
- [Reports.ReportItemDTO](#reportsreportitemdto)
- [Reports.ReportListQueryDTO](#reportsreportlistquerydto)
- [Reports.ReportPatchDTO](#reportsreportpatchdto)
- [Reports.ReportPreviewQueryDTO](#reportsreportpreviewquerydto)
- [Reports.ReportPreviewDTO](#reportsreportpreviewdto)
- [Reports.ReportDTO](#reportsreportdto)
- [Reports.ReportSubmitDTO](#reportsreportsubmitdto)
- [Attachments.AttachmentDTO](#attachmentsattachmentdto)
- [Attachments.UploadPolicyDTO](#attachmentsuploadpolicydto)
- [Analytics.AnalysisJobCreateDTO](#analyticsanalysisjobcreatedto)
- [Analytics.AnalysisJobDTO](#analyticsanalysisjobdto)
- [Analytics.AnalysisMetaDTO](#analyticsanalysismetadto)
- [Analytics.AnalyticsQueryDTO](#analyticsanalyticsquerydto)
- [Analytics.BottlenecksDTO](#analyticsbottlenecksdto)
- [Analytics.DashboardDTO](#analyticsdashboarddto)
- [Analytics.MetricDTO](#analyticsmetricdto)
- [Analytics.QualityDTO](#analyticsqualitydto)
- [Analytics.RiskItemDTO](#analyticsriskitemdto)
- [Analytics.RisksDTO](#analyticsrisksdto)
- [Analytics.SummaryDTO](#analyticssummarydto)
- [Analytics.WorkloadDTO](#analyticsworkloaddto)
- [Alerts.AlertPatchDTO](#alertsalertpatchdto)
- [Alerts.AlertQueryDTO](#alertsalertquerydto)
- [Alerts.AlertDTO](#alertsalertdto)
- [Alerts.AlertStatusDTO](#alertsalertstatusdto)
- [Shared.PersonRefDTO](#sharedpersonrefdto)
- [Shared.EntityLabelDTO](#sharedentitylabeldto)
- [Shared.AnalysisSubjectDTO](#sharedanalysissubjectdto)
- [Shared.AnalysisRefDTO](#sharedanalysisrefdto)
- [Analytics.AnalysisMeasureDTO](#analyticsanalysismeasuredto)
- [Shared.DomainActionDTO](#shareddomainactiondto)
- [Analytics.EvidenceDTO](#analyticsevidencedto)
- [Analytics.FindingDTO](#analyticsfindingdto)
- [Analytics.RecommendationDTO](#analyticsrecommendationdto)
- [Analytics.LlmExplanationDTO](#analyticsllmexplanationdto)
- [Analytics.AnalysisErrorDTO](#analyticsanalysiserrordto)
- [Analytics.ExplanationStateDTO](#analyticsexplanationstatedto)
- [Analytics.ContextItemDTO](#analyticscontextitemdto)
- [Analytics.AnalysisSeriesDTO](#analyticsanalysisseriesdto)
- [Analytics.AnalysisSnapshotDTO](#analyticsanalysissnapshotdto)
- [Analytics.FreshnessDTO](#analyticsfreshnessdto)
- [Analytics.GenerationPolicyDTO](#analyticsgenerationpolicydto)
- [Analytics.AnalysisDetailDTO](#analyticsanalysisdetaildto)
- [Analytics.HighlightDTO](#analyticshighlightdto)

## Users.ReasonRequestDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `reason` | string | Có | độ dài ≥ 1; độ dài ≤ 2000; Lý do của thao tác; ghi audit, không mass assign vào entity. |

## Users.ResetPasswordDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `temporaryPassword` | string | Có | độ dài ≥ 8; độ dài ≤ 128; Mật khẩu tạm do người có quyền cấp lại; không lưu trong cache giao diện. |
| `reason` | string | Có | độ dài ≥ 1; độ dài ≤ 2000; Lý do của thao tác; ghi audit, không mass assign vào entity. |

## Users.SystemRoleDTO

`enum(EMPLOYEE, MANAGER, ADMIN)`.

## Users.UserCreateDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `username` | string | Có | độ dài ≥ 3; độ dài ≤ 64; mẫu: ^[a-zA-Z0-9._-]+$; Tên đăng nhập nội bộ; trim đầu/cuối, giữ quy ước hoa/thường đã chốt. |
| `displayName` | string | Có | độ dài ≥ 1; độ dài ≤ 255; Họ tên hiển thị. |
| `email` | string | Có | Email; request trim rồi lowercase. |
| `unitId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; ID đơn vị trong phạm vi được phép. |
| `systemRole` | Users.SystemRoleDTO | Có | Vai trò hệ thống, không tự cấp quyền mọi dự án. |
| `initialPassword` | string | Có | độ dài ≥ 8; độ dài ≤ 128; Mật khẩu tạm khi cấp tài khoản; không trả về UserDTO. |

## Users.UserListQueryDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `page` | integer | Không; có mặc định | ≥ 1; mặc định 1; Trang bắt đầu từ 1. |
| `pageSize` | integer | Không; có mặc định | ≥ 1; ≤ 100; mặc định 20; Số dòng mỗi trang, mặc định 20 và tối đa 100. |
| `q` | string | Không | độ dài ≤ 255; Từ khóa tìm kiếm, trim đầu/cuối. |
| `unitId` | string | Không | độ dài ≥ 1; độ dài ≤ 100; ID đơn vị trong phạm vi được phép. |
| `systemRole` | Users.SystemRoleDTO | Không | Vai trò hệ thống, không tự cấp quyền mọi dự án. |
| `status` | Users.UserStatusDTO | Không | Trạng thái theo enum của đúng model; không dùng chung enum cho mọi phân hệ. |

## Users.UserLockDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `reason` | string | Có | độ dài ≥ 1; độ dài ≤ 2000; Lý do của thao tác; ghi audit, không mass assign vào entity. |
| `mode` | enum(NORMAL, EMERGENCY) | Có | NORMAL cần bàn giao; EMERGENCY thu hồi truy cập ngay. |

## Users.UserPatchDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `displayName` | string | Không | độ dài ≥ 1; độ dài ≤ 255; Họ tên hiển thị. |
| `email` | string | Không | Email; request trim rồi lowercase. |
| `unitId` | string | Không | độ dài ≥ 1; độ dài ≤ 100; ID đơn vị trong phạm vi được phép. |
| `systemRole` | Users.SystemRoleDTO | Không | Vai trò hệ thống, không tự cấp quyền mọi dự án. |
| `reason` | string | Không | độ dài ≥ 1; độ dài ≤ 2000; Lý do của thao tác; ghi audit, không mass assign vào entity. |

## Users.UserDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `id` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Định danh do BE sinh, không tự đổi. |
| `version` | integer | Có | > 0; Phiên bản đọc; gửi qua If-Match nếu contract yêu cầu. |
| `createdAt` | string · UTC ISO 8601 có Z | Có | Thời điểm tạo UTC. |
| `updatedAt` | string · UTC ISO 8601 có Z | Có | Thời điểm cập nhật UTC; không dùng thay thời điểm chuyển trạng thái. |
| `username` | string | Có | độ dài ≥ 1; Tên đăng nhập nội bộ; trim đầu/cuối, giữ quy ước hoa/thường đã chốt. |
| `displayName` | string | Có | độ dài ≥ 1; độ dài ≤ 255; Họ tên hiển thị. |
| `email` | string · email | Có | Email; request trim rồi lowercase. |
| `unitId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; ID đơn vị trong phạm vi được phép. |
| `systemRole` | Users.SystemRoleDTO | Có | Vai trò hệ thống, không tự cấp quyền mọi dự án. |
| `status` | Users.UserStatusDTO | Có | Trạng thái theo enum của đúng model; không dùng chung enum cho mọi phân hệ. |
| `unit` | Shared.EntityLabelDTO | Có | Nhãn đơn vị chỉ đọc; unit.id khớp unitId. |

## Users.UserStatusDTO

`enum(ACTIVE, LOCKED)`.

## Auth.LoginResponseDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `session` | Auth.SessionDTO | Có | Người dùng và tập quyền hiện tại. |
| `accessToken` | string | Có | độ dài ≥ 1; Bearer token theo phiên; không persist và không serialize vào RSC. |
| `expiresAt` | string · UTC ISO 8601 có Z | Có | Thời điểm hết hạn access token. |

## Auth.LoginDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `username` | string | Có | độ dài ≥ 1; độ dài ≤ 64; Tên đăng nhập nội bộ; trim đầu/cuối, giữ quy ước hoa/thường đã chốt. |
| `password` | string | Có | độ dài ≥ 1; độ dài ≤ 128; Giữ nguyên chuỗi đăng nhập; không trim/log/persist. |

## Auth.SessionDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `user` | Users.UserDTO | Có | Thông tin hiển thị chỉ đọc, user.id phải bằng userId. |
| `systemPermissions` | array<enum(USERS_MANAGE, ORGANIZATION_MANAGE, PROJECT_CREATE, PROJECT_MANAGE, MEMBERS_MANAGE, TASKS_MANAGE, TASKS_REVIEW, ANALYTICS_VIEW, ALERTS_MANAGE)> | Có | Quyền cấp hệ thống, không tự mở quyền dự án. |
| `projectAccess` | array<object> | Có | Tập quyền theo từng dự án và membershipId. |
| `projectAccess[].projectId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; ID dự án; không đồng nghĩa ID service. |
| `projectAccess[].membershipId` | string | Có | độ dài ≥ 1; độ dài ≤ 100 |
| `projectAccess[].permissions` | array<enum(USERS_MANAGE, ORGANIZATION_MANAGE, PROJECT_CREATE, PROJECT_MANAGE, MEMBERS_MANAGE, TASKS_MANAGE, TASKS_REVIEW, ANALYTICS_VIEW, ALERTS_MANAGE)> | Có | Mảng enum quyền trong thẩm quyền; không gửi boolean từ form trực tiếp. |

## Organization.TeamCreateDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `name` | string | Có | độ dài ≥ 1; độ dài ≤ 255; Tên hiển thị sau trim. |
| `unitId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; ID đơn vị trong phạm vi được phép. |
| `memberIds` | array<string> | Có | Danh sách ID tài khoản thuộc nhóm; không tạo quyền dự án. |

## Organization.TeamMembersDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `memberIds` | array<string> | Có | Danh sách ID tài khoản thuộc nhóm; không tạo quyền dự án. |
| `reason` | string | Có | độ dài ≥ 1; độ dài ≤ 2000; Lý do của thao tác; ghi audit, không mass assign vào entity. |

## Organization.TeamPatchDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `name` | string | Không | độ dài ≥ 1; độ dài ≤ 255; Tên hiển thị sau trim. |
| `unitId` | string | Không | độ dài ≥ 1; độ dài ≤ 100; ID đơn vị trong phạm vi được phép. |
| `reason` | string | Có | độ dài ≥ 1; độ dài ≤ 2000; Lý do của thao tác; ghi audit, không mass assign vào entity. |

## Organization.TeamDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `id` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Định danh do BE sinh, không tự đổi. |
| `version` | integer | Có | > 0; Phiên bản đọc; gửi qua If-Match nếu contract yêu cầu. |
| `createdAt` | string · UTC ISO 8601 có Z | Có | Thời điểm tạo UTC. |
| `updatedAt` | string · UTC ISO 8601 có Z | Có | Thời điểm cập nhật UTC; không dùng thay thời điểm chuyển trạng thái. |
| `name` | string | Có | độ dài ≥ 1; độ dài ≤ 255; Tên hiển thị sau trim. |
| `unitId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; ID đơn vị trong phạm vi được phép. |
| `memberIds` | array<string> | Có | Danh sách ID tài khoản thuộc nhóm; không tạo quyền dự án. |
| `status` | enum(ACTIVE, INACTIVE) | Có | Trạng thái theo enum của đúng model; không dùng chung enum cho mọi phân hệ. |

## Organization.UnitCreateDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `name` | string | Có | độ dài ≥ 1; độ dài ≤ 255; Tên hiển thị sau trim. |
| `parentId` | string / null | Có | Đơn vị cấp trên; null là không có. |
| `managerId` | string / null | Có | Người quản lý đơn vị; null là chưa chỉ định. |

## Organization.UnitPatchDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `name` | string | Không | độ dài ≥ 1; độ dài ≤ 255; Tên hiển thị sau trim. |
| `parentId` | string / null | Không | Đơn vị cấp trên; null là không có. |
| `managerId` | string / null | Không | Người quản lý đơn vị; null là chưa chỉ định. |
| `reason` | string | Có | độ dài ≥ 1; độ dài ≤ 2000; Lý do của thao tác; ghi audit, không mass assign vào entity. |

## Organization.UnitQueryDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `page` | integer | Không; có mặc định | ≥ 1; mặc định 1; Trang bắt đầu từ 1. |
| `pageSize` | integer | Không; có mặc định | ≥ 1; ≤ 100; mặc định 20; Số dòng mỗi trang, mặc định 20 và tối đa 100. |
| `q` | string | Không | độ dài ≤ 255; Từ khóa tìm kiếm, trim đầu/cuối. |
| `status` | enum(ACTIVE, INACTIVE) | Không | Trạng thái theo enum của đúng model; không dùng chung enum cho mọi phân hệ. |

## Organization.UnitDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `id` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Định danh do BE sinh, không tự đổi. |
| `version` | integer | Có | > 0; Phiên bản đọc; gửi qua If-Match nếu contract yêu cầu. |
| `createdAt` | string · UTC ISO 8601 có Z | Có | Thời điểm tạo UTC. |
| `updatedAt` | string · UTC ISO 8601 có Z | Có | Thời điểm cập nhật UTC; không dùng thay thời điểm chuyển trạng thái. |
| `name` | string | Có | độ dài ≥ 1; độ dài ≤ 255; Tên hiển thị sau trim. |
| `parentId` | string / null | Có | Đơn vị cấp trên; null là không có. |
| `managerId` | string / null | Có | Người quản lý đơn vị; null là chưa chỉ định. |
| `status` | enum(ACTIVE, INACTIVE) | Có | Trạng thái theo enum của đúng model; không dùng chung enum cho mọi phân hệ. |

## Projects.ProjectCreateDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `code` | string | Có | độ dài ≥ 2; độ dài ≤ 32; mẫu: ^[A-Z0-9_-]+$; Mã dự án duy nhất; không sửa bằng ProjectPatch. |
| `name` | string | Có | độ dài ≥ 1; độ dài ≤ 255; Tên hiển thị sau trim. |
| `objective` | string | Có | độ dài ≥ 1; độ dài ≤ 2000; Mục tiêu dự án. |
| `unitId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; ID đơn vị trong phạm vi được phép. |
| `ownerId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Người phụ trách hoạt động; đổi owner đồng bộ tư cách và quyền trên dự án. |
| `startDate` | string · YYYY-MM-DD | Có | Ngày bắt đầu kế hoạch theo ngày Việt Nam. |
| `dueAt` | string · UTC ISO 8601 có Z | Có | Hạn hiện tại đủ ngày/giờ, ISO UTC có Z. |

## Projects.ProjectListQueryDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `page` | integer | Không; có mặc định | ≥ 1; mặc định 1; Trang bắt đầu từ 1. |
| `pageSize` | integer | Không; có mặc định | ≥ 1; ≤ 100; mặc định 20; Số dòng mỗi trang, mặc định 20 và tối đa 100. |
| `q` | string | Không | độ dài ≤ 255; Từ khóa tìm kiếm, trim đầu/cuối. |
| `unitId` | string | Không | độ dài ≥ 1; độ dài ≤ 100; ID đơn vị trong phạm vi được phép. |
| `status` | Projects.ProjectStatusDTO | Không | Trạng thái theo enum của đúng model; không dùng chung enum cho mọi phân hệ. |

## Projects.ProjectPatchDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `name` | string | Không | độ dài ≥ 1; độ dài ≤ 255; Tên hiển thị sau trim. |
| `objective` | string | Không | độ dài ≥ 1; độ dài ≤ 2000; Mục tiêu dự án. |
| `ownerId` | string | Không | độ dài ≥ 1; độ dài ≤ 100; Người phụ trách hoạt động; đổi owner đồng bộ tư cách và quyền trên dự án. |
| `startDate` | string · YYYY-MM-DD | Không | Ngày bắt đầu kế hoạch theo ngày Việt Nam. |
| `dueAt` | string · UTC ISO 8601 có Z | Không | Hạn hiện tại đủ ngày/giờ, ISO UTC có Z. |
| `changeReason` | string | Có | độ dài ≥ 1; độ dài ≤ 2000; Lý do đổi kế hoạch; bắt buộc theo điều kiện API và dữ liệu hiện tại. |

## Projects.ProjectDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `id` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Định danh do BE sinh, không tự đổi. |
| `version` | integer | Có | > 0; Phiên bản đọc; gửi qua If-Match nếu contract yêu cầu. |
| `createdAt` | string · UTC ISO 8601 có Z | Có | Thời điểm tạo UTC. |
| `updatedAt` | string · UTC ISO 8601 có Z | Có | Thời điểm cập nhật UTC; không dùng thay thời điểm chuyển trạng thái. |
| `code` | string | Có | độ dài ≥ 1; Mã dự án duy nhất; không sửa bằng ProjectPatch. |
| `name` | string | Có | độ dài ≥ 1; độ dài ≤ 255; Tên hiển thị sau trim. |
| `objective` | string | Có | độ dài ≤ 10000; Mục tiêu dự án. |
| `unitId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; ID đơn vị trong phạm vi được phép. |
| `ownerId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Người phụ trách hoạt động; đổi owner đồng bộ tư cách và quyền trên dự án. |
| `startDate` | string · YYYY-MM-DD | Có | Ngày bắt đầu kế hoạch theo ngày Việt Nam. |
| `dueAt` | string · UTC ISO 8601 có Z | Có | Hạn hiện tại đủ ngày/giờ, ISO UTC có Z. |
| `status` | Projects.ProjectStatusDTO | Có | Trạng thái theo enum của đúng model; không dùng chung enum cho mọi phân hệ. |
| `completedAt` | string · UTC ISO 8601 có Z / null | Có | Thời điểm nghiệm thu hoàn thành, không phải thời điểm nộp. |
| `cancelledAt` | string · UTC ISO 8601 có Z / null | Có | Thời điểm hủy hợp lệ. |
| `owner` | Shared.PersonRefDTO | Có | Nhãn người phụ trách chỉ đọc; owner.id khớp ownerId. |
| `unit` | Shared.EntityLabelDTO | Có | Nhãn đơn vị chỉ đọc; unit.id khớp unitId. |

## Projects.ProjectStatusDTO

`enum(PLANNED, ACTIVE, COMPLETED, CANCELLED)`.

## Members.MemberCreateDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `userId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Tài khoản của thành viên/người ghi theo đúng model. |
| `projectRole` | enum(MANAGER, MEMBER) | Có | Nhãn vai trò trên một dự án; quyền thực tế nằm trong permissions. |
| `permissions` | array<enum(USERS_MANAGE, ORGANIZATION_MANAGE, PROJECT_CREATE, PROJECT_MANAGE, MEMBERS_MANAGE, TASKS_MANAGE, TASKS_REVIEW, ANALYTICS_VIEW, ALERTS_MANAGE)> | Có | Mảng enum quyền trong thẩm quyền; không gửi boolean từ form trực tiếp. |

## Members.MemberPermissionsDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `projectRole` | enum(MANAGER, MEMBER) | Có | Nhãn vai trò trên một dự án; quyền thực tế nằm trong permissions. |
| `permissions` | array<enum(USERS_MANAGE, ORGANIZATION_MANAGE, PROJECT_CREATE, PROJECT_MANAGE, MEMBERS_MANAGE, TASKS_MANAGE, TASKS_REVIEW, ANALYTICS_VIEW, ALERTS_MANAGE)> | Có | Mảng enum quyền trong thẩm quyền; không gửi boolean từ form trực tiếp. |
| `reason` | string | Có | độ dài ≥ 1; độ dài ≤ 2000; Lý do của thao tác; ghi audit, không mass assign vào entity. |

## Members.MembershipDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `id` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Định danh do BE sinh, không tự đổi. |
| `version` | integer | Có | > 0; Phiên bản đọc; gửi qua If-Match nếu contract yêu cầu. |
| `createdAt` | string · UTC ISO 8601 có Z | Có | Thời điểm tạo UTC. |
| `updatedAt` | string · UTC ISO 8601 có Z | Có | Thời điểm cập nhật UTC; không dùng thay thời điểm chuyển trạng thái. |
| `projectId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; ID dự án; không đồng nghĩa ID service. |
| `userId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Tài khoản của thành viên/người ghi theo đúng model. |
| `projectRole` | enum(OWNER, MANAGER, MEMBER) | Có | Nhãn vai trò trên một dự án; quyền thực tế nằm trong permissions. |
| `permissions` | array<enum(USERS_MANAGE, ORGANIZATION_MANAGE, PROJECT_CREATE, PROJECT_MANAGE, MEMBERS_MANAGE, TASKS_MANAGE, TASKS_REVIEW, ANALYTICS_VIEW, ALERTS_MANAGE)> | Có | Mảng enum quyền trong thẩm quyền; không gửi boolean từ form trực tiếp. |
| `joinedAt` | string · UTC ISO 8601 có Z | Có | Bắt đầu tư cách thành viên. |
| `endedAt` | string · UTC ISO 8601 có Z / null | Có | Kết thúc tư cách; null khi đang hiệu lực. |
| `user` | Shared.PersonRefDTO | Có | Thông tin hiển thị chỉ đọc, user.id phải bằng userId. |

## Tasks.AssignTaskDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `assigneeId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Người chịu trách nhiệm hiện tại với việc mở; với việc kết thúc, giữ người phụ trách cuối theo D15. |
| `reason` | string | Không | độ dài ≥ 1; độ dài ≤ 2000; Lý do của thao tác; ghi audit, không mass assign vào entity. |

## Tasks.AuditDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `id` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Định danh do BE sinh, không tự đổi. |
| `entityType` | string | Có | Loại đối tượng lịch sử. |
| `entityId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; ID đối tượng lịch sử. |
| `actorId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Người thực hiện thao tác. |
| `action` | string | Có | Tên thao tác đã lưu thành công. |
| `at` | string · UTC ISO 8601 có Z | Có | Mốc sự kiện UTC. |
| `before` | JSON value / null | Có | Dữ liệu trước thay đổi, không chứa mật khẩu/token. |
| `after` | JSON value / null | Có | Dữ liệu sau thay đổi, không chứa mật khẩu/token. |
| `reason` | string / null | Có | Lý do của thao tác; ghi audit, không mass assign vào entity. |

## Tasks.PriorityDTO

`enum(LOW, NORMAL, HIGH, URGENT)`.

## Tasks.RemainingDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `remainingMinutes` | integer | Có | ≥ 0; ≤ 5256000; Phút còn lại được nhập riêng; null là chưa cập nhật, không tự suy bằng phép trừ. |

## Tasks.TaskCreateDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `title` | string | Có | độ dài ≥ 1; độ dài ≤ 255; Tên công việc 1–255 ký tự sau trim. |
| `description` | string / null | Không | Mô tả; task nhận null để bỏ mô tả. |
| `acceptanceCriteria` | string | Có | độ dài ≥ 1; độ dài ≤ 2000; Tiêu chí dùng đối chiếu khi nghiệm thu. |
| `priority` | Tasks.PriorityDTO | Có | LOW/NORMAL/HIGH/URGENT; UI ánh xạ nhãn Việt. |
| `dueAt` | string · UTC ISO 8601 có Z | Có | Hạn hiện tại đủ ngày/giờ, ISO UTC có Z. |
| `estimatedMinutes` | integer | Có | > 0; ≤ 5256000; Phút dự kiến hiện tại, số nguyên dương. |

## Tasks.TaskListQueryDTO

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

## Tasks.TaskPatchDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `title` | string | Không | độ dài ≥ 1; độ dài ≤ 255; Tên công việc 1–255 ký tự sau trim. |
| `description` | string / null | Không | Mô tả; task nhận null để bỏ mô tả. |
| `acceptanceCriteria` | string | Không | độ dài ≥ 1; độ dài ≤ 2000; Tiêu chí dùng đối chiếu khi nghiệm thu. |
| `priority` | Tasks.PriorityDTO | Không | LOW/NORMAL/HIGH/URGENT; UI ánh xạ nhãn Việt. |
| `dueAt` | string · UTC ISO 8601 có Z | Không | Hạn hiện tại đủ ngày/giờ, ISO UTC có Z. |
| `estimatedMinutes` | integer | Không | > 0; ≤ 5256000; Phút dự kiến hiện tại, số nguyên dương. |
| `changeReason` | string | Không | độ dài ≥ 1; độ dài ≤ 2000; Lý do đổi kế hoạch; bắt buộc theo điều kiện API và dữ liệu hiện tại. |

## Tasks.TaskDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `id` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Định danh do BE sinh, không tự đổi. |
| `version` | integer | Có | > 0; Phiên bản đọc; gửi qua If-Match nếu contract yêu cầu. |
| `createdAt` | string · UTC ISO 8601 có Z | Có | Thời điểm tạo UTC. |
| `updatedAt` | string · UTC ISO 8601 có Z | Có | Thời điểm cập nhật UTC; không dùng thay thời điểm chuyển trạng thái. |
| `projectId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; ID dự án; không đồng nghĩa ID service. |
| `title` | string | Có | độ dài ≥ 1; độ dài ≤ 255; Tên công việc 1–255 ký tự sau trim. |
| `description` | string / null | Có | Mô tả; task nhận null để bỏ mô tả. |
| `acceptanceCriteria` | string | Có | độ dài ≥ 1; độ dài ≤ 2000; Tiêu chí dùng đối chiếu khi nghiệm thu. |
| `priority` | Tasks.PriorityDTO | Có | LOW/NORMAL/HIGH/URGENT; UI ánh xạ nhãn Việt. |
| `dueAt` | string · UTC ISO 8601 có Z | Có | Hạn hiện tại đủ ngày/giờ, ISO UTC có Z. |
| `originalDueAt` | string · UTC ISO 8601 có Z | Có | Hạn ban đầu, không đổi khi điều chỉnh kế hoạch. |
| `estimatedMinutes` | integer | Có | > 0; Phút dự kiến hiện tại, số nguyên dương. |
| `originalEstimatedMinutes` | integer | Có | > 0; Phút dự kiến ban đầu, không ghi đè. |
| `remainingMinutes` | integer / null | Có | Phút còn lại được nhập riêng; null là chưa cập nhật, không tự suy bằng phép trừ. |
| `assigneeId` | string / null | Có | Người chịu trách nhiệm hiện tại với việc mở; với việc kết thúc, giữ người phụ trách cuối theo D15. |
| `status` | Tasks.TaskStatusDTO | Có | Trạng thái theo enum của đúng model; không dùng chung enum cho mọi phân hệ. |
| `statusChangedAt` | string · UTC ISO 8601 có Z | Có | Lần gần nhất vào trạng thái hiện tại; không tăng khi chỉ ghi giờ hoặc sửa mô tả. |
| `firstStartedAt` | string · UTC ISO 8601 có Z / null | Có | Lần bắt đầu đầu tiên; giữ khi tạm dừng/bắt đầu lại hoặc bàn giao. |
| `completedAt` | string · UTC ISO 8601 có Z / null | Có | Thời điểm nghiệm thu hoàn thành, không phải thời điểm nộp. |
| `cancelledAt` | string · UTC ISO 8601 có Z / null | Có | Thời điểm hủy hợp lệ. |
| `actualMinutes` | integer | Có | ≥ 0; Tổng phút của nhật ký ACTIVE, do BE tính. |
| `latestSubmissionId` | string / null | Có | ID lần nộp gần nhất, không sửa từ TaskPatch. |
| `isOverdue` | boolean | Có | Cờ BE tính từ hạn hiện tại và trạng thái, không phải một trạng thái riêng. |
| `assignee` | Shared.PersonRefDTO / null | Có | Thông tin hiển thị chỉ đọc; id khớp assigneeId, cùng null nếu chưa giao. |
| `project` | Shared.EntityLabelDTO | Có | Nhãn dự án chỉ đọc; project.id khớp projectId. |

## Tasks.TaskStatusDTO

`enum(NEW, TODO, IN_PROGRESS, PENDING_REVIEW, COMPLETED, CANCELLED)`.

## Logs.TimeLogCreateDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `workDate` | string · YYYY-MM-DD | Có | Ngày làm việc YYYY-MM-DD theo Asia/Ho_Chi_Minh. |
| `minutes` | integer | Có | > 0; ≤ 1440; Phút nguyên dương; từng log ≤1440, tổng mọi log/người/ngày do BE kiểm tra. |
| `description` | string | Có | độ dài ≥ 1; độ dài ≤ 2000; Mô tả phần việc được ghi giờ, không nullable; dùng reason riêng để giải thích sửa nhật ký. |

## Logs.TimeLogPatchDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `workDate` | string · YYYY-MM-DD | Không | Ngày làm việc YYYY-MM-DD theo Asia/Ho_Chi_Minh. |
| `minutes` | integer | Không | > 0; ≤ 1440; Phút nguyên dương; từng log ≤1440, tổng mọi log/người/ngày do BE kiểm tra. |
| `description` | string | Không | độ dài ≥ 1; độ dài ≤ 2000; Mô tả phần việc được ghi giờ, không nullable; dùng reason riêng để giải thích sửa nhật ký. |
| `reason` | string | Có | độ dài ≥ 1; độ dài ≤ 2000; Lý do của thao tác; ghi audit, không mass assign vào entity. |

## Logs.TimeLogDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `id` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Định danh do BE sinh, không tự đổi. |
| `version` | integer | Có | > 0; Phiên bản đọc; gửi qua If-Match nếu contract yêu cầu. |
| `createdAt` | string · UTC ISO 8601 có Z | Có | Thời điểm tạo UTC. |
| `updatedAt` | string · UTC ISO 8601 có Z | Có | Thời điểm cập nhật UTC; không dùng thay thời điểm chuyển trạng thái. |
| `taskId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Công việc liên quan; phải đúng dự án và phạm vi. |
| `userId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Tài khoản của thành viên/người ghi theo đúng model. |
| `workDate` | string · YYYY-MM-DD | Có | Ngày làm việc YYYY-MM-DD theo Asia/Ho_Chi_Minh. |
| `minutes` | integer | Có | > 0; ≤ 1440; Phút nguyên dương; từng log ≤1440, tổng mọi log/người/ngày do BE kiểm tra. |
| `description` | string | Có | độ dài ≥ 1; độ dài ≤ 2000; Mô tả phần việc được ghi giờ, không nullable; dùng reason riêng để giải thích sửa nhật ký. |
| `status` | enum(ACTIVE, VOID) | Có | Trạng thái theo enum của đúng model; không dùng chung enum cho mọi phân hệ. |
| `voidReason` | string / null | Có | Lý do loại nhật ký khỏi tổng; null nếu còn hiệu lực. |
| `user` | Shared.PersonRefDTO | Có | Thông tin hiển thị chỉ đọc, user.id phải bằng userId. |

## Submissions.ApproveDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `comment` | string | Không | độ dài ≤ 10000; Nhận xét tùy chọn khi chấp nhận. |

## Submissions.RevisionDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `reason` | string | Có | độ dài ≥ 1; độ dài ≤ 2000; Lý do của thao tác; ghi audit, không mass assign vào entity. |
| `requestedChanges` | string | Có | độ dài ≥ 1; độ dài ≤ 2000; Nội dung cần sửa; bắt buộc khi yêu cầu chỉnh sửa. |

## Submissions.SubmissionCreateDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `summary` | string | Có | độ dài ≥ 1; độ dài ≤ 2000; Tóm tắt kết quả bắt buộc. |
| `links` | array<string> | Có | số phần tử ≤ 10; Mảng liên kết HTTP/HTTPS tùy chọn. |
| `attachmentIds` | array<string> | Có | số phần tử ≤ 10; Tệp READY đúng quyền/công việc; tối đa theo contract và policy. |

## Submissions.SubmissionDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `id` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Định danh do BE sinh, không tự đổi. |
| `version` | integer | Có | > 0; Phiên bản đọc; gửi qua If-Match nếu contract yêu cầu. |
| `createdAt` | string · UTC ISO 8601 có Z | Có | Thời điểm tạo UTC. |
| `updatedAt` | string · UTC ISO 8601 có Z | Có | Thời điểm cập nhật UTC; không dùng thay thời điểm chuyển trạng thái. |
| `taskId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Công việc liên quan; phải đúng dự án và phạm vi. |
| `sequence` | integer | Có | > 0; Số thứ tự lần nộp tăng dần trong công việc. |
| `submittedBy` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Người nộp do server xác định từ phiên. |
| `submittedAt` | string · UTC ISO 8601 có Z | Có | Thời điểm gửi/nộp do server lưu. |
| `summary` | string | Có | độ dài ≥ 1; độ dài ≤ 2000; Tóm tắt kết quả bắt buộc. |
| `links` | array<string> | Có | Mảng liên kết HTTP/HTTPS tùy chọn. |
| `attachmentIds` | array<string> | Có | Tệp READY đúng quyền/công việc; tối đa theo contract và policy. |
| `dueAtSnapshot` | string · UTC ISO 8601 có Z | Có | Hạn tại lần nộp, giữ để đánh giá nộp/hoàn tất muộn. |
| `actualMinutesSnapshot` | integer | Có | ≥ 0; Tổng phút tại lúc nộp. |
| `status` | enum(PENDING, ACCEPTED, REVISION_REQUESTED) | Có | Trạng thái theo enum của đúng model; không dùng chung enum cho mọi phân hệ. |
| `reviewedBy` | string / null | Có | Người xét có quyền, khác người nộp. |
| `reviewedAt` | string · UTC ISO 8601 có Z / null | Có | Thời điểm quyết định nghiệm thu. |
| `reviewComment` | string / null | Có | Nhận xét đã lưu của quyết định. |
| `requestedChanges` | string / null | Có | Nội dung cần sửa; bắt buộc khi yêu cầu chỉnh sửa. |
| `submitter` | Shared.PersonRefDTO | Có | Nhãn người nộp chỉ đọc; id khớp submittedBy. |
| `reviewer` | Shared.PersonRefDTO / null | Có | Nhãn người xét chỉ đọc; id khớp reviewedBy, null nếu chưa xét. |

## Reports.PeriodTypeDTO

`enum(DAILY, WEEKLY)`.

## Reports.ReportCreateDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `projectId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; ID dự án; không đồng nghĩa ID service. |
| `periodType` | Reports.PeriodTypeDTO | Có | DAILY hoặc WEEKLY; tuần từ thứ Hai theo Việt Nam. |
| `periodStart` | string · YYYY-MM-DD | Có | Ngày đầu kỳ, không ở tương lai. |
| `achievements` | string | Không | độ dài ≤ 10000; Kết quả thực hiện; nháp được rỗng, khi gửi phải có. |
| `blockers` | string | Không | độ dài ≤ 10000; Khó khăn cần ghi nhận, được rỗng. |
| `nextPlan` | string | Không | độ dài ≤ 10000; Kế hoạch tiếp theo; nháp được rỗng, khi gửi phải có. |
| `selectedTaskIds` | array<string> | Không | ID công việc liên quan đúng tác giả/dự án/kỳ, không gửi object công việc. |

## Reports.ReportItemDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `taskId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Công việc liên quan; phải đúng dự án và phạm vi. |
| `title` | string | Có | Tên công việc 1–255 ký tự sau trim. |
| `status` | Tasks.TaskStatusDTO | Có | Trạng thái theo enum của đúng model; không dùng chung enum cho mọi phân hệ. |
| `minutes` | integer | Có | ≥ 0; Phút nguyên dương; từng log ≤1440, tổng mọi log/người/ngày do BE kiểm tra. |

## Reports.ReportListQueryDTO

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

## Reports.ReportPatchDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `achievements` | string | Không | độ dài ≤ 10000; Kết quả thực hiện; nháp được rỗng, khi gửi phải có. |
| `blockers` | string | Không | độ dài ≤ 10000; Khó khăn cần ghi nhận, được rỗng. |
| `nextPlan` | string | Không | độ dài ≤ 10000; Kế hoạch tiếp theo; nháp được rỗng, khi gửi phải có. |
| `selectedTaskIds` | array<string> | Không | ID công việc liên quan đúng tác giả/dự án/kỳ, không gửi object công việc. |
| `zeroTimeReason` | string / null | Không | Giải thích khi gửi báo cáo có tổng 0 phút. |

## Reports.ReportPreviewQueryDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `projectId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; ID dự án; không đồng nghĩa ID service. |
| `periodType` | Reports.PeriodTypeDTO | Có | DAILY hoặc WEEKLY; tuần từ thứ Hai theo Việt Nam. |
| `periodStart` | string · YYYY-MM-DD | Có | Ngày đầu kỳ, không ở tương lai. |

## Reports.ReportPreviewDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `projectId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; ID dự án; không đồng nghĩa ID service. |
| `periodType` | Reports.PeriodTypeDTO | Có | DAILY hoặc WEEKLY; tuần từ thứ Hai theo Việt Nam. |
| `periodStart` | string · YYYY-MM-DD | Có | Ngày đầu kỳ, không ở tương lai. |
| `periodEndExclusive` | string · UTC ISO 8601 có Z | Có | Mốc UTC đầu kỳ tiếp theo, không thuộc kỳ hiện tại. |
| `dataAsOf` | string · UTC ISO 8601 có Z | Có | Thời điểm số liệu nguồn, không trình bày dữ liệu cũ như mới. |
| `totalMinutes` | integer | Có | ≥ 0; Tổng phút tính từ nhật ký còn hiệu lực trong đúng kỳ. |
| `items` | array<Reports.ReportItemDTO> | Có | Danh sách có schema riêng cho từng API. |
| `partialPeriod` | boolean | Có | true khi kỳ chưa hết tại lúc chốt. |

## Reports.ReportDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `id` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Định danh do BE sinh, không tự đổi. |
| `version` | integer | Có | > 0; Phiên bản đọc; gửi qua If-Match nếu contract yêu cầu. |
| `createdAt` | string · UTC ISO 8601 có Z | Có | Thời điểm tạo UTC. |
| `updatedAt` | string · UTC ISO 8601 có Z | Có | Thời điểm cập nhật UTC; không dùng thay thời điểm chuyển trạng thái. |
| `projectId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; ID dự án; không đồng nghĩa ID service. |
| `periodType` | Reports.PeriodTypeDTO | Có | DAILY hoặc WEEKLY; tuần từ thứ Hai theo Việt Nam. |
| `periodStart` | string · YYYY-MM-DD | Có | Ngày đầu kỳ, không ở tương lai. |
| `authorId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Tác giả do server gắn theo phiên. |
| `status` | enum(DRAFT, SUBMITTED) | Có | Trạng thái theo enum của đúng model; không dùng chung enum cho mọi phân hệ. |
| `achievements` | string | Có | độ dài ≤ 10000; Kết quả thực hiện; nháp được rỗng, khi gửi phải có. |
| `blockers` | string | Có | độ dài ≤ 10000; Khó khăn cần ghi nhận, được rỗng. |
| `nextPlan` | string | Có | độ dài ≤ 10000; Kế hoạch tiếp theo; nháp được rỗng, khi gửi phải có. |
| `selectedTaskIds` | array<string> | Có | ID công việc liên quan đúng tác giả/dự án/kỳ, không gửi object công việc. |
| `zeroTimeReason` | string / null | Có | Giải thích khi gửi báo cáo có tổng 0 phút. |
| `submittedAt` | string · UTC ISO 8601 có Z / null | Có | Thời điểm gửi/nộp do server lưu. |
| `snapshot` | Reports.ReportPreviewDTO / null | Có | Bản chốt từ dữ liệu server tại lúc gửi; null khi nháp, bất biến sau gửi. |
| `author` | Shared.PersonRefDTO | Có | Nhãn tác giả chỉ đọc; author.id khớp authorId; không đổi nội dung snapshot báo cáo. |

## Reports.ReportSubmitDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `zeroTimeReason` | string | Không | độ dài ≥ 1; độ dài ≤ 2000; Giải thích khi gửi báo cáo có tổng 0 phút. |

## Attachments.AttachmentDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `id` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Định danh do BE sinh, không tự đổi. |
| `version` | integer | Có | > 0; Phiên bản đọc; gửi qua If-Match nếu contract yêu cầu. |
| `createdAt` | string · UTC ISO 8601 có Z | Có | Thời điểm tạo UTC. |
| `updatedAt` | string · UTC ISO 8601 có Z | Có | Thời điểm cập nhật UTC; không dùng thay thời điểm chuyển trạng thái. |
| `taskId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Công việc liên quan; phải đúng dự án và phạm vi. |
| `uploadedBy` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Người tải lên từ phiên. |
| `filename` | string | Có | độ dài ≥ 1; Tên tệp đã nhận. |
| `mimeType` | string | Có | độ dài ≥ 1; Loại nội dung đã xác minh theo chính sách BE. |
| `sizeBytes` | integer | Có | > 0; Dung lượng tệp tính byte. |
| `status` | enum(READY, REJECTED) | Có | Trạng thái theo enum của đúng model; không dùng chung enum cho mọi phân hệ. |

## Attachments.UploadPolicyDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `maxBytes` | integer | Có | > 0; Dung lượng tối đa lấy từ BE policy. |
| `maxAttachments` | integer | Có | > 0; Giới hạn số minh chứng theo policy/contract. |
| `allowedMimeTypes` | array<string> | Có | Danh sách loại tệp cho phép. |

## Analytics.AnalysisJobCreateDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `analysisId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; ID bản phân tích được BE cấp; không phải taskId hay prompt do FE tự tạo. |
| `generationMode` | enum(REUSE_OR_CREATE, REGENERATE) | Không; có mặc định | mặc định REUSE_OR_CREATE; REUSE_OR_CREATE tận dụng kết quả/job hiện có; REGENERATE chỉ sau click Phân tích lại. |
| `locale` | enum(vi-VN) | Không; có mặc định | mặc định vi-VN |

## Analytics.AnalysisJobDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `id` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Định danh do BE sinh, không tự đổi. |
| `analysisId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; ID bản phân tích được BE cấp; không phải taskId hay prompt do FE tự tạo. |
| `snapshotId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; ID bộ thông số bất biến mà lời phân tích phải tham chiếu đúng. |
| `status` | enum(QUEUED, RUNNING, SUCCEEDED, FAILED) | Có | Trạng thái theo enum của đúng model; không dùng chung enum cho mọi phân hệ. |
| `createdAt` | string · UTC ISO 8601 có Z | Có | Thời điểm tạo UTC. |
| `updatedAt` | string · UTC ISO 8601 có Z | Có | Thời điểm cập nhật UTC; không dùng thay thời điểm chuyển trạng thái. |
| `completedAt` | string · UTC ISO 8601 có Z / null | Có | Thời điểm job kết thúc SUCCEEDED/FAILED; null khi đang chờ hoặc chạy. |
| `pollAfterMs` | integer | Có | ≥ 0; ≤ 10000; 2.000–10.000 khi QUEUED/RUNNING, 0 khi kết thúc; FE chặn giá trị ngoài quy ước. |
| `result` | object / null | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `result.analysisId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; ID bản phân tích được BE cấp; không phải taskId hay prompt do FE tự tạo. |
| `result.explanationId` | string | Có | độ dài ≥ 1; độ dài ≤ 100 |
| `error` | Analytics.AnalysisErrorDTO / null | Có | Theo đúng kiểu và khả năng null đã ghi. |

## Analytics.AnalysisMetaDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `snapshotId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; ID bộ thông số bất biến mà lời phân tích phải tham chiếu đúng. |
| `dataAsOf` | string · UTC ISO 8601 có Z | Có | Thời điểm số liệu nguồn, không trình bày dữ liệu cũ như mới. |
| `generatedAt` | string · UTC ISO 8601 có Z | Có | Thời điểm tạo kết quả, tách khỏi dataAsOf. |
| `scope` | Analytics.AnalyticsQueryDTO | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `calculationMethod` | enum(SERVER_RULES) | Có | Thông số do BE tính theo quy tắc, tách khỏi LLM diễn giải. |
| `calculationVersion` | string | Có | độ dài ≥ 1; độ dài ≤ 100 |
| `quality` | Analytics.QualityDTO | Có | Độ đủ dữ liệu, trường thiếu và giới hạn phạm vi. |

## Analytics.AnalyticsQueryDTO

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
| `teamId` | string | Không | Nhóm nhân sự hiện tại được phép xem; BE lọc thành viên và đánh dấu phạm vi tải chưa đầy đủ khi cần. |

## Analytics.BottlenecksDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `metadata` | Analytics.AnalysisMetaDTO | Có | Phạm vi thời gian/nguồn/phương pháp/quality của kết quả phân tích. |
| `items` | array<object> | Có | Danh sách có schema riêng cho từng API. |
| `items[].taskId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Công việc liên quan; phải đúng dự án và phạm vi. |
| `items[].stage` | enum(TODO, IN_PROGRESS, PENDING_REVIEW) | Có | Khâu tồn đọng. |
| `items[].elapsedMinutes` | number | Có | ≥ 0; Phút chờ ở khâu đang phân tích. |
| `items[].revisionCount` | integer | Có | ≥ 0; Số quyết định yêu cầu sửa. |
| `items[].calendarBasis` | enum(CONTINUOUS, WORKING_CALENDAR) | Có | CONTINUOUS hoặc WORKING_CALENDAR; không cộng vào giờ công. |
| `items[].evidence` | array<string> | Có | Căn cứ cho nhận định, không phải lệnh thực hiện. |
| `items[].taskTitle` | string | Có | độ dài ≥ 1; độ dài ≤ 255 |
| `items[].assignee` | Shared.PersonRefDTO / null | Có | Thông tin hiển thị chỉ đọc; id khớp assigneeId, cùng null nếu chưa giao. |
| `items[].analysisRef` | Shared.AnalysisRefDTO | Có | Điểm mở S43; giữ đúng analysisId/snapshotId và phạm vi lọc từ BE. |

## Analytics.DashboardDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `metadata` | Analytics.AnalysisMetaDTO | Có | Phạm vi thời gian/nguồn/phương pháp/quality của kết quả phân tích. |
| `totalTasks` | integer | Có | ≥ 0 |
| `completedTasks` | integer | Có | ≥ 0 |
| `cancelledTasks` | integer | Có | ≥ 0 |
| `openTasks` | integer | Có | ≥ 0 |
| `overdueTasks` | integer | Có | ≥ 0 |
| `completionRate` | number / null | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `actualMinutes` | integer | Có | ≥ 0; Tổng phút của nhật ký ACTIVE, do BE tính. |
| `byStatus` | array<object> | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `byStatus[].status` | Tasks.TaskStatusDTO | Có | Trạng thái theo enum của đúng model; không dùng chung enum cho mọi phân hệ. |
| `byStatus[].count` | integer | Có | ≥ 0 |
| `metrics` | array<Analytics.MetricDTO> | Có | số phần tử ≥ 16; số phần tử ≤ 16 |
| `timeVariance` | object | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `timeVariance.actualMinutes` | number | Có | ≥ 0; Tổng phút của nhật ký ACTIVE, do BE tính. |
| `timeVariance.currentEstimateMinutes` | number | Có | ≥ 0 |
| `timeVariance.originalEstimateMinutes` | number | Có | ≥ 0 |
| `timeVariance.deltaCurrentMinutes` | number | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `timeVariance.deltaOriginalMinutes` | number | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `submissionTimeliness` | object | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `submissionTimeliness.onTimeCount` | integer | Có | ≥ 0 |
| `submissionTimeliness.lateCount` | integer | Có | ≥ 0 |
| `submissionTimeliness.denominator` | integer | Có | ≥ 0 |
| `acceptedSubmissionTimeliness` | object | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `acceptedSubmissionTimeliness.onTimeCount` | integer | Có | ≥ 0 |
| `acceptedSubmissionTimeliness.lateCount` | integer | Có | ≥ 0 |
| `acceptedSubmissionTimeliness.denominator` | integer | Có | ≥ 0 |
| `reporting` | object | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `reporting.submittedDaily` | integer | Có | ≥ 0 |
| `reporting.submittedWeekly` | integer | Có | ≥ 0 |
| `reporting.expectedCount` | integer / null | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `reporting.submissionCoverageRate` | number / null | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `trend` | array<object> | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `trend[].date` | string · YYYY-MM-DD | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `trend[].completedCount` | integer / null | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `trend[].submissionCount` | integer / null | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `trend[].actualMinutes` | integer / null | Có | Tổng phút của nhật ký ACTIVE, do BE tính. |
| `trend[].complete` | boolean | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `projectComparisons` | array<object> | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `projectComparisons[].projectId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; ID dự án; không đồng nghĩa ID service. |
| `projectComparisons[].validTaskCount` | integer | Có | ≥ 0 |
| `projectComparisons[].completionRate` | number / null | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `projectComparisons[].overdueCount` | integer | Có | ≥ 0 |
| `projectComparisons[].activeAlertCount` | integer | Có | ≥ 0 |
| `projectComparisons[].quality` | Analytics.QualityDTO | Có | Độ đủ dữ liệu, trường thiếu và giới hạn phạm vi. |
| `projectComparisons[].analysisRef` | Shared.AnalysisRefDTO | Có | Điểm mở S43; giữ đúng analysisId/snapshotId và phạm vi lọc từ BE. |
| `overviewRef` | Shared.AnalysisRefDTO | Có | Tham chiếu phân tích tổng quan để mở S43, không gọi LLM trong GET tổng quan. |
| `projectComparisons[].projectName` | string | Có | Nhãn dự án từ BE, dài 1–255; không gọi API quản trị để tra tên. |
| `projectComparisons[].actualMinutes` | integer ≥0 | Có | Tổng phút nhật ký còn hiệu lực của dự án trong kỳ; đổi sang giờ khi hiển thị. |

## Analytics.MetricDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `code` | enum(K01, K02, K03, K04, K05, K06, K07, K08, K09, K10, K11, K12, K13, K14, K15, K16) | Có | Mã chỉ số/KPI theo quy ước BE; không phải mã dự án. |
| `label` | string | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `value` | number / null | Có | Giá trị đúng kiểu được khai báo; phần số do BE tính, null khi thiếu nguồn, không tự đổi thành 0. |
| `unit` | enum(TASK, COUNT, PERCENT, MINUTE, HOUR, REPORT) | Có | Đơn vị đo của giá trị hoặc chuỗi số liệu; dùng nhãn Việt tương ứng, không phải đơn vị tổ chức. |
| `basis` | enum(CURRENT, PERIOD) | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `aggregation` | enum(COUNT, SUM, MEAN, RATIO) | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `denominator` | number / null | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `missingFields` | array<string> | Có | Trường/nguồn thiếu; không tự thay bằng 0. |
| `analysisRef` | Shared.AnalysisRefDTO | Có | Điểm mở S43; giữ đúng analysisId/snapshotId và phạm vi lọc từ BE. |

## Analytics.QualityDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `status` | enum(SUFFICIENT, PARTIAL, INSUFFICIENT) | Có | Trạng thái theo enum của đúng model; không dùng chung enum cho mọi phân hệ. |
| `missingFields` | array<string> | Có | Trường/nguồn thiếu; không tự thay bằng 0. |
| `scopeLimited` | boolean | Có | true nếu chưa thể hiện toàn bộ tải hoặc toàn bộ nguồn dữ liệu của đối tượng. |

## Analytics.RiskItemDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `taskId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Công việc liên quan; phải đúng dự án và phạm vi. |
| `taskTitle` | string | Có | độ dài ≥ 1; độ dài ≤ 255 |
| `status` | Tasks.TaskStatusDTO | Có | Trạng thái theo enum của đúng model; không dùng chung enum cho mọi phân hệ. |
| `assignee` | Shared.PersonRefDTO / null | Có | Thông tin hiển thị chỉ đọc; id khớp assigneeId, cùng null nếu chưa giao. |
| `dueAt` | string · UTC ISO 8601 có Z | Có | Hạn hiện tại đủ ngày/giờ, ISO UTC có Z. |
| `category` | enum(AT_RISK, OVERDUE, INSUFFICIENT_DATA, NO_SIGNAL) | Có | Nhóm nguy cơ/đã quá hạn/thiếu dữ liệu; không thay trạng thái công việc. |
| `riskLevel` | enum(LOW, MEDIUM, HIGH, UNKNOWN) | Có | Mức cảnh báo từ quy tắc nghiệp vụ; không phải xác suất LLM. |
| `assessmentBasis` | enum(BUSINESS_RULES) | Có | Nguồn phân loại là BUSINESS_RULES; không suy confidence từ LLM. |
| `ruleIds` | array<string> | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `evidence` | array<string> | Có | Căn cứ cho nhận định, không phải lệnh thực hiện. |
| `quality` | Analytics.QualityDTO | Có | Độ đủ dữ liệu, trường thiếu và giới hạn phạm vi. |
| `analysisRef` | Shared.AnalysisRefDTO | Có | Điểm mở S43; giữ đúng analysisId/snapshotId và phạm vi lọc từ BE. |

## Analytics.RisksDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `metadata` | Analytics.AnalysisMetaDTO | Có | Phạm vi thời gian/nguồn/phương pháp/quality của kết quả phân tích. |
| `items` | array<Analytics.RiskItemDTO> | Có | Danh sách có schema riêng cho từng API. |
| `projects` | array<Analytics.ProjectRiskSummaryDTO> | Có | Tổng hợp mức nguy cơ dự án từ bằng chứng công việc và ngưỡng cấu hình; không tính xác suất bằng tỷ lệ cảnh báo. |

## Analytics.SummaryDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `metadata` | Analytics.AnalysisMetaDTO | Có | Phạm vi thời gian/nguồn/phương pháp/quality của kết quả phân tích. |
| `overviewRef` | Shared.AnalysisRefDTO | Có | Tham chiếu phân tích tổng quan để mở S43, không gọi LLM trong GET tổng quan. |
| `metrics` | array<Analytics.AnalysisMeasureDTO> | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `highlights` | array<Analytics.HighlightDTO> | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `summaryText` | string | Có | Bản tổng hợp theo mẫu từ số liệu BE đã kiểm tra, dài 1–4000; luôn sẵn sàng khi nguồn hợp lệ, kể cả LLM lỗi. Nhãn “Tổng hợp theo số liệu”. |

## Analytics.WorkloadDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `metadata` | Analytics.AnalysisMetaDTO | Có | Phạm vi thời gian/nguồn/phương pháp/quality của kết quả phân tích. |
| `items` | array<object> | Có | Danh sách có schema riêng cho từng API. |
| `items[].userId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Tài khoản của thành viên/người ghi theo đúng model. |
| `items[].openTaskCount` | integer | Có | ≥ 0; Số TODO/IN_PROGRESS đang được giao. |
| `items[].pendingReviewCount` | integer | Có | ≥ 0; Việc chờ nghiệm thu được tách riêng. |
| `items[].originalEstimateMinutes` | integer | Có | ≥ 0 |
| `items[].currentEstimateMinutes` | integer | Có | ≥ 0 |
| `items[].remainingMinutes` | integer / null | Có | Phút còn lại được nhập riêng; null là chưa cập nhật, không tự suy bằng phép trừ. |
| `items[].capacityMinutes` | integer / null | Có | Phút khả dụng cùng kỳ từ lịch hợp lệ; null nếu thiếu lịch. |
| `items[].utilizationRate` | number / null | Có | Phần trăm tải từ phút còn lại và khả dụng; null khi không đủ dữ liệu hoặc mẫu số không hợp lệ. |
| `items[].quality` | Analytics.QualityDTO | Có | Độ đủ dữ liệu, trường thiếu và giới hạn phạm vi. |
| `items[].person` | Shared.PersonRefDTO | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `items[].analysisRef` | Shared.AnalysisRefDTO | Có | Điểm mở S43; giữ đúng analysisId/snapshotId và phạm vi lọc từ BE. |

## Alerts.AlertPatchDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `status` | enum(READ, IN_PROGRESS, RESOLVED, DISMISSED) | Có | Trạng thái theo enum của đúng model; không dùng chung enum cho mọi phân hệ. |
| `resolutionNote` | string | Không | độ dài ≥ 1; độ dài ≤ 2000; Hướng xử lý/lý do; bắt buộc với trạng thái xử lý khác READ. |

## Alerts.AlertQueryDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `page` | integer | Không; có mặc định | ≥ 1; mặc định 1; Trang bắt đầu từ 1. |
| `pageSize` | integer | Không; có mặc định | ≥ 1; ≤ 100; mặc định 20; Số dòng mỗi trang, mặc định 20 và tối đa 100. |
| `q` | string | Không | độ dài ≤ 255; Từ khóa tìm kiếm, trim đầu/cuối. |
| `projectId` | string | Không | độ dài ≥ 1; độ dài ≤ 100; ID dự án; không đồng nghĩa ID service. |
| `status` | Alerts.AlertStatusDTO | Không | Trạng thái theo enum của đúng model; không dùng chung enum cho mọi phân hệ. |
| `severity` | enum(INFO, LOW, MEDIUM, HIGH, CRITICAL) | Không | Mức độ cảnh báo, khác trạng thái xử lý. |

## Alerts.AlertDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `id` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Định danh do BE sinh, không tự đổi. |
| `version` | integer | Có | > 0; Phiên bản đọc; gửi qua If-Match nếu contract yêu cầu. |
| `createdAt` | string · UTC ISO 8601 có Z | Có | Thời điểm tạo UTC. |
| `updatedAt` | string · UTC ISO 8601 có Z | Có | Thời điểm cập nhật UTC; không dùng thay thời điểm chuyển trạng thái. |
| `projectId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; ID dự án; không đồng nghĩa ID service. |
| `taskId` | string / null | Có | Công việc liên quan; phải đúng dự án và phạm vi. |
| `type` | enum(DEADLINE_RISK, OVERDUE, WORKLOAD, BOTTLENECK, DATA_QUALITY) | Có | Loại cảnh báo. |
| `severity` | enum(INFO, LOW, MEDIUM, HIGH, CRITICAL) | Có | Mức độ cảnh báo, khác trạng thái xử lý. |
| `status` | Alerts.AlertStatusDTO | Có | Trạng thái theo enum của đúng model; không dùng chung enum cho mọi phân hệ. |
| `conditionActive` | boolean | Có | Điều kiện nguồn còn tồn tại; không sửa bằng AlertPatch. |
| `evidence` | array<string> | Có | Căn cứ cho nhận định, không phải lệnh thực hiện. |
| `dataAsOf` | string · UTC ISO 8601 có Z | Có | Thời điểm số liệu nguồn, không trình bày dữ liệu cũ như mới. |
| `methodVersion` | string | Có | Phiên bản phương pháp để đối chiếu. |
| `resolutionNote` | string / null | Có | Hướng xử lý/lý do; bắt buộc với trạng thái xử lý khác READ. |
| `handledBy` | string / null | Có | Người xử lý từ phiên. |
| `handledAt` | string · UTC ISO 8601 có Z / null | Có | Thời điểm xử lý cảnh báo. |
| `taskTitle` | string / null | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `analysisRef` | Shared.AnalysisRefDTO / null | Có | Điểm mở S43; giữ đúng analysisId/snapshotId và phạm vi lọc từ BE. |

## Alerts.AlertStatusDTO

`enum(UNREAD, READ, IN_PROGRESS, RESOLVED, DISMISSED)`.

## Shared.PersonRefDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `id` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Định danh do BE sinh, không tự đổi. |
| `displayName` | string | Có | độ dài ≥ 1; độ dài ≤ 255; Họ tên hiển thị. |

## Shared.EntityLabelDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `id` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Định danh do BE sinh, không tự đổi. |
| `name` | string | Có | độ dài ≥ 1; độ dài ≤ 255; Tên hiển thị sau trim. |

## Shared.AnalysisSubjectDTO

Discriminated union theo `kind`; mỗi nhánh strict và không nhận field của nhánh khác.

### Nhánh TASK

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `kind` | "TASK" | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `taskId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Công việc liên quan; phải đúng dự án và phạm vi. |

### Nhánh PERSON

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `kind` | "PERSON" | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `userId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Tài khoản của thành viên/người ghi theo đúng model. |

### Nhánh PROJECT

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `kind` | "PROJECT" | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `projectId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; ID dự án; không đồng nghĩa ID service. |

### Nhánh PROCESS

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `kind` | "PROCESS" | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `projectId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; ID dự án; không đồng nghĩa ID service. |
| `stage` | enum(TODO, IN_PROGRESS, PENDING_REVIEW) | Có | Khâu tồn đọng. |

### Nhánh METRIC

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `kind` | "METRIC" | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `metricCode` | enum(K01, K02, K03, K04, K05, K06, K07, K08, K09, K10, K11, K12, K13, K14, K15, K16) | Có | Theo đúng kiểu và khả năng null đã ghi. |

### Nhánh UNIT

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `kind` | "UNIT" | Có | Phạm vi tổng hợp đơn vị, dùng cho SUMMARY nhiều dự án. |
| `unitId` | string | Có | ID đơn vị đã lọc quyền; các dự án thuộc scope được công bố rõ. |

## Shared.AnalysisRefDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `analysisId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; ID bản phân tích được BE cấp; không phải taskId hay prompt do FE tự tạo. |
| `snapshotId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; ID bộ thông số bất biến mà lời phân tích phải tham chiếu đúng. |
| `analysisType` | enum(RISK, WORKLOAD, BOTTLENECK, SUMMARY, METRIC) | Có | Loại nội dung phân tích; phân biệt với trạng thái job. |
| `subject` | Shared.AnalysisSubjectDTO | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `title` | string | Có | độ dài ≥ 1; độ dài ≤ 255; Tiêu đề hiển thị của nội dung phân tích, không bắt buộc là tên công việc. |
| `dataAsOf` | string · UTC ISO 8601 có Z | Có | Thời điểm số liệu nguồn, không trình bày dữ liệu cũ như mới. |
| `explanationStatus` | enum(NOT_REQUESTED, QUEUED, RUNNING, READY, FAILED, UNAVAILABLE) | Có | Theo đúng kiểu và khả năng null đã ghi. |

## Analytics.AnalysisMeasureDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `id` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Định danh do BE sinh, không tự đổi. |
| `code` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Mã chỉ số/KPI theo quy ước BE; không phải mã dự án. |
| `label` | string | Có | độ dài ≥ 1; độ dài ≤ 255 |
| `value` | number / null | Có | Giá trị đúng kiểu được khai báo; phần số do BE tính, null khi thiếu nguồn, không tự đổi thành 0. |
| `unit` | enum(TASK, COUNT, PERCENT, MINUTE, HOUR) | Có | Đơn vị đo của giá trị hoặc chuỗi số liệu; dùng nhãn Việt tương ứng, không phải đơn vị tổ chức. |
| `basis` | enum(CURRENT, PERIOD) | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `formula` | string | Có | độ dài ≥ 1; độ dài ≤ 2000; Diễn giải cách tính của BE; FE hiển thị/định dạng, không yêu cầu LLM tính lại. |
| `evidenceIds` | array<string> | Có | ID dữ liệu căn cứ phải tồn tại trong snapshot.evidence. |
| `missingFields` | array<string> | Có | Trường/nguồn thiếu; không tự thay bằng 0. |

## Shared.DomainActionDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `target` | enum(TASK_DETAIL, TASK_PLAN, TASK_ASSIGNMENT, SUBMISSION_REVIEW, REVIEW_QUEUE, REPORT_DETAIL) | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `taskId` | string / null | Có | Công việc liên quan; phải đúng dự án và phạm vi. |
| `submissionId` | string / null | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `reportId` | string / null | Có | Theo đúng kiểu và khả năng null đã ghi. |

## Analytics.EvidenceDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `id` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Định danh do BE sinh, không tự đổi. |
| `sourceType` | enum(TASK, TIME_LOG, SUBMISSION, REPORT, HISTORY, AGGREGATE) | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `sourceId` | string / null | Có | ID nguồn đã được lọc quyền; null nếu là số liệu tổng hợp không gắn một bản ghi. |
| `label` | string | Có | độ dài ≥ 1; độ dài ≤ 1000 |
| `observedAt` | string · UTC ISO 8601 có Z / null | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `action` | Shared.DomainActionDTO / null | Có | Điểm mở màn nghiệp vụ theo DomainAction; null khi không có điều hướng. Đây không phải lệnh tự động thay đổi dữ liệu. |

## Analytics.FindingDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `id` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Định danh do BE sinh, không tự đổi. |
| `title` | string | Có | độ dài ≥ 1; độ dài ≤ 255; Tiêu đề hiển thị của nội dung phân tích, không bắt buộc là tên công việc. |
| `text` | string | Có | độ dài ≥ 1; độ dài ≤ 3000 |
| `metricIds` | array<string> | Có | ID thông số phải tồn tại trong snapshot.metrics; không tham chiếu chỉ số bịa thêm. |
| `evidenceIds` | array<string> | Có | ID dữ liệu căn cứ phải tồn tại trong snapshot.evidence. |

## Analytics.RecommendationDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `id` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Định danh do BE sinh, không tự đổi. |
| `title` | string | Có | độ dài ≥ 1; độ dài ≤ 255; Tiêu đề hiển thị của nội dung phân tích, không bắt buộc là tên công việc. |
| `text` | string | Có | độ dài ≥ 1; độ dài ≤ 2000 |
| `priority` | enum(LOW, NORMAL, HIGH) | Có | Mức ưu tiên đề xuất LOW/NORMAL/HIGH; không thêm URGENT từ enum ưu tiên công việc. |
| `evidenceIds` | array<string> | Có | ID dữ liệu căn cứ phải tồn tại trong snapshot.evidence. |
| `action` | Shared.DomainActionDTO / null | Có | Điểm mở màn nghiệp vụ theo DomainAction; null khi không có điều hướng. Đây không phải lệnh tự động thay đổi dữ liệu. |

## Analytics.LlmExplanationDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `id` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Định danh do BE sinh, không tự đổi. |
| `analysisId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; ID bản phân tích được BE cấp; không phải taskId hay prompt do FE tự tạo. |
| `snapshotId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; ID bộ thông số bất biến mà lời phân tích phải tham chiếu đúng. |
| `locale` | enum(vi-VN) | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `generatedAt` | string · UTC ISO 8601 có Z | Có | Thời điểm tạo kết quả, tách khỏi dataAsOf. |
| `modelDisplayName` | string | Có | độ dài ≥ 1; độ dài ≤ 255; Tên hiển thị của LLM BE đang cấu hình; không chứa API key hoặc endpoint bí mật. |
| `promptVersion` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Phiên bản mẫu yêu cầu BE dùng, chỉ phục vụ truy vết; FE không gửi prompt tự do. |
| `summary` | string | Có | độ dài ≥ 1; độ dài ≤ 4000; Tóm tắt kết quả bắt buộc. |
| `findings` | array<Analytics.FindingDTO> | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `recommendations` | array<Analytics.RecommendationDTO> | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `limitations` | array<string> | Có | Theo đúng kiểu và khả năng null đã ghi. |

## Analytics.AnalysisErrorDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `code` | enum(LLM_NOT_CONFIGURED, PROVIDER_TIMEOUT, PROVIDER_RATE_LIMIT, PROVIDER_UNAVAILABLE, OUTPUT_INVALID, REFUSED, INSUFFICIENT_DATA) | Có | Mã lỗi chuẩn của adapter BE/LLM. |
| `message` | string | Có | độ dài ≥ 1; độ dài ≤ 1000 |
| `retryable` | boolean | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `retryAfterSeconds` | integer / null | Có | Theo đúng kiểu và khả năng null đã ghi. |

## Analytics.ExplanationStateDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `status` | enum(NOT_REQUESTED, QUEUED, RUNNING, READY, FAILED, UNAVAILABLE) | Có | Trạng thái theo enum của đúng model; không dùng chung enum cho mọi phân hệ. |
| `lastSuccess` | Analytics.LlmExplanationDTO / null | Có | Lời phân tích thành công của đúng snapshot; có thể giữ khi lượt phân tích lại lỗi. |
| `activeJobId` | string / null | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `error` | Analytics.AnalysisErrorDTO / null | Có | Theo đúng kiểu và khả năng null đã ghi. |

## Analytics.ContextItemDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `key` | string | Có | độ dài ≥ 1; độ dài ≤ 100 |
| `label` | string | Có | độ dài ≥ 1; độ dài ≤ 255 |
| `value` | string / null | Có | Giá trị bối cảnh dạng chuỗi hoặc null; TEXT là nội dung, UTC là thời điểm ISO có Z, DATE là YYYY-MM-DD. FE định dạng theo valueType. |
| `valueType` | enum(TEXT, UTC, DATE) | Có | Theo đúng kiểu và khả năng null đã ghi. |

## Analytics.AnalysisSeriesDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `id` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Định danh do BE sinh, không tự đổi. |
| `label` | string | Có | độ dài ≥ 1; độ dài ≤ 255 |
| `unit` | enum(TASK, COUNT, PERCENT, MINUTE, HOUR) | Có | Đơn vị đo của giá trị hoặc chuỗi số liệu; dùng nhãn Việt tương ứng, không phải đơn vị tổ chức. |
| `points` | array<object> | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `points[].date` | string · YYYY-MM-DD | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `points[].value` | number / null | Có | Giá trị đúng kiểu được khai báo; phần số do BE tính, null khi thiếu nguồn, không tự đổi thành 0. |

## Analytics.AnalysisSnapshotDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `id` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Định danh do BE sinh, không tự đổi. |
| `analysisId` | string | Có | độ dài ≥ 1; độ dài ≤ 100; ID bản phân tích được BE cấp; không phải taskId hay prompt do FE tự tạo. |
| `sourceRevision` | string | Có | độ dài ≥ 1; độ dài ≤ 255; Dấu phiên bản nguồn opaque để đối chiếu snapshot, không phải version của Task. |
| `analysisType` | enum(RISK, WORKLOAD, BOTTLENECK, SUMMARY, METRIC) | Có | Loại nội dung phân tích; phân biệt với trạng thái job. |
| `title` | string | Có | độ dài ≥ 1; độ dài ≤ 255; Tiêu đề hiển thị của nội dung phân tích, không bắt buộc là tên công việc. |
| `subject` | Shared.AnalysisSubjectDTO | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `scope` | Analytics.AnalyticsQueryDTO | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `dataAsOf` | string · UTC ISO 8601 có Z | Có | Thời điểm số liệu nguồn, không trình bày dữ liệu cũ như mới. |
| `createdAt` | string · UTC ISO 8601 có Z | Có | Thời điểm tạo UTC. |
| `expiresAt` | string · UTC ISO 8601 có Z | Có | Hạn lưu/đọc snapshot; sau thời điểm này BE có thể trả 410 SNAPSHOT_EXPIRED. |
| `calculationVersion` | string | Có | độ dài ≥ 1; độ dài ≤ 100 |
| `quality` | Analytics.QualityDTO | Có | Độ đủ dữ liệu, trường thiếu và giới hạn phạm vi. |
| `metrics` | array<Analytics.AnalysisMeasureDTO> | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `context` | array<Analytics.ContextItemDTO> | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `series` | array<Analytics.AnalysisSeriesDTO> | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `evidence` | array<Analytics.EvidenceDTO> | Có | Căn cứ cho nhận định, không phải lệnh thực hiện. |

## Analytics.FreshnessDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `status` | enum(CURRENT, OUTDATED) | Có | Trạng thái theo enum của đúng model; không dùng chung enum cho mọi phân hệ. |
| `checkedAt` | string · UTC ISO 8601 có Z | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `latestAnalysisId` | string / null | Có | Theo đúng kiểu và khả năng null đã ghi. |

## Analytics.GenerationPolicyDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `allowed` | boolean | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `blockedReason` | enum(SNAPSHOT_OUTDATED, INSUFFICIENT_DATA, LLM_NOT_CONFIGURED, ACTIVE_JOB, RATE_LIMITED) / null | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `retryAfterSeconds` | integer / null | Có | Theo đúng kiểu và khả năng null đã ghi. |

## Analytics.AnalysisDetailDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `snapshot` | Analytics.AnalysisSnapshotDTO | Có | Bộ thông số, bối cảnh và căn cứ bất biến của analysisId; luôn có khi GET chi tiết thành công, kể cả khi lời AI chưa sẵn sàng. |
| `freshness` | Analytics.FreshnessDTO | Có | Độ mới của snapshot so với nguồn hiện tại; không sửa snapshot khi nguồn thay đổi. |
| `explanation` | Analytics.ExplanationStateDTO | Có | Theo đúng kiểu và khả năng null đã ghi. |
| `generation` | Analytics.GenerationPolicyDTO | Có | BE cho biết được tạo lời phân tích hay đang bị chặn và nguyên nhân. |
| `systemSummary` | string | Có | Tổng hợp theo mẫu của chính snapshot, dài 1–4000; hiện độc lập với lời LLM và không gắn nhãn AI. |
| `feedback` | object | Có | Phản hồi của người xem đối với nhận định điểm nghẽn. |
| `feedback.latest` | Analytics.AnalysisFeedbackDTO / null | Có | Phản hồi mới nhất của chính người xem, đúng analysisId/snapshotId; lịch sử vẫn được BE giữ. |
| `feedback.canSubmit` | boolean | Có | BE cho biết người xem được phản hồi; chỉ BOTTLENECK, snapshot hiện hành và đủ quyền điều hành. |

## Analytics.HighlightDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `id` | string | Có | độ dài ≥ 1; độ dài ≤ 100; Định danh do BE sinh, không tự đổi. |
| `title` | string | Có | độ dài ≥ 1; độ dài ≤ 255; Tiêu đề hiển thị của nội dung phân tích, không bắt buộc là tên công việc. |
| `description` | string | Có | độ dài ≥ 1; độ dài ≤ 2000; Nội dung điểm đáng chú ý do read model BE tạo; không nullable và không gắn nhãn lời LLM. |
| `severity` | enum(INFO, MEDIUM, HIGH) | Có | Mức độ cảnh báo, khác trạng thái xử lý. |
| `analysisRef` | Shared.AnalysisRefDTO | Có | Điểm mở S43; giữ đúng analysisId/snapshotId và phạm vi lọc từ BE. |

## Analytics.AnalysisFeedbackCreateDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `verdict` | enum(CONFIRMED, REJECTED) | Có | Xác nhận hoặc bác bỏ nhận định điểm nghẽn; khác quyết định nghiệm thu công việc. |
| `comment` | string | Có | Trim, dài 1–2000; căn cứ của phản hồi. Không nhận ID người hoặc snapshot do FE tự khai báo. |

## Analytics.AnalysisFeedbackDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `id` | string | Có | ID phản hồi do BE cấp. |
| `analysisId` | string | Có | ID nhận định được phản hồi; khớp path. |
| `snapshotId` | string | Có | Snapshot của nhận định; BE suy ra từ analysisId. |
| `verdict` | enum(CONFIRMED, REJECTED) | Có | Giữ đúng ý kiến đã gửi. |
| `comment` | string | Có | Nội dung đã lưu, dài 1–2000. |
| `actorId` | string | Có | Người phản hồi từ phiên xác thực. |
| `actor` | Shared.PersonRefDTO | Có | Nhãn chỉ đọc; actor.id=actorId. |
| `createdAt` | UTC | Có | Thời điểm lưu phản hồi bất biến. |

## Analytics.ProjectRiskSummaryDTO

| Trường | Kiểu | Bắt buộc | Ràng buộc / ý nghĩa |
|---|---|---|---|
| `projectId` | string | Có | Dự án trong phạm vi. |
| `projectName` | string | Có | Nhãn dự án, dài 1–255. |
| `riskLevel` | enum(LOW, MEDIUM, HIGH, UNKNOWN) | Có | Kết quả tổng hợp theo quy tắc có giải thích; không là xác suất dự án trễ. |
| `overdueCount` | integer ≥0 | Có | Số việc đang quá hạn. |
| `atRiskCount` | integer ≥0 | Có | Số việc có tín hiệu nguy cơ trước hạn. |
| `insufficientDataCount` | integer ≥0 | Có | Số việc chưa đủ nguồn cho đánh giá. |
| `ruleIds` | string[] | Có | Các quy tắc tạo mức đánh giá. |
| `evidence` | string[] | Có | Căn cứ tổng hợp, không có số ngoài phạm vi. |
| `quality` | Analytics.QualityDTO | Có | Độ đầy đủ và giới hạn dữ liệu. |
| `analysisRef` | Shared.AnalysisRefDTO | Có | Ref RISK với subject PROJECT; mở S43 đúng snapshot tổng hợp. |

## Refinement bắt buộc ngoài kiểu trường

- Các nhãn chỉ đọc khớp ID: assignee.id=assigneeId, project.id=projectId, owner.id=ownerId, user.id=userId, submitter.id=submittedBy, reviewer.id=reviewedBy, author.id=authorId. Liên kết nullable cùng null. Handler mock dựng nhãn từ model ID; không sao chép nhãn thành nguồn ghi dữ liệu.
- AnalysisRef.analysisId=detail.snapshot.analysisId; AnalysisRef.snapshotId=detail.snapshot.id. LlmExplanation.analysisId/snapshotId phải khớp snapshot. Từng finding.metricIds/evidenceIds và recommendation.evidenceIds chỉ trỏ vào tập của snapshot đó.
- Các metric ID, evidence ID, finding ID không trùng trong phạm vi snapshot/kết quả; mọi giá trị số phải finite. value=null không hiển thị 0. Rate phần trăm cần miền đúng công thức; utilization có thể >100, completion trong 0–100.
- Explanation READY bắt buộc lastSuccess; QUEUED/RUNNING bắt buộc activeJobId. FAILED có error; có thể giữ lastSuccess của cùng snapshot khi lượt phân tích lại lỗi. NOT_REQUESTED không có job đang chạy/kết quả; UNAVAILABLE có nguyên nhân rõ.
- Job QUEUED/RUNNING: completedAt/result/error=null và pollAfterMs 2.000–10.000. SUCCEEDED: result hợp lệ, error=null, completedAt có giá trị, pollAfterMs=0. FAILED: result=null, error có giá trị, completedAt có giá trị, pollAfterMs=0.
- Snapshot CURRENT có latestAnalysisId=null hoặc chính analysisId; OUTDATED có latestAnalysisId hợp lệ khác analysisId nếu bản mới sẵn sàng. Nguồn thay đổi không sửa metrics/evidence của snapshot cũ.
- generation.allowed=false phải có blockedReason. allowed=true thì blockedReason=null. Tạo job còn phải được BE kiểm tra lại quyền và độ mới ngay trước khi nhận.
- Subject của RISK là TASK hoặc PROJECT; WORKLOAD là PERSON hoặc PROJECT; BOTTLENECK là TASK hoặc PROCESS; SUMMARY là PROJECT hoặc UNIT; METRIC là METRIC. Subject phải nằm trong scope đã lọc quyền.
- DomainAction target SUBMISSION_REVIEW cần taskId+submissionId; TASK_* cần taskId; REPORT_DETAIL cần reportId; REVIEW_QUEUE không cần entity ID. FE tự map enum sang route đã cho phép, không điều hướng theo URL do LLM viết.
- JSON schema/structured output chỉ xác minh cấu trúc. BE còn kiểm tra tham chiếu, số liệu và nội dung bất nhất với snapshot; không xem schema hợp lệ là bằng chứng mọi lời nhận định đều đúng.

- Feedback nhận định không đổi Task.status, Alert.status hoặc riskLevel; không tạo LLM job. Mỗi lần gửi mới lưu một bản phản hồi, retry cùng Idempotency-Key không tạo thêm bản.
- Phạm vi có teamId là nhóm hiện tại, không giả dựng cơ cấu nhân sự lịch sử.

## DTO cho lookup bộ lọc phân tích

listAnalyticsFilterOptions trả PageDTO<Shared.EntityLabelDTO>. Với kind=PERSON, name là tên hiển thị; không trả UserDTO, email hoặc vai trò quản trị. Query gồm kind UNIT/PROJECT/TEAM/PERSON bắt buộc; q (tối đa 255), unitId, projectId, teamId, page (mặc định 1) và pageSize (mặc định 20, tối đa 100) tùy chọn. Request strict; BE giới hạn quyền và quan hệ giữa các filter. Đây là response tổng hợp bằng kiểu dùng chung, không thêm schema gốc thứ 94.

## DTO hồ sơ thành viên và mốc công việc theo yêu cầu mới

ProfileDto của GET /users/:userId/profile là object phẳng gồm id/displayName/avatarUrl nullable/unit (tên đơn vị)/systemRole/email, chỉ phục vụ card nhận diện và liên hệ của người đã đăng nhập. Không có thống kê, dự án hoặc phân trang; không dùng UserDTO quản trị để trả thừa field.

Schema TaskDto hiện hành trả createdAt và firstStartedAt đã có trong model để hiển thị chi tiết công việc. firstStartedAt=null khi chưa bắt đầu, giữ mốc lần đầu khi tạm dừng/tiếp tục/bàn giao. TaskRow trả thêm firstStartedAt cho cột Ngày bắt đầu, không trả createdAt. Payload không nhận các mốc này; updatedAt/statusChangedAt/completedAt tiếp tục là dữ liệu nội bộ khi chưa có chỗ hiển thị.
