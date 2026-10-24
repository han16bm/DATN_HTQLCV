# Trạng thái triển khai

Cập nhật 24/10/2026. Đã triển khai tuần tự các luồng chính từ S01 đến S43 theo kiến trúc tham khảo vietcd/frontend. Đây là bản FE dùng HTTP/MSW; chưa nối Gateway hoặc LLM thật và chưa nghiệm thu giao diện trên browser.

## Phạm vi chức năng

| Màn      | Chức năng đã nối UI → hook → HTTP → MSW                                                                                                                             |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S01–S02  | Đăng nhập/đăng xuất, phục hồi phiên, menu theo quyền, workspace cá nhân, dự án tham gia, báo cáo nháp và hàng chờ nghiệm thu                                        |
| S03–S05  | Tìm/lọc tài khoản, tạo/sửa, khóa thường/khẩn cấp, mở khóa, cấp lại mật khẩu, bảo vệ admin cuối, thu hồi phiên                                                       |
| S06–S07  | Đơn vị cha/con, người phụ trách, tạo/sửa/ngừng sử dụng đơn vị và nhóm, thay thành viên nhóm                                                                         |
| S08–S11  | Danh sách/chi tiết/tạo/sửa dự án, triển khai, kế hoạch và lịch sử trước/sau                                                                                         |
| S12–S14  | Thêm/kết thúc thành viên, phân quyền trong thẩm quyền, bảo vệ OWNER, kiểm tra điều kiện kết thúc/hủy dự án                                                          |
| S15–S21  | Danh sách/bảng trạng thái, bộ lọc URL, tạo/chi tiết/sửa/giao/bàn giao/bắt đầu/tạm dừng/hủy công việc, cập nhật ước lượng còn lại                                    |
| S22–S23  | Ghi/sửa/VOID giờ công thủ công, ngày theo phân công, tổng mọi công việc không quá 1.440 phút/người/ngày                                                             |
| S24–S28  | Nộp/nộp lại, lịch sử lần nộp, hàng chờ, đối chiếu tiêu chí và nghiệm thu/yêu cầu sửa, lịch sử công việc                                                             |
| S29–S32  | Lọc báo cáo, chọn kỳ ngày/tuần, xử lý trùng kỳ bằng existingReportId, nháp riêng tư, làm mới, lưu/gửi và snapshot bất biến                                          |
| S33–S36  | Dashboard đủ K01–K16, biểu đồ trạng thái/xu hướng, so sánh dự án, nguy cơ task/dự án, workload và điểm nghẽn                                                        |
| S37–S39  | Cảnh báo, ghi nhận xử lý bằng version/note, tách conditionActive, tổng hợp theo số liệu và liên kết đến phân tích                                                   |
| S40, S43 | Snapshot, thông số/công thức/căn cứ, diễn giải mô phỏng, job async, poll 2–10 giây và tạm dừng sau 2 phút, regenerate, giữ lastSuccess khi lỗi, phản hồi BOTTLENECK |
| S41      | Upload multipart theo policy, kiểm tra định dạng/dung lượng/nội dung mẫu, chọn ID READY, tải byte tệp qua HTTP; dùng chung dialog nộp kết quả                       |
| S42      | not-found và error boundary; lỗi 403/404, HTTP/contract/version hiển thị tại màn, không tạo route riêng                                                             |

S16 dùng `/tasks?view=board`; các biểu mẫu phụ dùng hash dialog theo đặc tả. Không tạo 43 route riêng khi đặc tả dùng chung màn/dialog.

## API mock và state

Đủ **79 operation có handler HTTP**, được kiểm tra khớp trực tiếp với API theo feature:

| Feature         | Handler |
| --------------- | ------: |
| auth            |       4 |
| users           |       7 |
| organization    |      11 |
| projects        |       9 |
| project-members |       4 |
| tasks           |      10 |
| time-logs       |       4 |
| submissions     |       6 |
| attachments     |       4 |
| reports         |       7 |
| analytics       |      10 |
| alerts          |       3 |

