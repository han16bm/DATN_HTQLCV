# Đối chiếu chức năng với tài liệu nguồn

Tài liệu FE **0.4**, contract đề xuất **0.3.0**, rà soát ngày **24/10/2026**.

Đã đọc toàn bộ bản hiện tại của `Bao_cao_phan_tich_he_thong_quan_ly_du_an_va_cong_viec_tich_hop_AI.docx` (70 trang). Bảng dưới đối chiếu đủ 27 FR/Use Case ở trang 7 với các đặc tả chi tiết trang 19–45. “Đã đặc tả” nghĩa là có đầu vào triển khai và tiêu chí xử lý; chưa phải chức năng đã code hoặc tích hợp BE thành công.

## Kết quả và các chỗ đã bổ sung

Bản 0.3 đã có 27 mã UC nhưng chưa đủ chi tiết để coi mọi luồng đều khép kín. Bản 0.4 bổ sung phản hồi xác nhận/bác bỏ điểm nghẽn (UC-D04 bước 6), bảo đảm tổng hợp theo mẫu khi LLM lỗi (UC-D06), làm rõ mức nguy cơ cấp dự án, bộ lọc nhóm/đơn vị và nguồn lookup đúng quyền. Quy tắc dedupe cảnh báo và thông báo sau commit được đưa vào mock/rule để không bị bỏ sót khi code.

Chỉ xuất 24 ảnh màn chính. Toàn bộ 43 màn/biểu mẫu/hộp thoại vẫn có route, field, action, quyền và API; state và sitemap chuyển sang TXT. Việc bỏ ảnh biến thể không cắt luồng thay thế hoặc ngoại lệ.

## Ma trận chức năng

