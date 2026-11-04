# Frontend DATN

## Nguồn hướng dẫn

- Kiến trúc: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
- Thiết kế: nạp [../Skill FE/codex/AGENTS.md](../Skill%20FE/codex/AGENTS.md), system-prompt.md và skill phù hợp trước khi làm giao diện. Bộ hướng dẫn này thay toàn bộ quy tắc thiết kế cũ đã xóa; không khôi phục lịch sử layout/token cũ.
- Hướng triển khai và kiểm tra của bản hiện tại: [docs/DESIGN.md](docs/DESIGN.md).
- API, DTO, state machine và mock policy: fe-specs/api, fe-specs/rules, fe-specs/screens/*.txt và schema hiện hành trong src/features.

## Ràng buộc kiến trúc

- Next.js App Router, TypeScript strict, Tailwind, React Hook Form/Zod, TanStack Query và Zustand cho UI state. Đọc hướng dẫn Next.js liên quan tại node_modules/next/dist/docs trước khi thay API/framework.
- UI → hook → service Axios → HTTP → MSW handler → DB tạm. Không import mock vào UI/service, không tạo dữ liệu giả trong component. Handler chỉ đọc request, xác thực và gọi DB.
- Mỗi feature có api/schemas/types/hooks/components. Không tạo registry, generator, contract/interface lặp, barrel hoặc metadata dựng form khi không có nhu cầu thực tế.
- DTO chỉ trả dữ liệu có consumer; giữ ID/version/citation dùng cho điều hướng, ghi dữ liệu và đối chiếu dù không in ra màn.
- canVisit chặn trang trước khi mount query; quyền ghi, phạm vi dự án, người nhận/tác giả và cấm tự nghiệm thu vẫn được BE kiểm tra. Thiết kế lại không thay API/quyền/state machine.
- React Query giữ server state và session, key tách theo viewer. Filter/pagination ở URL; đổi filter reset page, đổi chế độ xem giữ filter. Zustand không giữ bản sao dữ liệu server.
- Form dùng useForm/zodResolver và field rõ ràng; giữ dirty guard, pending, whitelist patch, If-Match/Idempotency-Key và xử lý 412 giữ draft.
- Token chỉ ở bộ nhớ; không ghi credential hoặc byte upload vào cache/store/localStorage.

## Yêu cầu sản phẩm đã chốt

- Sidebar chứa chức năng chung cho mọi role; header chỉ có chức năng quản lý bổ sung theo quyền. Khu quản trị riêng qua avatar. Không thêm chức năng ngoài phạm vi để lấp bố cục.
- Mục /workspace là Tổng quan; bộ lọc Việc của tôi chỉ hiện với Manager/Admin. Người dùng/hồ sơ/đăng xuất ở menu avatar.
- Trạng thái tải đặt tại vùng thực sự fetch, không có spinner toàn cục trên header. Giữ khung báo cáo đính kèm kể cả khi không có tệp.
- Hồ sơ công khai chỉ gồm thông tin giới thiệu và email sau đăng nhập; hồ sơ cá nhân sửa thông tin trừ email, avatar kéo/zoom/cắt và tab ngang.
- Dùng tên người/avatar từ DTO, không fetch từng người để trang trí. Nội dung/giờ công/chỉ số lấy từ API, không thêm số liệu hoặc tính năng minh họa.
- Khi kiểm tra UI, chỉ thao tác Edge đang mở theo lựa chọn người dùng; không dùng Playwright/CDP hoặc tự mở trình duyệt khác. Không cần chụp bộ ảnh. Nếu kết nối không hoạt động, tiếp tục công việc độc lập và ghi đúng giới hạn QA.

## Kiểm tra

Chạy typecheck, lint, test phù hợp và build. Test phải xác nhận hành vi/HTTP/quyền/state thật, không kiểm tra sao chép class CSS. Không sửa logic nghiệp vụ chỉ để test đạt. Không commit/push nếu chưa được yêu cầu.
