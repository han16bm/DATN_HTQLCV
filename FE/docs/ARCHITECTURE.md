# Kiến trúc frontend

Tài liệu này giữ kiến trúc, trách nhiệm tầng và ràng buộc dữ liệu của ứng dụng. Các phần lịch sử bố cục/thiết kế cũ đã được bỏ theo yêu cầu người dùng; thiết kế hiện tại tham chiếu Skill FE/codex và [DESIGN.md](DESIGN.md).

## Truy cập và điều hướng

Quyền hiệu lực lấy từ session.permissions và session.projectAccess[].permissions; canVisit chặn trang trước khi mount dữ liệu, quyền ghi và phạm vi được backend kiểm tra độc lập. Role không thay thế điều kiện người nhận/tác giả, trạng thái hay cấm tự nghiệm thu. Khu admin có route group riêng, cùng phiên và điểm vào qua avatar. lib/navigation.ts sở hữu route/menu/breadcrumb; Zustand chỉ giữ lịch sử điều hướng và UI state.

Trang chi tiết dự án chứa các danh sách công việc và thành viên, lịch sử tải trong ngăn kéo. useUrlFilters(prefix) tách q/page của từng vùng trong URL; thay đổi giữ hash và chỉ reset trang cùng namespace. lib/navigation.ts cung cấp projectUrl để các route FE cũ chuyển hướng và breadcrumb về trang chi tiết, giữ bộ lọc. API resource/subresource và query key theo viewer không đổi.

## Thông báo

NotificationBell dùng service HTTP, React Query, MSW và outbox DB hiện có. API list/summary/mark read kiểm tra người nhận và quyền đọc đối tượng; mutation có idempotency, rollback/replay cùng giao dịch. Poll summary không tạo spinner toàn cục. Không có inbox/route hoặc WebSocket riêng.

## Hạn mock tự cập nhật khi mở ứng dụng — 31/10/2026

browser.ts gọi resetDatabase(new Date().toISOString()) trước khi khởi động worker. DB lấy ngày Việt Nam, đặt deadline task còn mở và còn hạn ở mốc seed thành hôm nay + taskPolicy.dueInDays (6), giữ giờ seed và khoảng lệch originalDueAt. Nếu hạn mới vượt hạn dự án, nới dueAt của dự án tương ứng. Case quá hạn/hoàn thành/hủy, lần nộp và snapshot lịch sử giữ nguyên; HTTP GET không tự dời hạn. Node resetMockState gọi resetDatabase() không đối số để giữ fixture và clock cố định cho các ca tích hợp. setClock vẫn chỉ phục vụ tiến thời gian trong kịch bản, không rebase task.


## Rà dọn toàn bộ FE — 31/10/2026

Đã bỏ feature permission-groups chưa có màn/caller/handler và hàm EvidenceFile cũ; tệp đang xem dùng AttachmentViewer/PdfPreview. Xóa các type không có consumer, thu phạm vi export về nội bộ và bỏ CSS của giao diện đã xóa. class-variance-authority, clsx và tailwind-merge không có import nên được bỏ khỏi dependency trực tiếp.

Session.projectAccess chỉ gồm projectId/permissions; projectRole vẫn ở membership/model để quản lý vai trò và tính quyền. LoginResponse chỉ trả session/accessToken; hạn token tiếp tục được kiểm tra từ sessionExpiry trong DB. MeasureDto bỏ basis; model giữ basis để dựng KPI. Snapshot.scope response chỉ giữ from/to, model vẫn giữ scope đầy đủ cho quyền/tạo lại phân tích. ID snapshot/citation, dữ liệu chart và version vẫn giữ vì validation/thao tác có dùng. AlertDto trả handler (PersonRef), không trả handledBy của model hoặc suy tên theo người đang đăng nhập. Severity/trạng thái lựa chọn dùng cùng schema; phiên bản luật lấy từ analysisPolicy.ruleVersion trong data.json. Nhóm quyền nội bộ chỉ cần features/memberIds.

