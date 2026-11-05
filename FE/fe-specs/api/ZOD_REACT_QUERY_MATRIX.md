# Ma trận Zod và TanStack React Query theo từng API

Contract 0.3.0; cập nhật LLM và màn S43.

Đây là quy tắc triển khai cho Codex. Mỗi operation phải có một API function cố định và schema theo API_CATALOG.md; tên hook/adapter và key dưới đây đối chiếu với code hiện hành; các nhóm invalidation là nhóm dữ liệu, không yêu cầu tách thêm hook hoặc feature.

## Quy tắc chung

- Đọc dữ liệu JSON: useQuery, queryFn truyền AbortSignal cho wrapper; validate trước khi trả DTO vào cache.
- Thao tác nghiệp vụ: useMutation, retry mặc định false; chặn gửi lặp trong UI. GET download chạy theo click qua useDownloadAttachment, giữ pending/error cục bộ và không cache Blob. refreshSession chạy trong auth adapter single-flight, không tạo useQuery hoặc vòng refresh định kỳ.
- viewerId bắt buộc trong key. ID tài nguyên và tất cả filter/query chuẩn hóa ảnh hưởng response phải nằm trong key. Không chứa accessToken, mật khẩu, Blob hoặc dữ liệu nhạy cảm dạng credential.
- Hook dùng trực tiếp resourceId trong key và service, không parse rồi tạo alias id/parentId. ID phiên lấy một lần bằng useSession().session?.user.id để tách cache, không gửi lên API nếu không thuộc contract. ID rỗng chờ dependency; ID sai không rỗng nhận lỗi từ HTTP handler, không bị đổi thành rỗng để tắt query.
- enabled: phiên đã sẵn sàng, đủ ID/path và phụ thuộc tải dữ liệu. Trang/menu đã kiểm tra role tại WorkspaceShell; query không xét quyền mở trang lần nữa. Filter danh sách không hợp lệ vẫn gửi API để nhận lỗi 422, không tắt query vô thời hạn. Analytics chỉ mount phần nội dung khi useAnalyticsScope kiểm tra URL hợp lệ. Lookup phụ có thể tắt khi control không hiển thị.
- gcTime dự kiến 5 phút. staleTime cho từng query ở bảng dưới. Chỉ retry tối đa 1 lần cho lỗi network/502/503/504 của query; không retry 401/403/404/409/412/422/contract error. Đổi phiên phải cancel rồi clear cache.
- background refetch giữ nội dung cũ có chỉ báo đang làm mới; lỗi refetch có banner và thời điểm dữ liệu. Không thay toàn bộ trang bằng skeleton nếu đã có dữ liệu hợp lệ.
- Response Zod lỗi: ContractError, không ghi dữ liệu vào cache. Mutation có thể đã thành công trên server: đọc lại hoặc retry cùng idempotency key, không tạo thao tác mới bằng key mới.

## Ma trận 87 endpoint HTTP

Ba endpoint thông báo được bổ sung theo yêu cầu 03/11; hợp đồng chi tiết ở NOTIFICATIONS.md. Query key có viewer; summary poll 30s, danh sách chỉ enabled khi chuông mở. Mark read dùng useMutation/idempotency; response id/readAt cập nhật list cache của viewer và invalidate summary, không version vì chỉ chuyển sang đã đọc một chiều. Không dùng Zustand lưu danh sách/count từ server.