- Validation theo contract 0.3.0 được chia theo thực thể/nhóm nghiệp vụ; DTO/query/payload/result nằm trong `types`. Các schema kết quả giống nhau dùng một định nghĩa chung; đã bỏ 55 alias DTO không được dùng. Giới hạn một time log được tách khỏi tổng phút báo cáo tuần.
- Đã bỏ generator, endpoint metadata, generic feature hook, registry/manifest, các barrel ở gốc feature và route `/403`, `/404` dư thừa. API contract chỉ chứa interface; service gọi `apiClient.get/post/patch/put` rõ path/payload; hook dùng React Query và khai báo invalidation trực tiếp.
- Các màn báo cáo, nghiệm thu, cảnh báo và phân tích có file riêng. Form dùng chung tách state, field, resolver, lỗi/xung đột; analytics DB tách scope, snapshot và từng nhóm phép tính.
- Đã áp dụng tiêu chí code gọn: rút tên schema/DTO/query/input/args, bỏ parse input lặp trong service và key, dùng cùng query đã chuẩn hóa cho cache và HTTP. Analytics chia sẻ scope giữa khung lọc và màn; DB dùng query đã được handler parse. Form trả output có kiểu theo schema; tạo/sửa dùng callback riêng và props chung, không parse lại nguyên dữ liệu đã kiểm tra. Payload được ghép mới hoặc chỉ gồm phần thay đổi vẫn được kiểm tra.
- Handler chỉ chuyển HTTP sang DB và định dạng status/cookie/header. CRUD, quyền, version, audit, transaction và scheduler nằm ở DB; fixture/policy ở data. Có test ngăn đưa nghiệp vụ hoặc seed trở lại handler và ngăn DB phụ thuộc Request/MSW.
- Request strict whitelist, response Zod, quyền/phạm vi, state machine, If-Match, idempotency, hàng đợi mutation, rollback khi lỗi, audit và outbox mô phỏng.
- Receipt chỉ được replay khi còn quyền hiện tại. Token access có thời hạn, bị thu hồi khi khóa/reset. Login/tạo user/reset mật khẩu/upload dùng ticket tạm để MutationCache không giữ credential hoặc byte tệp; các mutation thông thường nhận variables trực tiếp.
- Query giữ server state; Zustand chỉ giữ menu/dirty form; filter nằm trên URL. Dữ liệu nhạy cảm được dọn khi mất quyền; đổi phiên xóa cache.
- Form giữ input khi lỗi và cho đối chiếu phiên bản mới. Dialog dùng Radix focus trap; có nhắc form chưa lưu khi đóng/rời trang.
- Báo cáo đã gửi và snapshot phân tích không bị ghi đè khi nguồn thay đổi. KPI giờ công lọc theo người ghi, không dồn lịch sử cho người nhận mới.
- Job dùng scheduler mock độc lập GET; danh sách/dashboard không tạo job. Cảnh báo được đánh giá sau command nguồn hoặc scheduler tick, tách khỏi job diễn giải.

## Kiểm tra

- HTTP/MSW: luồng tạo → giao → bắt đầu → ghi giờ → nộp → yêu cầu sửa → nộp lại → nghiệm thu; tài khoản/tổ chức/dự án, báo cáo, tệp, snapshot/job/feedback/cảnh báo.
- Ca ranh giới: đúng thời điểm deadline, nộp đúng hạn nhưng duyệt muộn, hết phiên/mất quyền, replay đồng thời, version cũ, mẫu số 0/null, tuần Việt Nam, nháp riêng tư và số liệu đã chốt.
- Component với React Query và HTTP/MSW thật trong JSDOM: StrictMode chỉ gửi một job, gửi báo cáo 0 giờ, nộp kết quả, giữ nội dung qua xung đột 412 và chấp nhận phiên bản mới để thử lại.
- Kiểm tra sau refactor: `npm run typecheck`, `npm run lint`, `npm test` (**54/54 ca, 8 file**) và `npm run build` đều thành công. Test kiến trúc đối chiếu đủ 79 HTTP route với API catalog; kiểm tra thêm query tương đương dùng chung một cache/request sau chuẩn hóa và payload thừa trường bị từ chối qua HTTP mà không ghi DB. Các ca nghiệp vụ tiếp tục gọi service qua HTTP/MSW. JSDOM không thay cho kiểm tra Service Worker và layout trên browser.
- Dev server chạy tại `http://localhost:3000`; GET các route login/workspace/projects/task/report/dashboard/analytics/reviews và `mockServiceWorker.js` trả HTTP 200. Đây là kiểm tra HTTP, chưa phải kiểm tra thao tác trên browser.
- Quét JavaScript production không có marker mật khẩu mẫu, cookie mock hoặc `msw/browser`; `git diff --check` thành công.

## Phần cần nghiệm thu hoặc BE xác nhận

- Browser QA desktop/tablet/mobile, đối chiếu đầy đủ 24 PNG, bàn phím/focus/back-forward và Service Worker thật. Công cụ computer-use hiện trả inventory browser rỗng.
- Lookup candidate cho PM chưa có trong contract. Tạo dự án dùng đơn vị/người dùng hiện tại; đổi owner chọn thành viên dự án; thêm thành viên dùng mã tài khoản nội bộ do admin cung cấp và API kiểm tra. Không tự thêm endpoint quản trị ngoài quyền.
- Lịch khả dụng, lịch yêu cầu báo cáo chưa có: capacity/utilization/coverage giữ null; closure-check kết hợp báo cáo nháp và fixture requiredReports.
- LLM hiện là diễn giải mô phỏng có nhãn rõ; chưa gọi nhà cung cấp, chưa có đánh giá mô hình dự báo. Ngưỡng cảnh báo là ngưỡng thử nghiệm trong đặc tả.
- Gateway, auth/cookie/CSRF/CORS production, rate limit, quét tệp, lưu trữ bền vững, scheduler và gửi notification thật thuộc phần tích hợp BE. Mock dùng bộ nhớ và reset khi reload.

Không coi bản này là nghiệm thu toàn bộ NFR/KT hoặc giao diện chỉ vì đã có route/handler và tests thành công.
