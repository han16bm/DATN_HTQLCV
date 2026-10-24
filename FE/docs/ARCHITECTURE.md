# Cấu trúc frontend

Cập nhật 24/10/2026, tham khảo cách tổ chức và luồng auth của `D:/TTZinza/vietcd/frontend`. FE dùng Next.js App Router, TypeScript strict, Tailwind CSS, React Hook Form, Zod, Zustand và TanStack Query. Các yêu cầu nghiệp vụ theo bộ đặc tả và API catalog 0.3.0 trong `fe-specs/`.

## Thư mục và trách nhiệm

```text
src/
  app/                              # Route, layout, providers, error boundary
  components/
    layout/                         # Workspace shell, navigation, dirty guard
    ui/                             # Control và trạng thái giao diện dùng chung
    forms/                          # Form RHF, field, resolver, lỗi/xung đột version
  features/<feature>/
    api/
      <feature>.contract.ts         # Interface TypeScript mô tả các hàm API
      <feature>.service.ts          # Gửi input có kiểu qua HTTP, khai báo response schema
      <feature>.keys.ts             # Query key từ viewer, resource và filter đã chuẩn hóa
    schemas/                        # Zod validation theo thực thể/nhóm nghiệp vụ
    types/<feature>.types.ts        # DTO, payload, query, result, mutation variables
    hooks/
      use-<feature>-queries.ts      # useQuery + service + query key
      use-<feature>-mutations.ts    # useMutation + service + invalidation
    components/                     # Mỗi màn một file; form/dialog chia riêng
  lib/
    auth/                           # Session context và permission helper
    crypto/                         # Fingerprint dùng chung cho retry/receipt
    forms/                          # Snapshot khi chỉnh sửa
    query/                          # Access error, retry key, cache, URL filters
    validation/                     # Schema giá trị chung và các refinements
  services/                         # HTTP transport, lỗi, token/refresh adapter
  stores/                           # State UI client-only
  types/                            # Envelope/error, Page<T>, value types chung
  mocks/
    handlers/                       # MSW routes, parse HTTP, gọi DB, response/header
    db/                             # CRUD, scope/quyền, state machine, audit
      analytics/                    # Scope, KPI, snapshot, risk/workload/bottleneck
    data/                           # Seed, bootstrap, upload policy, byte tệp mẫu
    utils/                          # HTTP envelope/scenario/receipt, pagination
    browser.ts                      # Browser worker
    node.ts                         # Test server
tests/                              # Kiểm thử qua HTTP/MSW và component JSDOM
```

Import trực tiếp file cần dùng. Không có barrel `index.ts`, `client.ts`, `hooks.ts` ở gốc feature. Module chỉ phụ thuộc đúng type/schema/hook/component cần thiết; service và shared types không phụ thuộc mock hoặc UI. Schema không export DTO; file types suy ra kiểu từ schema bằng import type để tránh hai nguồn định nghĩa hình dạng dữ liệu.

## Luồng đọc và ghi dữ liệu

```text
App route → feature component → React Query hook → feature service
         → fetch HTTP /api/v1/... → MSW handler → mock DB → seed/state
```

Ví dụ cảnh báo: `alerts-page.tsx` gọi `useListAlertsQuery(query)`. Hook kiểm tra và chuẩn hóa query một lần, truyền cùng `filters` vào `alertsKeys.listAlerts(viewerId, filters)` và `alertsService.listAlerts(filters, { signal })`. Key chỉ tạo mảng định danh; service gửi đúng input được truyền vào. API client thêm base URL/bearer, kiểm tra envelope/response bằng Zod và chuẩn hóa lỗi. `alerts.handlers.ts` là biên HTTP server độc lập: parse query rồi gọi `alertsDb.listAlerts(viewer, query)`. DB kiểm tra nghiệp vụ, lọc dữ liệu và trả DTO; handler tạo envelope `{ data, meta }`.

Analytics có `useAnalyticsScope` đọc và kiểm tra bộ lọc URL một lần; màn truyền cùng scope cho khung lọc và query hook. Query hook analytics nhận scope đã kiểm tra nên không parse lại. Không tự viết hàm sắp xếp object cho query key; React Query xử lý key object. Service cũng không thêm default hoặc parse lại query/payload. Khi gọi service trực tiếp, caller truyền tham số cần gửi; handler áp dụng default của API cho trường bị bỏ trống.

