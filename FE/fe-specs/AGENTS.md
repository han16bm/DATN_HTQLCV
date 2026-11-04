# Đặc tả nghiệp vụ và tích hợp

Kiến trúc hiện hành theo [../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) và [../AGENTS.md](../AGENTS.md). Tài liệu thiết kế giao diện cũ đã bỏ theo yêu cầu người dùng; không dùng PNG/mô tả trình bày cũ để ràng buộc redesign.

- Giữ route/payload/DTO hiện hành trong api/ và schema src/features; đồng bộ service, MSW, DB, tài liệu và kiểm thử khi contract thực sự thay đổi.
- Nghiệp vụ: state machine task, quyền theo phạm vi, cấm tự nghiệm thu, thời gian thủ công, VOID có lý do, snapshot báo cáo/AI bất biến, source/citation/quality và version/idempotency.
- API qua HTTP thật; MSW chặn request và gọi DB tạm, không import fixture vào sản phẩm.
- Không đổi null thành số 0, không thêm dữ liệu để lấp UI, không tự suy quyền từ việc menu đang hiện.
- Checklist nghiệp vụ và state TXT tiếp tục được dùng; giao diện theo Skill FE/codex và bản triển khai hiện tại.
