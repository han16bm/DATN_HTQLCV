# Thay đổi contract và model khi dùng LLM có sẵn

Lịch sử: contract 0.1.0 → 0.2.0 (tài liệu 0.3), sau đó 0.3.0 (tài liệu 0.4). Đây là thay đổi đặc tả; chưa triển khai ứng dụng/SDK nhà cung cấp trong bộ bàn giao.

## Tác động tổng thể

43 màn/hộp thoại (thêm S43), 79 API operation (thêm GET detail), 93 kiểu/schema gốc được mô tả. Mọi màn được thiết kế lại; các thao tác CRUD nghiệp vụ giữ whitelist cũ, chỉ bổ sung read projection cho giao diện rõ nhãn.

| Thành phần | Trước | Sau / cách đổi |
|---|---|---|
| AnalysisMetaDTO | method RULES/MODEL/TEMPLATE và methodVersion | snapshotId, scope, calculationMethod=SERVER_RULES, calculationVersion; tách khỏi thông tin LLM |
| RiskItemDTO | score, scoreKind có thể CALIBRATED_PROBABILITY | bỏ score/scoreKind; thêm riskLevel, assessmentBasis=BUSINESS_RULES, ruleIds và analysisRef; không dựng xác suất từ LLM |
| DashboardDTO | aiStatus toàn cục | bỏ aiStatus; thêm overviewRef; từng metric/project comparison có analysisRef và trạng thái lời phân tích của chính ref |
| WorkloadDTO item | ID người và số tổng hợp | thêm person read-only và analysisRef; giữ null cho remaining/capacity/utilization thiếu nguồn |
| BottlenecksDTO item | ID việc, stage/thời gian/bằng chứng | thêm taskTitle/assignee read-only và analysisRef; thời gian vẫn do BE tính |
| SummaryDTO | narrative/facts/suggestions/fallbackUsed gom chung | metadata, overviewRef, metrics và highlights từ BE; lời LLM chuyển vào detail.explanation, không dùng template giả là AI |
| AnalysisJobCreateDTO | analysisType, projectId, from, to | analysisId + generationMode + locale; BE lấy scope/subject/thông số từ snapshot, FE không gửi raw data/prompt |
| AnalysisJobDTO | resultPath, errorCode đơn giản | analysisId/snapshotId, updatedAt, pollAfterMs, result{analysisId,explanationId}, error{code,message,retryable,retryAfterSeconds}; bỏ URL kết quả tự do |
| AnalysisDetailDTO | chưa có | snapshot bất biến + freshness + explanation + generation |
| LlmExplanationDTO | chưa có | summary, findings tham chiếu metric/evidence, recommendations có DomainAction, limitations, modelDisplayName/promptVersion/generatedAt |
| AlertDTO | không có điểm mở phân tích | taskTitle và analysisRef nullable chỉ đọc; updateAlert body giữ status/resolutionNote |
| Nhãn người/tài nguyên | DTO chỉ ID, UI phải tự tra | PersonRef{id,displayName}/EntityLabel{id,name} trong response; handler dựng từ model ID |

## Read projection cần cập nhật đồng bộ

| DTO | Field mới chỉ đọc | API chịu ảnh hưởng |
|---|---|---|
| UserDTO | unit | login/refresh/getSession và list/get/create/update/lock/unlock user trả User |
| ProjectDTO | owner, unit | list/get/create/update/activate/complete/cancel project |
| MembershipDTO | user | list/add/update role/end member |
| TaskDTO | assignee nullable, project | list/get/create/update/assign/start/pause/cancel/remaining; response tổng hợp giờ công và nộp/nghiệm thu |
| TimeLogDTO | user | list/create/update/void log |
| SubmissionDTO | submitter, reviewer nullable | list/get/create/approve/revision/review queue |
| ReportDTO | author | list/get/create/update/submit report |

Đây là dữ liệu đọc để render, không phải thêm field vào Mock DomainModel ghi hoặc body CRUD. Snapshot báo cáo và lịch sử không bị viết lại khi tên người/tài nguyên hiện tại đổi. Zod cần kiểm tra projection ID khớp field ID; component không gọi API quản trị theo từng hàng để lấy tên.

## API được sửa trực tiếp cho LLM