Mutation như cập nhật cảnh báo gọi `alertsService.updateAlert(alertId, payload, { version, key })`. HTTP adapter gửi `If-Match` và `Idempotency-Key`. Hook giữ key cho lần thử lại cùng nội dung và invalidate rõ các query liên quan khi thành công. Không dùng endpoint descriptor, generic feature hook, registry/manifest hoặc generator.

Handler không chứa fixture, lọc collection hoặc nghiệp vụ. DB nhận viewer, ID, payload/query và version cần thiết, không nhận `Request`, `Response` hoặc API MSW. `mockCommand` đảm nhận transaction/receipt và chỉ kiểm tra lại quyền khi replay; kiểm tra thao tác mới nằm trong DB. Một triển khai `requireVersion` được dùng chung. Transaction serialize các command và rollback khi thất bại.

`mocks/db/analytics` tách scope, snapshot và từng nhóm phép tính khỏi các hàm API trong `analytics.db.ts`. Các màn analytics/report/submission/alert được chia file; component dùng chung như số liệu báo cáo hoặc form phản hồi được import trực tiếp và không sao chép logic.

## State và form

- React Query quản lý dữ liệu server và session; query key có viewer để phân tách phiên. Hook xử lý 403/410 qua helper chung, xóa dữ liệu không còn được phép xem.
- Zustand chỉ giữ menu và dấu form chưa lưu. Bộ lọc có thể chia sẻ nằm trên URL. React Hook Form giữ input và validation theo Zod.
- Form dùng chung tách phần điều khiển form, field, resolver, lỗi và wrapper version. `onSubmit` nhận kiểu output suy ra từ schema, dùng thẳng dữ liệu đã kiểm tra. Form tạo/sửa chọn schema và callback có kiểu riêng, chia sẻ props hiển thị. Chỉ kiểm tra lại khi dựng payload mới từ nhiều nguồn hoặc lấy phần thay đổi. Form giữ dữ liệu khi 412, cho tải bản mới để đối chiếu rồi xác nhận dùng version mới khi lưu lại.
- Access token nằm trong transport adapter, chỉ trong bộ nhớ. Auth service tiêu thụ token và trả `AuthSessionDTO`; không đưa token/password vào Query cache, Zustand hoặc localStorage.
- Login, tạo user, reset mật khẩu và upload dùng ticket tạm để MutationCache không giữ mật khẩu/byte tệp. Các mutation thông thường nhận variables trực tiếp. Download trả Blob cho hook tiêu thụ và thu hồi Object URL.

Các yêu cầu riêng của DATN được giữ: quyền theo dự án, state machine, cấm tự nghiệm thu, version, replay có kiểm tra quyền hiện tại, snapshot báo cáo/phân tích bất biến và job AI mô phỏng bất đồng bộ.

## Quy tắc viết code

Ưu tiên đủ chức năng, gọn và dễ lần theo luồng. Tên dùng đúng ngữ cảnh: `AlertDto`, `TaskQuery`, `CreateTaskInput`, `UpdateTaskArgs`, `alertSchema`, `analyticsQuerySchema`. Không lặp tiền tố feature, không giữ biến chỉ gán lại tham số, không bọc `Promise.all` cho một request, không tạo biến chỉ để return ngay. Chỉ tách helper khi có trách nhiệm độc lập hoặc logic được dùng lại; không tạo factory để che lời gọi service/query.

## Chuyển giữa mock và backend

Development dùng `NEXT_PUBLIC_API_MOCKING=enabled` trong `.env.development`. Chỉ `app/providers.tsx` dynamic import browser worker khi `NODE_ENV=development` và đợi worker sẵn sàng trước khi render feature. Test dùng MSW Node server và gọi chính feature service qua HTTP.

`NEXT_PUBLIC_API_ORIGIN` là origin Gateway, ví dụ `https://gateway.example.test`; HTTP adapter tự thêm `/api/v1`, service chỉ dùng path như `/tasks`. Để trống biến này sẽ dùng cùng origin với FE. Khi nối BE, tắt MSW và cấu hình origin; component/hook/service tiếp tục dùng cùng luồng HTTP. Production không khởi động worker.

Mock DB tồn tại trong bộ nhớ và reset khi reload. Cần kiểm thử riêng auth/cookie/CORS, scheduler, lưu trữ tệp và LLM khi có Gateway thật. Mức độ hoàn thành và giới hạn QA được ghi trong `IMPLEMENTATION_STATUS.md`.
