# Cấu trúc frontend

Quyết định cập nhật 24/10/2026 theo yêu cầu tham khảo `D:/TTZinza/vietcd/frontend`. Đã đọc API client/error, providers, auth contract/service/key/hooks, novel service/hooks và chuỗi MSW handler → DB → data trong dự án tham khảo. Chỉ sử dụng dự án đó làm nguồn tham khảo; không sửa file ở `vietcd`.

## Cây thư mục

```text
src/
  app/                         # App Router, providers, route/layout boundary
  components/
    layout/                    # Workspace shell, navigation
    ui/                        # Control và state dùng chung
  features/<feature>/
    api/
      <feature>.contract.ts    # Method/path, params/query/body/response schema
      <feature>.service.ts     # Hàm API cố định, luôn gửi HTTP
      <feature>.keys.ts        # Query key có viewerId và filter chuẩn hóa
    schemas/<feature>.schema.ts
    types/<feature>.types.ts   # Re-export z.output từ schema
    hooks/use-<feature>-queries.ts
    hooks/use-<feature>-mutations.ts
    components/                # Tạo khi đã có UI thực
    index.ts                   # Public contract/schema/service/key
    client.ts                  # Public hooks/UI
  lib/
    auth/                      # Session context, permission helpers
    query/                     # Query/mutation mechanics dùng chung
    validation/                # Refinement thuần, không phụ thuộc feature
  services/
    api-contract.ts            # Kiểu contract chung
    api-client.ts              # Fetch HTTP, headers, Zod boundary, abort/replay
    http-error.ts              # Chuẩn hóa lỗi HTTP/network
    auth-session.ts            # Token trong bộ nhớ, refresh single-flight
  stores/ui-store.ts           # Zustand chỉ giữ UI state
  types/
    common.ts                  # Value contract chung, refs, pagination, audit
    api/error.ts               # Error envelope và lỗi chuẩn
  contracts/                   # Registry/manifest cho tích hợp, không import vào UI
  mocks/
    browser.ts                 # setupWorker
    node.ts                    # setupServer cho test
    handlers/<feature>.handlers.ts
    db/<feature>.db.ts         # Nghiệp vụ mock và state trong bộ nhớ
    data/seed.mock.json        # Seed deterministic từ fe-specs
    utils/                     # Validate request, envelope, replay, rollback
    reset.ts                   # Reset DB/receipt giữa các test
```

## Luồng dữ liệu

```text
Route → Feature component → React Query hook → Feature service
     → services/api-client → fetch HTTP tới Gateway /api/v1/...
                              ├─ MSW bật: handler → mock DB → HTTP response
                              └─ MSW tắt: Gateway thật → HTTP response
     ← Zod validate envelope/DTO ← React Query cache ← UI
```

Service không kiểm tra chế độ mock, không import fixture và không gọi DB. MSW intercept cùng method/path/header/body mà Gateway thật nhận. Không có `Promise.resolve(mockData)` hoặc fake Axios adapter trong service.

MSW xử lý request ở browser/test và tự tạo HTTP response; nó không chuyển tiếp request đến một mock server khác. Nhờ đó request vẫn xuất hiện trong Network của browser, còn mock store sống trong bộ nhớ của phiên trang. Reload reset dữ liệu nghiệp vụ; không dùng localStorage làm DB.

## Điểm áp dụng từ vietcd

Giữ cách chia `services`, `features/*/api`, hooks, `components/ui`, `mocks/handlers`, `mocks/db`, `mocks/data`. Giữ App Router ghép màn và Query quản lý server state.

Fetch wrapper được giữ theo stack đã chọn ban đầu. Mỗi API vẫn có service cố định như `tasksService.listTasks`, không chọn endpoint động trong component. Schema Zod được phân bổ theo feature; chỉ value object dùng chung nằm ở `types/common.ts`.

Các điểm riêng theo contract DATN: bearer token trong bộ nhớ, refresh bằng cookie, envelope `{data,meta}`/`{error,meta}`, If-Match, Idempotency-Key, kiểm tra response runtime, scope theo dự án và cấm tự nghiệm thu. Không sao chép contract đăng ký/reset-password công khai hoặc refresh token trong localStorage của ứng dụng tham khảo.

## Phân chia state và phụ thuộc

React Query giữ dữ liệu phiên/quyền và tài nguyên server. Zustand chỉ giữ menu và danh sách form đang dirty. React Hook Form giữ input; filter chia sẻ được nằm trên URL. Token được service auth tiêu thụ vào adapter và không trả vào mutation cache.

Schema của auth đọc User qua public users; reports đọc trạng thái Task qua public tasks; response giờ công/nộp sử dụng Task qua public tasks. Analytics đọc enum Task và value refs chung. Không có phụ thuộc ngược từ tasks/users vào analytics. Registry và `mocks/db/model-contracts.ts` là lớp hợp nhất phục vụ tích hợp/test, không phải đường import cho component sản phẩm.

## Cấu hình API

Development mặc định có `NEXT_PUBLIC_API_MOCKING=enabled` trong `.env.development`. Worker chỉ chạy khi `NODE_ENV=development`; providers đợi `worker.start()` thành công trước khi render feature. Khởi động lỗi giữ state lỗi và cho tải lại, không cho request chạy sớm.

`NEXT_PUBLIC_API_ORIGIN` là origin Gateway, ví dụ `https://gateway.example.test`; path đã bao gồm `/api/v1`. Để trống origin dùng cùng origin với FE. Khi nối BE, tắt MSW và đặt origin đã chốt; gọi API từ service không thay đổi. Production build không khởi động worker. Cần kiểm thử auth/CORS/cookie với Gateway thật khi có BE.
