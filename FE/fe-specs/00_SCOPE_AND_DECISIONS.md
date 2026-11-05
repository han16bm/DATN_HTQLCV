# Phạm vi và quyết định cho tài liệu FE

## Hợp đồng hiện hành

Quyền, schema và dữ liệu thực thi theo src/features và docs/ARCHITECTURE.md. Các quyết định đề xuất bên dưới phục vụ đối chiếu với BE; không là tài liệu trình bày giao diện.

## Nguồn nghiệp vụ

Nguồn chính là `Bao_cao_phan_tich_he_thong_quan_ly_du_an_va_cong_viec_tich_hop_AI.docx`, bản hợp nhất 70 trang, 27 Use Case: UC-A01–A05, UC-P01–P05, UC-T01–T11, UC-D01–D06. Lấy các quy tắc, trạng thái và quyền từ bản này. Đây là mô hình FE và contract trao đổi, không phải ERD hay cấu trúc lưu trữ BE.

Yêu cầu bổ sung đã chốt trong trao đổi: BE dùng Microservices; FE dùng Next.js App Router, TypeScript strict, Tailwind, component system, React Hook Form, Zod, Zustand cho UI state, TanStack Query cho server state và fetch/Axios wrapper. Chọn shadcn/ui và fetch wrapper làm phương án mặc định. MSW giả lập ở ranh giới HTTP. Gateway là đầu vào công khai chung; quy tắc định tuyến nội bộ do BE quyết định.

## Các quyết định đề xuất dùng thống nhất trong mock

| Mã | Quy ước hiện tại | Mức độ |
|---|---|---|
| D01 | Một public origin của Gateway, prefix `/api`, camelCase, ID dạng chuỗi opaque | Đề xuất kỹ thuật, BE đối chiếu |
| D02 | Access token Bearer giữ trong bộ nhớ; refresh qua cookie HttpOnly do BE quản lý | Đề xuất, cần chốt với BE; không tự chuyển token sang localStorage |
| D03 | Thành công `{data,meta}`; lỗi `{error,meta}`; pagination page/pageSize/total | Đề xuất, cần đối chiếu contract BE |
| D04 | Version số nguyên và If-Match dạng `"1"`; thiếu trả 428, cũ trả 412 | Đề xuất cho concurrency; không đổi sang 409 mà không đồng bộ toàn bộ tài liệu |
| D05 | Mutation nghiệp vụ có Idempotency-Key; auth không bắt buộc khóa này | Đề xuất; scope theo người dùng và operation, cần chốt thời gian lưu khóa trên BE |
| D06 | Assignment đang thực hiện khi bàn giao trở về TODO; giữ firstStartedAt và giờ đã ghi | Quyết định chi tiết để đặc tả mock nhất quán; cần nhóm/BE xác nhận |
| D07 | Refresh nháp trả projection tạm, không sửa nội dung hoặc chốt snapshot | Đề xuất hỗ trợ UI, cần BE đối chiếu |
| D08 | Khóa khẩn cấp thu hồi phiên ngay; xử lý bàn giao/người phụ trách sau đó theo workflow kiểm soát | Nguồn có ngoại lệ khóa khẩn cấp; BE cần chốt ca người phụ trách duy nhất bị khóa |
| D09 | Upload multipart qua Gateway; giới hạn mẫu 20 MiB/tệp, tối đa 10 tệp/lần nộp; PDF/PNG/JPEG/TXT/DOCX | Tham số mẫu, lấy lại từ upload policy của BE; BE kiểm tra MIME thực và nội dung |
| D10 | Job chỉ tạo/reuse lời LLM cho snapshot; 200 khi reuse hoàn tất, 202 khi chờ/chạy; GET poll chỉ đọc | Đề xuất tích hợp LLM có sẵn |
| D11 | API remaining-estimate phục vụ dữ liệu tải công việc; không suy từ dự kiến trừ đã làm | API hỗ trợ đề xuất, cần BE xác nhận; chưa có workflow lịch làm việc trong phạm vi FE |
| D12 | Quản lý tài khoản có API cấp lại mật khẩu tạm; không có đăng ký/reset-password công khai | Phương án hỗ trợ cho chức năng quản trị, BE cần chốt cách cấp mật khẩu và thu hồi phiên |
| D13 | Các mốc sự kiện là UTC; workDate/kỳ báo cáo dùng Asia/Ho_Chi_Minh; deadline luôn có giờ | Theo quy tắc nghiệp vụ |
| D14 | Thông số có snapshot/dataAsOf/calculationVersion/quality; lời LLM có snapshotId/generatedAt/promptVersion/limitations; null không thành 0 | Quy tắc tích hợp mới |
| D15 | assigneeId trên công việc đã kết thúc giữ người phụ trách cuối để tra cứu; phân công hoạt động được kết thúc trong assignment history | Quy ước đọc model FE, cần BE ánh xạ tương đương |

## Phần BE cần chốt trước tích hợp thật

Xác nhận URL Gateway và OpenAPI, ánh xạ enum, cơ chế đăng nhập/refresh/CSRF/CORS, cấu trúc lỗi JSON phẳng, If-Match, idempotency, chính sách upload/download, API cấp lại mật khẩu, quy tắc chuyển đơn vị/thành viên, nguồn lịch khả dụng, cách xác định “báo cáo cần gửi” trước khi đóng dự án và giao thức job AI. Bảng khác biệt phải ghi cả tác động lên UI, schema, DTO, mapper, mock và test. Các mục chưa chốt không ngăn dựng UI với contract đề xuất.

## Tham khảo kỹ thuật

- [Next.js: Backend for Frontend](https://nextjs.org/docs/app/guides/backend-for-frontend)
- [TanStack Query: Query Invalidation](https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation)
- [Zod: Defining schemas](https://zod.dev/api)
- [MSW: Introduction](https://mswjs.io/docs/)
- [MSW: Browser integration](https://mswjs.io/guides/integrations/browser)
- [MSW: setupServer](https://mswjs.io/api/setup-server/)
- [Microsoft: API gateways](https://learn.microsoft.com/en-us/azure/architecture/microservices/design/gateway)

Các nguồn kỹ thuật được đối chiếu ngày 23/10/2026. Nội dung định tuyến, mock và validation trong bộ này là phương án áp dụng cho dự án, không phải trích dẫn nguyên văn.