GET /tasks/:taskId/submissions nhận sort=sequence|-sequence, default -sequence; DB sort trước paginate. Bảng lấy 5 lần/trang; chọn Chi tiết mới tải nội dung và tệp của lần đó trong ngăn kéo. Đóng khung/đổi tệp thu hồi URL blob. Xem báo cáo cũ không thay đổi đối tượng nghiệm thu của TaskShell. Không thêm endpoint hoặc trang.



## Thư mục và trách nhiệm

```text
src/
  app/                              # Route, layout, providers, error boundary
  components/
    layout/                         # Workspace shell, navigation, dirty guard
    ui/                             # Control và trạng thái giao diện dùng chung
    forms/                          # Khung form, control, lỗi/xung đột và ReasonForm
  features/<feature>/
    api/
      <feature>.service.ts          # Gửi input có kiểu qua HTTP, khai báo response schema
      <feature>.keys.ts             # Query key từ viewer, resource và filter đã chuẩn hóa
    schemas/                        # Zod validation theo thực thể/nhóm nghiệp vụ
    types/<feature>.types.ts        # DTO, payload, query, result, mutation variables
    hooks/
      use-<feature>-queries.ts      # useQuery + service + query key
      use-<feature>-mutations.ts    # useMutation + service + invalidation
    components/                     # Mỗi màn một file; form/dialog chia riêng
  lib/
    auth/                           # Session context và role/phạm vi dự án
    crypto/                         # Fingerprint dùng chung cho retry/receipt
    forms/                          # Snapshot khi chỉnh sửa
    query/                          # Access error, retry key, cache, URL filters
    validation/                     # Schema giá trị chung và các refinements
  services/
    api-client.ts                   # Axios, options, token bộ nhớ, refresh và response validation
    http-error.ts                   # Chuẩn hóa lỗi HTTP/network và quy tắc retry
  stores/                           # State UI client-only
  types/                            # HTTP error, Page<T>, value types chung
  mocks/
    data.json                       # Toàn bộ seed, policy và nội dung tệp mẫu
    db.ts                           # DB bộ nhớ, reset/clock, CRUD và nghiệp vụ theo nhóm
    handlers/
      <feature>.handlers.ts         # Chặn API, parse request, gọi DB, trả HTTP response
      http.ts                       # JSON response, scenario, auth request và receipt dùng chung
      index.ts                      # Đăng ký các nhóm handler
    browser.ts                      # Browser worker
    node.ts                         # Test server và reset DB/receipt
tests/                              # Kiểm thử qua HTTP/MSW và component JSDOM
```

Import trực tiếp file cần dùng. Không có barrel `index.ts`, `client.ts`, `hooks.ts` ở gốc feature. Module chỉ phụ thuộc đúng type/schema/hook/component cần thiết; service và shared types không phụ thuộc mock hoặc UI. Schema không export DTO; file types suy ra kiểu từ schema bằng import type để tránh hai nguồn định nghĩa hình dạng dữ liệu.


## Luồng đọc và ghi dữ liệu

Trang và sidebar dùng chung chính sách quyền trong `lib/auth/access.ts` (permission hiệu lực trong session, theo hệ thống hoặc theo dự án). AppShell chặn route trước khi mount feature; không có PermissionGate. Menu quản trị chỉ ở khu quản trị; các trang công việc/dự án/báo cáo/hồ sơ dành cho mọi thành viên đăng nhập. Thao tác trong trang dùng `hasPermission(session, quyền, projectId)` cùng điều kiện trạng thái và quy tắc không tự nghiệm thu. Query hook chỉ xét phiên, ID, bộ lọc và phụ thuộc tải; không kiểm tra quyền mở trang lần nữa.

```text
App route → feature component → React Query hook → feature service
         → Axios HTTP /api/... → MSW handler → mock DB → seed/state
```

