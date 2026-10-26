# Rà soát và refactor từng luồng

## Điều chỉnh role ngày 26/10/2026

Bỏ quyền cấp lẻ, chuyển sang role/phạm vi dự án và gom fallback user ID vào query keys. S13 là dialog Đổi vai trò trong danh sách thành viên. Chi tiết chính sách và dữ liệu tại [ARCHITECTURE.md](ARCHITECTURE.md#điều-chỉnh-role-ngày-26102026).

Ngày 25/10/2026. Đối chiếu cách viết form, schema, hook và service trong vietcd/frontend; giữ nghiệp vụ và các cơ chế cần thiết của DATN.

Phạm vi gồm 12 feature, 82 hàm service và 83 HTTP route (thêm tài nguyên ảnh đại diện do trình duyệt tải từ URL). Bảng bên dưới ghi từng hàm và điểm gọi trong ứng dụng; không có service chỉ được khai báo mà chưa có nơi dùng.

## Quy tắc sau refactor

Cập nhật quyền mở trang: bỏ hasPermission/PermissionGate. [access.ts](../src/lib/auth/access.ts) ánh xạ role sang route một lần cho WorkspaceShell và sidebar. Query không kiểm tra quyền view; canManage xét MANAGER và tư cách OWNER/MANAGER theo projectId. Backend tiếp tục lọc dữ liệu và từ chối thao tác ngoài phạm vi. Bỏ systemPermissions khỏi Session DTO; 403/410 dọn dữ liệu cũ và giữ query lỗi để tránh tải lại vô hạn.

- UI khai báo useForm có kiểu và zodResolver, viết FormInput/FormSelect/FormTextarea/Controller trực tiếp. Form dùng chung chỉ quản lý hiển thị, pending, lỗi HTTP, dirty và đối chiếu; không dựng field từ metadata. ReasonForm là biểu mẫu một trường dùng lại cho các thao tác bắt buộc có lý do.
- Schema kiểm tra giá trị một lần tại form. Chuyển giờ Việt Nam sang UTC trong schema của form; ô số dùng RHF. Payload cập nhật lấy changedFields có kiểu từ giá trị đã hợp lệ, không parse lại patch. Schema cập nhật tái sử dụng whitelist của schema tạo, bổ sung lý do theo thao tác. Form tạo/sửa chọn schema và default riêng; không giữ hoặc kiểm tra lại trường ẩn bất biến, mật khẩu khởi tạo hay danh sách thành viên ở nhánh không dùng.
- Hook danh sách chuẩn hóa filter một lần bằng safeParse(...).data ?? query rồi dùng cùng kết quả cho key và request. Filter sai được gửi đến API để trả lỗi; không tắt query rồi để màn hình chờ mãi. ID phụ thuộc chưa có vẫn tắt query. Analytics dùng scope đã kiểm tra từ URL.
- Hook mutation khai báo service và invalidation rõ ràng. useIdempotentRequest giữ khóa khi thất bại, đổi khóa khi nội dung thay đổi và kết thúc lần gửi sau thành công. Không khai báo lại retry:false vì Providers đã cấu hình.
- Service ghi rõ method, URL, path ID, params/body và kiểu response. Không lặp interface chữ ký trong *.contract.ts, không parse input hoặc đọc mock. Options chỉ giữ ở nơi có dùng.
- api-client.ts và http-error.ts giữ base URL, bearer, refresh dùng chung, hủy request, version, idempotency, kiểm tra response và lỗi. MSW chặn HTTP; handler kiểm tra request ở biên server độc lập rồi giao nghiệp vụ cho DB tạm.
- Query cache tách theo người xem; giữ xử lý mất quyền và thu hồi cache. Password/file dùng ticket để payload nhạy cảm không nằm trong mutation variables. Những cơ chế này có trách nhiệm cụ thể, không bỏ chỉ để giảm số dòng.
- Giữ form khi refetch hoặc 412. Chỉ cập nhật version nền sau khi người dùng đối chiếu; đóng/bỏ sửa rồi mở lại lấy giá trị hiện tại. Avatar tiếp tục là luồng cắt và upload riêng.

## Các tệp dùng chung

| Trách nhiệm                   | Tệp                                                                                            |
| ----------------------------- | ---------------------------------------------------------------------------------------------- |
| Khung biểu mẫu                | [form.tsx](../src/components/forms/form.tsx)                                                   |
| Các control biểu mẫu          | [form-field.tsx](../src/components/forms/form-field.tsx)                                       |
| Biểu mẫu lý do                | [reason-form.tsx](../src/components/forms/reason-form.tsx)                                     |
| Lỗi và đối chiếu              | [form-error.tsx](../src/components/forms/form-error.tsx)                                       |
| Snapshot đang chỉnh sửa       | [use-edit-snapshot.ts](../src/lib/forms/use-edit-snapshot.ts)                                  |
| Chống gửi lặp                 | [use-idempotent-request.ts](../src/lib/query/use-idempotent-request.ts)                        |
| Thu hồi dữ liệu khi mất quyền | [use-query-access.ts](../src/lib/query/use-query-access.ts)                                    |
| HTTP                          | [api-client.ts](../src/services/api-client.ts), [http-error.ts](../src/services/http-error.ts) |

## Từng nhóm chức năng

Xác nhận cuối: typecheck, lint, build và 152/152 tests ở 9 file đạt; các service/handler khớp 83 HTTP route. Kiểm thử form/điều hướng chạy trong JSDOM và gọi HTTP/MSW; chưa nghiệm thu bố cục trực tiếp trên trình duyệt hoặc backend thật.

### Cảnh báo (alerts)

alerts-page → alert-detail-page → alert-form

Danh sách/phân trang, bằng chứng, trạng thái xử lý và ghi chú. Form yêu cầu ghi chú theo quyết định; version thuộc Alert, không tự sửa công việc.

| Service                                                     | HTTP                         | Hook / nơi điều phối                                                           |
| ----------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------ |
| [listAlerts](../src/features/alerts/api/alerts.service.ts)  | `GET /api/alerts`            | [useListAlertsQuery](../src/features/alerts/hooks/use-alerts-queries.ts)       |
| [getAlert](../src/features/alerts/api/alerts.service.ts)    | `GET /api/alerts/:alertId`   | [useGetAlertQuery](../src/features/alerts/hooks/use-alerts-queries.ts)         |
| [updateAlert](../src/features/alerts/api/alerts.service.ts) | `PATCH /api/alerts/:alertId` | [useUpdateAlertMutation](../src/features/alerts/hooks/use-alerts-mutations.ts) |

### Dashboard và phân tích AI (analytics)

dashboard-page, risks-page, workload-page, bottlenecks-page, analysis-summary-page, analysis-detail-page, analysis-job-page, analysis-feedback-panel

Giữ scope URL, quyền theo dự án/toàn hệ thống, nguồn dữ liệu và snapshot. Poll job dừng khi kết thúc/lỗi quyền và tạm dừng sau giới hạn; phản hồi không thay đổi công việc.

| Service                                                                          | HTTP                                               | Hook / nơi điều phối                                                                            |
| -------------------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| [getDashboard](../src/features/analytics/api/analytics.service.ts)               | `GET /api/dashboard`                               | [useGetDashboardQuery](../src/features/analytics/hooks/use-analytics-queries.ts)                |
| [getDeadlineRisks](../src/features/analytics/api/analytics.service.ts)           | `GET /api/analytics/risks`                         | [useGetDeadlineRisksQuery](../src/features/analytics/hooks/use-analytics-queries.ts)            |
| [getWorkload](../src/features/analytics/api/analytics.service.ts)                | `GET /api/analytics/workload`                      | [useGetWorkloadQuery](../src/features/analytics/hooks/use-analytics-queries.ts)                 |
| [getBottlenecks](../src/features/analytics/api/analytics.service.ts)             | `GET /api/analytics/bottlenecks`                   | [useGetBottlenecksQuery](../src/features/analytics/hooks/use-analytics-queries.ts)              |
| [getAnalysisSummary](../src/features/analytics/api/analytics.service.ts)         | `GET /api/analytics/summary`                       | [useGetAnalysisSummaryQuery](../src/features/analytics/hooks/use-analytics-queries.ts)          |
| [createAnalysisJob](../src/features/analytics/api/analytics.service.ts)          | `POST /api/analytics/jobs`                         | [useCreateAnalysisJobMutation](../src/features/analytics/hooks/use-analytics-mutations.ts)      |
| [getAnalysisJob](../src/features/analytics/api/analytics.service.ts)             | `GET /api/analytics/jobs/:jobId`                   | [useGetAnalysisJobQuery](../src/features/analytics/hooks/use-analytics-queries.ts)              |
| [getAnalysisDetail](../src/features/analytics/api/analytics.service.ts)          | `GET /api/analytics/details/:analysisId`           | [useGetAnalysisDetailQuery](../src/features/analytics/hooks/use-analytics-queries.ts)           |
| [createAnalysisFeedback](../src/features/analytics/api/analytics.service.ts)     | `POST /api/analytics/details/:analysisId/feedback` | [useCreateAnalysisFeedbackMutation](../src/features/analytics/hooks/use-analytics-mutations.ts) |
| [listAnalyticsFilterOptions](../src/features/analytics/api/analytics.service.ts) | `GET /api/analytics/filter-options`                | [useListAnalyticsFilterOptionsQuery](../src/features/analytics/hooks/use-analytics-queries.ts)  |

### Tệp minh chứng (attachments)

EvidenceUploader, EvidenceFile và useDownloadAttachment

Đọc policy từ HTTP, upload multipart, chỉ chọn tệp READY. Download chủ động khi bấm, kiểm tra binary/header, giải phóng object URL; file không được đưa vào Query cache.

| Service                                                                      | HTTP                                         | Hook / nơi điều phối                                                                          |
| ---------------------------------------------------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------- |
| [getUploadPolicy](../src/features/attachments/api/attachments.service.ts)    | `GET /api/attachments/policy`                | [useGetUploadPolicyQuery](../src/features/attachments/hooks/use-attachments-queries.ts)       |
| [uploadAttachment](../src/features/attachments/api/attachments.service.ts)   | `POST /api/attachments`                      | [useUploadAttachmentMutation](../src/features/attachments/hooks/use-attachments-mutations.ts) |
| [getAttachment](../src/features/attachments/api/attachments.service.ts)      | `GET /api/attachments/:attachmentId`         | [useGetAttachmentQuery](../src/features/attachments/hooks/use-attachments-queries.ts)         |
| [downloadAttachment](../src/features/attachments/api/attachments.service.ts) | `GET /api/attachments/:attachmentId/content` | [download](../src/features/attachments/hooks/use-download-attachment.ts)                      |

### Phiên và hồ sơ cá nhân (auth)

login-page, AuthObserver, profile-page, avatar-editor/avatar-crop-dialog, change-password-form

AuthObserver là nơi duy nhất điều phối phiên, refresh và đăng xuất. Form thông tin/mật khẩu có kiểu; xác nhận mật khẩu chỉ ở FE. Avatar kéo/zoom/cắt rồi upload riêng, không tham gia dirty guard.

| Service                                                    | HTTP                        | Hook / nơi điều phối                                                          |
| ---------------------------------------------------------- | --------------------------- | ----------------------------------------------------------------------------- |
| [login](../src/features/auth/api/auth.service.ts)          | `POST /api/auth/login`      | [useLoginMutation](../src/features/auth/hooks/use-auth-mutations.ts)          |
| [logout](../src/features/auth/api/auth.service.ts)         | `POST /api/auth/logout`     | [AuthObserver](../src/features/auth/components/auth-observer.tsx)             |
| [refreshSession](../src/features/auth/api/auth.service.ts) | `POST /api/auth/refresh`    | [AuthObserver](../src/features/auth/components/auth-observer.tsx)             |
| [getSession](../src/features/auth/api/auth.service.ts)     | `GET /api/auth/me`          | [AuthObserver](../src/features/auth/components/auth-observer.tsx)             |
| [updateProfile](../src/features/auth/api/auth.service.ts)  | `PATCH /api/auth/me`        | [useUpdateProfileMutation](../src/features/auth/hooks/use-auth-mutations.ts)  |
| [changePassword](../src/features/auth/api/auth.service.ts) | `PUT /api/auth/me/password` | [useChangePasswordMutation](../src/features/auth/hooks/use-auth-mutations.ts) |

### Đơn vị và nhóm nhân sự (organization)

organization-page/unit-editor-page/unit-form, teams-page/team-editor-page/team-form/team-members-form

Danh sách → chi tiết → mở thao tác. Tạo/sửa/ngừng sử dụng độc lập; member select có tìm kiếm và lọc theo đơn vị. Version lấy từ đúng Unit/Team; bỏ sửa rồi mở lại không giữ draft đã hủy.

| Service                                                                        | HTTP                                 | Hook / nơi điều phối                                                                              |
| ------------------------------------------------------------------------------ | ------------------------------------ | ------------------------------------------------------------------------------------------------- |
| [listUnits](../src/features/organization/api/organization.service.ts)          | `GET /api/units`                     | [useListUnitsQuery](../src/features/organization/hooks/use-organization-queries.ts)               |
| [getUnit](../src/features/organization/api/organization.service.ts)            | `GET /api/units/:unitId`             | [useGetUnitQuery](../src/features/organization/hooks/use-organization-queries.ts)                 |
| [createUnit](../src/features/organization/api/organization.service.ts)         | `POST /api/units`                    | [useCreateUnitMutation](../src/features/organization/hooks/use-organization-mutations.ts)         |
| [updateUnit](../src/features/organization/api/organization.service.ts)         | `PATCH /api/units/:unitId`           | [useUpdateUnitMutation](../src/features/organization/hooks/use-organization-mutations.ts)         |
| [deactivateUnit](../src/features/organization/api/organization.service.ts)     | `POST /api/units/:unitId/deactivate` | [useDeactivateUnitMutation](../src/features/organization/hooks/use-organization-mutations.ts)     |
| [listTeams](../src/features/organization/api/organization.service.ts)          | `GET /api/teams`                     | [useListTeamsQuery](../src/features/organization/hooks/use-organization-queries.ts)               |
| [getTeam](../src/features/organization/api/organization.service.ts)            | `GET /api/teams/:teamId`             | [useGetTeamQuery](../src/features/organization/hooks/use-organization-queries.ts)                 |
| [createTeam](../src/features/organization/api/organization.service.ts)         | `POST /api/teams`                    | [useCreateTeamMutation](../src/features/organization/hooks/use-organization-mutations.ts)         |
| [updateTeam](../src/features/organization/api/organization.service.ts)         | `PATCH /api/teams/:teamId`           | [useUpdateTeamMutation](../src/features/organization/hooks/use-organization-mutations.ts)         |
| [replaceTeamMembers](../src/features/organization/api/organization.service.ts) | `PUT /api/teams/:teamId/members`     | [useReplaceTeamMembersMutation](../src/features/organization/hooks/use-organization-mutations.ts) |
| [deactivateTeam](../src/features/organization/api/organization.service.ts)     | `POST /api/teams/:teamId/deactivate` | [useDeactivateTeamMutation](../src/features/organization/hooks/use-organization-mutations.ts)     |

### Thành viên và quyền dự án (project-members)

project-members-page, member-role-form (dialog Đổi vai trò)

Thêm thành viên, đổi vai trò và kết thúc tư cách qua HTTP. MANAGER trong dự án yêu cầu role hệ thống Leader/PM; người phụ trách không bị sửa bằng form thành viên. Giữ hạn chế nguồn tra cứu ứng viên theo đặc tả hiện tại.

| Service                                                                                          | HTTP                                                      | Hook / nơi điều phối                                                                                                |
| ------------------------------------------------------------------------------------------------ | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| [listProjectMembers](../src/features/project-members/api/project-members.service.ts)             | `GET /api/projects/:projectId/members`                    | [useListProjectMembersQuery](../src/features/project-members/hooks/use-project-members-queries.ts)                  |
| [addProjectMember](../src/features/project-members/api/project-members.service.ts)               | `POST /api/projects/:projectId/members`                   | [useAddProjectMemberMutation](../src/features/project-members/hooks/use-project-members-mutations.ts)               |
| [updateProjectMemberRole](../src/features/project-members/api/project-members.service.ts) | `PATCH /api/projects/:projectId/members/:membershipId`    | [useUpdateProjectMemberRoleMutation](../src/features/project-members/hooks/use-project-members-mutations.ts) |
| [endProjectMembership](../src/features/project-members/api/project-members.service.ts)           | `POST /api/projects/:projectId/members/:membershipId/end` | [useEndProjectMembershipMutation](../src/features/project-members/hooks/use-project-members-mutations.ts)           |

### Dự án (projects)

projects-page, project-editor-page/project-form, project-shell/project-close-dialog, project-detail-page

Tạo kế hoạch, sửa patch, triển khai, kiểm tra đóng, hoàn thành/hủy và lịch sử. Code/đơn vị không nằm trong patch sửa; deadline nhập theo giờ Việt Nam và gửi UTC. Đóng vẫn kiểm tra điều kiện trên server.

| Service                                                                     | HTTP                                          | Hook / nơi điều phối                                                                      |
| --------------------------------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------- |
| [listProjects](../src/features/projects/api/projects.service.ts)            | `GET /api/projects`                           | [useListProjectsQuery](../src/features/projects/hooks/use-projects-queries.ts)            |
| [getProject](../src/features/projects/api/projects.service.ts)              | `GET /api/projects/:projectId`                | [useGetProjectQuery](../src/features/projects/hooks/use-projects-queries.ts)              |
| [createProject](../src/features/projects/api/projects.service.ts)           | `POST /api/projects`                          | [useCreateProjectMutation](../src/features/projects/hooks/use-projects-mutations.ts)      |
| [updateProject](../src/features/projects/api/projects.service.ts)           | `PATCH /api/projects/:projectId`              | [useUpdateProjectMutation](../src/features/projects/hooks/use-projects-mutations.ts)      |
| [activateProject](../src/features/projects/api/projects.service.ts)         | `POST /api/projects/:projectId/activate`      | [useActivateProjectMutation](../src/features/projects/hooks/use-projects-mutations.ts)    |
| [getProjectClosureChecks](../src/features/projects/api/projects.service.ts) | `GET /api/projects/:projectId/closure-checks` | [useGetProjectClosureChecksQuery](../src/features/projects/hooks/use-projects-queries.ts) |
| [completeProject](../src/features/projects/api/projects.service.ts)         | `POST /api/projects/:projectId/complete`      | [useCompleteProjectMutation](../src/features/projects/hooks/use-projects-mutations.ts)    |
| [cancelProject](../src/features/projects/api/projects.service.ts)           | `POST /api/projects/:projectId/cancel`        | [useCancelProjectMutation](../src/features/projects/hooks/use-projects-mutations.ts)      |
| [listProjectHistory](../src/features/projects/api/projects.service.ts)      | `GET /api/projects/:projectId/history`        | [useListProjectHistoryQuery](../src/features/projects/hooks/use-projects-queries.ts)      |

### Báo cáo (reports)

reports-page, new-report-page, report-page/report-editor, report-numbers

Chọn kỳ → preview → nháp → lưu/gửi. Giữ draft và đối chiếu; không parse lại patch đã có kiểu. Refresh chỉ trả preview, không thay version/nội dung nháp. Snapshot được chốt khi gửi tại DB.

| Service                                                              | HTTP                                  | Hook / nơi điều phối                                                                    |
| -------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------- |
| [listReports](../src/features/reports/api/reports.service.ts)        | `GET /api/reports`                    | [useListReportsQuery](../src/features/reports/hooks/use-reports-queries.ts)             |
| [getReportPreview](../src/features/reports/api/reports.service.ts)   | `GET /api/report-previews`            | [useGetReportPreviewQuery](../src/features/reports/hooks/use-reports-queries.ts)        |
| [getReport](../src/features/reports/api/reports.service.ts)          | `GET /api/reports/:reportId`          | [useGetReportQuery](../src/features/reports/hooks/use-reports-queries.ts)               |
| [createReportDraft](../src/features/reports/api/reports.service.ts)  | `POST /api/reports`                   | [useCreateReportDraftMutation](../src/features/reports/hooks/use-reports-mutations.ts)  |
| [updateReportDraft](../src/features/reports/api/reports.service.ts)  | `PATCH /api/reports/:reportId`        | [useUpdateReportDraftMutation](../src/features/reports/hooks/use-reports-mutations.ts)  |
| [refreshReportDraft](../src/features/reports/api/reports.service.ts) | `POST /api/reports/:reportId/refresh` | [useRefreshReportDraftMutation](../src/features/reports/hooks/use-reports-mutations.ts) |
| [submitReport](../src/features/reports/api/reports.service.ts)       | `POST /api/reports/:reportId/submit`  | [useSubmitReportMutation](../src/features/reports/hooks/use-reports-mutations.ts)       |

### Nộp kết quả và nghiệm thu (submissions)

submit-result-dialog, submissions-page, submission-detail-page, reviews-page/review-form

Summary, links và attachmentIds cùng state của form, kiểm tra một lần. Nộp kết quả dùng version Task; nghiệm thu dùng version Submission theo catalog và mock DB. Chỉ quản lý đúng phạm vi, khác người nộp và đúng lần nộp mới xét; chấp nhận/yêu cầu sửa có field riêng. Nghiệm thu có snapshot và đối chiếu 412.

| Service                                                                             | HTTP                                                                 | Hook / nơi điều phối                                                                                   |
| ----------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| [listSubmissions](../src/features/submissions/api/submissions.service.ts)           | `GET /api/tasks/:taskId/submissions`                                 | [useListSubmissionsQuery](../src/features/submissions/hooks/use-submissions-queries.ts)                |
| [getSubmission](../src/features/submissions/api/submissions.service.ts)             | `GET /api/tasks/:taskId/submissions/:submissionId`                   | [useGetSubmissionQuery](../src/features/submissions/hooks/use-submissions-queries.ts)                  |
| [createSubmission](../src/features/submissions/api/submissions.service.ts)          | `POST /api/tasks/:taskId/submissions`                                | [useCreateSubmissionMutation](../src/features/submissions/hooks/use-submissions-mutations.ts)          |
| [approveSubmission](../src/features/submissions/api/submissions.service.ts)         | `POST /api/tasks/:taskId/submissions/:submissionId/approve`          | [useApproveSubmissionMutation](../src/features/submissions/hooks/use-submissions-mutations.ts)         |
| [requestSubmissionRevision](../src/features/submissions/api/submissions.service.ts) | `POST /api/tasks/:taskId/submissions/:submissionId/request-revision` | [useRequestSubmissionRevisionMutation](../src/features/submissions/hooks/use-submissions-mutations.ts) |
| [listReviewQueue](../src/features/submissions/api/submissions.service.ts)           | `GET /api/review-queue`                                              | [useListReviewQueueQuery](../src/features/submissions/hooks/use-submissions-queries.ts)                |

### Công việc (tasks)

task-list-page, task-editor-page/task-form, task-shell/task-commands, task-detail-page, task-history-page

Danh sách/bảng, tạo/sửa, phân công/bàn giao, bắt đầu/tạm dừng/hủy, cập nhật còn lại và lịch sử. Giữ firstStartedAt lần đầu; quá hạn là cờ lọc. Payload chỉ có trường thay đổi và lý do khi cần.

| Service                                                               | HTTP                                          | Hook / nơi điều phối                                                                     |
| --------------------------------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------- |
| [listTasks](../src/features/tasks/api/tasks.service.ts)               | `GET /api/tasks`                              | [useListTasksQuery](../src/features/tasks/hooks/use-tasks-queries.ts)                    |
| [getTask](../src/features/tasks/api/tasks.service.ts)                 | `GET /api/tasks/:taskId`                      | [useGetTaskQuery](../src/features/tasks/hooks/use-tasks-queries.ts)                      |
| [createTask](../src/features/tasks/api/tasks.service.ts)              | `POST /api/projects/:projectId/tasks`         | [useCreateTaskMutation](../src/features/tasks/hooks/use-tasks-mutations.ts)              |
| [updateTask](../src/features/tasks/api/tasks.service.ts)              | `PATCH /api/tasks/:taskId`                    | [useUpdateTaskMutation](../src/features/tasks/hooks/use-tasks-mutations.ts)              |
| [assignTask](../src/features/tasks/api/tasks.service.ts)              | `POST /api/tasks/:taskId/assignments`         | [useAssignTaskMutation](../src/features/tasks/hooks/use-tasks-mutations.ts)              |
| [startTask](../src/features/tasks/api/tasks.service.ts)               | `POST /api/tasks/:taskId/start`               | [useStartTaskMutation](../src/features/tasks/hooks/use-tasks-mutations.ts)               |
| [pauseTask](../src/features/tasks/api/tasks.service.ts)               | `POST /api/tasks/:taskId/pause`               | [usePauseTaskMutation](../src/features/tasks/hooks/use-tasks-mutations.ts)               |
| [cancelTask](../src/features/tasks/api/tasks.service.ts)              | `POST /api/tasks/:taskId/cancel`              | [useCancelTaskMutation](../src/features/tasks/hooks/use-tasks-mutations.ts)              |
| [updateRemainingEstimate](../src/features/tasks/api/tasks.service.ts) | `PATCH /api/tasks/:taskId/remaining-estimate` | [useUpdateRemainingEstimateMutation](../src/features/tasks/hooks/use-tasks-mutations.ts) |
| [listTaskHistory](../src/features/tasks/api/tasks.service.ts)         | `GET /api/tasks/:taskId/history`              | [useListTaskHistoryQuery](../src/features/tasks/hooks/use-tasks-queries.ts)              |

### Giờ công (time-logs)

time-logs-page, time-log-dialog/LogEditor

Tạo dùng version Task; sửa/VOID dùng version TimeLog. Ngày làm việc giữ YYYY-MM-DD Việt Nam. Không suy giờ công từ trạng thái; VOID có lý do và giữ lịch sử.

| Service                                                             | HTTP                                  | Hook / nơi điều phối                                                                   |
| ------------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------- |
| [listTimeLogs](../src/features/time-logs/api/time-logs.service.ts)  | `GET /api/tasks/:taskId/time-logs`    | [useListTimeLogsQuery](../src/features/time-logs/hooks/use-time-logs-queries.ts)       |
| [createTimeLog](../src/features/time-logs/api/time-logs.service.ts) | `POST /api/tasks/:taskId/time-logs`   | [useCreateTimeLogMutation](../src/features/time-logs/hooks/use-time-logs-mutations.ts) |
| [updateTimeLog](../src/features/time-logs/api/time-logs.service.ts) | `PATCH /api/time-logs/:timeLogId`     | [useUpdateTimeLogMutation](../src/features/time-logs/hooks/use-time-logs-mutations.ts) |
| [voidTimeLog](../src/features/time-logs/api/time-logs.service.ts)   | `POST /api/time-logs/:timeLogId/void` | [useVoidTimeLogMutation](../src/features/time-logs/hooks/use-time-logs-mutations.ts)   |

### Tài khoản và hồ sơ thành viên (users)

users-page, user-editor-page/user-profile-form, user-commands, member-profile-page

Danh sách/chi tiết/tạo/sửa, khóa/mở khóa, cấp lại mật khẩu và hồ sơ nội bộ. Hồ sơ công khai chỉ có nhận diện/email. Phân biệt email quản trị với email chỉ đọc của /profile; credential không vào cache.

| Service                                                         | HTTP                                     | Hook / nơi điều phối                                                               |
| --------------------------------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------- |
| [listUsers](../src/features/users/api/users.service.ts)         | `GET /api/users`                         | [useListUsersQuery](../src/features/users/hooks/use-users-queries.ts)              |
| [getUser](../src/features/users/api/users.service.ts)           | `GET /api/users/:userId`                 | [useGetUserQuery](../src/features/users/hooks/use-users-queries.ts)                |
| [getProfile](../src/features/users/api/users.service.ts)        | `GET /api/users/:userId/profile`         | [useGetProfileQuery](../src/features/users/hooks/use-users-queries.ts)             |
| [createUser](../src/features/users/api/users.service.ts)        | `POST /api/users`                        | [useCreateUserMutation](../src/features/users/hooks/use-users-mutations.ts)        |
| [updateUser](../src/features/users/api/users.service.ts)        | `PATCH /api/users/:userId`               | [useUpdateUserMutation](../src/features/users/hooks/use-users-mutations.ts)        |
| [lockUser](../src/features/users/api/users.service.ts)          | `POST /api/users/:userId/lock`           | [useLockUserMutation](../src/features/users/hooks/use-users-mutations.ts)          |
| [unlockUser](../src/features/users/api/users.service.ts)        | `POST /api/users/:userId/unlock`         | [useUnlockUserMutation](../src/features/users/hooks/use-users-mutations.ts)        |
| [resetUserPassword](../src/features/users/api/users.service.ts) | `POST /api/users/:userId/reset-password` | [useResetUserPasswordMutation](../src/features/users/hooks/use-users-mutations.ts) |

## Rà lại UI, luồng và tham số — 26/10/2026

Đã quét 12 feature/82 service, đối chiếu 83 HTTP route, các hook query/mutation, form, bảng và dialog với AGENTS.md và UI_REVIEW.md. Kiểm tra cấu trúc bằng TypeScript AST, đọc các nhánh xử lý và chạy tích hợp qua HTTP/MSW; đây chưa phải kiểm tra kích thước CSS trên trình duyệt.

| Nhóm | Vi phạm phát hiện | Cách sửa |
| --- | --- | --- |
| Quản trị tài khoản | Khóa/mở khóa/cấp mật khẩu lấy version trực tiếp từ props cập nhật nền; thiếu đối chiếu 412 | Chốt snapshot khi mở thao tác; giữ draft/version cho đến khi chấp nhận bản mới, không đưa mật khẩu vào dữ liệu đối chiếu |
| Đơn vị, nhóm và thành viên | Form ngừng sử dụng/kết thúc tư cách thiếu tải lại sau 412 | Dùng snapshot của đúng Unit/Team/Membership, giữ lý do và lấy reload từ màn cha |
| Nghiệm thu | Không có luồng đối chiếu 412; tài liệu nhầm nguồn version là Task | ReviewForm nhận Submission và reload; If-Match lấy Submission.version theo catalog/DB, nộp mới vẫn lấy Task.version |
| Dialog công việc | Giờ công và nộp kết quả tự đăng ký lại query Task/Project dù TaskShell đã có | TaskShell truyền Task, trạng thái hoạt động và reload; layout không mount bản dialog thứ hai |
| Bộ lọc báo cáo | Đổi dự án giữ authorId của dự án cũ; lookup người lập chạy cả khi control bị ẩn | Xóa authorId/page khi đổi dự án; dùng cùng điều kiện hiển thị để tải lookup phụ |
| Bộ lọc phân tích | ownerId và assigneeId cùng nhận teamId, làm mất lựa chọn người phụ trách dự án | teamId chỉ gửi khi lấy người thực hiện; người phụ trách vẫn thuộc phạm vi dự án |
| Bộ lọc dự án | Đơn vị lấy từ chính trang kết quả đang lọc, mất lựa chọn khi trang rỗng | Dùng query phạm vi độc lập với search/page hiện tại |
| Lỗi lookup | Danh sách bỏ qua lỗi lookup; form kế hoạch mở trước khi tải thành viên xong | Hiện lỗi/thử lại; chờ nguồn lựa chọn bắt buộc trước khi mở form |
| Nhãn bị thiếu | Tài khoản bị khóa/ngoài trang lookup bị hiểu là chưa phân công hoặc nhóm rỗng; số thành viên ẩn đếm cố định theo 3 | Phân biệt ID có sẵn với nhãn chưa tải; đếm phần còn lại từ số tên thực sự hiển thị |

Các mẫu đã rà không còn service/keys parse lại input, permission view hoặc anonymous fallback trong hooks, fetch/service trực tiếp trong UI nghiệp vụ, bảng HTML riêng hoặc browser confirm/alert. AuthObserver là biên khởi tạo/thu hồi phiên dùng HTTP client, không phải đường tắt lấy dữ liệu màn. Pagination riêng trong Kanban là footer của board, không phải bảng tách thẻ. Form không có If-Match không cần thêm luồng 412 giả.

Kiểm tra sau lượt quét: typecheck, lint, build, git diff --check và **167/167 tests ở 9 file đạt**, bổ sung 14 ca tích hợp cho các lỗi vừa sửa.

Các lựa chọn hiện lấy qua API danh sách với pageSize 100; API lookup chuyên biệt/paging cho ứng viên và nhãn lịch sử chưa có đủ trong contract. Với hơn 100 bản ghi hoặc tài khoản đã khóa, không bảo đảm trả đủ tên/lựa chọn; UI phải báo đúng trạng thái thiếu nguồn. Chưa tự tạo endpoint, dữ liệu tên hoặc giả định đã tải toàn bộ. Đây là giới hạn còn cần xử lý khi chốt API lookup với BE.

## Rút gọn truyền ID trong hooks — 26/10/2026

Đối chiếu novel queries và account profile bên vietcd: hook dùng tham số được nhận, không parse rồi đổi tên ID. Dữ liệu account vẫn cần ID người đăng nhập để tách cache; dữ liệu novels công khai không cần phụ thuộc đó.

Đã bỏ 19 lời gọi queryIdSchema.parse và xóa schema catch("") không còn dùng. Sửa 24 file hook của cả 12 feature: nhận resourceId rồi truyền cùng biến cho key/service; lấy viewerId một dòng từ Session context, dùng chính nó cho enabled và invalidation. Không thêm viewerId vào HTTP; không truyền lại Session từ UI hoặc tạo wrapper hook mới. Các biến riêng có ý nghĩa như taskId/submissionId giữ nguyên để tránh đảo tham số.

ID rỗng tiếp tục chờ dependency. ID không rỗng nhưng sai phải đến HTTP handler và trả 422, không bị đổi thành rỗng gây chờ mãi. Form kiểm tra dữ liệu người dùng nhập; handler kiểm tra request ở biên server độc lập; response được API client kiểm tra. Chuẩn hóa filter danh sách một lần và tách cache theo người xem được giữ lại.

Kiểm tra sau khi rút gọn hooks: typecheck, lint, build, git diff --check và 167/167 tests ở 9 file đạt. Ca ID xác nhận dùng chung key/request, không gọi khi ID rỗng và nhận lỗi 422 từ HTTP khi ID sai; các ca tách cache, đổi tài khoản và invalidation tiếp tục đạt.
