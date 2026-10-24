# Quy tắc cho ứng dụng FE

Đọc `docs/ARCHITECTURE.md`, `docs/SPEC_REVIEW.md` và `docs/IMPLEMENTATION_STATUS.md` trước khi tiếp tục. Đặc tả nghiệp vụ gốc ở `fe-specs/`; contract giữ phiên bản 0.3.0.

Theo yêu cầu người dùng ngày 24/10/2026, tổ chức code tham khảo `D:/TTZinza/vietcd/frontend`: `app`, `components`, `features`, `hooks`, `lib`, `services`, `stores`, `types`, `mocks`. Thay thế các đường dẫn cấu trúc đích `shared/...` cũ trong tài liệu bằng cấu trúc ở `docs/ARCHITECTURE.md`; giữ nguyên các yêu cầu nghiệp vụ, quyền, validation, trạng thái và cache.

- Schema/DTO nghiệp vụ nằm tại `features/<feature>/schemas` và `types`; không tạo lại file DTO chung chứa mọi feature.
- Route chỉ ghép màn. `components/ui` không fetch dữ liệu. Feature component dùng hooks; hooks gọi service; service gửi HTTP qua `services/api-client.ts`.
- MSW chỉ chặn HTTP ở môi trường development/test. Chỉ `app/providers.tsx` được dynamic import browser worker; component/service/store không đọc mock hoặc gọi mock DB.
- Trong `mocks`: `handlers` xử lý HTTP, `db` kiểm tra/thay đổi state, `data` chứa seed, `utils` quản lý envelope/version/idempotency. Không import browser worker vào RSC.
- `index.ts` là public API thuần; `client.ts` export hooks/UI. Cross-feature chỉ dùng public API. Services và types dùng chung không import feature.
- `npm run contracts` sinh contract, schema, service, key và hook từ các bảng trong `fe-specs`. Sửa generator hoặc nguồn đặc tả khi thay đổi file có dòng Generated; không sửa file generated riêng lẻ.
- Token chỉ nằm trong auth transport adapter. Login/refresh service tiêu thụ token rồi trả SessionDTO; không lưu credential trong Query cache, Zustand hoặc localStorage.
- Không khai báo một endpoint đã hoàn thành chỉ vì đã có schema/service. Cập nhật trạng thái handler, UI và test riêng trong tài liệu trạng thái.
- Chạy `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` cho các thay đổi phù hợp. Tests tích hợp phải gọi feature service qua HTTP/MSW, không thay API client bằng mock function.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