| Operation | Hook / adapter | Zod kiểm tra | Query key / cache | Điều kiện / staleTime |
|---|---|---|---|---|
| `listNotifications` | `useNotifications` · useQuery | query + success/error JSON | ['notifications', viewerId, 'list', {page,pageSize}] | Có phiên và chuông mở; staleTime 0 |
| `getNotificationSummary` | `useNotificationSummary` · useQuery | empty query + success/error JSON | ['notifications', viewerId, 'summary'] | Có phiên; poll 30 giây khi hoạt động |
| `readNotification` | `useReadNotification` · useMutation | ID + body read:true + success/error JSON | Mutation ['notifications', viewerId, 'read']; cập nhật list cache, invalidate summary | Theo thao tác; idempotency; retry false |
| `login` | `useLoginMutation` · useMutation | params + query + body + success/error JSON | Không có query key cho kết quả thao tác. Nhóm làm mới: all-session-cache | Theo thao tác hợp lệ; retry false |
| `logout` | `AuthObserver.signOut` · thao tác đăng xuất | params + query + body + success/error JSON | Không có query key cho kết quả thao tác. Nhóm làm mới: all-session-cache | Theo thao tác hợp lệ; retry false |
| `refreshSession` | `refreshSessionSingleFlight` · Auth adapter single-flight; không tạo query định kỳ | params + query + body + success/error JSON | Không có query key cho kết quả thao tác. Nhóm làm mới: auth | Auth adapter single-flight, tối đa một lượt replay |
| `getSession` | `AuthObserver` · useQuery | params + query + success/error JSON | ['auth', viewerId, 'getSession'] | Phiên/ID và phụ thuộc dữ liệu; staleTime 0 ms |
| `listUsers` | `useListUsersQuery` · useQuery | params + query + success/error JSON | ['users', viewerId, 'listUsers', normalizedQuery] | Phiên/ID và phụ thuộc dữ liệu; staleTime 30.000 ms |
| `getUser` | `useGetUserQuery` · useQuery | params + query + success/error JSON; kiểm tra nhãn đọc khớp ID | ['users', viewerId, 'getUser', userId] | Phiên/ID và phụ thuộc dữ liệu; staleTime 10.000 ms |
| `createUser` | `useCreateUserMutation` · useMutation | params + query + body + success/error JSON | Không có query key cho kết quả thao tác. Nhóm làm mới: users | Theo thao tác hợp lệ; retry false |
| `updateUser` | `useUpdateUserMutation` · useMutation | params + query + body + success/error JSON | Không có query key cho kết quả thao tác. Nhóm làm mới: users, auth, project-members | Theo thao tác hợp lệ; retry false |
| `lockUser` | `useLockUserMutation` · useMutation | params + query + body + success/error JSON | Không có query key cho kết quả thao tác. Nhóm làm mới: users, auth, tasks, project-members | Theo thao tác hợp lệ; retry false |
| `unlockUser` | `useUnlockUserMutation` · useMutation | params + query + body + success/error JSON | Không có query key cho kết quả thao tác. Nhóm làm mới: users, auth | Theo thao tác hợp lệ; retry false |
| `resetUserPassword` | `useResetUserPasswordMutation` · useMutation | params + query + body + success/error JSON | Không có query key cho kết quả thao tác. Nhóm làm mới: users, auth | Theo thao tác hợp lệ; retry false |
| `listUnits` | `useListUnitsQuery` · useQuery | params + query + success/error JSON | ['organization', viewerId, 'listUnits', normalizedQuery] | Phiên/ID và phụ thuộc dữ liệu; staleTime 30.000 ms |
| `getUnit` | `useGetUnitQuery` · useQuery | params + query + success/error JSON | ['organization', viewerId, 'getUnit', unitId] | Phiên/ID và phụ thuộc dữ liệu; staleTime 10.000 ms |
| `createUnit` | `useCreateUnitMutation` · useMutation | params + query + body + success/error JSON | Không có query key cho kết quả thao tác. Nhóm làm mới: organization | Theo thao tác hợp lệ; retry false |
| `updateUnit` | `useUpdateUnitMutation` · useMutation | params + query + body + success/error JSON | Không có query key cho kết quả thao tác. Nhóm làm mới: organization | Theo thao tác hợp lệ; retry false |
| `deactivateUnit` | `useDeactivateUnitMutation` · useMutation | params + query + body + success/error JSON | Không có query key cho kết quả thao tác. Nhóm làm mới: organization | Theo thao tác hợp lệ; retry false |
| `listTeams` | `useListTeamsQuery` · useQuery | params + query + success/error JSON | ['organization', viewerId, 'listTeams', normalizedQuery] | Phiên/ID và phụ thuộc dữ liệu; staleTime 30.000 ms |
| `getTeam` | `useGetTeamQuery` · useQuery | params + query + success/error JSON | ['organization', viewerId, 'getTeam', teamId] | Phiên/ID và phụ thuộc dữ liệu; staleTime 10.000 ms |
| `createTeam` | `useCreateTeamMutation` · useMutation | params + query + body + success/error JSON | Không có query key cho kết quả thao tác. Nhóm làm mới: organization | Theo thao tác hợp lệ; retry false |
| `updateTeam` | `useUpdateTeamMutation` · useMutation | params + query + body + success/error JSON | Không có query key cho kết quả thao tác. Nhóm làm mới: organization | Theo thao tác hợp lệ; retry false |
| `replaceTeamMembers` | `useReplaceTeamMembersMutation` · useMutation | params + query + body + success/error JSON | Không có query key cho kết quả thao tác. Nhóm làm mới: organization | Theo thao tác hợp lệ; retry false |
| `deactivateTeam` | `useDeactivateTeamMutation` · useMutation | params + query + body + success/error JSON | Không có query key cho kết quả thao tác. Nhóm làm mới: organization | Theo thao tác hợp lệ; retry false |
| `listProjects` | `useListProjectsQuery` · useQuery | params + query + success/error JSON | ['projects', viewerId, 'listProjects', normalizedQuery] | Phiên/ID và phụ thuộc dữ liệu; staleTime 30.000 ms |
| `getProject` | `useGetProjectQuery` · useQuery | params + query + success/error JSON; kiểm tra nhãn đọc khớp ID | ['projects', viewerId, 'getProject', projectId] | Phiên/ID và phụ thuộc dữ liệu; staleTime 10.000 ms |
| `createProject` | `useCreateProjectMutation` · useMutation | params + query + body + success/error JSON | Không có query key cho kết quả thao tác. Nhóm làm mới: projects, project-members, auth | Theo thao tác hợp lệ; retry false |
| `updateProject` | `useUpdateProjectMutation` · useMutation | params + query + body + success/error JSON | Không có query key cho kết quả thao tác. Nhóm làm mới: projects, project-members, auth, analytics | Theo thao tác hợp lệ; retry false |
| `activateProject` | `useActivateProjectMutation` · useMutation | params + query + body + success/error JSON | Không có query key cho kết quả thao tác. Nhóm làm mới: projects | Theo thao tác hợp lệ; retry false |
| `getProjectClosureChecks` | `useGetProjectClosureChecksQuery` · useQuery | params + query + success/error JSON | ['projects', viewerId, 'getProjectClosureChecks', projectId] | Phiên/ID và phụ thuộc dữ liệu; staleTime 0 ms |
| `completeProject` | `useCompleteProjectMutation` · useMutation | params + query + body + success/error JSON | Không có query key cho kết quả thao tác. Nhóm làm mới: projects, tasks, reports, analytics | Theo thao tác hợp lệ; retry false |
| `cancelProject` | `useCancelProjectMutation` · useMutation | params + query + body + success/error JSON | Không có query key cho kết quả thao tác. Nhóm làm mới: projects, tasks, reports, analytics | Theo thao tác hợp lệ; retry false |
| `listProjectHistory` | `useListProjectHistoryQuery` · useQuery | params + query + success/error JSON | ['projects', viewerId, 'listProjectHistory', projectId, normalizedQuery] | Phiên/ID và phụ thuộc dữ liệu; staleTime 30.000 ms |
| `listProjectMembers` | `useListProjectMembersQuery` · useQuery | params + query + success/error JSON | ['project-members', viewerId, 'listProjectMembers', projectId, normalizedQuery] | Phiên/ID và phụ thuộc dữ liệu; staleTime 30.000 ms |
| `addProjectMember` | `useAddProjectMemberMutation` · useMutation | params + query + body + success/error JSON | Không có query key cho kết quả thao tác. Nhóm làm mới: project-members, auth | Theo thao tác hợp lệ; retry false |
| `updateProjectMemberRole` | `useUpdateProjectMemberRoleMutation` · useMutation | params + query + body + success/error JSON | Không có query key cho kết quả thao tác. Nhóm làm mới: project-members, auth | Theo thao tác hợp lệ; retry false |
| `endProjectMembership` | `useEndProjectMembershipMutation` · useMutation | params + query + body + success/error JSON | Không có query key cho kết quả thao tác. Nhóm làm mới: project-members, auth, tasks | Theo thao tác hợp lệ; retry false |
| `listTasks` | `useListTasksQuery` · useQuery | params + query + success/error JSON | ['tasks', viewerId, 'listTasks', normalizedQuery] | Phiên/ID và phụ thuộc dữ liệu; staleTime 30.000 ms |
| `getTask` | `useGetTaskQuery` · useQuery | params + query + success/error JSON; kiểm tra nhãn đọc khớp ID | ['tasks', viewerId, 'getTask', taskId] | Phiên/ID và phụ thuộc dữ liệu; staleTime 10.000 ms |
| `createTask` | `useCreateTaskMutation` · useMutation | params + query + body + success/error JSON | Không có query key cho kết quả thao tác. Nhóm làm mới: tasks, projects, analytics | Theo thao tác hợp lệ; retry false |
| `updateTask` | `useUpdateTaskMutation` · useMutation | params + query + body + success/error JSON | Không có query key cho kết quả thao tác. Nhóm làm mới: tasks, projects, analytics, alerts | Theo thao tác hợp lệ; retry false |
| `assignTask` | `useAssignTaskMutation` · useMutation | params + query + body + success/error JSON | Không có query key cho kết quả thao tác. Nhóm làm mới: tasks, project-members, analytics, alerts | Theo thao tác hợp lệ; retry false |
| `startTask` | `useStartTaskMutation` · useMutation | params + query + body + success/error JSON | Không có query key cho kết quả thao tác. Nhóm làm mới: tasks, analytics | Theo thao tác hợp lệ; retry false |
| `pauseTask` | `usePauseTaskMutation` · useMutation | params + query + body + success/error JSON | Không có query key cho kết quả thao tác. Nhóm làm mới: tasks, analytics | Theo thao tác hợp lệ; retry false |
| `cancelTask` | `useCancelTaskMutation` · useMutation | params + query + body + success/error JSON | Không có query key cho kết quả thao tác. Nhóm làm mới: tasks, projects, analytics, alerts | Theo thao tác hợp lệ; retry false |
| `updateRemainingEstimate` | `useUpdateRemainingEstimateMutation` · useMutation | params + query + body + success/error JSON | Không có query key cho kết quả thao tác. Nhóm làm mới: tasks, analytics, alerts | Theo thao tác hợp lệ; retry false |
| `listTaskHistory` | `useListTaskHistoryQuery` · useQuery | params + query + success/error JSON | ['tasks', viewerId, 'listTaskHistory', taskId, normalizedQuery] | Phiên/ID và phụ thuộc dữ liệu; staleTime 30.000 ms |
| `listTimeLogs` | `useListTimeLogsQuery` · useQuery | params + query + success/error JSON | ['time-logs', viewerId, 'listTimeLogs', taskId, normalizedQuery] | Phiên/ID và phụ thuộc dữ liệu; staleTime 30.000 ms |
| `createTimeLog` | `useCreateTimeLogMutation` · useMutation | params + query + body + success/error JSON | Không có query key cho kết quả thao tác. Nhóm làm mới: time-logs, tasks, reports, report-preview, analytics | Theo thao tác hợp lệ; retry false |
| `updateTimeLog` | `useUpdateTimeLogMutation` · useMutation | params + query + body + success/error JSON | Không có query key cho kết quả thao tác. Nhóm làm mới: time-logs, tasks, reports, report-preview, analytics | Theo thao tác hợp lệ; retry false |
| `voidTimeLog` | `useVoidTimeLogMutation` · useMutation | params + query + body + success/error JSON | Không có query key cho kết quả thao tác. Nhóm làm mới: time-logs, tasks, reports, report-preview, analytics | Theo thao tác hợp lệ; retry false |
| `listSubmissions` | `useListSubmissionsQuery` · useQuery | params + query + success/error JSON | ['submissions', viewerId, 'listSubmissions', taskId, normalizedQuery] | Phiên/ID và phụ thuộc dữ liệu; staleTime 30.000 ms |
| `getSubmission` | `useGetSubmissionQuery` · useQuery | params + query + success/error JSON; kiểm tra nhãn đọc khớp ID | ['submissions', viewerId, 'getSubmission', taskId, submissionId] | Phiên/ID và phụ thuộc dữ liệu; staleTime 10.000 ms |
| `createSubmission` | `useCreateSubmissionMutation` · useMutation | params + query + body + success/error JSON | Không có query key cho kết quả thao tác. Nhóm làm mới: submissions, tasks, reviews, analytics, alerts | Theo thao tác hợp lệ; retry false |
| `approveSubmission` | `useApproveSubmissionMutation` · useMutation | params + query + body + success/error JSON | Không có query key cho kết quả thao tác. Nhóm làm mới: submissions, tasks, reviews, projects, analytics, alerts | Theo thao tác hợp lệ; retry false |
| `requestSubmissionRevision` | `useRequestSubmissionRevisionMutation` · useMutation | params + query + body + success/error JSON | Không có query key cho kết quả thao tác. Nhóm làm mới: submissions, tasks, reviews, analytics, alerts | Theo thao tác hợp lệ; retry false |
| `listReviewQueue` | `useListReviewQueueQuery` · useQuery | params + query + success/error JSON | ['submissions', viewerId, 'listReviewQueue', normalizedQuery] | Phiên/ID và phụ thuộc dữ liệu; staleTime 30.000 ms |
| `listReports` | `useListReportsQuery` · useQuery | params + query + success/error JSON | ['reports', viewerId, 'listReports', normalizedQuery] | Phiên/ID và phụ thuộc dữ liệu; staleTime 30.000 ms |
| `getReportPreview` | `useGetReportPreviewQuery` · useQuery | params + query + success/error JSON | ['reports', viewerId, 'getReportPreview', normalizedQuery] | Phiên/ID và phụ thuộc dữ liệu; staleTime 10.000 ms |
| `getReport` | `useGetReportQuery` · useQuery | params + query + success/error JSON; kiểm tra nhãn đọc khớp ID | ['reports', viewerId, 'getReport', reportId] | Phiên/ID và phụ thuộc dữ liệu; staleTime 10.000 ms |
| `createReportDraft` | `useCreateReportDraftMutation` · useMutation | params + query + body + success/error JSON | Không có query key cho kết quả thao tác. Nhóm làm mới: reports | Theo thao tác hợp lệ; retry false |
| `updateReportDraft` | `useUpdateReportDraftMutation` · useMutation | params + query + body + success/error JSON | Không có query key cho kết quả thao tác. Nhóm làm mới: reports | Theo thao tác hợp lệ; retry false |
| `refreshReportDraft` | `useRefreshReportDraftMutation` · useMutation | params + query + body + success/error JSON | Không có query key cho kết quả thao tác. Nhóm làm mới: report-preview | Theo thao tác hợp lệ; retry false |
| `submitReport` | `useSubmitReportMutation` · useMutation | params + query + body + success/error JSON | Không có query key cho kết quả thao tác. Nhóm làm mới: reports, report-preview, analytics | Theo thao tác hợp lệ; retry false |
| `getUploadPolicy` | `useGetUploadPolicyQuery` · useQuery | params + query + success/error JSON | ['attachments', viewerId, 'getUploadPolicy'] | Phiên/ID và phụ thuộc dữ liệu; staleTime 10.000 ms |
| `uploadAttachment` | `useUploadAttachmentMutation` · useMutation | params + query + multipart/File theo policy + success/error JSON | Không có query key cho kết quả thao tác. Nhóm làm mới: attachments | Theo thao tác hợp lệ; retry false |
| `getAttachment` | `useGetAttachmentQuery` · useQuery | params + query + success/error JSON | ['attachments', viewerId, 'getAttachment', attachmentId] | Phiên/ID và phụ thuộc dữ liệu; staleTime 10.000 ms |
| `downloadAttachment` | `useDownloadAttachment` · GET binary theo click; pending/error cục bộ, không cache Blob | params + error JSON; success: status/Content-Type/Blob | Không có query key cho kết quả thao tác. | Theo thao tác hợp lệ; retry false |
| `getDashboard` | `useGetDashboardQuery` · useQuery | params + query + success/error JSON; thêm refinement ID/snapshot/citation/state | ['analytics', viewerId, 'getDashboard', normalizedQuery] | Phiên/ID và phụ thuộc dữ liệu; staleTime 10.000 ms |
| `getDeadlineRisks` | `useGetDeadlineRisksQuery` · useQuery | params + query + success/error JSON; thêm refinement ID/snapshot/citation/state | ['analytics', viewerId, 'getDeadlineRisks', normalizedQuery] | Phiên/ID và phụ thuộc dữ liệu; staleTime 10.000 ms |
| `getWorkload` | `useGetWorkloadQuery` · useQuery | params + query + success/error JSON; thêm refinement ID/snapshot/citation/state | ['analytics', viewerId, 'getWorkload', normalizedQuery] | Phiên/ID và phụ thuộc dữ liệu; staleTime 10.000 ms |
| `getBottlenecks` | `useGetBottlenecksQuery` · useQuery | params + query + success/error JSON; thêm refinement ID/snapshot/citation/state | ['analytics', viewerId, 'getBottlenecks', normalizedQuery] | Phiên/ID và phụ thuộc dữ liệu; staleTime 10.000 ms |
| `getAnalysisSummary` | `useGetAnalysisSummaryQuery` · useQuery | params + query + success/error JSON; thêm refinement ID/snapshot/citation/state | ['analytics', viewerId, 'getAnalysisSummary', normalizedQuery] | Phiên/ID và phụ thuộc dữ liệu; staleTime 10.000 ms |
| `createAnalysisJob` | `useCreateAnalysisJobMutation` · useMutation | params + query + body + success/error JSON; thêm refinement ID/snapshot/citation/state | Không có query key cho kết quả thao tác. Nhóm làm mới: analysis-detail, analytics-jobs | Một REUSE_OR_CREATE khi mở chi tiết nếu NOT_REQUESTED và allowed; không tự thử lại sau FAILED |
| `getAnalysisJob` | `useGetAnalysisJobQuery` · useQuery | params + query + success/error JSON; thêm refinement ID/snapshot/citation/state | ['analytics', viewerId, 'getAnalysisJob', jobId] | Phiên/jobId hợp lệ: đọc lần đầu cả khi chưa biết status; chỉ poll QUEUED/RUNNING mỗi 2 giây khi đang chạy |
| `listAlerts` | `useListAlertsQuery` · useQuery | params + query + success/error JSON | ['alerts', viewerId, 'listAlerts', normalizedQuery] | Phiên/ID và phụ thuộc dữ liệu; staleTime 30.000 ms |
| `getAlert` | `useGetAlertQuery` · useQuery | params + query + success/error JSON | ['alerts', viewerId, 'getAlert', alertId] | Phiên/ID và phụ thuộc dữ liệu; staleTime 10.000 ms |
| `updateAlert` | `useUpdateAlertMutation` · useMutation | params + query + body + success/error JSON | Không có query key cho kết quả thao tác. Nhóm làm mới: alerts, analytics | Theo thao tác hợp lệ; retry false |
| `getAnalysisDetail` | `useGetAnalysisDetailQuery` · useQuery | params + query + success/error JSON; thêm refinement ID/snapshot/citation/state | ['analytics', viewerId, 'getAnalysisDetail', analysisId] | enabled khi mở S43 và analysisId hợp lệ; staleTime 0; giữ số liệu khi AI cập nhật |
| `createAnalysisFeedback` | `useCreateAnalysisFeedbackMutation` · useMutation | params + query + strict body + success/error JSON; kiểm tra actor/analysis/snapshot | Không có query key; refetch đúng detail của người xem | Click xác nhận/bác bỏ BOTTLENECK, CURRENT, canSubmit; retry=false; Idempotency-Key |
| `listAnalyticsFilterOptions` | `useListAnalyticsFilterOptionsQuery` · useQuery | strict params/query + Page<EntityLabel> success/error JSON | ['analytics-options', viewerId, normalizedQuery] | Phiên/quyền/query hợp lệ; staleTime 30.000 ms; search/page theo server |

