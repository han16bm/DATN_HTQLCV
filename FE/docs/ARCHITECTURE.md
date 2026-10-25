# Cấu trúc frontend

Cập nhật 25/10/2026, tham khảo cách tổ chức và luồng auth của `D:/TTZinza/vietcd/frontend`. FE dùng Next.js App Router, TypeScript strict, Tailwind CSS, React Hook Form, Zod, Zustand và TanStack Query. Các yêu cầu nghiệp vụ theo bộ đặc tả và API catalog 0.3.0 trong `fe-specs/`, cùng điều chỉnh mới của người dùng bên dưới.

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
         → Axios HTTP /api/... → MSW handler → mock DB → seed/state
```

Ví dụ cảnh báo: `alerts-page.tsx` gọi `useListAlertsQuery(query)`. Hook kiểm tra và chuẩn hóa query một lần, truyền cùng `filters` vào `alertsKeys.listAlerts(viewerId, filters)` và `alertsService.listAlerts(filters, { signal })`. Key chỉ tạo mảng định danh; service gửi đúng input được truyền vào. API client thêm base URL/bearer, kiểm tra envelope/response bằng Zod và chuẩn hóa lỗi. `alerts.handlers.ts` là biên HTTP server độc lập: parse query rồi gọi `alertsDb.listAlerts(viewer, query)`. DB kiểm tra nghiệp vụ, lọc dữ liệu và trả DTO; handler tạo envelope `{ data, meta }`.

Service gọi trực tiếp Axios, ví dụ `apiClient.get<unknown>("/alerts", { ...options, params: query }).then(parseResponse(page(alertRowSchema)))`. Axios xử lý query params, JSON/FormData, timeout 15 giây và `AbortSignal`; dùng fetch adapter để HTTP/MSW và Blob hoạt động thống nhất giữa browser/test. Không có lớp bọc `get/post/patch/put` riêng. `parseResponse` kiểm tra envelope và schema kết quả; download dùng `responseType: "blob"` cùng `parseFile` để kiểm tra metadata. Interceptor thêm header, refresh một lần khi 401 và chuẩn hóa lỗi, kể cả JSON lỗi trong Blob. Lỗi hủy request giữ dấu cancellation của Axios, bỏ config/request chứa dữ liệu nhạy cảm và không được retry như lỗi mạng.

Analytics có `useAnalyticsScope` đọc và kiểm tra bộ lọc URL một lần; màn truyền cùng scope cho khung lọc và query hook. Query hook analytics nhận scope đã kiểm tra nên không parse lại. Không tự viết hàm sắp xếp object cho query key; React Query xử lý key object. Service cũng không thêm default hoặc parse lại query/payload. Khi gọi service trực tiếp, caller truyền tham số cần gửi; handler áp dụng default của API cho trường bị bỏ trống.

Mutation như cập nhật cảnh báo gọi `alertsService.updateAlert(alertId, payload, { version, key })`. Axios interceptor gửi `If-Match` và `Idempotency-Key`. Hook giữ key cho lần thử lại cùng nội dung và invalidate rõ các query liên quan khi thành công. Không dùng endpoint descriptor, generic feature hook, registry/manifest hoặc generator.

Handler không chứa fixture, lọc collection hoặc nghiệp vụ. DB nhận viewer, ID, payload/query và version cần thiết, không nhận `Request`, `Response` hoặc API MSW. `mockCommand` đảm nhận transaction/receipt và chỉ kiểm tra lại quyền khi replay; kiểm tra thao tác mới nằm trong DB. Một triển khai `requireVersion` được dùng chung. Transaction serialize các command và rollback khi thất bại.

`mocks/db.ts` chứa các nhóm xử lý quyền, CRUD, báo cáo, phân tích và cảnh báo; handler import trực tiếp từ file này. Dữ liệu mẫu của báo cáo/audit/phân tích/tệp đã đưa hết vào `data.json`, không chạy bootstrap fixture riêng. `handlers/http.ts` chỉ xử lý phần HTTP dùng chung; `node.ts` reset DB và receipt khi test. Đã bỏ các folder db/data/utils cũ và file reset chuyển tiếp. Các màn analytics/report/submission/alert được chia file; component dùng chung như số liệu báo cáo hoặc form phản hồi được import trực tiếp và không sao chép logic.

## Model, DTO và component

Responsive dùng CSS chung trong globals.css, không thêm state/hook theo kích thước màn hình. page-surface là container page; panel là container card; schema-form là container form. Các layout nhiều vùng chuyển một cột khi container page rộng tối đa 820px; card/tiêu đề/nút được thu gọn ở 480px, thông tin trong card xếp dọc ở 400px. KPI/skeleton cards và metadata/giờ công dùng auto-fit với minmax giới hạn bởi chiều rộng hiện có. Bảng giữ table-scroll riêng cùng footer có thể xuống hàng; không ẩn tràn ngang ở body. Form giữ fieldset/control min-width: 0 và các container query theo kích thước form.

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

Lịch sử task/dự án dùng `AuditChanges` chung để hiển thị từng trường trước/sau, nhãn tiếng Việt, ngày và giờ công. `AuditDto.actor` là tham chiếu người thay cho actorId hiển thị thô. Projection before/after chỉ giữ các khóa có trong lần thay đổi, đổi userId/ownerId/assigneeId sang tham chiếu user/owner/assignee. Model audit vẫn lưu ID và snapshot gốc; lúc sửa task/giờ công, snapshot cũ lấy theo đúng khóa patch trước khi mutate. Không render JSON thành nội dung lịch sử.

- React Query quản lý dữ liệu server và session; query key có viewer để phân tách phiên. Hook xử lý 403/410 qua helper chung, xóa dữ liệu không còn được phép xem.
- Zustand giữ menu, dấu form chưa lưu và yêu cầu xác nhận đang chờ. Bộ lọc có thể chia sẻ nằm trên URL. React Hook Form giữ input và validation theo Zod.
- Form dùng chung tách phần điều khiển form, field, resolver, lỗi và wrapper version. `onSubmit` nhận kiểu output suy ra từ schema, dùng thẳng dữ liệu đã kiểm tra. Form tạo/sửa chọn schema và callback có kiểu riêng, chia sẻ props hiển thị. Chỉ kiểm tra lại khi dựng payload mới từ nhiều nguồn hoặc lấy phần thay đổi. Form giữ dữ liệu khi 412, cho tải bản mới để đối chiếu rồi xác nhận dùng version mới khi lưu lại.
- Access token chỉ nằm trong bộ nhớ của `services/api-client.ts`. File này cũng chứa kiểu request options, callback refresh và Promise dùng chung để các request 401 chờ cùng một lần refresh. Auth service tiêu thụ token và trả `SessionDto`; không đưa token/password vào Query cache, Zustand hoặc localStorage. `http-error.ts` đảm nhận chuẩn hóa lỗi; không cần thêm file types/session riêng cho lượng code hiện tại.
- Login, tạo user, reset mật khẩu và upload dùng ticket tạm để MutationCache không giữ mật khẩu/byte tệp. Các mutation thông thường nhận variables trực tiếp. Download trả Blob cho hook tiêu thụ và thu hồi Object URL.

Các yêu cầu riêng của DATN được giữ: quyền theo dự án, state machine, cấm tự nghiệm thu, version, replay có kiểm tra quyền hiện tại, snapshot báo cáo/phân tích bất biến và job AI mô phỏng bất đồng bộ.

Theo yêu cầu ngày 25/10/2026, Admin có `ANALYTICS_VIEW` toàn hệ thống: dashboard, bộ lọc mọi đơn vị và dữ liệu chi tiết liên quan. Admin không có thêm quyền ghi dự án/công việc/nghiệm thu/xử lý cảnh báo; lập báo cáo cá nhân vẫn cần tư cách thành viên dự án. Manager tiếp tục xem trong phạm vi được cấp. Session trả thêm username/email để hiển thị hồ sơ cá nhân; token và credential tiếp tục giữ riêng.

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

MSW dùng mockHandler để trì hoãn response sau khi xử lý request, áp dụng cả JSON thành công, lỗi và tệp. NEXT_PUBLIC_MSW_DELAY cấu hình theo ms, mặc định development 400 và test 0; scenario slow dùng 1500. Không thêm delay trong component/service hoặc từng handler. API dùng /api cho cả client, handler, ảnh và catalog; đã bỏ thành phần phiên bản trong URL, không có alias cũ.

`NEXT_PUBLIC_API_ORIGIN` là origin Gateway, ví dụ `https://gateway.example.test`; Axios client tự thêm `/api`, service chỉ dùng path như `/tasks`. Để trống biến này sẽ dùng cùng origin với FE. Khi nối BE, tắt MSW và cấu hình origin; component/hook/service tiếp tục dùng cùng luồng HTTP. Production không khởi động worker.