Ví dụ cảnh báo: `alerts-page.tsx` gọi `useListAlertsQuery(query)`. Hook kiểm tra và chuẩn hóa query một lần, truyền cùng `filters` vào `alertsKeys.listAlerts(viewerId, filters)` và `alertsService.listAlerts(filters, { signal })`. Key chỉ tạo mảng định danh; service gửi đúng input được truyền vào. API client thêm base URL/bearer, kiểm tra response bằng Zod và chuẩn hóa lỗi. `alerts.handlers.ts` là biên HTTP server độc lập: parse query rồi gọi `alertsDb.listAlerts(viewer, query)`. DB kiểm tra nghiệp vụ, lọc dữ liệu và trả DTO; handler trả DTO trực tiếp dưới dạng HTTP JSON.

Service dùng async/await theo vietcd, ví dụ `const response = await apiClient.get<AlertList>("/alerts", { ...options, params: query, schema: page(alertRowSchema) }); return response.data;`. Mỗi hàm khai báo DTO hiện có và response schema trong config, không dùng chuỗi <unknown>().then(...) hoặc helper parseResponse/parseFile. Interceptor Axios kiểm tra response.data một lần bằng schema, dùng chính dữ liệu đã parse để bỏ trường ngoài DTO trước khi vào cache; binary kiểm tra Content-Type/Content-Disposition theo responseType blob. Không thêm wrapper HTTP hoặc bảng ánh xạ endpoint–schema.

Axios xử lý query params, JSON/FormData, timeout 15 giây và AbortSignal; dùng fetch adapter để HTTP/MSW và Blob hoạt động thống nhất giữa browser/test. Lỗi JSON là object phẳng code/message/fieldErrors?/details?, được kiểm tra bằng errorResponseSchema rồi chuyển thành ApiError. Interceptor thêm header, refresh một lần khi 401 và chuẩn hóa lỗi, kể cả JSON lỗi trong Blob. Lỗi hủy request giữ dấu cancellation của Axios, bỏ config/request chứa dữ liệu nhạy cảm và không được retry như lỗi mạng. Auth login/refresh dùng LoginResponse suy từ schema, giữ token trong bộ nhớ rồi chỉ trả SessionDto; không đưa credential vào Query cache. Các import trong cùng feature dùng đường dẫn tương đối; method có dòng trống để dễ đọc.

Analytics có `useAnalyticsScope` đọc và kiểm tra bộ lọc URL một lần; màn truyền cùng scope cho khung lọc và query hook. Query hook analytics nhận scope đã kiểm tra nên không parse lại. Không tự viết hàm sắp xếp object cho query key; React Query xử lý key object. Service cũng không thêm default hoặc parse lại query/payload. Khi gọi service trực tiếp, caller truyền tham số cần gửi; handler áp dụng default của API cho trường bị bỏ trống.

Mutation như cập nhật cảnh báo dùng `run(input, key => alertsService.updateAlert(input.alertId, input.payload, { version: input.version, key }))`. `run` lấy từ `useIdempotentRequest`, giữ khóa sau lỗi và kết thúc lần gửi khi thành công. Axios interceptor gửi `If-Match` và `Idempotency-Key`; hook invalidate rõ các query liên quan. Không dùng endpoint descriptor, generic feature hook, registry/manifest hoặc generator. Không lặp chữ ký service trong interface `*.contract.ts`.

Handler không chứa fixture, lọc collection hoặc nghiệp vụ. DB nhận viewer, ID, payload/query và version cần thiết, không nhận `Request`, `Response` hoặc API MSW. `mockCommand` đảm nhận transaction/receipt và chỉ kiểm tra lại quyền khi replay; kiểm tra thao tác mới nằm trong DB. Một triển khai `requireVersion` được dùng chung. Transaction serialize các command và rollback khi thất bại.

`mocks/db.ts` chứa các nhóm xử lý quyền, CRUD, báo cáo, phân tích và cảnh báo; handler import trực tiếp từ file này. Dữ liệu mẫu của báo cáo/audit/phân tích/tệp đã đưa hết vào `data.json`, không chạy bootstrap fixture riêng. `handlers/http.ts` chỉ xử lý phần HTTP dùng chung; `node.ts` reset DB và receipt khi test. Đã bỏ các folder db/data/utils cũ và file reset chuyển tiếp. Các màn analytics/report/submission/alert được chia file; component dùng chung như số liệu báo cáo hoặc form phản hồi được import trực tiếp và không sao chép logic.


