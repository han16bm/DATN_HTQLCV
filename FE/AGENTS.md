# Quy tắc cho ứng dụng FE

Đọc `docs/ARCHITECTURE.md`, `docs/SPEC_REVIEW.md` và `docs/IMPLEMENTATION_STATUS.md` trước khi tiếp tục. Đặc tả nghiệp vụ gốc ở `fe-specs/`; contract giữ phiên bản 0.3.0.

Theo yêu cầu người dùng ngày 24/10/2026, tổ chức code tham khảo `D:/TTZinza/vietcd/frontend`: `app`, `components`, `features`, `hooks`, `lib`, `services`, `stores`, `types`, `mocks`. Thay thế các đường dẫn cấu trúc đích `shared/...` cũ trong tài liệu bằng cấu trúc ở `docs/ARCHITECTURE.md`; giữ nguyên các yêu cầu nghiệp vụ, quyền, validation, trạng thái và cache.

- Schema/DTO nghiệp vụ nằm tại `features/<feature>/schemas` và `types`; không tạo lại file DTO chung chứa mọi feature.
- Route chỉ ghép màn. `components/ui` và `components/forms` không fetch dữ liệu. Feature component dùng hooks; hooks gọi service; service gửi HTTP qua `services/api-client.ts`.
- MSW chỉ chặn HTTP ở môi trường development/test. Chỉ `app/providers.tsx` được dynamic import browser worker; component/service/store không đọc mock hoặc gọi mock DB.
- Trong `mocks`: `handlers` xử lý HTTP, `db` kiểm tra/thay đổi state, `data` chứa seed, `utils` quản lý envelope/version/idempotency. Không import browser worker vào RSC.
- Handler chỉ đăng ký endpoint, chuyển request đã parse cho DB và định dạng HTTP response/header. Không đặt fixture, lọc/mutate collection hoặc kiểm tra nghiệp vụ trong handler. DB nhận DTO/viewer/version đã parse, không nhận Request/Response/MSW. Seed và policy nằm trong `mocks/data`.
- Không tạo lại `src/contracts/registry.ts`, `manifest.json` hoặc barrel schema riêng cho mock. Contract theo feature chỉ khai báo interface TypeScript; service/handler tái sử dụng schema. Test kiểm tra HTTP routes trực tiếp với API catalog. Lỗi quyền hiển thị tại màn, 404 dùng `app/not-found.tsx`; không thêm route `/403`, `/404` riêng.
- Import trực tiếp file cần dùng; không thêm barrel `index.ts`, `hooks.ts`, `client.ts` ở gốc feature. Cross-feature chỉ import đúng schema/type/hook/component cần thiết, tránh kéo UI vào service hoặc tạo vòng phụ thuộc. Services và types dùng chung không import feature.
- DTO/payload/query/result nằm trong `types`, validation runtime nằm trong `schemas`. Chia schema theo thực thể/nhóm nghiệp vụ; mỗi màn có file component riêng. Tái sử dụng DTO và schema kết quả chung thay vì tạo nhiều bản giống nhau theo tên endpoint.
- Theo tiêu chí người dùng: code đủ chức năng, gọn, dễ đọc; mỗi tầng chỉ xử lý đúng trách nhiệm. Form kiểm tra input một lần và trả kiểu suy ra từ schema. Hook chuẩn hóa query một lần rồi dùng cùng dữ liệu cho key và request; analytics dùng scope đã kiểm tra từ URL. Keys không parse. Service nhận input có kiểu, gửi HTTP và giao kiểm tra response cho API client; không parse lại input. HTTP handler là biên server độc lập nên vẫn kiểm tra request; DB không parse lại DTO đã nhận từ handler. Khi tạo payload mới từ nhiều nguồn hoặc chỉ lấy các trường thay đổi, có thể kiểm tra lại hình dạng mới đó.
- Tên ngắn nhưng rõ: `AlertDto`, `TaskQuery`, `CreateTaskInput`, `UpdateTaskArgs`, `alertSchema`. Không lặp tên feature trong tên thực thể, không giữ alias chỉ đổi tên biến hoặc wrapper chỉ gọi tiếp một hàm. Không thêm abstraction chỉ để giảm số dòng.
- Theo yêu cầu refactor toàn bộ, bỏ generator và endpoint metadata. `api/*.contract.ts` chỉ khai báo interface API; service gọi HTTP trực tiếp; hook dùng React Query trực tiếp. Schema/types được bảo trì như code thông thường, tái sử dụng validation, không sinh lại từ đặc tả.
- Token chỉ nằm trong auth transport adapter. Login/refresh service tiêu thụ token rồi trả SessionDTO; không lưu credential trong Query cache, Zustand hoặc localStorage.
- Không khai báo một endpoint đã hoàn thành chỉ vì đã có schema/service. Cập nhật trạng thái handler, UI và test riêng trong tài liệu trạng thái.
- Chạy `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` cho các thay đổi phù hợp. Tests tích hợp phải gọi feature service qua HTTP/MSW, không thay API client bằng mock function.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