| FR / Use Case và trang nguồn | Màn/biểu mẫu | API | Nội dung bắt buộc đã đối chiếu |
|---|---|---|---|
| FR-A01 / **UC-A01 Đăng nhập** · tr. 19 | S01, S02 | `login`, `refreshSession`, `getSession` | Phiên, tài khoản khóa, scope/menu; lỗi đăng nhập và hết phiên. Không có đăng ký công khai. |
| FR-A02 / **UC-A02 Đăng xuất** · tr. 20 | S01, S02 | `logout` | Nhắc dữ liệu chưa lưu; dọn cache/phiên client kể cả lỗi mạng, nêu rõ server chưa xác nhận thu hồi. |
| FR-A03 / **UC-A03 Tạo tài khoản người dùng** · tr. 21 | S03, S04 | `listUsers`, `createUser` | Tài khoản duy nhất, đơn vị hoạt động, vai trò được phép cấp; không tự cấp quyền dự án. |
| FR-A04 / **UC-A04 Cập nhật và khóa tài khoản** · tr. 22 | S03, S05 | `listUsers`, `getUser`, `updateUser`, `lockUser`, `unlockUser`, `resetUserPassword` | Cập nhật/khóa/mở khóa, chống tự nâng quyền và khóa quản trị cuối; bàn giao thường hoặc khóa khẩn cấp giữ lịch sử. |
| FR-A05 / **UC-A05 Quản lý đơn vị và nhóm** · tr. 23 | S06, S07 | `listUnits`, `getUnit`, `createUnit`, `updateUnit`, `deactivateUnit`, `listTeams`, `getTeam`, `createTeam`, `updateTeam`, `replaceTeamMembers`, `deactivateTeam` | Đơn vị/nhóm, tư cách nhân sự và ngừng sử dụng; không làm thành viên nhóm tự thành thành viên dự án. |
| FR-P01 / **UC-P01 Tạo dự án** · tr. 24 | S09 | `createProject` | Mục tiêu, thời hạn, owner hoạt động; tạo membership quản lý ban đầu; PLANNED chưa thực hiện task. |
| FR-P02 / **UC-P02 Cập nhật và kết thúc dự án** · tr. 25 | S10, S11, S14 | `updateProject`, `activateProject`, `getProjectClosureChecks`, `completeProject`, `cancelProject`, `listProjectHistory` | Điều chỉnh có lý do; không rút hạn sai hạn task; closure checks, xử lý pending review và báo cáo trước đóng/hủy. |
| FR-P03 / **UC-P03 Xem danh sách và chi tiết dự án** · tr. 26 | S02, S08, S10 | `listProjects`, `getProject` | Danh sách/lọc/chi tiết trong quyền; dự án đã đóng chỉ đọc; lỗi/rỗng/mất quyền. |
| FR-P04 / **UC-P04 Quản lý thành viên dự án** · tr. 27 | S12 | `listProjectMembers`, `addProjectMember`, `endProjectMembership` | Thêm/kết thúc membership, không trùng, bàn giao trước rời; giữ lịch sử, không loại owner cuối. |
| FR-P05 / **UC-P05 Phân quyền trong dự án** · tr. 28 | S13 | `updateProjectMemberPermissions` | Quyền được cấp/thu hồi trong thẩm quyền, có lý do/audit; người xét vẫn khác người nộp. |
| FR-T01 / **UC-T01 Tạo công việc** · tr. 29 | S17 | `createTask` | Tên/tiêu chí/hạn đủ giờ/phút dự kiến/ưu tiên; NEW chưa có assignee, có thể chuyển phân công riêng. |
| FR-T02 / **UC-T02 Giao và phân công lại công việc** · tr. 30 | S20 | `assignTask` | Một người nhận hiện tại, thành viên hoạt động; bàn giao giữ assignment/giờ lịch sử và kiểm tra version. |
| FR-T03 / **UC-T03 Chỉnh sửa và hủy công việc** · tr. 31 | S19, S21 | `updateTask`, `cancelTask` | Whitelist sửa/hủy, lý do đổi kế hoạch sau giao, giữ gốc; không sửa/hủy pending hoặc trạng thái đóng. |
| FR-T04 / **UC-T04 Xem danh sách và chi tiết công việc** · tr. 32 | S02, S15, S16, S18, S26 | `listTasks`, `getTask` | List/board/detail, filter theo scope; nhân viên xem việc hiện tại/từng làm khi còn quyền, không suy quyền từ ID. |
| FR-T05 / **UC-T05 Cập nhật trạng thái thực hiện** · tr. 33 | S21 | `startTask`, `pauseTask` | Bắt đầu/tạm dừng có lý do theo command; không tự đặt COMPLETED hoặc suy giờ từ timer. |
| FR-T06 / **UC-T06 Ghi nhận và chỉnh sửa thời gian thực hiện** · tr. 34 | S22, S23 | `listTimeLogs`, `createTimeLog`, `updateTimeLog`, `voidTimeLog` | Phút/ngày Việt Nam, phân công, ≤1.440 phút/người/ngày; sửa/VOID của mình, giữ dấu vết. |
| FR-T07 / **UC-T07 Nộp kết quả công việc** · tr. 35 | S24, S25, S27, S41 | `listSubmissions`, `createSubmission`, `getUploadPolicy`, `uploadAttachment`, `getAttachment`, `downloadAttachment` | Summary bắt buộc, tệp/link tùy chọn; File READY, snapshot hạn/giờ, sequence tăng, chỉ một pending và replay không trùng. |
| FR-T08 / **UC-T08 Nghiệm thu kết quả** · tr. 36 | S24, S26, S27, S41 | `getSubmission`, `approveSubmission`, `listReviewQueue`, `getAttachment`, `downloadAttachment` | Xét lần mới nhất, đủ quyền và khác người nộp; lưu ACCEPTED+Task COMPLETED cùng giao dịch. |
| FR-T09 / **UC-T09 Yêu cầu chỉnh sửa kết quả** · tr. 37 | S26, S27 | `getSubmission`, `requestSubmissionRevision`, `listReviewQueue` | Lý do+nội dung cần sửa bắt buộc; trở lại IN_PROGRESS, giữ người/hạn và các lần nộp cũ. |
| FR-T10 / **UC-T10 Lập và gửi báo cáo công việc** · tr. 38 | S30, S31 | `getReportPreview`, `createReportDraft`, `updateReportDraft`, `refreshReportDraft`, `submitReport` | DAILY/WEEKLY, nháp riêng, trùng kỳ, refresh preview, gửi snapshot; 0 phút có lý do, không cộng giờ hai lần. |
| FR-T11 / **UC-T11 Xem báo cáo và lịch sử thực hiện** · tr. 39 | S25, S28, S29, S31, S32 | `listTaskHistory`, `listSubmissions`, `listReports`, `getReport` | Xem báo cáo/lịch sử task đúng quyền; báo cáo gửi và before/after bất biến, nháp người khác bị chặn. |
| FR-D01 / **UC-D01 Xem bảng theo dõi tổng quan** · tr. 40 | S33, S34, S35, S36, S39, S43 | `getDashboard`, `getAnalysisDetail`, `listAnalyticsFilterOptions` | 16 KPI, kỳ/đơn vị/dự án, biểu đồ, so sánh dự án và drilldown; mẫu số 0=null, dữ liệu cũ có nhãn. |
| FR-D02 / **UC-D02 Phân tích nguy cơ trễ hạn** · tr. 41 | S33, S34, S35, S36, S39, S40, S43 | `getDeadlineRisks`, `createAnalysisJob`, `getAnalysisJob`, `getAnalysisDetail`, `listAnalyticsFilterOptions` | Tách overdue/at-risk/insufficient; tổng hợp nguy cơ dự án có căn cứ; không dựng xác suất hay gọi LLM từ GET. |
| FR-D03 / **UC-D03 Phân tích khối lượng công việc** · tr. 42 | S18, S33, S34, S35, S36, S39, S40, S43 | `updateRemainingEstimate`, `getWorkload`, `createAnalysisJob`, `getAnalysisJob`, `getAnalysisDetail`, `listAnalyticsFilterOptions` | Nhóm nhân sự/phạm vi, current/original estimate/remaining/capacity, workload bị giới hạn quyền; null/0 khả dụng xử lý riêng. |
| FR-D04 / **UC-D04 Phát hiện điểm nghẽn** · tr. 43 | S33, S34, S35, S36, S39, S40, S43 | `getBottlenecks`, `createAnalysisJob`, `getAnalysisJob`, `getAnalysisDetail`, `createAnalysisFeedback`, `listAnalyticsFilterOptions` | Thời gian trạng thái/chờ/vòng sửa, mốc nguồn/ngưỡng; bổ sung ghi xác nhận/bác bỏ nhận định tại S43. |
| FR-D05 / **UC-D05 Xem và xử lý cảnh báo** · tr. 44 | S37, S38, S43 | `listAlerts`, `getAlert`, `updateAlert`, `getAnalysisDetail` | Tạo/cập nhật/dedupe cảnh báo phía scheduler, đọc/xử lý/note, conditionActive riêng; lỗi gửi không xóa cảnh báo. |
| FR-D06 / **UC-D06 Xem tổng hợp phân tích và đề xuất** · tr. 45 | S33, S34, S35, S36, S39, S40, S43 | `getAnalysisSummary`, `createAnalysisJob`, `getAnalysisJob`, `getAnalysisDetail`, `listAnalyticsFilterOptions` | Tổng hợp theo mẫu luôn có khi nguồn hợp lệ; LLM có sẵn bổ sung lời diễn giải có kiểm tra; lỗi vẫn đọc template/metrics. |