Lookup phục vụ điều khiển phải tách khỏi trang kết quả đang lọc; không suy lựa chọn toàn hệ thống từ các hàng của một trang. Bắt buộc chờ lookup của form và hiển thị lỗi/thử lại. Chỉ tải lookup phụ khi control xuất hiện; query chính vẫn không kiểm tra quyền mở trang lần nữa. ownerId là người phụ trách dự án, assigneeId là người thực hiện công việc; chỉ assigneeId phụ thuộc nhóm.

Mọi thao tác dùng If-Match chốt snapshot/version khi mở form. Refetch nền không nâng version của draft; 412 tải bản mới từ cha, giữ nội dung và chỉ chấp nhận version sau đối chiếu. Tạo giờ công/nộp kết quả dùng Task; sửa/VOID giờ công dùng TimeLog; nghiệm thu dùng Submission. TaskShell truyền Task/trạng thái hoạt động/reload cho dialog thay vì dialog tự đọc lại Task/Project. Xem kết quả quét và giới hạn lookup trong schema/service và kiểm thử hiện hành.


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
| Quyền trong UI chung                 | AppShell kiểm tra `canVisit` trước khi mount trang; sidebar và thao tác dùng cùng `lib/auth/access.ts` với permission hiệu lực trong session (`permissions`, `projectAccess[].permissions`). `components/ui` chỉ hiển thị. Không lưu permissions theo thành viên; backend kiểm tra độc lập cùng phạm vi nghiệp vụ. |

Các nguồn còn thiếu đã được xác định: API chọn ứng viên cho PM, lịch khả dụng/capacity và lịch báo cáo bắt buộc. Chưa tự thêm field/endpoint hoặc gán 8 giờ/ngày để lấp chỗ trống. Capacity/utilization giữ null; pendingReportCount còn dựa một phần fixture. Theo yêu cầu người dùng, response hiện hành trong schema/service/MSW dùng Row cho danh sách và DTO cho chi tiết. Catalog 0.3.0 tiếp tục là nguồn route/nghiệp vụ; các DTO đầy đủ trong đặc tả là bản gốc tham chiếu. Khi nối BE cần dùng response đã điều chỉnh này.


## Response và model tối giản

Response chỉ gửi trường có nơi dùng để hiển thị hoặc thao tác. ID/version/quyền phục vụ điều hướng, quan hệ và cập nhật vẫn cần dù không in lên màn. Trường nội bộ để kiểm tra quyền, tính tiến độ, lọc kỳ và xác thực snapshot không tự động đi vào HTTP.

Danh sách dùng 9 kiểu Row trong schema/types hiện có: UserRow, ProjectRow, TaskRow, UnitRow, TeamRow, ReportRow, SubmissionRow, ReviewRow, AlertRow. Detail giữ dữ liệu cho xem/sửa. Time log dùng danh sách làm nguồn sửa nên giữ version và trường chỉnh sửa. TeamRow trả memberCount; ReportRow trả totalMinutes từ snapshot đã chốt. Danh sách cảnh báo không tạo snapshot phân tích. Không thêm model hoặc endpoint theo từng màn.

ProjectRow chỉ có id/name/startDate/dueAt/status/owner/unit; bỏ code/objective khỏi schema và response DB, không chỉ ẩn trên UI. projectDTO thêm lại code/objective cho chi tiết và form. ID vẫn phục vụ link/lookup/quyền; bảng không hiển thị mã hay mục tiêu. ProjectTile chọn biểu tượng Lucide và màu ổn định theo ID, dùng chung tại bảng, trang chủ và header; không cần gửi thêm field ảnh/icon.