| `getPersonalProfile` | `useProfileQuery` | Auth.PersonalProfileDTO; không query/userId | ['auth', viewerId, 'getProfile'] | Có phiên; staleTime 0; mount một lần ở trang hồ sơ |
| `updateProfile` | `useUpdateProfileMutation` | multipart whitelist + SessionDTO | Cập nhật auth.getSession; invalidate auth.getProfile và dữ liệu cùng viewer | If-Match từ version hồ sơ/ảnh đang sửa; giữ draft/crop khi 412 |
| `changePassword` | `useChangePasswordMutation` | currentPassword/newPassword + kết quả ok | Không lưu mật khẩu trong Query cache | Click; không If-Match, có idempotency |
| `getProfile` | `useGetProfileQuery` | userId + hồ sơ nhận diện/email | ['users', viewerId, 'getProfile', userId] | Phiên/ID; staleTime 0 ms |
| `getAvatar` | Browser tải URL ảnh từ DTO | avatarId ở handler; binary ảnh | URL ảnh có ID riêng; không Query cache Blob | GET /api/avatars/:avatarId; không có service/hook chuyển tiếp |

## Từ nhóm invalidation sang query thực tế

Các chuỗi groups trong API_CATALOG là nhóm nghiệp vụ, không phải query key đầy đủ. Sau response hợp lệ, dùng key factory và scope của mutation; không invalidate toàn hệ thống một cách mặc định.