## Quy tắc xuyên phân hệ và kiểm tra nguồn

| Nhóm nguồn | Nơi đặc tả và nội dung giữ lại |
|---|---|
| QT-A01–A10 · tr. 9 | AGENTS.md, API_CATALOG, MOCK_MODELS và BUSINESS_STATES: quyền/scope, owner cuối, member hoạt động, khóa/bàn giao, hạn dự án và bảo toàn lịch sử |
| QT-T01–T13 · tr. 10 | Task/request whitelist, thời điểm UTC, kế hoạch gốc, chuyển trạng thái, khóa khi pending review |
| QT-T14–T27 · tr. 11 | Overdue khác nộp muộn/hoàn tất muộn, giờ chờ khác giờ công, nhật ký/ngày/phân công, các lần nộp, quyền xét, kỳ và snapshot báo cáo |
| QT-T28–T33 · tr. 12 | Tra cứu theo quyền, audit/VOID, version/idempotency/giao dịch, tệp READY, công thức tiến độ, notification sau commit |
| QT-D01–D10 · tr. 13 | Phạm vi/thời điểm, thiếu dữ liệu, người quyết định, dedupe, lỗi phân tích, giới hạn đánh giá nhân sự, kiểm tra LLM; đánh giá mô hình dự báo là điều kiện nếu sau này dùng mô hình đó |
| K01–K16 · tr. 54–55 | METRICS_K01_K16.md giữ đủ công thức, cohort/kỳ, mẫu số, unit và missingFields; dashboard giữ đủ 16 chỉ số |
| Biểu đồ · tr. 55–57 | S33 có phân bố trạng thái/xu hướng/so sánh dự án; S35 so sánh nhân sự; S26 là hàng chờ nghiệm thu. Tên/giờ dự án có field response rõ |
| NFR01–NFR10, KT01–KT26 · tr. 67–69 | SOURCE_QUALITY_AND_SCENARIOS.txt giữ đầy đủ nội dung chữ nguồn; ACCEPTANCE_CHECKLIST dẫn chiếu để triển khai và kiểm tra trên code thật |

## Các lựa chọn thay đổi hoặc cần đối chiếu BE

- Theo yêu cầu mới của người dùng, AI dùng LLM có sẵn để diễn giải snapshot. Các phần đào tạo/so sánh mô hình dự báo trong chương 10 là phương án mở rộng có điều kiện; không giao Codex dựng mô hình dự báo riêng hoặc chế tạo xác suất từ LLM.
- Snapshot, public Gateway `/api`, Bearer/refresh cookie, DTO/envelope, If-Match, idempotency, job, lookup và feedback endpoint là contract FE đề xuất để khép kín các luồng nguồn; chưa phải OpenAPI đã được BE triển khai. Các giá trị cần chốt có ở 00_SCOPE_AND_DECISIONS.md.
- Bàn giao IN_PROGRESS về TODO là lựa chọn D06 để mock nhất quán; nguồn yêu cầu lưu lịch sử và kiểm tra trạng thái nhưng chưa chốt đầy đủ chuyển đổi này.
- Không thêm thiết kế dữ liệu tổng thể/ERD của người 3. Mock model và projection chỉ mô tả dữ liệu cần cho nghiệp vụ/HTTP.
- Không thêm chat, lương/chi phí, đăng ký công khai, inbox thông báo hoặc AI tự điều hành. Notification delivery là trách nhiệm BE sau commit; không phải một màn mới.

Để kiểm tra một chức năng: tra dòng UC ở đây → SCREEN_SPECIFICATIONS.md → API_CATALOG/DTO → state TXT và MOCK_MODELS → checklist/KT tương ứng. Codex phải báo luồng thay thế/ngoại lệ chưa làm, không chỉ đối chiếu tên màn.
