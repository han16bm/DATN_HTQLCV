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
  services/
    api-client.ts                   # Axios, options, token bộ nhớ, refresh và response validation
    http-error.ts                   # Chuẩn hóa lỗi HTTP/network và quy tắc retry
  stores/                           # State UI client-only
  types/                            # Envelope/error, Page<T>, value types chung
  mocks/
    data.json                       # Toàn bộ seed, policy và nội dung tệp mẫu
    db.ts                           # DB bộ nhớ, reset/clock, CRUD và nghiệp vụ theo nhóm
    handlers/
      <feature>.handlers.ts         # Chặn API, parse request, gọi DB, trả HTTP response
      http.ts                       # Envelope, scenario, auth request và receipt dùng chung
      index.ts                      # Đăng ký các nhóm handler
    browser.ts                      # Browser worker
    node.ts                         # Test server và reset DB/receipt
tests/                              # Kiểm thử qua HTTP/MSW và component JSDOM
```

Import trực tiếp file cần dùng. Không có barrel `index.ts`, `client.ts`, `hooks.ts` ở gốc feature. Module chỉ phụ thuộc đúng type/schema/hook/component cần thiết; service và shared types không phụ thuộc mock hoặc UI. Schema không export DTO; file types suy ra kiểu từ schema bằng import type để tránh hai nguồn định nghĩa hình dạng dữ liệu.

## Luồng đọc và ghi dữ liệu

```text
App route → feature component → React Query hook → feature service
         → Axios HTTP /api/v1/... → MSW handler → mock DB → seed/state