Mock DB tồn tại trong bộ nhớ và reset khi reload. Cần kiểm thử riêng auth/cookie/CORS, scheduler, lưu trữ tệp và LLM khi có Gateway thật. Mức độ hoàn thành và giới hạn QA được ghi trong `IMPLEMENTATION_STATUS.md`.

Rà dữ liệu viết cứng: UI/service không chứa fixture tài khoản/dự án/số liệu; nhãn enum, cấu hình field và bố cục là hằng số giao diện. Xóa helper time() trả ngày cố định theo revision; mọi số liệu và snapshot mới dùng now() của DB. Snapshot expiresAt tính theo analysisPolicy.retentionDays trong data.json (mock hiện 7 ngày); setClock đổi revision để snapshot cũ được đánh dấu và đọc bản mới. Trend không chèn thêm ngày mẫu; thiếu hoạt động thì API trả mảng rỗng và UI hiện trạng thái trống. Scope phân tích từ cảnh báo dùng tháng hiện tại của đồng hồ nguồn. Diễn giải mô phỏng lấy giá trị metric và formatter thay đoạn nội dung mẫu cố định; snapshot mẫu đã lưu trong data.json vẫn bất biến. Xóa useGetSessionQuery/useLogoutMutation không có nơi dùng vì SessionProvider đã quản lý cùng luồng.