| Operation | Thay đổi request | Thay đổi response / hành vi |
|---|---|---|
| getDashboard | không | metadata mới, overviewRef, metric/project analysisRef; không gọi LLM |
| getDeadlineRisks | không | phân loại rule, bỏ score, nhãn người/việc, analysisRef |
| getWorkload | không | person và analysisRef; giữ công thức/null |
| getBottlenecks | không | nhãn việc/người và analysisRef |
| getAnalysisSummary | không | metrics/highlights/ref, narrative chuyển sang detail |
| getAlert/listAlerts/updateAlert response | update body giữ nguyên | taskTitle/analysisRef chỉ đọc; chỉ mở detail nếu có ref |
| createAnalysisJob | đổi toàn bộ body theo AnalysisJobCreateDTO | reuse/coalesce hoặc tạo lượt LLM cho snapshot; không tính lại nghiệp vụ và không tự tạo cảnh báo |
| getAnalysisJob | không, vẫn jobId | job có ref snapshot và error typed; GET không điều khiển tiến trình |
| getAnalysisDetail (mới) | path analysisId, không query/body | số liệu + AI state/result đúng snapshot; không gọi LLM |

## Tác động lên Zod/React Query/MSW

Zod: request strict và response boundary của mọi API; thêm discriminated union Subject, kiểm tra chéo ID, metric/evidence refs và trạng thái job/explanation. FE không gửi các projection read-only. Lỗi provider output được BE chặn thành job FAILED/OUTPUT_INVALID; lỗi API response sai DTO ở FE là ContractError.

React Query: thêm detail key theo viewerId+analysisId, job key theo viewerId+jobId; tạo/reuse/regenerate là mutation retry=false. Không gọi mutation trong queryFn/select hoặc mỗi refetch. Job terminal refetch đúng detail; dữ liệu nguồn đổi đánh stale scope và mở snapshot mới, không trộn cache.

MSW: thêm store snapshot/ref/explanation/job và scenario LLM; không gọi API LLM thật. Job tiến triển bằng scheduler/clock điều khiển, không dựa vào số lần GET. Các fixture lời AI là văn bản mô phỏng cố định và có căn cứ khớp metrics; không giả đã gọi model thật.

## Khi nối BE thực

Đối chiếu cả projection mới, snapshot/read-model retention, lỗi 410/409, cơ chế job, quyền và model adapter. Nếu BE giữ tên field khác, sửa mapper/schema/tài liệu/mock đồng thời. Không thêm if mock trong component hoặc cho FE gọi trực tiếp provider để né phần BE còn thiếu.

POST job trả 200 cho kết quả đã xong được reuse hoặc 202 cho job đang chờ/chạy; API wrapper phải hỗ trợ cả hai success status. Các job đã nhận nhưng provider lỗi kết thúc bằng JobDTO FAILED qua GET 200.


## Bổ sung sau đối chiếu nguồn 0.4 / contract 0.3.0

| Phần | Thay đổi | Căn cứ |
|---|---|---|
| createAnalysisFeedback (mới) | POST theo analysisId, strict verdict/comment; phản hồi bất biến, actor/snapshot từ BE | UC-D04 tr. 43 bước 6 |
| AnalysisFeedbackCreateDTO / AnalysisFeedbackDTO | 2 schema gốc mới; idempotency, lịch sử, canSubmit | Ghi xác nhận/bác bỏ nhận định |
| AnalysisDetailDTO | systemSummary và feedback.latest/canSubmit | Tổng hợp theo mẫu và ý kiến người xem |
| SummaryDTO | summaryText luôn có khi nguồn hợp lệ, không phụ thuộc LLM | UC-D06 tr. 45 fallback theo mẫu |
| RisksDTO | projects[] / ProjectRiskSummaryDTO (1 schema gốc mới); RISK subject TASK hoặc PROJECT | UC-D02 tr. 41 tổng hợp nguy cơ dự án |
| AnalyticsQueryDTO | teamId tùy chọn, thuộc scope/query key | UC-D03 tr. 42 nhóm nhân sự |
| listAnalyticsFilterOptions (mới) | GET kind/q/filter cha/page; Page<EntityLabel> theo quyền | Bộ lọc đơn vị/dự án/nhóm/người không yêu cầu quyền admin |
| DashboardDTO | projectComparisons thêm projectName và actualMinutes | So sánh dự án có nhãn/giờ từ BE, không tự ghép sai |
| Mock nội bộ | analysisFeedback + template summary + notification outbox/dedupe | UC-D04/D05/D06, QT-T33/QT-D06 |
| Định dạng bàn giao | 24 PNG màn chính; 43 đặc tả màn/biểu mẫu; state/site/flow TXT | Yêu cầu cập nhật của người dùng |

Tổng hiện tại: 79 operation, 93 schema gốc. Chỉ thêm hai mutation/query hỗ trợ các luồng nguồn; request CRUD cũ giữ whitelist. Metadata/DTO thay đổi phải được BE đối chiếu trước tích hợp thật.
