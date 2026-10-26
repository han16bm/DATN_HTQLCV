# Giao việc và tiêu chí kiểm tra cho agent

## Các đợt triển khai

| Đợt | Phạm vi | Kết quả phải có trước đợt tiếp |
|---|---|---|
| 1 | Shell, routing, login, users, organization | Menu theo quyền; loading/empty/error/forbidden; đổi phiên xóa cache; không có dữ liệu mẫu import trực tiếp |
| 2 | Projects, members, roles | PLANNED/ACTIVE/closed; owner và thành viên hợp lệ; closure checks và cảnh báo chặn |
| 3 | Task list/board/detail/create/edit/assign/execution | Các command riêng, đúng state machine; không cho patch status; deadline UTC/giờ Việt Nam |
| 4 | Time logs, attachments, submissions, review | Giờ công thủ công; VOID có lý do; upload READY; không tự duyệt; một lần nộp đang chờ |
| 5 | Reports | Kỳ Việt Nam, duplicate handling, nháp riêng tư, snapshot bất biến, không cộng giờ hai lần |
| 6 | Dashboard, AI jobs, alerts | Nguồn/thời điểm/quality; null thiếu dữ liệu; job terminal; đề xuất dẫn tới màn nghiệp vụ |
| 7 | Nối BE và hoàn thiện | Bảng khác biệt contract, auth thật, tích hợp Gateway, production build, kiểm thử quyền và luồng hoàn chỉnh |

## Mỗi màn Sxx phải đạt

- Đúng route, bố cục, nhãn, field và action được đặc tả; mobile reflow không mất thao tác thiết yếu.
- Đúng quyền theo dự án và tác giả/người nhận; menu ẩn không thay thế lỗi 403 từ BE.
- Đủ loading, empty, error, forbidden, not-found, pending và conflict khi liên quan; form lỗi giữ nội dung.
- Mọi dữ liệu từ query/API đã parse; không có số liệu filler trình bày như dữ liệu thật.
- Giữ filter/pagination trong URL theo quy định; back/forward hoạt động; chuyển filter reset page phù hợp.
- Field có label; lỗi truy cập được bằng bàn phím/screen reader; confirmation mô tả đúng nghiệp vụ.

## Mỗi mutation phải đạt

- Payload tạo bằng whitelist từ form/mapper; chỉ gửi dirty fields hợp lệ, không gửi thuộc tính server.
- Kiểm tra Zod và điều kiện context; server vẫn kiểm tra lại mọi quyền và trạng thái.
- Đúng version của tài nguyên theo API catalog; không lấy version Task thay cho Submission/TimeLog/Report.
- Một khóa cho cùng lần gửi; disable submit khi pending; retry không sinh bản ghi trùng.
- Không update cache trước khi có response hợp lệ; invalidate đúng nhóm và phạm vi.
- Xử lý riêng 409/412/422; không làm mất nháp, lịch sử hoặc snapshot đã gửi.

## Luồng kiểm tra bắt buộc

1. Đăng nhập nhân viên; chỉ thấy dữ liệu hiện tại/từng tham gia trong dự án còn quyền.
2. Đăng nhập admin không có quyền dự án; không thể đọc/sửa/nghiệm thu công việc của dự án đó.
3. Tạo dự án, thêm thành viên, chỉ định owner, triển khai; thử kết thúc owner cuối cùng và người đang giữ việc mở.
4. Tạo công việc, giao, bắt đầu, tạm dừng có lý do, bắt đầu lại; total minutes không tự tăng từ timer.
5. Đổi hạn/dự kiến sau giao; thiếu lý do bị chặn, giá trị gốc và audit vẫn còn.
6. Ghi/sửa/VOID giờ công; kiểm tra ngày tương lai, trước phân công, nhật ký người khác và tổng nhiều công việc/ngày.
7. Nộp kết quả; thử thiếu summary/giờ công, tệp chưa sẵn sàng và hai lần submit khi mạng chậm.
8. Chờ nghiệm thu khóa các thao tác không được phép; người nộp có quyền review vẫn không tự duyệt được.
9. Yêu cầu sửa, nộp lại tạo sequence mới; nghiệm thu lần cũ hoặc quyết định đồng thời không ghi đè.
10. Lập nháp báo cáo; người khác không đọc nháp. Trùng kỳ mở bản có sẵn theo existingReportId. Gửi chốt snapshot; sửa giờ sau đó không đổi bản đã gửi.
11. Kiểm tra thứ Hai/Chủ nhật theo Việt Nam, ranh giới UTC, đúng thời điểm deadline, mẫu số 0 và capacity 0/null.
12. AI lỗi vẫn giao việc/ghi giờ/nghiệm thu được; cảnh báo có nguồn và thời điểm; đóng cảnh báo không đổi Task status.
13. Mất quyền giữa thao tác, hết phiên, 412, 429, 5xx, offline và response 200 sai schema đều có thông báo phù hợp.