Attachment chỉ gửi id/filename/sizeBytes/status; taskId/uploadedBy/mimeType nằm trong model để kiểm tra quyền và tải binary. Audit giữ entityType/entityId nội bộ để lọc lịch sử. Task giữ mốc thời gian cần tính tiến độ, kiểm tra ngày ghi giờ và sắp xếp. Assignment chỉ giữ taskId/userId/startedAt/endedAt; lý do bàn giao đã có trong audit. Bỏ timestamp và trường dự phòng không có nơi dùng trong model/seed.

Dashboard bỏ tổng hợp trùng KPI và trường lồng không được hiển thị. AnalysisRef chỉ có analysisId. Model analysis vẫn giữ revision/scope/subject/expiry, missingFields và citation cần để kiểm tra nguồn, quyền và kết quả LLM. Seed chỉ giữ analysisDetails, bỏ collection snapshot/explanation trùng không được đọc. Snapshot lịch sử của báo cáo/lần nộp vẫn được lưu.

MSW kiểm tra và serialize dữ liệu đã qua response schema trước khi gửi HTTP. Test đọc body Axios không truyền schema để phát hiện trường thừa mà validator phía client có thể bỏ đi; service sản phẩm luôn khai báo schema JSON hoặc responseType blob. Response chỉ có DTO; danh sách giữ {items, pagination}. Đã bỏ lớp bọc data/meta và requestId/serverTime; không có nhánh tương thích định dạng cũ. Idempotency receipt replay cùng JSON DTO, status và header.


## Quy ước API và tham số

Đối chiếu API catalog và 83 HTTP route hiện hành: các route hiện có khớp catalog 0.3.0, gồm resource, subresource, read model và command nghiệp vụ. ID opaque được kiểm tra tại form/biên HTTP; hook dùng nguyên resourceId cho key/service và không parse lại. Chưa có slug trong contract.

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
| Cache và HTTP         | Hook dùng trực tiếp resourceId cho key/service, không parse hoặc đổi tên thành id/parentId. ID rỗng chờ dữ liệu; ID sai không rỗng nhận lỗi API. Filter chuẩn hóa một lần, dùng cùng kết quả cho key và service. Service gửi input có kiểu qua Axios, không parse lại hoặc ghép ID vào filter/body.                                                                                           |

Tên query theo dữ liệu: `ReportPreviewQuery`, `FilterOptionsQuery`, `TaskQuery`; response chi tiết dùng hậu tố `Dto`, bản ghi danh sách rút gọn dùng `Row`, mutation body dùng `Input`. Đã bỏ các alias query/input trùng cấu trúc trong analytics. Contract TypeScript và service dùng cùng type. Test kiến trúc đối chiếu cả route service lẫn MSW với catalog để phát hiện lệch đường dẫn khi sửa API.


## State và form

Lịch sử task/dự án dùng `AuditChanges` chung để hiển thị từng trường trước/sau, nhãn tiếng Việt, ngày và giờ công. `AuditDto.actor` là tham chiếu người thay cho actorId hiển thị thô. Projection before/after chỉ giữ các khóa có trong lần thay đổi, đổi userId/ownerId/assigneeId sang tham chiếu user/owner/assignee. Model audit vẫn lưu ID và snapshot gốc; lúc sửa task/giờ công, snapshot cũ lấy theo đúng khóa patch trước khi mutate. Không render JSON thành nội dung lịch sử.

