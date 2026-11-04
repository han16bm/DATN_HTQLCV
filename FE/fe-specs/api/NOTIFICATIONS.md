# Thông báo cá nhân — 03/11/2026

Người dùng yêu cầu tiếp tục cả phần chuông thông báo của lượt Claude. Phần này bổ sung hợp đồng đang có; quy tắc cũ không thêm chuông khi chưa có yêu cầu được thay bởi yêu cầu này. Chỉ thêm popover trên header, không tạo route/màn inbox.

| API | Request | Response |
|---|---|---|
| GET /api/notifications | page mặc định 1, pageSize mặc định 10, tối đa 100 | `{items: NotificationDto[], pagination: {page,pageSize,total}}` |
| GET /api/notifications/summary | Không query/body | `{unreadCount}` |
| PATCH /api/notifications/:notificationId | `{read:true}`, Idempotency-Key; không If-Match | `{id,readAt}` với readAt không null |

NotificationDto chỉ gồm `id`, `type`, `title`, `href`, `createdAt`, `readAt` nullable. Không trả recipientId, eventId, trạng thái gửi hoặc số lần gửi của outbox. `type`: TASK_ASSIGNED, TASK_UPDATED, RESULT_SUBMITTED, RESULT_APPROVED, CHANGES_REQUESTED, ALERT_CREATED. href do BE tạo, trỏ task, đúng lần nộp hoặc cảnh báo hiện có.

Mọi endpoint yêu cầu đăng nhập và tự lấy người nhận từ phiên; không nhận userId từ FE. Danh sách/count chỉ có thông báo của người nhận và đối tượng vẫn được phép đọc. Đọc ID của người khác hoặc không còn thấy trả 404. Danh sách mới nhất trước, cùng thời điểm thì sự kiện tạo sau đứng trước, sắp xếp trước phân trang. GET không chạy rule hoặc phát sinh sự kiện. Mark read chỉ chuyển chưa đọc → đã đọc, không thay readAt ở lần sau; replay cùng key không lặp thay đổi và kiểm tra lại quyền.

Mock dùng outbox sẵn có, thêm loại, taskId, submissionId/alertId khi có, createdAt/readAt. Giao việc và đổi kế hoạch gửi người nhận; nộp kết quả gửi chủ dự án; chấp nhận/yêu cầu sửa gửi người nộp; rule cảnh báo gửi chủ dự án. Sự kiện đi cùng giao dịch đã lưu, rollback không giữ sự kiện và replay không tạo bản thứ hai. Lỗi kênh gửi ngoài không xóa thông báo trong ứng dụng hoặc rollback nghiệp vụ. Không giả thông báo lịch sử khi chưa có sự kiện; ban đầu danh sách có thể rỗng.

React Query giữ summary theo viewer, poll 30 giây khi hoạt động; list chỉ mount request khi mở chuông, 10/trang. Mở lại làm mới; đọc thành công áp id/readAt vào các trang cache và làm mới count cùng viewer, không tải lại list chỉ để biết đã đọc. Không trả lại title/type/href khi mark read vì đã có trong danh sách. Bấm thông báo kiểm tra dữ liệu chưa lưu, đánh dấu đã đọc rồi mở href; lỗi lưu giữ popover cho thử lại. Có loading/rỗng/lỗi/phân trang, Escape/focus/viewport theo Radix Popover. BE thật (04/11/2026): Tasks.Api `NotificationsController` + bảng `Notifications` (migration `AddNotifications`), Gateway route `/api/notifications/{**catch-all}`; thông báo ghi cùng SaveChanges với giao việc, đổi kế hoạch, nộp, chấp nhận/yêu cầu sửa và cảnh báo mới (Analytics.Api). Chưa có WebSocket: FE poll 30 giây.
