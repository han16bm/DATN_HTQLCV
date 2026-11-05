# Đủ 16 chỉ số và cách gắn với giao diện

`getDashboard` trả `metrics` đủ K01–K16, không trùng mã. Mỗi metric có label, value, unit, basis, aggregation, denominator và missingFields. Các thẻ chính chỉ là cách bố trí; không bỏ các chỉ số còn lại khỏi contract. `DashboardSchema`, `WorkloadSchema`, `SubmissionSchema` và `TaskSchema.statusChangedAt` cung cấp dữ liệu cần đối chiếu.

| Mã | Ý nghĩa và công thức | Nguồn/field | Phạm vi thời gian và lưu ý |
|---|---|---|---|
| K01 | Đếm công việc không CANCELLED | metrics.K01, projectComparisons.validTaskCount | CURRENT; totalTasks có thể gồm hủy, không dùng totalTasks làm mẫu số K03 |
| K02 | Công việc đã được chấp nhận hoàn thành | metrics.K02, completedTasks | metrics.K02 đếm completedAt trong kỳ; completedTasks là tổng hiện trạng, cần ghi đúng nhãn |
| K03 | Hoàn thành / tổng không hủy ×100 | completionRate, metrics.K03 | CURRENT; mẫu số 0 → null, hiển thị chưa có dữ liệu |
| K04 | Việc mở và serverTime > dueAt | overdueTasks, metrics.K04 | CURRENT; tách PENDING_REVIEW khi mở chi tiết |
| K05 | Việc mở quá hạn / tổng việc mở ×100 | metrics.K05, openTasks | CURRENT; không lấy mẫu số mọi công việc đã kết thúc |
| K06 | Tổng phút TimeLog ACTIVE /60 | actualMinutes, metrics.K06 | PERIOD theo workDate Việt Nam; lọc nhân viên theo TimeLog.userId, không gán giờ người cũ cho người nhận mới |
| K07 | Thực tế − dự kiến, cùng đơn vị | timeVariance.deltaCurrentMinutes/deltaOriginalMinutes | CURRENT theo cohort công việc; hiện cả dự kiến hiện tại và gốc, không kết luận năng lực từ số dương |
| K08 | Nộp đúng/muộn theo dueAtSnapshot | submissionTimeliness và acceptedSubmissionTimeliness | PERIOD theo submittedAt; mẫu số từng lần nộp khác mẫu số công việc hoàn thành. metrics.K08 biểu thị số lần nộp muộn, không phải phần trăm |
| K09 | Nghiệm thu sau hạn của lần nộp được chấp nhận | metrics.K09; Submission.reviewedAt/dueAtSnapshot | PERIOD theo completedAt; không đồng nhất với nộp muộn |
| K10 | reviewedAt − submittedAt; đang chờ dùng dataAsOf | metrics.K10; chi tiết Submission | Mock dùng trung bình các lần nộp trong kỳ để tóm tắt; đơn vị phút liên tục, chi tiết từng lần vẫn giữ. Không cộng vào giờ công |
| K11 | Đếm quyết định REVISION_REQUESTED | metrics.K11, lịch sử Submission | PERIOD theo reviewedAt; không đếm click/retry |
| K12 | Việc TODO/IN_PROGRESS và tổng dự kiến hiện tại theo người nhận | metrics.K12; Workload.openTaskCount/currentEstimateMinutes | CURRENT; PENDING_REVIEW tách riêng, dự kiến gốc không tự coi là còn lại |
| K13 | Khả dụng = lịch làm − nghỉ − phần đã dành cho nghĩa vụ khác | Workload.capacityMinutes, metrics.K13 | PERIOD; không có lịch hợp lệ → null; không mặc định 8 giờ/ngày |
| K14 | Phút còn lại phân bổ trong kỳ / khả dụng cùng kỳ ×100 | Workload.utilizationRate, metrics.K14 | PERIOD; thiếu nguồn hoặc khả dụng 0 → không chia; tỷ lệ >100 có thể hợp lệ để báo quá tải |
| K15 | dataAsOf − lần gần nhất vào trạng thái hiện tại | Task.statusChangedAt, metrics.K15 | CURRENT; mock dùng trung bình việc mở cho thẻ, chi tiết tính từng task. updatedAt không thay statusChangedAt |
| K16 | Báo cáo đã gửi, tách DAILY/WEEKLY | reporting.submittedDaily/submittedWeekly; metrics.K16 | PERIOD theo submittedAt trong phương án này; expectedCount/coverage null khi thiếu lịch yêu cầu. Không cộng báo cáo thành giờ công |

## Các biểu đồ và danh sách

- Phân bố trạng thái dùng byStatus, có nhóm CANCELLED riêng.
- Xu hướng ngày/tuần dùng trend: completedCount theo thời điểm chấp nhận, submissionCount theo lúc nộp, actualMinutes theo workDate. Ngày thiếu bucket không tự điền 0; điền khoảng trống null hoặc chỉ rõ không có dữ liệu xác nhận.
- So sánh dự án dùng projectComparisons, kèm validTaskCount và quality. Không chỉ đặt hai phần trăm cạnh nhau khi quy mô khác nhau mà thiếu bối cảnh.
- Cột theo nhân viên dùng Workload, giữ riêng current estimate, original estimate, remaining, capacity và tỷ lệ tải.
- Hàng chờ nghiệm thu dùng listReviewQueue; thời gian chờ liên kết tới đúng Submission và người có quyền xét.

Khi drilldown, giữ project/unit, owner, nhân viên, status, priority và kỳ ở những metric phù hợp. Filter nhân viên của chỉ số giờ công là người ghi; của số lần nộp là người nộp; của báo cáo là tác giả. Filter status/priority là cohort công việc, không biến thành trạng thái báo cáo. Không dùng trạng thái hiện tại để giả dựng một snapshot hiện trạng lịch sử.

## Phân tích có căn cứ

Phân tích trễ hạn phân biệt OVERDUE với AT_RISK trước hạn và INSUFFICIENT_DATA. Contract 0.3.0 bỏ score/scoreKind; riskLevel là phân loại rule có ruleIds/assessmentBasis=BUSINESS_RULES. LLM có sẵn chỉ diễn giải snapshot và nêu đề xuất có căn cứ, không sinh xác suất/confidence. Workload giữ null nếu thiếu còn lại/lịch khả dụng; bottleneck ghi rõ CONTINUOUS hay WORKING_CALENDAR.

Mỗi KPI có analysisRef; click mở S43 với thông số, công thức, evidence và lời LLM của đúng snapshot. Summary landing trả metrics/highlights/overviewRef; narrative/findings/recommendations nằm trong LlmExplanationDTO. Lỗi/chậm LLM không làm mất KPI; template hệ thống nếu có được gắn nhãn khác AI.

Các ngưỡng 48 giờ liên tục khi chưa có lịch, chờ nghiệm thu 24 giờ, từ 3 vòng sửa và tải trên 100% là ngưỡng thử nghiệm trong báo cáo; BE cần cấu hình và xác nhận trước khi coi là quy tắc vận hành. Mock hiện mô phỏng output/quality và một số dấu hiệu, không phải triển khai đầy đủ mô hình AI hoặc mọi ngưỡng phân tích.