| Nhóm | Các query cần làm mới |
|---|---|
| tasks | listTasks của viewer liên quan; getTask(taskId); listTaskHistory(taskId); dữ liệu task trong board và workspace |
| projects | listProjects; getProject(projectId); getProjectClosureChecks(projectId); listProjectHistory(projectId) |
| project-members | listProjectMembers(projectId); danh sách người có thể nhận việc; quyền hiển thị theo dự án |
| time-logs | listTimeLogs(taskId); getTask(taskId) để lấy actualMinutes mới |
| submissions, reviews | listSubmissions(taskId); getSubmission(taskId, submissionId); listReviewQueue theo phạm vi |
| reports | listReports và getReport của báo cáo/nháp liên quan; báo cáo SUBMITTED luôn giữ snapshot server |
| report-preview | getReportPreview của tác giả/dự án/kỳ bị ảnh hưởng, kể cả nháp đang soạn |
| analytics | getDashboard, getDeadlineRisks, getWorkload, getBottlenecks, getAnalysisSummary của dự án/đơn vị/kỳ liên quan |
| alerts | listAlerts trong phạm vi và getAlert(alertId) liên quan |
| analysis-detail | getAnalysisDetail theo viewerId/analysisId; job kết thúc chỉ refetch đúng detail; nguồn đổi đánh stale cùng scope |
| analytics-jobs | getAnalysisJob(jobId); terminal refetch detail đúng analysisId, không sửa dữ liệu nghiệp vụ |
| users | listUsers và getUser(userId); các lookup người dùng liên quan |
| organization | listUnits/getUnit, listTeams/getTeam của đơn vị/nhóm liên quan |
| attachments | getAttachment(attachmentId); vùng chọn tệp của task lấy ID từ response upload |
| auth | getSession; tải quyền mới, hủy/loại dữ liệu không còn được xem, điều chỉnh menu/action |
| all-session-cache | Cancel request cũ, xóa toàn bộ Query cache và UI state theo phiên; không giữ dữ liệu tài khoản trước |