## Báo cáo hoàn thành của agent

Nêu màn/UC đã hoàn thành, file chính đã đổi, contract thay đổi nếu có, lệnh kiểm tra và kết quả, phần đang dùng mock và phần đã nối BE. Không báo “xong toàn bộ” nếu còn nút không có hành vi, endpoint chưa có contract, trạng thái lỗi chưa xử lý hoặc chỉ dùng dữ liệu tĩnh trong component.

## Cách dùng bộ tài liệu

Đọc README và AGENTS.md trước. Chọn đợt triển khai, tra MAIN_SCREENS.md/ảnh màn chính và đặc tả đầy đủ Sxx, tra API/DTO tương ứng, sau đó viết code. State/sitemap ở TXT, không tạo thêm route hoặc PNG cho từng state. Khi tài liệu có thiếu hoặc mâu thuẫn làm đổi nghiệp vụ, ghi chính xác điểm cần giải quyết và các file liên quan trước khi thay contract.

## Nghiệm thu bản thiết kế và thay đổi LLM

- Dựng đủ màn theo ảnh mới và DESIGN_SYSTEM.md, giữ font; kiểm tra desktop/tablet/mobile, contrast/focus và quyền của persona trong ảnh.
- Kiểm tra 5 biến thể S43: RISK, WORKLOAD, BOTTLENECK, SUMMARY, METRIC; các thông số/căn cứ/lời phân tích khớp nhau.
- Dashboard/GET không gọi provider; mở chi tiết reuse/create một lần; refocus/StrictMode không tạo thêm job.
- Kiểm tra loading AI giữ metrics, lỗi giữ metrics/lastSuccess, partial/null không bị kết luận sai, outdated không ghép dữ liệu, expired refetch ref, late-result không ghi nhầm key.
- Không tự đổi task/assignment/report từ recommendation. Giữ các luồng nghiệp vụ trước đó và phân quyền BE như cũ.
- Chạy kiểm tra trên code thật khi được giao triển khai; hiện bộ này chỉ là ảnh và đặc tả.


## Đối chiếu nguồn bắt buộc 0.4

- Tra 27 UC trong FUNCTION_COVERAGE.md và toàn bộ NFR01–NFR10/KT01–KT26 trong SOURCE_QUALITY_AND_SCENARIOS.txt, áp dụng KT23 cho mô hình dự báo nếu sau này bổ sung.
- Xác nhận/bác bỏ BOTTLENECK lưu đúng actor/snapshot/comment, replay không trùng; read-only viewer bị chặn; không đổi task/alert.
- LLM lỗi/không cấu hình vẫn đọc tổng hợp theo mẫu; label không giả đó là AI.
- Đơn vị/nhiều dự án/nhóm nhân sự có lookup đúng quyền; snapshot scope/quality rõ; nguy cơ dự án có căn cứ.
- Notification lỗi sau commit không mất nghiệp vụ; cùng cảnh báo không tạo/gửi trùng liên tục.
- Màn phụ vẫn có đầy đủ hành vi dù không có PNG riêng; không dựng thêm ảnh state/sitemap.