## Giao diện dùng chung

components/ui/loading.tsx cung cấp Spinner, Skeleton và PageSkeleton (table/detail/form/cards). Các trang/query dùng cùng skeleton thay Loading dạng chữ; workspace loading.tsx làm fallback Suspense, không phụ thuộc MSW. Spinner dùng ở bootstrap/phiên, nút submit/ActionButton, tải tệp, tiến trình AI và trạng thái refetch tại topbar. Mỗi khối tải có role=status/aria-busy, skeleton trang trí aria-hidden; animation tôn trọng reduced motion. Refetch giữ dữ liệu cũ và chỉ báo spinner. UI không giả dữ liệu để lấp trạng thái tải.

WorkspaceShell đặt một div.page-surface bên trong main.content cho toàn bộ trang quản lý và xem chi tiết. Tham khảo AdminShell/AdminDetailFrame của vietcd: khung trắng, viền/bo góc/shadow nhẹ, padding nhất quán và đường phân cách dưới tiêu đề. Wrapper nằm ở layout để không lặp từng màn, vẫn giữ các panel nội dung và DataTable riêng. Mobile giảm padding; dialog tiếp tục render trong portal. PageHeader.description nhận ReactNode để hiển thị email chip từ dữ liệu phiên khi cần.

Tông xanh nước biển và trắng dùng chung qua CSS variables. Màn đăng nhập dùng SVG người làm việc trên máy tính trong public/illustrations. Sidebar chia theo Công việc, Theo dõi & phân tích, Quản trị; ẩn mục theo quyền và đánh dấu route con. Desktop thu gọn thành cột biểu tượng; mobile dùng Radix Dialog để đóng bằng Escape/nút đóng, giữ focus và trả focus về nút mở. State đóng/mở và thu gọn nằm trong Zustand UI.