Time-log mutation còn phải làm mới report-preview của người ghi trong kỳ chịu ảnh hưởng (báo cáo đã gửi giữ snapshot). Sửa/giao/bắt đầu/nộp/nghiệm thu công việc cũng làm stale closure checks. Mutation response tổng hợp có thể setQueryData cho chi tiết Task/Submission/TimeLog đã validate, đồng thời invalidate các danh sách/tổng hợp phụ thuộc.

## Phiên, upload, download và job

- login/refresh trả token cho auth adapter trong bộ nhớ; chỉ SessionDTO không chứa token được đặt vào session query. Sau khi chuyển token vào adapter, reset mutation result để không giữ credential trong mutation cache; không ghi log/devtools/persist token.
- logout thực hiện API rồi dọn phiên; nếu request lỗi vẫn dọn dữ liệu client theo lựa chọn đăng xuất, đồng thời thể hiện nếu BE chưa xác nhận thu hồi.
- uploadAttachment dùng useMutation; validate File theo getUploadPolicy. Không hiển thị phần trăm giả nếu transport không cung cấp tiến trình thật. upload thành công lấy attachmentId READY.
- downloadAttachment dùng useMutation gọi GET khi click, response Blob dùng ngắn hạn rồi giải phóng object URL; không cache toàn bộ tệp.
- createAnalysisJob chỉ tạo lời diễn giải cho snapshot đã có. getAnalysisJob poll mỗi 2 giây khi đang chạy và tối đa 2 phút trong một lượt theo dõi; terminal refetch detail đúng analysisId. Quá thời gian theo dõi chỉ tạm dừng, không tự gán FAILED.
- refreshReportDraft là POST trả projection đọc nên dùng useMutation; kết quả dùng để cập nhật preview nháp sau validate, không thay snapshot đã gửi.

