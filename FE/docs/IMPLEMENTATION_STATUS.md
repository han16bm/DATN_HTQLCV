# Trạng thái triển khai

Cập nhật 24/10/2026 sau yêu cầu điều chỉnh cấu trúc theo vietcd/frontend. Lượt này tập trung hoàn thiện cấu trúc và chứng minh luồng HTTP/MSW trước khi tiếp tục mở rộng UI.

## Đã có

- Next.js App Router, TypeScript strict, Tailwind, RHF/Zod, Zustand UI state, TanStack Query và fetch wrapper chuẩn hóa lỗi.
- 93 schema gốc và 79 operation contract/service/key/hook phân theo 12 feature. Generator lấy từ đặc tả, không đổi HTTP contract.
- 25 MSW handler: auth 4, tasks 10, time-logs 4, submissions 7. Có state trong bộ nhớ, scope quyền, kiểm tra trạng thái, If-Match, idempotency, response validation, rollback khi handler lỗi, audit và notification receipt mô phỏng.
- UI nền: đăng nhập; workspace hiển thị công việc cá nhân; danh sách công việc với URL filter/pagination, loading/empty/error. Đây là nền ban đầu của S01/S02/S15, chưa phải nghiệm thu đầy đủ các màn này.
- Test tích hợp gọi service qua fetch HTTP/MSW, gồm full flow tạo → giao → bắt đầu → ghi giờ → nộp → yêu cầu sửa → nộp lại → nghiệm thu và các ca quyền/version/replay/validation.
- Mock analytics read model đã được viết bước đầu trong `mocks/db/analytics.db.ts`; chưa kết nối handler/UI, chưa tính là hoàn thành phân hệ AI.

## Chưa hoàn thành của yêu cầu ban đầu

- UI đầy đủ S01–S43 và đối chiếu từng bố cục PNG, quyền/action/state theo checklist.
- 54 handler còn lại: users, organization, projects, project-members, reports, attachments, analytics và alerts.
- Snapshot/job/feedback AI tích hợp UI, upload/download minh chứng, luồng báo cáo và đóng dự án.
- Kiểm tra responsive/keyboard/dirty navigation, đầy đủ tình huống ngoại lệ và browser QA cho toàn hệ thống.
- Gateway thật, cookie security, upload scanning, scheduler/dedupe và adapter LLM thật phía BE.

Không coi việc sinh đủ schema/service là đã hoàn thành 79 API mock hoặc 43 màn. Lịch tiếp tục giữ thứ tự tài khoản/tổ chức → dự án/thành viên → công việc/giờ công → nộp/nghiệm thu → báo cáo → dashboard/AI.

## Kiểm tra đã chạy cho phần điều chỉnh cấu trúc

- `npm run typecheck`: thành công.
- `npm run lint`: thành công.
- `npm test`: 13/13 test thành công (9 test HTTP/MSW và 4 kiểm tra ranh giới kiến trúc/cache/contract).
- `npm run build`: thành công, các route `/`, `/login`, `/workspace`, `/tasks` được build.
- Dev server: `/login`, `/tasks` trả HTTP 200 HTML; `/mockServiceWorker.js` trả HTTP 200 JavaScript.
- Production static bundle không chứa chuỗi mật khẩu mẫu, seed mock hoặc import `msw/browser` trong kiểm tra văn bản đã chạy.
- Chưa QA trực quan: computer-use không có browser khả dụng, tạo tab in-app browser bị từ chối vì browser không khả dụng. Test Node không thay thế kiểm tra đăng ký Service Worker trên browser thật.
