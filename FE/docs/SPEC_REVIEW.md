# Rà soát fe-specs

Ngày 24/10/2026. Nguồn có trong workspace: tài liệu FE 0.4, contract đề xuất 0.3.0, 43 mã màn/biểu mẫu, 24 PNG, 79 operation, 93 schema gốc. Báo cáo nguồn DOCX 70 trang được tài liệu nhắc đến không có trong workspace; rà soát này đối chiếu bộ FE hiện có và mô tả đề tài của người dùng, không khẳng định đã đọc lại DOCX nguồn.

## Kết luận

Đủ đầu vào để dựng FE/MSW: có route/action/field theo S01–S43, quyền theo phạm vi, state machine, whitelist mutation, snapshot báo cáo, lỗi/version/idempotency, 16 KPI, trạng thái/snapshot/job AI, mock seed và kịch bản nghiệp vụ. Đây là contract đề xuất cho mock; chưa thay thế OpenAPI BE thật.

## Điểm cần giữ rõ khi triển khai

| Điểm                                                      | Hiện trạng / cách xử lý                                                                                                                                                                                                                          |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Giới hạn tệp                                              | NFR nguồn ghi 10 MB, quyết định mock D09 chọn 20 MiB. UI lấy từ upload policy; nhóm/BE cần thống nhất giới hạn vận hành.                                                                                                                         |
| Lookup người dùng và đơn vị cho tạo dự án/thêm thành viên | Analytics đã có lookup riêng theo quyền. Các form ngoài analytics chưa có API candidate rõ cho PM không có USERS_MANAGE/ORGANIZATION_MANAGE. Không tự thêm endpoint; cần chốt nguồn lựa chọn và scope với BE trước khi hoàn thiện các select đó. |
| Bearer/refresh/CSRF/CORS                                  | Được nêu là đề xuất D02. Mock dùng cookie mẫu; chưa phải nghiệm thu phiên/cookie production.                                                                                                                                                     |
| Bàn giao và khóa tài khoản                                | D06 chuyển IN_PROGRESS về TODO; D08 khóa khẩn cấp trước bàn giao. Dùng theo quyết định mock, ghi lại khi BE thay đổi.                                                                                                                            |
| Đóng dự án và báo cáo bắt buộc                            | Có closure-check API nhưng nguồn dữ liệu pendingReportCount còn là fixture. BE cần chốt lịch và báo cáo bắt buộc.                                                                                                                                |
| Tải công việc                                             | Chưa có lịch khả dụng trong phạm vi. Giữ capacity/utilization null, không mặc định 8 giờ/ngày hoặc kết luận quá tải từ số task.                                                                                                                  |
| UI phụ                                                    | 19 mã không có PNG vẫn có đặc tả; phải dùng pattern cùng feature, không bỏ màn vì thiếu ảnh.                                                                                                                                                     |
| AI                                                        | MSW chỉ mô phỏng lời phân tích có căn cứ. Không gọi provider hoặc tuyên bố đã tích hợp LLM thật. Metrics/template và trạng thái AI phải tách biệt.                                                                                               |
| Cấu trúc code                                             | Đã điều chỉnh theo vietcd/frontend theo yêu cầu mới. Schema phân theo feature, API qua HTTP, mock tách handler/DB/data. Không thay đổi contract nghiệp vụ.                                                                                       |

Những điểm còn cần BE xác nhận không chặn xây mock theo contract đề xuất, nhưng phải được xử lý trước tích hợp thật. Trạng thái code/UI/handler được theo dõi riêng tại `IMPLEMENTATION_STATUS.md`.