```

Ví dụ cảnh báo: `alerts-page.tsx` gọi `useListAlertsQuery(query)`. Hook kiểm tra và chuẩn hóa query một lần, truyền cùng `filters` vào `alertsKeys.listAlerts(viewerId, filters)` và `alertsService.listAlerts(filters, { signal })`. Key chỉ tạo mảng định danh; service gửi đúng input được truyền vào. API client thêm base URL/bearer, kiểm tra envelope/response bằng Zod và chuẩn hóa lỗi. `alerts.handlers.ts` là biên HTTP server độc lập: parse query rồi gọi `alertsDb.listAlerts(viewer, query)`. DB kiểm tra nghiệp vụ, lọc dữ liệu và trả DTO; handler tạo envelope `{ data, meta }`.

Service gọi trực tiếp Axios, ví dụ `apiClient.get<unknown>("/alerts", { ...options, params: query }).then(parseResponse(page(alertRowSchema)))`. Axios xử lý query params, JSON/FormData, timeout 15 giây và `AbortSignal`; dùng fetch adapter để HTTP/MSW và Blob hoạt động thống nhất giữa browser/test. Không có lớp bọc `get/post/patch/put` riêng. `parseResponse` kiểm tra envelope và schema kết quả; download dùng `responseType: "blob"` cùng `parseFile` để kiểm tra metadata. Interceptor thêm header, refresh một lần khi 401 và chuẩn hóa lỗi, kể cả JSON lỗi trong Blob. Lỗi hủy request giữ dấu cancellation của Axios, bỏ config/request chứa dữ liệu nhạy cảm và không được retry như lỗi mạng.

Analytics có `useAnalyticsScope` đọc và kiểm tra bộ lọc URL một lần; màn truyền cùng scope cho khung lọc và query hook. Query hook analytics nhận scope đã kiểm tra nên không parse lại. Không tự viết hàm sắp xếp object cho query key; React Query xử lý key object. Service cũng không thêm default hoặc parse lại query/payload. Khi gọi service trực tiếp, caller truyền tham số cần gửi; handler áp dụng default của API cho trường bị bỏ trống.

Mutation như cập nhật cảnh báo gọi `alertsService.updateAlert(alertId, payload, { version, key })`. Axios interceptor gửi `If-Match` và `Idempotency-Key`. Hook giữ key cho lần thử lại cùng nội dung và invalidate rõ các query liên quan khi thành công. Không dùng endpoint descriptor, generic feature hook, registry/manifest hoặc generator.

Handler không chứa fixture, lọc collection hoặc nghiệp vụ. DB nhận viewer, ID, payload/query và version cần thiết, không nhận `Request`, `Response` hoặc API MSW. `mockCommand` đảm nhận transaction/receipt và chỉ kiểm tra lại quyền khi replay; kiểm tra thao tác mới nằm trong DB. Một triển khai `requireVersion` được dùng chung. Transaction serialize các command và rollback khi thất bại.

`mocks/db.ts` chứa các nhóm xử lý quyền, CRUD, báo cáo, phân tích và cảnh báo; handler import trực tiếp từ file này. Dữ liệu mẫu của báo cáo/audit/phân tích/tệp đã đưa hết vào `data.json`, không chạy bootstrap fixture riêng. `handlers/http.ts` chỉ xử lý phần HTTP dùng chung; `node.ts` reset DB và receipt khi test. Đã bỏ các folder db/data/utils cũ và file reset chuyển tiếp. Các màn analytics/report/submission/alert được chia file; component dùng chung như số liệu báo cáo hoặc form phản hồi được import trực tiếp và không sao chép logic.

## Model, DTO và component

Model nội bộ trong db.ts mô tả dữ liệu được lưu; DTO mô tả dữ liệu trao đổi qua HTTP; input mô tả các trường được phép gửi; `FormOption` mô tả lựa chọn hiển thị. Model được suy ra từ phần dữ liệu gốc của schema, DTO/input vẫn suy ra từ schema của feature. Không xây thêm ERD hoặc sao chép một bộ interface chứa cùng dữ liệu.

| Điểm rà soát                         | Kết quả và cách xử lý                                                                                                                                                                                                                                                                    |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Task lưu cả tổng giờ và cờ quá hạn   | Đã bỏ `actualMinutes`, `isOverdue` khỏi model/seed. Projection tính từ time log ACTIVE, trạng thái và clock hiện tại. Lần nộp vẫn chốt `actualMinutesSnapshot` để giữ lịch sử.                                                                                                           |
| Analysis lưu metadata theo người đọc | Model giữ snapshot, diễn giải, chính sách tạo job và tổng hợp hệ thống; `freshness` và `feedback` được dựng khi đọc theo revision/quyền hiện tại. Kiểm tra citation/snapshot dùng chung cho model và DTO; DTO kiểm tra thêm metadata trả ra.                                             |
| DTO tham chiếu và payload            | ID dùng cho quan hệ; nhãn người/dự án/đơn vị là dữ liệu read-only phục vụ màn. Payload strict và riêng cho từng thao tác; không lấy nguyên DTO làm input. Response hiện hành được rút gọn theo toàn bộ nơi dùng trong màn và thao tác; không trả nguyên model hoặc detail cho danh sách. |
| Upload policy                        | DTO đã có maxBytes/maxAttachments/allowedMimeTypes; lỗi nằm ở mô tả UI hardcode 20 MiB. UI hiện đọc policy thật và kiểm tra file theo cùng policy. Download trả Blob trực tiếp, không giữ alias DTO cho kiểu binary có sẵn.                                                              |
| Form và màn cha                      | Tách user-profile-form, user-commands, unit-form, team-form, team-members-form, project-form, task-form. Màn cha ghép dữ liệu và điều hướng; form giữ RHF/snapshot và gọi mutation hook. Không tạo loader/factory chuyển tiếp riêng.                                                     |
| Phần hiển thị phân tích              | AnalysisSources hiển thị snapshot/căn cứ/biểu đồ; AnalysisExplanation hiển thị kết quả hợp lệ và citation. Trang detail điều phối query/job/tracking. Component con không fetch lại cùng dữ liệu.                                                                                        |
| Quyền trong UI chung                 | PermissionGate nằm ở `components/layout`; `components/ui` chỉ hiển thị, không đọc session/quyền. Schema permission dùng chung, quyền dự án và quyền hệ thống vẫn được kiểm tra theo phạm vi nghiệp vụ.                                                                                   |

Các nguồn còn thiếu đã được xác định: API chọn ứng viên cho PM, lịch khả dụng/capacity và lịch báo cáo bắt buộc. Chưa tự thêm field/endpoint hoặc gán 8 giờ/ngày để lấp chỗ trống. Capacity/utilization giữ null; pendingReportCount còn dựa một phần fixture. Theo yêu cầu người dùng, response hiện hành trong schema/service/MSW dùng Row cho danh sách và DTO cho chi tiết. Catalog 0.3.0 tiếp tục là nguồn route/nghiệp vụ; các DTO đầy đủ trong đặc tả là bản gốc tham chiếu. Khi nối BE cần dùng response đã điều chỉnh này.

## Response và model tối giản

Response chỉ gửi trường có nơi dùng để hiển thị hoặc thao tác. ID/version/quyền phục vụ điều hướng, quan hệ và cập nhật vẫn cần dù không in lên màn. Trường nội bộ để kiểm tra quyền, tính tiến độ, lọc kỳ và xác thực snapshot không tự động đi vào HTTP.

Danh sách dùng 9 kiểu Row trong schema/types hiện có: UserRow, ProjectRow, TaskRow, UnitRow, TeamRow, ReportRow, SubmissionRow, ReviewRow, AlertRow. Detail giữ dữ liệu cho xem/sửa. Time log dùng danh sách làm nguồn sửa nên giữ version và trường chỉnh sửa. TeamRow trả memberCount; ReportRow trả totalMinutes từ snapshot đã chốt. Danh sách cảnh báo không tạo snapshot phân tích. Không thêm model hoặc endpoint theo từng màn.

Attachment chỉ gửi id/filename/sizeBytes/status; taskId/uploadedBy/mimeType nằm trong model để kiểm tra quyền và tải binary. Audit giữ entityType/entityId nội bộ để lọc lịch sử. Task giữ mốc thời gian cần tính tiến độ, kiểm tra ngày ghi giờ và sắp xếp. Assignment chỉ giữ taskId/userId/startedAt/endedAt; lý do bàn giao đã có trong audit. Bỏ timestamp và trường dự phòng không có nơi dùng trong model/seed.

Dashboard bỏ tổng hợp trùng KPI và trường lồng không được hiển thị. AnalysisRef chỉ có analysisId. Model analysis vẫn giữ revision/scope/subject/expiry, missingFields và citation cần để kiểm tra nguồn, quyền và kết quả LLM. Seed chỉ giữ analysisDetails, bỏ collection snapshot/explanation trùng không được đọc. Snapshot lịch sử của báo cáo/lần nộp vẫn được lưu.

MSW kiểm tra và serialize dữ liệu đã qua response schema trước khi gửi HTTP. Test đọc body Axios trước parseResponse để phát hiện trường thừa mà Zod phía client có thể bỏ đi. Envelope giữ requestId/serverTime để truy vết HTTP.

## Quy ước API và tham số

Đối chiếu 79 operation: các route hiện có khớp catalog 0.3.0, gồm resource, subresource, read model và command nghiệp vụ. Các điểm lệch đã sửa nằm ở schema tham số, tên query và cách dùng ID đã chuẩn hóa; chưa có slug trong contract.

| Thành phần            | Quy ước                                                                                                                                                                                                                                                                                             |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resource              | Collection số nhiều như `/projects`, `/tasks`, `/reports`; chi tiết `/<resources>/:resourceId`.                                                                                                                                                                                                     |
| Subresource           | Phạm vi cha nằm trong path, ví dụ `/projects/:projectId/members`, `/tasks/:taskId/submissions/:submissionId`. Task/time-log có ID độc lập nên sửa qua `/tasks/:taskId`, `/time-logs/:timeLogId` theo catalog.                                                                                       |
| Read model và command | `/dashboard`, `/report-previews`, `/review-queue`, `/analytics/*` phục vụ dữ liệu tổng hợp. Các command `/start`, `/approve`, `/submit` giữ ý nghĩa và quyền riêng theo catalog.                                                                                                                    |
| ID, code, slug        | Entity trả `id`; tham số path và quan hệ dùng `projectId`, `taskId`, `membershipId`… ID là chuỗi opaque, trim, dài 1–100; không ép số, đổi chữ hoa/thường hoặc suy ra từ tên. `project.code` là mã nghiệp vụ. Chưa có slug hoặc API tra cứu slug nên không thêm kiểu/field/route giả định cho slug. |
| Chữ ký service        | `get(resourceId, options?)`, `list(query?, options?)`, `create(payload, options)`, `update(resourceId, payload, options)`. Subresource nhận parent ID trước; query hoặc payload tiếp theo; options luôn cuối. Các tên hàm cụ thể theo feature.                                                      |
| Vị trí tham số        | Path chứa định danh; query chứa pagination/filter/sort; body chứa input mutation; options chứa signal/version/key. Không gửi lại ID path trong body. `Args` là object variables của React Query, service nhận các tham số HTTP tương ứng.                                                           |
| Pagination            | `page` bắt đầu từ 1, mặc định 1; `pageSize` mặc định 20, tối đa 100. 14 schema danh sách dùng chung `listQuerySchema.shape`; response `Page<T>` có `{ items, pagination: { page, pageSize, total } }`. `Pagination` suy ra từ schema response, không định nghĩa lại trường.                         |
| Filter và sort        | Mỗi resource có `<Resource>Query` và whitelist riêng; search dùng `q`, quan hệ dùng `<resource>Id`. `q` trim và rỗng thành undefined. Task dùng sort allowlist `dueAt`, `-dueAt`, `updatedAt`, `-updatedAt`; không thêm sort cho endpoint chưa hỗ trợ.                                              |
| Ngày và thời điểm     | Analytics/report dùng `from`, `to` là ngày; task dùng `dueFrom`, `dueTo` là UTC. Giữ tên và kiểu theo nghĩa dữ liệu.                                                                                                                                                                                |
| Cache và HTTP         | Hook chuẩn hóa ID/filter một lần; dùng cùng kết quả cho key, kiểm tra quyền và service. ID thiếu/sai làm query bị tắt. Service gửi input có kiểu qua Axios, không parse lại hoặc ghép ID vào filter/body.                                                                                           |

Tên query theo dữ liệu: `ReportPreviewQuery`, `FilterOptionsQuery`, `TaskQuery`; response chi tiết dùng hậu tố `Dto`, bản ghi danh sách rút gọn dùng `Row`, mutation body dùng `Input`. Đã bỏ các alias query/input trùng cấu trúc trong analytics. Contract TypeScript và service dùng cùng type. Test kiến trúc đối chiếu cả route service lẫn MSW với catalog để phát hiện lệch đường dẫn khi sửa API.

## State và form

- React Query quản lý dữ liệu server và session; query key có viewer để phân tách phiên. Hook xử lý 403/410 qua helper chung, xóa dữ liệu không còn được phép xem.
- Zustand chỉ giữ menu và dấu form chưa lưu. Bộ lọc có thể chia sẻ nằm trên URL. React Hook Form giữ input và validation theo Zod.
- Form dùng chung tách phần điều khiển form, field, resolver, lỗi và wrapper version. `onSubmit` nhận kiểu output suy ra từ schema, dùng thẳng dữ liệu đã kiểm tra. Form tạo/sửa chọn schema và callback có kiểu riêng, chia sẻ props hiển thị. Chỉ kiểm tra lại khi dựng payload mới từ nhiều nguồn hoặc lấy phần thay đổi. Form giữ dữ liệu khi 412, cho tải bản mới để đối chiếu rồi xác nhận dùng version mới khi lưu lại.
- Access token chỉ nằm trong bộ nhớ của `services/api-client.ts`. File này cũng chứa kiểu request options, callback refresh và Promise dùng chung để các request 401 chờ cùng một lần refresh. Auth service tiêu thụ token và trả `SessionDto`; không đưa token/password vào Query cache, Zustand hoặc localStorage. `http-error.ts` đảm nhận chuẩn hóa lỗi; không cần thêm file types/session riêng cho lượng code hiện tại.
- Login, tạo user, reset mật khẩu và upload dùng ticket tạm để MutationCache không giữ mật khẩu/byte tệp. Các mutation thông thường nhận variables trực tiếp. Download trả Blob cho hook tiêu thụ và thu hồi Object URL.

Các yêu cầu riêng của DATN được giữ: quyền theo dự án, state machine, cấm tự nghiệm thu, version, replay có kiểm tra quyền hiện tại, snapshot báo cáo/phân tích bất biến và job AI mô phỏng bất đồng bộ.

## Quy tắc viết code

Ưu tiên đủ chức năng, gọn và dễ lần theo luồng. Tên dùng đúng ngữ cảnh: `AlertDto`, `TaskQuery`, `CreateTaskInput`, `UpdateTaskArgs`, `alertSchema`, `analyticsQuerySchema`. Không lặp tiền tố feature, không giữ biến chỉ gán lại tham số, không bọc `Promise.all` cho một request, không tạo biến chỉ để return ngay. Chỉ tách helper khi có trách nhiệm độc lập hoặc logic được dùng lại; không tạo factory để che lời gọi service/query.

Rà soát luồng lưu và truyền dữ liệu:

| Luồng                                        | Cách viết được giữ sau rà soát                                                                                                                                       |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Query và quyền                               | Hook kiểm tra ID; màn chỉ thêm điều kiện riêng như dialog mở hoặc chế độ tạo mới. `hasPermission` xử lý session rỗng, caller không kiểm tra lại.                     |
| Form tạo/sửa user, đơn vị, nhóm, dự án, task | Nhánh sửa dùng cùng `base` từ snapshot cho ID, patch và version, không kiểm tra lại entity trong callback. Payload được ghép mới vẫn kiểm tra schema.                |
| Dialog giao/thực hiện task, đóng dự án       | Nhận entity và callback reload từ query của cha, không tạo observer chỉ để gọi refetch.                                                                              |
| Nộp kết quả                                  | Form nhận task, lấy ID và tiêu chí từ task thay vì nhận thêm các props chứa cùng dữ liệu.                                                                            |
| Báo cáo                                      | Mutation refresh invalidate query; component không refetch lần nữa. DB tính preview một lần khi gửi, dùng cùng preview để kiểm tra task và tạo snapshot.             |
| Đăng nhập, mật khẩu, upload                  | Map giữ request nhạy cảm được khởi tạo một lần qua lazy state; MutationCache chỉ giữ ticket, payload được xóa sau execute.                                           |
| HTTP                                         | Base URL cấu hình một lần; envelope và data được parse cùng schema; meta dùng chung cho success/error. Nhận diện AxiosError một lần trước chuẩn hóa lỗi.             |
| DTO và phân tích mock                        | Các hàm dựng DTO CRUD/cảnh báo trả object có kiểu; handler kiểm tra response. Scope tái sử dụng danh sách dự án có quyền và nhóm đã tìm, không tìm lại cùng dữ liệu. |

Kiểm tra ở FE và biên HTTP độc lập vẫn cần giữ: backend không tin input từ client và client không tin response ngoài hệ thống. Không bỏ quyền hiện tại khi replay, kiểm tra version, state machine hoặc validation trên payload mới chỉ để giảm dòng.

## Chuyển giữa mock và backend

Development dùng `NEXT_PUBLIC_API_MOCKING=enabled` trong `.env.development`. Chỉ `app/providers.tsx` dynamic import browser worker khi `NODE_ENV=development` và đợi worker sẵn sàng trước khi render feature. Test dùng MSW Node server và gọi chính feature service qua HTTP.

`NEXT_PUBLIC_API_ORIGIN` là origin Gateway, ví dụ `https://gateway.example.test`; Axios client tự thêm `/api/v1`, service chỉ dùng path như `/tasks`. Để trống biến này sẽ dùng cùng origin với FE. Khi nối BE, tắt MSW và cấu hình origin; component/hook/service tiếp tục dùng cùng luồng HTTP. Production không khởi động worker.

Mock DB tồn tại trong bộ nhớ và reset khi reload. Cần kiểm thử riêng auth/cookie/CORS, scheduler, lưu trữ tệp và LLM khi có Gateway thật. Mức độ hoàn thành và giới hạn QA được ghi trong `IMPLEMENTATION_STATUS.md`.