Form dùng lưới 12 cột với field short/medium/long/full; form ít trường có khung nhỏ. Mã/tên đăng nhập ngắn, tên/mô tả rộng hơn. Textarea tự tăng/giảm chiều cao theo nội dung và chiều rộng, có giới hạn cuộn khi nội dung dài. Card form giới hạn chiều rộng và không giãn chiều cao theo vùng bên cạnh.

Field cao 36px, lưới bố trí 2–3 cột theo chiều rộng thực của form; vùng hẹp chuyển về một cột. Chi tiết đơn vị/nhóm/tài khoản và các cập nhật trên màn task/cảnh báo hiển thị nội dung trước, bấm thao tác mới mở form. Tạo đơn vị là route riêng `/admin/organization/new`. Thông tin nhóm và thành viên chung một card, mỗi lần chỉ mở một thao tác; MultiSelect dùng Radix Popover có tìm kiếm.

Hồ sơ `/profile` và đăng xuất nằm trong DropdownMenu của avatar. ConfirmDialog dùng Radix AlertDialog giữa màn hình; `confirmDiscard` trả Promise dùng chung khi rời/chuyển/đóng form, không dùng window.confirm. Handler select giữ giá trị trước khi await. Tải lại/đóng tab vẫn dùng beforeunload do trình duyệt điều khiển. Sonner hiển thị thông báo ở góc trên phải.

Các field lọc đều chia chiều ngang, ô tìm kiếm rộng hơn; bộ lọc chỉ có một field có khung gọn. “Quá hạn” nằm trong select Trạng thái của danh sách task và ánh xạ sang overdue=true, không đổi enum trạng thái. SectionSelect thay dãy Tabs bằng dropdown gọn bên trái cho dự án/công việc/phân tích; route con của lần nộp vẫn chọn Các lần nộp, lịch sử dự án đọc query tab, route edit có nhãn riêng. Chuyển mục dùng confirmDiscard và giữ lựa chọn/nội dung cũ khi hủy. PageHeader.status đặt trạng thái cạnh tiêu đề thay một hàng metadata riêng. Form nghiệm thu mở sau nút và nằm cùng cột kết quả. Mỗi cặp dt/dd phải bọc div để dùng đúng hàng nhãn/giá trị. Các lỗi và quy tắc tránh lặp nằm trong `UI_REVIEW.md`.

Lượt UI thứ hai dùng DataTable `actions` để canh cột thao tác cuối; DetailLink và UserBadge dùng chung. Card chứa bảng không lặp padding, table-scroll không dùng margin âm; Pagination ẩn nhóm nút khi chỉ có một trang. Panel hỗ trợ actions bên cạnh tiêu đề để đặt trạng thái/nút gọn. Đơn vị/nhóm dùng bảng danh sách, thao tác chi tiết mở route riêng.

Theo yêu cầu dùng chung cấu trúc thẻ bảng, DataTable quản lý toàn bộ Panel.table-card, header (title/headerActions), mô tả tùy chọn, vùng cuộn, trạng thái rỗng và footer phân trang. Màn chỉ truyền pagination gồm metadata/onPage từ HTTP/URL; không ghép Panel/Pagination quanh bảng. Bảng không có phân trang HTTP dùng footer đếm dòng, không cắt dữ liệu hoặc tạo nút phân trang giả. Phần tiêu đề/mô tả và chân bảng không cuộn theo chiều ngang cùng dữ liệu. CSS table-card tường minh thay quy tắc :has đoán card chứa bảng; một khung viền/bo góc chung, không margin âm. ReportNumbers đưa thời điểm/tổng giờ/nút làm mới vào cùng header/mô tả thẻ. Pagination dùng riêng chỉ còn ở chế độ board.

Cột thao tác thống nhất nhãn Hành động và căn giữa cả header/cell. DetailLink hiển thị chữ Chi tiết, không thêm viền, nền hoặc icon; tên truy cập và focus bàn phím giữ nguyên.

Thông báo lỗi form lấy tên trường và kiểu control từ metadata, diễn đạt hành động cần làm; không lộ lỗi ID hoặc Zod tiếng Anh. Resolver chỉ dùng một kết quả safeParse, giữ thông báo nghiệp vụ custom và giới hạn schema. Field file dùng Controller, đưa Blob vào schema và chỉ gửi khi người dùng lưu.

