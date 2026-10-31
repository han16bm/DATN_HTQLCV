# Cấu trúc frontend

## Giao diện hiện hành — 31/10/2026

Đã rà 43 page.tsx và 12 feature; xem [UI_REDESIGN.md](UI_REDESIGN.md) cho danh sách từng route, component/state và phạm vi QA. SectionNav chuyển thành liên kết tab ngang (giữ URL/scope/dirty guard). Chi tiết công việc chia nội dung/kết quả và cột ngữ cảnh/giờ công; lịch sử mở drawer khi chọn hàng, không còn khung rỗng. Báo cáo nháp có vùng viết và tóm tắt nguồn, hai nút Lưu nháp/Gửi báo cáo ở đầu form; bỏ footer sticky che field. Báo cáo gửi là bố cục đọc với snapshot. KPI chính thành một nhóm, chỉ số phụ thành danh sách; căn cứ và lời AI cùng ngữ cảnh.

Token chung 24/17/15/14/12–13px, control thông thường 30px, topbar 56px, sidebar 232px; chữ trung tính, xanh cho action/chọn. Bảng dùng header/footer 32px, hàng chuẩn 48px, tên việc ellipsis/title và ưu tiên chữ màu. Filter focus trung tính; select/menu đổi mũi tên theo trạng thái mở thật. Lịch sử dự án và công việc dùng chung drawer 420px có slide; AuditChanges chỉ dựng nội dung trước/sau, không giữ Popover/split riêng. PdfPreview sở hữu Panel với actions trên heading, picker thay tên tệp khi có nhiều tệp; các màn gọi không bọc thêm card PDF. Mô tả/tiêu chí cùng vị trí cũ nhưng phân vùng bằng nền nhẹ/viền trái, không thêm dữ liệu/icon trang trí. Các đoạn UI ngày 30/10 và cũ hơn bên dưới là lịch sử, không yêu cầu dựng lại dropdown SectionNav, section-group/task-overview/task-effort hay panel lịch sử rỗng. API/DTO/mock/permissions/cache/validation nghiệp vụ giữ nguyên trong lượt thiết kế này.

## Khung tài liệu và thử tải lại — 31/10/2026

Ai đọc được công việc cũng thấy vùng tài liệu, gồm nhân viên và người nộp; không dùng TASKS_REVIEW/TASKS_MANAGE để ẩn khung. API lấy lần nộp và tệp vẫn kiểm tra quyền đọc công việc qua requireTask; quyền nghiệm thu độc lập, không đổi. AttachmentViewer/PdfPreview giữ cùng Panel khi chưa có lần nộp hoặc tệp đính kèm. Khung trống có nhãn Chưa có báo cáo đính kèm; ID trống giữ query phụ thuộc tắt, không tạo ID giả hay request rỗng. Tệp lỗi vẫn hiển thị lỗi/thử lại, không bị coi là không có tài liệu. Trang chi tiết công việc và đối chiếu lần nộp cùng dùng khung này; chọn lần nộp, sort/phân trang và vòng đời blob giữ nguyên.

QueryErrorState nhận callback Promise và tái dùng ActionButton cho pending/spinner/disable. Các màn truyền retry={query.refetch}; theo dõi AI cũng trả Promise refetch. Không bọc void hoặc tự reload trang để tạo cảm giác tải lại. ActionButton dùng type=button, tránh submit form cha; response không hợp lệ vẫn là lỗi sau khi thử lại.

## Hạn mock tự cập nhật khi mở ứng dụng — 31/10/2026

browser.ts gọi resetDatabase(new Date().toISOString()) trước khi khởi động worker. DB lấy ngày Việt Nam, đặt deadline task còn mở và còn hạn ở mốc seed thành hôm nay + taskPolicy.dueInDays (6), giữ giờ seed và khoảng lệch originalDueAt. Nếu hạn mới vượt hạn dự án, nới dueAt của dự án tương ứng. Case quá hạn/hoàn thành/hủy, lần nộp và snapshot lịch sử giữ nguyên; HTTP GET không tự dời hạn. Node resetMockState gọi resetDatabase() không đối số để giữ fixture và clock cố định cho các ca tích hợp. setClock vẫn chỉ phục vụ tiến thời gian trong kịch bản, không rebase task.