## Nguồn kỹ thuật đã đối chiếu

- [TanStack Query: Queries](https://tanstack.com/query/latest/docs/framework/react/guides/queries)
- [TanStack Query: Invalidations from Mutations](https://tanstack.com/query/latest/docs/framework/react/guides/invalidations-from-mutations)
- [Zod API](https://zod.dev/api)
- [MSW Introduction](https://mswjs.io/docs/)

Các lựa chọn staleTime, tên key/hook, thời gian poll và phạm vi invalidation là quy định của dự án; không phải giá trị mặc định bắt buộc từ thư viện.

## Cache và luồng LLM trên S43

1. Click analysisRef → GET detail bằng key ['analytics', viewerId, 'getAnalysisDetail', analysisId]. Không tạo job trong queryFn/select hoặc mỗi lần refetch.
2. READY hiển thị lastSuccess ngay; QUEUED/RUNNING theo dõi activeJobId; NOT_REQUESTED+generation.allowed kích hoạt đúng một mutation REUSE_OR_CREATE cho lượt mở chủ động. Dùng mutex/attempt key ổn định qua React StrictMode; BE coalesce và idempotency là lớp đảm bảo cuối.
3. FAILED/UNAVAILABLE/OUTDATED không tự tạo lại. Chỉ nút Thử lại/Phân tích lại hoặc Xem dữ liệu mới mới bắt đầu thao tác được đặc tả. Refocus/tab mount/đổi layout không phải lý do phát sinh thêm lượt gọi LLM.
4. Job trả kết quả snapshot cũ sau khi người dùng đã mở analysisId khác: chỉ cập nhật cache key của analysisId cũ; không ghép narrative cũ với metrics mới. Dùng AbortSignal cho request đọc, không coi abort ở FE là hủy job BE.
5. Nhóm analysis-detail làm mới detail theo analysisId. analytics-jobs làm mới job theo jobId. Job SUCCEEDED/FAILED refetch detail và trạng thái ref của các tổng quan có cùng scope để cập nhật nhãn AI. LLM job không invalidate tasks/time-logs/reports để giả rằng có thay đổi nghiệp vụ.
6. Mutation nguồn (đổi task, giờ, nghiệm thu, báo cáo) làm stale các query analytics và detail cùng phạm vi. Snapshot cũ bất biến; detail wrapper báo OUTDATED và latestAnalysisId. Không setQueryData đè metrics của snapshot cũ bằng dữ liệu task hiện tại.
7. Refresh quyền/đăng xuất phải cancel/remove cache của detail, job và explanation cùng các query nhạy cảm khác. Không persist cache phân tích ra localStorage.

createAnalysisJob nhận HTTP 200 (reuse kết quả đã xong) hoặc 202 (đang chờ/chạy), cùng AnalysisJobDTO. Sau 200 SUCCEEDED refetch detail ngay; sau 202 theo dõi job. Không đòi một status cố định gây ContractError khi reuse.

Khi nhóm analytics bị invalidate bởi mutation nguồn, bao gồm các detail cùng phạm vi. Vì detail key dùng analysisId opaque, dùng predicate đọc scope đã validate từ cache/query meta để chọn project/đơn vị/kỳ liên quan; không parse analysisId để đoán project và không đè snapshot. Đổi phiên/mất quyền luôn dọn cache theo viewer.

## Bổ sung bám sát nguồn 0.4

teamId thuộc normalizedQuery/query key của analytics. summaryText/systemSummary luôn là nội dung theo mẫu BE, tách khỏi explanation. Phản hồi điểm nghẽn là mutation có chủ ý, không chạy khi mở chi tiết/refetch. Chỉ refetch feedback của analysisId liên quan; không làm job hoặc nguồn nghiệp vụ thay đổi.

Nhóm analytics-options chứa lookup bộ lọc có quyền riêng; đổi thành viên/nhóm/dự án và refresh quyền phải làm stale hoặc loại lựa chọn không còn hợp lệ. Không dùng cache lookup để quyết định quyền nghiệp vụ.