Chi tiết tài khoản dùng account-layout hai cột thông tin/truy cập, tự xếp dọc trên màn hẹp; nút chỉnh sửa ở tiêu đề. Hồ sơ cá nhân sửa username/displayName/avatar qua PATCH /auth/me multipart, giữ If-Match/idempotency và đối chiếu 412. Email/đơn vị/vai trò chỉ đọc và nằm ngoài whitelist. Session thêm version để lưu, avatarUrl để hiển thị; UserDTO/UserRow dùng cùng avatarUrl. Avatar dùng Image unoptimized để trình duyệt tải trực tiếp HTTP qua MSW, có chữ cái tên khi ảnh lỗi. DB giữ avatarId và byte ảnh riêng, trả link opaque GET /avatars/:avatarId; không nhúng byte/base64 vào DTO. Mutation dùng ticket tạm để không giữ tệp trong MutationCache, cập nhật phiên từ response và làm mới nhãn người dùng trong dữ liệu của viewer. Hai endpoint mới được ghi tại API_CATALOG, tổng 81 route; ảnh là tài nguyên trình duyệt tải trực tiếp, 80 route còn lại qua service.

AnalyticsFrame dùng cùng SectionSelect/section-toolbar với dự án và công việc: dropdown bên trái, nút mở bộ lọc Popover bên phải. Các bộ lọc cập nhật URL trực tiếp, xóa các lựa chọn phụ thuộc khi đổi đơn vị/dự án; Đặt lại trả về phạm vi mặc định. Đổi mục phân tích giữ scope.suffix, không tạo bản sao state lọc. Header không hiển thị dòng mô tả chung lặp tiêu đề/quyền; dự án/công việc chỉ giữ tên đơn vị/dự án liên quan.

ReportRow có `project` thay projectId để trả tên dự án ngay trong hàng; ReviewRow có taskTitle để bỏ query theo từng task. Metadata phân tích chỉ gồm dataAsOf/quality; bỏ calculationVersion không phục vụ thao tác. Định dạng đơn vị/chỉ số dùng `metricValue` trong lib/format cho cả UI và diễn giải mock. Mô tả công thức KPI nằm trong data.json. KPI dùng thẻ nhỏ với nút chi tiết góc trên; trang chi tiết bỏ các khung trùng chỉ số/tổng hợp và không tạo khung căn cứ rỗng. Cách tính và giới hạn diễn giải mở theo nhu cầu.

Hồ sơ theo bố cục account-page của vietcd: tiêu đề/email, tab ngang Thông tin cá nhân/Ảnh đại diện/Đổi mật khẩu, form một cột rộng tối đa 576px ngay bên dưới. Riêng /profile hiển thị form thông tin ngay; bỏ bước mở sửa và bảng thông tin trước form. Email là input readonly bên trên, họ tên/tên đăng nhập xếp dọc, đơn vị/vai trò là dòng thông tin chỉ đọc. Field cao 44px, nút lưu ở dưới bên trái; form mật khẩu cùng bố cục. Tab giữ trạng thái chọn/keyboard/confirmDiscard. Avatar nằm giữa panel ảnh, tròn 160px với placeholder biểu tượng người, nút chọn ảnh riêng và preview/filename sau chọn. onFileChange của field file chỉ phục vụ preview UI, RHF vẫn giữ tệp và validation; object URL được thu hồi khi thay ảnh/rời mục. Ảnh chỉ gửi avatar qua PATCH /auth/me, không gửi email hoặc URL preview. Lưu thành công cập nhật snapshot từ result.user để lưu tiếp đúng version. ProfileHeader chỉ dùng ở hồ sơ công khai. PUT /auth/me/password nhận currentPassword/newPassword, xác nhận chỉ ở FE; không trim/lưu credential vào cache/audit. Endpoint trả {ok:true} và giữ phiên hiện tại.