- React Query quản lý dữ liệu server và session; query key có viewer để phân tách phiên. Hook xử lý 403/410 qua helper chung, xóa dữ liệu không còn được phép xem.
- Zustand giữ menu, dấu form chưa lưu và yêu cầu xác nhận đang chờ. Bộ lọc có thể chia sẻ nằm trên URL. React Hook Form giữ input và validation theo Zod.
- Mỗi form feature khai báo `useForm` có kiểu, `zodResolver` và JSX của từng field như vietcd. `Form` dùng chung giữ pending/lỗi HTTP/dirty/conflict; các control nhận `register`/`Controller` và lỗi. Không có bộ dựng field, resolver metadata hoặc wrapper version. Chuyển deadline qua schema của form, ô số qua RHF. `onSubmit` nhận output đã kiểm tra, `changedFields` trả patch có kiểu; không parse lại patch. Form giữ dữ liệu khi 412, cho tải bản mới để đối chiếu rồi xác nhận version mới. Bỏ sửa rồi mở lại lấy giá trị hiện tại.
- Access token chỉ nằm trong bộ nhớ của `services/api-client.ts`. File này cũng chứa kiểu request options, callback refresh và Promise dùng chung để các request 401 chờ cùng một lần refresh. Auth service tiêu thụ token và trả `SessionDto`; không đưa token/password vào Query cache, Zustand hoặc localStorage. `http-error.ts` đảm nhận chuẩn hóa lỗi; không cần thêm file types/session riêng cho lượng code hiện tại.
- Login, tạo user, reset mật khẩu và upload dùng ticket tạm để MutationCache không giữ mật khẩu/byte tệp. Các mutation thông thường nhận variables trực tiếp. Download trả Blob cho hook tiêu thụ và thu hồi Object URL.

Các yêu cầu riêng của DATN được giữ: quyền theo dự án, state machine, cấm tự nghiệm thu, version, replay có kiểm tra quyền hiện tại, snapshot báo cáo/phân tích bất biến và job AI mô phỏng bất đồng bộ.

Theo yêu cầu ngày 25/10/2026, Admin có `ANALYTICS_VIEW` toàn hệ thống: dashboard, bộ lọc mọi đơn vị và dữ liệu chi tiết liên quan. Admin không có thêm quyền ghi dự án/công việc/nghiệm thu/xử lý cảnh báo; lập báo cáo cá nhân vẫn cần tư cách thành viên dự án. Manager tiếp tục xem trong phạm vi được cấp. Session trả thêm username/email để hiển thị hồ sơ cá nhân; token và credential tiếp tục giữ riêng.


## Quy tắc viết code

Ưu tiên đủ chức năng, gọn và dễ lần theo luồng. Tên dùng đúng ngữ cảnh: `AlertDto`, `TaskQuery`, `CreateTaskInput`, `UpdateTaskArgs`, `alertSchema`, `analyticsQuerySchema`. Không lặp tiền tố feature, không giữ biến chỉ gán lại tham số, không bọc `Promise.all` cho một request, không tạo biến chỉ để return ngay. Chỉ tách helper khi có trách nhiệm độc lập hoặc logic được dùng lại; không tạo factory để che lời gọi service/query.

Rà soát luồng lưu và truyền dữ liệu:

| Luồng                                        | Cách viết được giữ sau rà soát                                                                                                                                       |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Query và quyền                               | Hook kiểm tra ID; màn chỉ thêm điều kiện riêng như dialog mở hoặc chế độ tạo mới. Role mở trang chỉ kiểm tra ở WorkspaceShell; hook không lặp quyền view.                     |
| Form tạo/sửa user, đơn vị, nhóm, dự án, task | Nhánh sửa dùng cùng `base` từ snapshot cho ID, patch và version, không kiểm tra lại entity trong callback. Patch chỉ lọc trường của output đã hợp lệ nên không parse lại.                |
| Dialog giao/thực hiện task, đóng dự án       | Nhận entity và callback reload từ query của cha, không tạo observer chỉ để gọi refetch.                                                                              |
| Nộp kết quả                                  | Form nhận task, lấy ID và tiêu chí từ task thay vì nhận thêm các props chứa cùng dữ liệu.                                                                            |
| Báo cáo                                      | Mutation refresh invalidate query; component không refetch lần nữa. DB tính preview một lần khi gửi, dùng cùng preview để kiểm tra task và tạo snapshot.             |
| Đăng nhập, mật khẩu, upload                  | Map giữ request nhạy cảm được khởi tạo một lần qua lazy state; MutationCache chỉ giữ ticket, payload được xóa sau execute.                                           |
| HTTP                                         | Base URL cấu hình một lần; kiểm tra DTO trực tiếp từ response.data, lỗi JSON phẳng. Nhận diện AxiosError một lần trước chuẩn hóa lỗi.                                |
| DTO và phân tích mock                        | Các hàm dựng DTO CRUD/cảnh báo trả object có kiểu; handler kiểm tra response. Scope tái sử dụng danh sách dự án có quyền và nhóm đã tìm, không tìm lại cùng dữ liệu. |