## Rà dọn toàn bộ FE — 31/10/2026

Đã bỏ feature permission-groups chưa có màn/caller/handler và hàm EvidenceFile cũ; tệp đang xem dùng AttachmentViewer/PdfPreview. Xóa các type không có consumer, thu phạm vi export về nội bộ và bỏ CSS của giao diện đã xóa. class-variance-authority, clsx và tailwind-merge không có import nên được bỏ khỏi dependency trực tiếp.

Session.projectAccess chỉ gồm projectId/permissions; projectRole vẫn ở membership/model để quản lý vai trò và tính quyền. LoginResponse chỉ trả session/accessToken; hạn token tiếp tục được kiểm tra từ sessionExpiry trong DB. MeasureDto bỏ basis; model giữ basis để dựng KPI. Snapshot.scope response chỉ giữ from/to, model vẫn giữ scope đầy đủ cho quyền/tạo lại phân tích. ID snapshot/citation, dữ liệu chart và version vẫn giữ vì validation/thao tác có dùng. AlertDto trả handler (PersonRef), không trả handledBy của model hoặc suy tên theo người đang đăng nhập. Severity/trạng thái lựa chọn dùng cùng schema; phiên bản luật lấy từ analysisPolicy.ruleVersion trong data.json. Nhóm quyền nội bộ chỉ cần features/memberIds.

GET /tasks/:taskId/submissions nhận sort=sequence|-sequence, default -sequence; DB sort trước paginate. Khung báo cáo lấy 5 lần/trang, chọn một lần và một tệp. Đổi trang/sort xóa lựa chọn cũ, không giữ PDF của trang trước; đổi latestSubmissionId remount khung. Xem báo cáo cũ không thay đổi đối tượng nghiệm thu của TaskShell. Không thêm endpoint hoặc trang.