Hồ sơ thành viên /users/[userId] nằm trong workspace yêu cầu đăng nhập. MemberProfilePage dùng users hook/service qua GET /users/:userId/profile; không dùng API quản trị để đọc hồ sơ. Theo yêu cầu đã điều chỉnh, ProfileDto là object phẳng chỉ có id/displayName/avatarUrl/unit dạng tên/systemRole/email. UI chỉ gồm card nhận diện và thông tin liên hệ email; bỏ toàn bộ thống kê, bảng dự án, query phân trang và logic tính trong DB. Handler xác thực rồi gọi DB lấy hồ sơ; query thừa trả 422. Thành viên bị khóa/không tồn tại trả 404. Key chỉ có viewerId/userId, staleTime 0 để cập nhật hồ sơ khi mở lại. Avatar menu, tên thành viên dự án và danh sách tài khoản có liên kết đến hồ sơ; hồ sơ của chính mình có link quản lý /profile. Tổng catalog vẫn có 83 route (82 service + 1 image resource).

TaskDto trả createdAt và firstStartedAt để chi tiết công việc hiển thị Ngày tạo/Bắt đầu thực hiện; task chưa bắt đầu hiện Chưa bắt đầu. TaskRow trả thêm firstStartedAt cho cột Ngày bắt đầu; taskDTO dùng lại từ taskRow, không khai báo lặp field. Hai mốc do server ghi, không có trong payload tạo/sửa; firstStartedAt giữ nguyên qua tạm dừng, bắt đầu lại hoặc bàn giao. Chi tiết dùng metadata ba cột, nội dung/tiêu chí và giờ công hai vùng tự xếp dọc khi hẹp; giờ thực tế, ước lượng ban đầu/hiện tại và còn lại hiển thị riêng. Không dùng tỷ lệ giờ làm làm tiến độ hoàn thành.

Tổng quan cá nhân dùng overview-stats auto-fit thay metric-grid cố định bốn cột: card là link gồm nhãn/số liệu/thao tác, chia đều phần ngang khi chỉ có ba card và cùng chiều cao theo nội dung. Số việc quá hạn lấy pagination.total từ query assigneeId/overdue/pageSize=1, không tự đếm task ở FE. Dự án bên dưới dùng bảng gọn, không để lưới card thưa. Các bảng lịch sử dùng HistoryTable chung trên DataTable: Thời điểm/Người thực hiện/Sự kiện/Hành động, chỉ cột hành động căn giữa như bảng khác, bỏ width cố định và timeline riêng. Lý do đi cùng sự kiện; AuditChanges là thao tác chữ mở đối chiếu trường, không viền/nền.

Field formula trong DTO tiếp tục là chuỗi, nhưng UI trình bày dưới nhãn Ý nghĩa chỉ số. Nội dung giải thích ý nghĩa nghiệp vụ thay vì đọc phép tính; công thức toán và điều kiện lọc nằm trong code/đặc tả. metricFormulas và snapshot mẫu trong data.json, các mô tả sinh động trong db.ts đều dùng câu ngắn, thống nhất “ước lượng ban đầu/hiện tại”, không lộ mã trạng thái. K07 vẫn là thực tế so với ước lượng hiện tại; deltaOriginalMinutes được ghi riêng là so với ước lượng ban đầu. Đơn vị/giờ/ngày trong diễn giải dùng formatter hiện có; không đổi số liệu hoặc cách tính khi sửa câu chữ.

Đơn vị/nhóm tách danh sách và chi tiết: /admin/organization, /admin/teams chỉ tải collection theo page trên URL, render DataTable với Hành động/Chi tiết. /admin/organization/[unitId] dùng UnitEditorPage; /admin/teams/[teamId] dùng TeamEditorPage. Các editor ghép detail và lookup cho form, giữ quyền/loading/error/version/dirty/conflict; form mặc định đóng trên chi tiết. Route /new dùng cùng editor và mở chi tiết bản ghi sau khi tạo. TeamRow thay unitId bằng unit (EntityLabel) cho cột đơn vị, không cần gọi lookup từ danh sách; model Team/DTO chi tiết vẫn lưu unitId và không đổi payload. Bỏ layout danh sách bên trái/chi tiết bên phải, query chọn unit/team và CSS entity-list/organization-layout.