Kiểm tra ở FE và biên HTTP độc lập vẫn cần giữ: backend không tin input từ client và client không tin response ngoài hệ thống. Không bỏ quyền hiện tại khi replay, kiểm tra version, state machine hoặc validation trên payload mới chỉ để giảm dòng.


## Chuyển giữa mock và backend

Theo cấu hình vietcd, `.env` dùng `NEXT_PUBLIC_API_MODE=mock` để bật MSW hoặc `http` để gọi backend. Chế độ chỉ phụ thuộc biến này, không phụ thuộc NODE_ENV; không dùng `.env.development` để ghi đè. `.env.example` là mẫu để tạo `.env`, không được Next.js tự nạp. Chỉ `app/providers.tsx` dynamic import browser worker và đợi worker sẵn sàng trước khi render feature. Promise workerReady giữ lần khởi động dùng chung để tránh start lặp khi React Strict Mode chạy lại effect; đây không phải cấu hình chế độ. Nếu khởi động lỗi, hiển thị lỗi/tải lại thay vì gửi request trước khi MSW sẵn sàng. Test dùng MSW Node server và gọi chính feature service qua HTTP.

MSW dùng mockHandler để trì hoãn response sau khi xử lý request, áp dụng cả JSON thành công, lỗi và tệp. NEXT_PUBLIC_MSW_DELAY cấu hình theo ms, mặc định development 400 và test 0; scenario slow dùng 1500. Không thêm delay trong component/service hoặc từng handler. API dùng /api cho cả client, handler, ảnh và catalog; đã bỏ thành phần phiên bản trong URL, không có alias cũ.

`NEXT_PUBLIC_API_BASE_URL` là URL API đầy đủ, ví dụ `/api` cho MSW hoặc `https://gateway.example.test/api` cho backend; Axios dùng trực tiếp, service chỉ dùng path như `/tasks`. Khi không khai báo, base URL mặc định /api. Khi nối BE, đặt chế độ http và URL backend, kể cả khi build production; component/hook/service tiếp tục dùng cùng luồng HTTP. Khởi động lại dev server sau khi sửa `.env`; với production phải build lại vì Next.js đóng gói NEXT_PUBLIC_* lúc build.

Mock DB tồn tại trong bộ nhớ và reset khi reload. Cần kiểm thử riêng auth/cookie/CORS, scheduler, lưu trữ tệp và LLM khi có Gateway thật. Giới hạn QA của lượt thiết kế hiện tại được ghi trong DESIGN.md.

Rà dữ liệu viết cứng: UI/service không chứa fixture tài khoản/dự án/số liệu; nhãn enum, cấu hình field và bố cục là hằng số giao diện. Xóa helper time() trả ngày cố định theo revision; mọi số liệu và snapshot mới dùng now() của DB. Snapshot expiresAt tính theo analysisPolicy.retentionDays trong data.json (mock hiện 7 ngày); setClock đổi revision để snapshot cũ được đánh dấu và đọc bản mới. Trend không chèn thêm ngày mẫu; thiếu hoạt động thì API trả mảng rỗng và UI hiện trạng thái trống. Scope phân tích từ cảnh báo dùng tháng hiện tại của đồng hồ nguồn. Diễn giải mô phỏng lấy giá trị metric và formatter thay đoạn nội dung mẫu cố định; snapshot mẫu đã lưu trong data.json vẫn bất biến. Xóa useGetSessionQuery/useLogoutMutation không có nơi dùng vì SessionProvider đã quản lý cùng luồng.