Phạm vi và bằng chứng rà từng feature ở [REFACTOR_REVIEW.md](REFACTOR_REVIEW.md#rà-dọn-file-prop-dto-và-hardcode--31102026).

## Bố cục theo ảnh phản hồi — 30/10/2026

AppShell/AdminShell giữ quyền và phiên, thanh trên chỉ có logo/menu tài khoản; CreateMenu đã bỏ theo yêu cầu. PageNav xếp breadcrumb trên Quay lại. Dự án/công việc/phân tích dùng SectionNav dropdown trong header, vẫn qua DirtyNavigationGuard. Danh sách/Bảng trạng thái là hai button ở bên phải các filter trong cùng hàng lọc, tách khỏi nút tạo ở header và không nằm trong dropdown. Sidebar lọc cùng /tasks và giữ tìm kiếm/dự án/chế độ xem. WorkspaceOverview ghép danh sách chính/cột dự án qua children; các thẻ cá nhân rộng tối đa 220px, không kéo giãn hàng. Nút tạo ở trang chủ có ngữ cảnh Dự án bạn quản lý, chỉ dùng quyền TASKS_MANAGE và danh sách dự án ACTIVE hiện có.

Hàng lọc có padding ngang 8px, ô chọn/nhập có 12px; chiều cao vẫn 32px. Board dùng cột 188–216px, thẻ padding 8px, chữ 13px và metadata 11px, cuộn trong vùng riêng. MetricCard dùng chung: label/value 14px, ngữ cảnh/link ở hàng dưới. Bốn KPI nằm trên biểu đồ, canh phải trong hàng tối đa 960px, không ở cột bên cạnh. Giờ công/chỉ số giữ hai vùng nhưng chia 3/7; lưới chỉ số có 3 cột khi rộng và 2/1 khi hẹp. section-group bao chung hai vùng bằng nền nhẹ/viền, dùng lại ở chi tiết công việc; không chiều cao cố định hay lớp trắng thừa quanh chỉ số.

ReviewsPage đưa q/projectId/page vào useListReviewQueueQuery, tái dùng listQuerySchema và service GET /review-queue. DB lọc q theo tên công việc không phân biệt hoa/thường cùng quyền/dự án trước khi paginate; handler và response không đổi. URL giữ các bộ lọc, xóa page khi đổi q/projectId; không fetch từng task hoặc lọc riêng dữ liệu trang hiện tại.

Panel có section.panel trong suốt, panel-heading chứa title/actions nằm ngoài div.panel-body.card trắng. Các selector form đi qua panel-body; tên lớp/logic feature giữ ở section. DataTable tiếp tục có title ngoài table-card, dữ liệu/footer cùng thẻ. HistoryTable giữ bốn cột 21/23/38/18; công việc luôn có khung phải với lời nhắc khi chưa chọn, chỉ nút Chi tiết ở Hành động mới hiển thị Trước/Sau. Không tự chọn dòng hoặc dùng sự kiện làm nút; nội dung lấy trực tiếp từ item, không thêm query/store. Dưới 900px xếp dọc, dự án giữ Popover portal. task-overview chia nội dung/tiêu chí trái, giờ công phải; padding 12px 14px, gap 16px, chữ 13px. Giờ công dùng flex-row, label/value cách 8px, không border/space-between hoặc bị container chung ép xếp dọc. HeaderActions/HeaderTarget giữ logic tại feature. PageHeader grid đặt tên trái/actions ngoài cùng phải, các thông tin khác ở hàng dưới.

UserBadge dùng chung avatar/tên ở các cột người thực hiện, người nhận, người ghi giờ, người nộp, tác giả và actor lịch sử; metadata dùng person-meta để canh avatar với thời điểm. Tái dùng PersonRef hiện có và avatar chữ cái khi chưa có URL, không thêm request theo từng người hoặc sửa DTO chỉ để dựng avatar. Dữ liệu chưa phân công vẫn hiển thị text.

Nút Quyết định nghiệm thu ở actions của TaskShell, bên phải cùng hàng tên công việc. Nút mở #review tại URL hiện tại; ReviewDialog dùng HashDialog và chỉ mount query lấy lần nộp mới nhất khi mở. TaskShell xét quyền/trạng thái dự án/công việc và route lần nộp; dialog kiểm tra trạng thái/tác giả thực tế từ response. ReviewForm chỉ chứa form, tái dùng mutation và snapshot/version; hủy/Escape giữ dirty guard, 412 tải bản mới để đối chiếu. SubmissionDetailPage không tạo điểm ghi thứ hai. Không thêm route, hook API hoặc endpoint.

## Quyền, điều hướng và khu quản trị — 30/10/2026

Quyền hiệu lực do backend trả trong session và là nguồn duy nhất để mở menu, route, nút và biểu mẫu: `permissions` ở phạm vi hệ thống và `projectAccess[].permissions` ở từng dự án. Role chỉ là nhóm vai trò để hiển thị. Toàn bộ logic nằm ở `lib/auth/access.ts` (`hasPermission`, `hasAnyPermission`, `canVisit`, `canAdminister`, `adminHome`); quản trị tài khoản không kéo theo quyền đọc, sửa hay nghiệm thu dự án. FE chỉ phản ánh quyền đã cấp, backend vẫn kiểm tra độc lập; phiên thiếu `permissions` được xem là chưa cấp quyền.

`components/layout/app-shell.tsx` là khung chung của hai khu vực. WorkspaceShell dùng menu làm việc, AdminShell (route group app/(admin), URL /admin/...) có menu riêng và liên kết Về không gian làm việc; điểm vào qua avatar. Trang chỉ mount khi canVisit cho phép, hết phiên chuyển tới /login kèm next. lib/navigation.ts quản lý menu/cây route cho PageNav; ui-store giữ nhãn/danh sách gần nhất/trang trước. Thiết kế hiện hành dùng SectionNav trong header và nút chức năng của từng màn, không có Tạo toàn cục hay TabNav.

## Điều chỉnh role ngày 26/10/2026

Theo yêu cầu người dùng, bỏ quyền cấp lẻ và trang phân quyền riêng. ADMIN quản trị tài khoản/tổ chức và xem tổng quan toàn hệ thống; MANAGER quản lý dự án nơi có tư cách OWNER/MANAGER; MEMBER xử lý công việc được giao. Session chỉ trả user và projectAccess (projectId/projectRole đang hoạt động); model/DTO không còn mảng permissions. Backend giả kiểm tra role cùng phạm vi dự án, người được giao và tác giả, kể cả khi replay. S13 là dialog Đổi vai trò tại danh sách thành viên; PATCH membership chỉ nhận projectRole/reason. Người phụ trách phải là Leader/PM hoạt động trong đơn vị; bàn giao vai trò quản lý ở dự án đang mở trước khi đổi role hệ thống.

Query keys nhận user ID có thể null/undefined; chỉ hàm viewer trong keys đặt giá trị anonymous. Hook không tự tạo user ID dự phòng; key vẫn tách dữ liệu theo người xem và giữ thứ tự feature/viewer/operation.

Cập nhật 26/10/2026, tham khảo cách tổ chức và luồng auth của `D:/TTZinza/vietcd/frontend`. FE dùng Next.js App Router, TypeScript strict, Tailwind CSS, React Hook Form, Zod, Zustand và TanStack Query. Các yêu cầu nghiệp vụ theo bộ đặc tả và API catalog 0.3.0 trong `fe-specs/`, cùng điều chỉnh mới của người dùng bên dưới.

Bảng lần theo đủ 82 hàm trong 12 feature nằm tại [REFACTOR_REVIEW.md](REFACTOR_REVIEW.md). Cấu trúc hiện hành đã bỏ `*.contract.ts` lặp chữ ký và bộ dựng form bằng metadata; các ghi chép lịch sử trước lượt refactor này không yêu cầu tạo lại các tầng đã bỏ.

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

Mọi thao tác dùng If-Match chốt snapshot/version khi mở form. Refetch nền không nâng version của draft; 412 tải bản mới từ cha, giữ nội dung và chỉ chấp nhận version sau đối chiếu. Tạo giờ công/nộp kết quả dùng Task; sửa/VOID giờ công dùng TimeLog; nghiệm thu dùng Submission. TaskShell truyền Task/trạng thái hoạt động/reload cho dialog thay vì dialog tự đọc lại Task/Project. Xem kết quả quét và giới hạn lookup trong [REFACTOR_REVIEW.md](REFACTOR_REVIEW.md#rà-lại-ui-luồng-và-tham-số--26102026).

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

Hồ sơ theo bố cục account-page của vietcd: tiêu đề/email, tab ngang Thông tin cá nhân/Ảnh đại diện/Đổi mật khẩu, form một cột rộng tối đa 576px ngay bên dưới. Riêng /profile hiển thị form thông tin ngay; bỏ bước mở sửa và bảng thông tin trước form. Email là input readonly bên trên, họ tên/tên đăng nhập xếp dọc, đơn vị/vai trò là dòng thông tin chỉ đọc. Field cao 44px, nút lưu ở dưới bên trái; form mật khẩu cùng bố cục. Tab giữ trạng thái chọn/keyboard/confirmDiscard cho thông tin/mật khẩu.

AvatarEditor hiển thị avatar hiện tại 160px và chọn tệp; avatarSchema kiểm tra định dạng/dung lượng trước khi mở AvatarCropDialog. React-easy-crop cho kéo bằng chuột/chạm/phím, zoom 1–3 và chọn vùng tròn 1:1. Bấm Cập nhật mới lấy pixel của vùng chọn từ ảnh đang hiển thị, vẽ Canvas 512×512, mã hóa WebP rồi gửi File qua PATCH /auth/me multipart; trình duyệt không hỗ trợ WebP dùng PNG từ Canvas. Không gửi ảnh gốc, tọa độ hoặc URL tạm; giữ version/idempotency và ticket để byte ảnh không vào mutation cache. Hủy/Escape/đóng bỏ nguồn ảnh, không upload hoặc hỏi bỏ lưu; avatar không đăng ký dirty form. Object URL được thu hồi khi đóng, thay tệp hoặc rời mục. Dialog dùng Radix để quản lý focus/Escape, không scale animation làm sai kích thước cropper; giữ vùng cắt/zoom khi lỗi, có đối chiếu ảnh hiện tại và chấp nhận version mới khi 412. Thành công cập nhật ảnh/menu và vẫn ở mục ảnh. Đã bỏ callback onFileChange và profileAvatarSchema không còn nơi dùng. Lưu hồ sơ cập nhật snapshot từ result.user để lưu tiếp đúng version. ProfileHeader chỉ dùng ở hồ sơ công khai. PUT /auth/me/password nhận currentPassword/newPassword, xác nhận chỉ ở FE; không trim/lưu credential vào cache/audit. Endpoint trả {ok:true} và giữ phiên hiện tại.

Hồ sơ thành viên /users/[userId] nằm trong workspace yêu cầu đăng nhập. MemberProfilePage dùng users hook/service qua GET /users/:userId/profile; không dùng API quản trị để đọc hồ sơ. Theo yêu cầu đã điều chỉnh, ProfileDto là object phẳng chỉ có id/displayName/avatarUrl/unit dạng tên/systemRole/email. UI chỉ gồm card nhận diện và thông tin liên hệ email; bỏ toàn bộ thống kê, bảng dự án, query phân trang và logic tính trong DB. Handler xác thực rồi gọi DB lấy hồ sơ; query thừa trả 422. Thành viên bị khóa/không tồn tại trả 404. Key chỉ có viewerId/userId, staleTime 0 để cập nhật hồ sơ khi mở lại. Avatar menu, tên thành viên dự án và danh sách tài khoản có liên kết đến hồ sơ; hồ sơ của chính mình có link quản lý /profile. Tổng catalog vẫn có 83 route (82 service + 1 image resource).

TaskDto trả createdAt và firstStartedAt để chi tiết công việc hiển thị Ngày tạo/Bắt đầu thực hiện; task chưa bắt đầu hiện Chưa bắt đầu. TaskRow trả thêm firstStartedAt cho cột Ngày bắt đầu; taskDTO dùng lại từ taskRow, không khai báo lặp field. Hai mốc do server ghi, không có trong payload tạo/sửa; firstStartedAt giữ nguyên qua tạm dừng, bắt đầu lại hoặc bàn giao. Chi tiết dùng metadata ba cột, nội dung/tiêu chí và giờ công hai vùng tự xếp dọc khi hẹp; giờ thực tế, ước lượng ban đầu/hiện tại và còn lại hiển thị riêng. Không dùng tỷ lệ giờ làm làm tiến độ hoàn thành.

Tổng quan cá nhân dùng overview-stats auto-fit thay metric-grid cố định bốn cột: card là link gồm nhãn/số liệu/thao tác, chia đều phần ngang khi chỉ có ba card và cùng chiều cao theo nội dung. Số việc quá hạn lấy pagination.total từ query assigneeId/overdue/pageSize=1, không tự đếm task ở FE. Dự án bên dưới dùng bảng gọn, không để lưới card thưa. Các bảng lịch sử dùng HistoryTable chung trên DataTable: Thời điểm/Người thực hiện/Sự kiện/Hành động, chỉ cột hành động căn giữa như bảng khác, bỏ width cố định và timeline riêng. Lý do đi cùng sự kiện; AuditChanges là thao tác chữ mở đối chiếu trường, không viền/nền.

Field formula trong DTO tiếp tục là chuỗi, nhưng UI trình bày dưới nhãn Ý nghĩa chỉ số. Nội dung giải thích ý nghĩa nghiệp vụ thay vì đọc phép tính; công thức toán và điều kiện lọc nằm trong code/đặc tả. metricFormulas và snapshot mẫu trong data.json, các mô tả sinh động trong db.ts đều dùng câu ngắn, thống nhất “ước lượng ban đầu/hiện tại”, không lộ mã trạng thái. K07 vẫn là thực tế so với ước lượng hiện tại; deltaOriginalMinutes được ghi riêng là so với ước lượng ban đầu. Đơn vị/giờ/ngày trong diễn giải dùng formatter hiện có; không đổi số liệu hoặc cách tính khi sửa câu chữ.

Đơn vị/nhóm tách danh sách và chi tiết: /admin/organization, /admin/teams chỉ tải collection theo page trên URL, render DataTable với Hành động/Chi tiết. /admin/organization/[unitId] dùng UnitEditorPage; /admin/teams/[teamId] dùng TeamEditorPage. Các editor ghép detail và lookup cho form, giữ quyền/loading/error/version/dirty/conflict; form mặc định đóng trên chi tiết. Route /new dùng cùng editor và mở chi tiết bản ghi sau khi tạo. TeamRow thay unitId bằng unit (EntityLabel) cho cột đơn vị, không cần gọi lookup từ danh sách; model Team/DTO chi tiết vẫn lưu unitId và không đổi payload. Bỏ layout danh sách bên trái/chi tiết bên phải, query chọn unit/team và CSS entity-list/organization-layout.
