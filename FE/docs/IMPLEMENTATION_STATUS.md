# Trạng thái triển khai

## Điều chỉnh role ngày 26/10/2026

Đã bỏ permissions khỏi seed/model/DTO/session và xóa trang phân quyền riêng. Chuyển S13 sang dialog Đổi vai trò tại danh sách thành viên; backend xét role và phạm vi cho request mới lẫn replay. Query keys nhận user ID nullable và xử lý anonymous tại hàm viewer, không còn lặp fallback trong hooks. Chi tiết tại [ARCHITECTURE.md](ARCHITECTURE.md#điều-chỉnh-role-ngày-26102026).

Kiểm tra sau thay đổi: typecheck, lint, build, git diff --check và **153/153 tests ở 9 file đạt**. Các ca kiểm tra gồm role/phạm vi, chặn replay sau thu hồi vai trò, bảo vệ người phụ trách, giữ lịch sử thành viên, từ chối payload permissions cũ và giữ draft khi đổi vai trò gặp 412. Chưa QA trực quan trên browser hoặc nối BE thật.

Cập nhật 26/10/2026. Đã triển khai tuần tự các luồng chính từ S01 đến S43 theo kiến trúc tham khảo vietcd/frontend. Đây là bản FE dùng HTTP/MSW; chưa nối Gateway hoặc LLM thật và chưa nghiệm thu giao diện trên browser.


## Rà UI, luồng và tham số — 26/10/2026

Đã sửa snapshot/412 cho thao tác tài khoản, ngừng sử dụng đơn vị/nhóm, kết thúc thành viên và nghiệm thu; dialog Task nhận entity/reload từ cha. Sửa bộ lọc phụ thuộc, phạm vi lookup owner/assignee, lỗi lookup và thông báo dữ liệu thiếu. Phạm vi toàn bộ 12 feature/82 service/83 HTTP route được ghi tại [REFACTOR_REVIEW.md](REFACTOR_REVIEW.md#rà-lại-ui-luồng-và-tham-số--26102026).

Typecheck, lint, build, git diff --check và **167/167 tests ở 9 file đạt**; gồm 14 ca mới cho các lỗi trên. Lookup hiện lấy một trang tối đa 100 bản ghi và chưa bảo đảm đủ nhãn lịch sử; đây vẫn là giới hạn nguồn dữ liệu, không tuyên bố đã xử lý hết khi vượt phạm vi đó. Chưa QA trực quan trên browser.

## Phạm vi chức năng

| Màn      | Chức năng đã nối UI → hook → HTTP → MSW                                                                                                                             |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S01–S02  | Đăng nhập/đăng xuất, phục hồi phiên, menu theo quyền, workspace cá nhân, dự án tham gia, báo cáo nháp và hàng chờ nghiệm thu                                        |
| S03–S05  | Tìm/lọc tài khoản, tạo/sửa, khóa thường/khẩn cấp, mở khóa, cấp lại mật khẩu, bảo vệ admin cuối, thu hồi phiên                                                       |
| S06–S07  | Đơn vị cha/con, người phụ trách, tạo/sửa/ngừng sử dụng đơn vị và nhóm, thay thành viên nhóm                                                                         |
| S08–S11  | Danh sách/chi tiết/tạo/sửa dự án, triển khai, kế hoạch và lịch sử trước/sau                                                                                         |
| S12–S14  | Thêm/kết thúc thành viên, đổi vai trò theo role hệ thống, bảo vệ OWNER, kiểm tra điều kiện kết thúc/hủy dự án                                                          |
| S15–S21  | Danh sách/bảng trạng thái, bộ lọc URL, tạo/chi tiết/sửa/giao/bàn giao/bắt đầu/tạm dừng/hủy công việc, cập nhật ước lượng còn lại                                    |
| S22–S23  | Ghi/sửa/VOID giờ công thủ công, ngày theo phân công, tổng mọi công việc không quá 1.440 phút/người/ngày                                                             |
| S24–S28  | Nộp/nộp lại, lịch sử lần nộp, hàng chờ, đối chiếu tiêu chí và nghiệm thu/yêu cầu sửa, lịch sử công việc                                                             |
| S29–S32  | Lọc báo cáo, chọn kỳ ngày/tuần, xử lý trùng kỳ bằng existingReportId, nháp riêng tư, làm mới, lưu/gửi và snapshot bất biến                                          |
| S33–S36  | Dashboard đủ K01–K16, biểu đồ trạng thái/xu hướng, so sánh dự án, nguy cơ task/dự án, workload và điểm nghẽn                                                        |
| S37–S39  | Cảnh báo, ghi nhận xử lý bằng version/note, tách conditionActive, tổng hợp theo số liệu và liên kết đến phân tích                                                   |
| S40, S43 | Snapshot, thông số/công thức/căn cứ, diễn giải mô phỏng, job async, poll 2–10 giây và tạm dừng sau 2 phút, regenerate, giữ lastSuccess khi lỗi, phản hồi BOTTLENECK |
| S41      | Upload multipart theo policy, kiểm tra định dạng/dung lượng/nội dung mẫu, chọn ID READY, tải byte tệp qua HTTP; dùng chung dialog nộp kết quả                       |
| S42      | not-found và error boundary; lỗi 403/404, HTTP/contract/version hiển thị tại màn, không tạo route riêng                                                             |

S16 dùng `/tasks?view=board`; các biểu mẫu phụ dùng hash dialog theo đặc tả. Không tạo 43 route riêng khi đặc tả dùng chung màn/dialog.

## API mock và state

Đủ **83 endpoint HTTP (82 service và 1 URL ảnh đại diện)**, được kiểm tra khớp trực tiếp với API theo feature:

| Feature         | Handler |
| --------------- | ------: |
| auth            |       7 |
| users           |       8 |
| organization    |      11 |
| projects        |       9 |
| project-members |       4 |
| tasks           |      10 |
| time-logs       |       4 |
| submissions     |       6 |
| attachments     |       4 |
| reports         |       7 |
| analytics       |      10 |
| alerts          |       3 |

- Validation theo contract 0.3.0 được chia theo thực thể/nhóm nghiệp vụ; DTO/query/payload/result nằm trong `types`. Các schema kết quả giống nhau dùng một định nghĩa chung; đã bỏ 55 alias DTO không được dùng. Giới hạn một time log được tách khỏi tổng phút báo cáo tuần.
- Đã bỏ generator, endpoint metadata, generic feature hook, registry/manifest, các barrel ở gốc feature và route `/403`, `/404` dư thừa. Không còn file contract lặp chữ ký; service gọi `apiClient.get/post/patch/put` rõ path/payload; hook dùng React Query và khai báo invalidation trực tiếp.
- Các màn báo cáo, nghiệm thu, cảnh báo và phân tích có file riêng. Form nghiệp vụ khai báo useForm/zodResolver và field trực tiếp; phần dùng chung giữ control, pending, dirty và lỗi/xung đột; nghiệp vụ analytics được nhóm trong db.ts.
- Đã áp dụng tiêu chí code gọn: rút tên schema/DTO/query/input/args, bỏ parse input lặp trong service và key, dùng cùng query đã chuẩn hóa cho cache và HTTP. Analytics chia sẻ scope giữa khung lọc và màn; DB dùng query đã được handler parse. Form trả output có kiểu theo schema; tạo/sửa dùng callback riêng và props chung, không parse lại nguyên dữ liệu đã kiểm tra. Payload được ghép mới hoặc chỉ gồm phần thay đổi vẫn được kiểm tra.
- HTTP transport còn hai file `services/api-client.ts` và `services/http-error.ts`; kiểu options, token bộ nhớ và refresh được đặt cùng client, không còn `api.types.ts`/`auth-session.ts` riêng.
- Đã chuyển cả 12 feature sang Axios trực tiếp. Query dùng `params`, payload dùng JSON/FormData, download dùng Blob; Axios quản lý timeout và hủy request. Interceptor giữ bearer, refresh dùng chung, If-Match và idempotency; response tiếp tục được kiểm tra bằng Zod.
- Đã rà luồng lưu/truyền biến: bỏ 13 kiểm tra session lặp trước `hasPermission`, điều kiện enabled trùng kiểm tra ID ở hook, 5 guard lặp trong form sửa, props taskId/tiêu chí trùng task và query phụ chỉ lấy refetch trong dialog. Request ticket khởi tạo một lần; DTO CRUD/cảnh báo không parse lặp trước handler. Refresh báo cáo không gọi HTTP preview hai lần; submit DB dùng cùng preview cho kiểm tra và snapshot. HTTP kiểm tra response trực tiếp bằng schema một lần.
- Đã thống nhất API/params theo catalog: 14 schema danh sách dùng chung pagination/search; `Pagination` suy ra từ schema; ID dùng quy tắc opaque chung tại form/HTTP; hook truyền resourceId trực tiếp cho cache/HTTP, không parse hoặc tạo alias id/parentId. Đổi tên `ReportPreviewQuery`, `FilterOptionsQuery`, bỏ alias query/input trùng; service nhận ID → query/payload → options. Không thêm slug hoặc đổi 83 route hiện có. Test đối chiếu cả service và handler với catalog.
- Đã rà model/DTO và ranh giới thư mục: phân biệt model lưu trữ và dữ liệu tính khi đọc trong db.ts; bỏ tổng giờ/cờ quá hạn khỏi model task, bỏ freshness/quyền phản hồi theo viewer khỏi model analysis. Snapshot đã chốt vẫn được lưu. Tách 7 form/thao tác quản trị khỏi màn cha, 2 phần hiển thị phân tích và PermissionGate khỏi UI chung. FormOption riêng cho UI; permission schema dùng chung; upload hiển thị policy từ HTTP thay vì hardcode.
- Handler chỉ chuyển HTTP sang DB và định dạng status/cookie/header. CRUD, quyền, version, audit, transaction và scheduler nằm ở DB; fixture/policy trong data.json. Có test ngăn đưa nghiệp vụ hoặc seed trở lại handler và ngăn DB phụ thuộc Request/MSW.
- Mock đã gom về 18 file: data.json, db.ts, browser.ts, node.ts và folder handlers (12 nhóm API, http.ts, index.ts). Xóa 35 file cũ trong db/data/utils và reset.ts; đưa toàn bộ fixture báo cáo/audit/tệp/analysis vào data.json. Handler vẫn chỉ xử lý HTTP và gọi DB; reset tại node.ts xóa state/receipt, hủy scheduler và nạp lại seed. Bỏ 14 alias viewer và các hàm chuyển tiếp analytics không cần thiết.
- Theo tiêu chí response/model mới: 9 Row cho danh sách; báo cáo chỉ trả tổng giờ thay cho snapshot, nhóm trả số thành viên. Bỏ timestamp/metadata không có nơi dùng, dữ liệu dashboard trùng và collection analysis seed trùng. Dữ liệu tính tiến độ/quyền/tải tệp/xác thực snapshot giữ nội bộ. HTTP test kiểm tra body trước client parse; form sửa/version/snapshot tiếp tục được kiểm tra.

- Request strict whitelist, response Zod, quyền/phạm vi, state machine, If-Match, idempotency, hàng đợi mutation, rollback khi lỗi, audit và outbox mô phỏng.
- Receipt chỉ được replay khi còn quyền hiện tại. Token access có thời hạn, bị thu hồi khi khóa/reset. Login/tạo user/reset mật khẩu/upload dùng ticket tạm để MutationCache không giữ credential hoặc byte tệp; các mutation thông thường nhận variables trực tiếp.
- Query giữ server state; Zustand giữ menu/dirty form/yêu cầu xác nhận đang chờ; filter nằm trên URL. Dữ liệu nhạy cảm được dọn khi mất quyền; đổi phiên xóa cache.
- Form giữ input khi lỗi và cho đối chiếu phiên bản mới. Dialog dùng Radix focus trap; có nhắc form chưa lưu khi đóng/rời trang.
- Báo cáo đã gửi và snapshot phân tích không bị ghi đè khi nguồn thay đổi. KPI giờ công lọc theo người ghi, không dồn lịch sử cho người nhận mới.
- Job dùng scheduler mock độc lập GET; danh sách/dashboard không tạo job. Cảnh báo được đánh giá sau command nguồn hoặc scheduler tick, tách khỏi job diễn giải.

- Giao diện ngày 25/10/2026: xanh nước biển–trắng, SVG đăng nhập, sidebar có nhóm và thu gọn desktop/ngăn trượt mobile; nút menu đồng bộ, trạng thái active cho route con. Form co theo số trường, kiểu dữ liệu và nội dung textarea. Có test điều hướng nhóm/quyền, thu gọn và Escape/focus của menu.

## Kiểm tra

- HTTP/MSW: luồng tạo → giao → bắt đầu → ghi giờ → nộp → yêu cầu sửa → nộp lại → nghiệm thu; tài khoản/tổ chức/dự án, báo cáo, tệp, snapshot/job/feedback/cảnh báo.
- Ca ranh giới: đúng thời điểm deadline, nộp đúng hạn nhưng duyệt muộn, hết phiên/mất quyền, replay đồng thời, version cũ, mẫu số 0/null, tuần Việt Nam, nháp riêng tư và số liệu đã chốt.
- Component với React Query và HTTP/MSW thật trong JSDOM: StrictMode chỉ gửi một job, gửi báo cáo 0 giờ, nộp kết quả, giữ nội dung qua xung đột 412 và chấp nhận phiên bản mới để thử lại.
- Kiểm tra sau chỉnh giao diện ngày 25/10: `npm run typecheck`, `npm run lint`, `npm test` (**75/75 ca, 8 file**) và `npm run build` đều thành công. Test kiến trúc đối chiếu đủ 79 HTTP route của cả service/MSW với API catalog; kiểm tra query/ID tương đương dùng chung cache/request, paging đồng nhất và query sai bị từ chối. Payload thừa trường không ghi DB. Test Axios kiểm tra refresh đồng thời, replay, cancellation, retry, Blob và response sai cấu trúc. Test model kiểm tra số giờ sau VOID, ranh giới deadline và metadata analysis đổi theo quyền. Component test kiểm tra policy upload lấy qua HTTP, refresh báo cáo một lần, form sửa task giữ nội dung qua 412 và dùng snapshot được chấp nhận. Các ca nghiệp vụ tiếp tục gọi service qua HTTP/MSW. JSDOM không thay cho kiểm tra Service Worker và layout trên browser.
- Form đơn vị/nhóm/tài khoản, cập nhật giờ còn lại và xử lý cảnh báo chỉ mở khi bấm thao tác. Tạo đơn vị chuyển sang `/admin/organization/new`. Các nút sửa/ngừng sử dụng cùng hàng; card form co theo nội dung, field 36px và lưới chia cột theo chiều rộng form. Thông tin nhóm/thành viên chung một card; chọn thành viên bằng popup có tìm kiếm.
- Hồ sơ và đăng xuất chuyển vào menu avatar; bổ sung `/profile` và username/email trong session để hiển thị. AlertDialog xác nhận chưa lưu nằm giữa màn, focus mặc định vào Ở lại; tất cả luồng chuyển thao tác dùng xác nhận bất đồng bộ, giữ giá trị select trước khi chờ. Sonner chuyển góc trên phải. Tải lại/đóng tab tiếp tục dùng cảnh báo do browser quản lý.
- Admin xem dashboard/phân tích toàn hệ thống, lọc cả đơn vị chưa có dự án và đọc chi tiết liên quan. Quyền sửa dự án/task, nghiệm thu, xử lý cảnh báo và lập báo cáo thay nhân viên không được cấp thêm. Test kiểm tra tổng hợp nhiều đơn vị, đơn vị trống, từ chối ghi và giữ scope của Manager; test UI kiểm tra form chỉ mở sau nút, tạo đơn vị riêng, popup chọn thành viên, lưu tiếp sau đổi thành viên đúng version, menu avatar và hủy/chấp nhận bỏ dữ liệu.
- Dev server chạy tại `http://localhost:3000`; GET các route login/workspace/projects/task/report/dashboard/analytics/reviews và `mockServiceWorker.js` trả HTTP 200. Đây là kiểm tra HTTP, chưa phải kiểm tra thao tác trên browser.
- Quét JavaScript production không có marker mật khẩu mẫu, cookie mock hoặc `msw/browser`; `git diff --check` thành công.

Lượt sửa theo “Lỗi FE.docx” ngày 25/10 đã hoàn tất phần code: form nghiệm thu mở bằng nút và căn cùng cột kết quả; lịch sử task/dự án dùng bảng thay đổi có nhãn thay cho JSON; bộ lọc quá hạn gộp vào select trạng thái; các field lọc chia hết hàng; tabs rõ trạng thái đang chọn kể cả route con. Sửa các cặp nhãn/giá trị tại lần nộp, cảnh báo, job AI và dashboard. Dữ liệu audit trả tên người và đúng giá trị cũ của các field được cập nhật. Toàn bộ typecheck/lint/build và **83/83 tests, 8 file** thành công. Quy tắc tránh lặp được lưu ở `UI_REVIEW.md` và dẫn từ AGENTS.md. Giới hạn kiểm tra trực quan vẫn như bên dưới.

Lượt sửa “Lỗi FE_2.docx”: thu gọn dòng bảng/phân trang, bỏ margin âm làm hỏng viền khung, đưa dự án vào cột riêng và thao tác chi tiết về cuối hàng. Người dùng có avatar chữ cái; đơn vị/nhóm có danh sách cuộn và thanh tiêu đề gọn. KPI dùng thẻ nhỏ, trang phân tích bỏ các khung số liệu lặp/rỗng; thu gọn chữ kỹ thuật và diễn giải đơn vị/công thức. ReportRow/ReviewRow đủ nhãn hiển thị, bỏ component gọi API từng task trong hàng chờ. Typecheck/lint/build và **87/87 tests ở 8 file** đạt; quy tắc được bổ sung vào UI_REVIEW.md và AGENTS.md.

Thanh phân tích dùng dropdown bên trái và popup bộ lọc bên phải, giữ scope URL khi chuyển mục; bỏ các mô tả chung lặp tiêu đề. Typecheck/lint/build và **89/89 tests ở 8 file** đạt.

Lượt cập nhật hồ sơ/tài khoản và câu chữ validation: chi tiết tài khoản Admin có bố cục hai cột gọn, tên/avatar/trạng thái ở đầu và nút sửa cạnh tiêu đề; ẩn hướng dẫn khóa khi chưa mở thao tác. Hồ sơ sửa họ tên/tên đăng nhập/avatar sau nút, giữ email/đơn vị/vai trò chỉ đọc; PATCH /auth/me multipart lưu một transaction với version/idempotency. Session thêm version/avatarUrl, user row/detail thêm avatarUrl; GET /avatars/:avatarId cấp ảnh qua URL opaque, DB tạm giữ byte riêng. Thay ảnh dọn ảnh cũ, ảnh hỏng hiển thị chữ cái tên. Form file và draft được giữ khi lỗi/412; menu tài khoản cập nhật từ response. Resolver diễn đạt lỗi theo tên trường và loại input, không parse lặp; bỏ thông báo mã tài nguyên trên form.

Kiểm tra lượt này: typecheck, lint, build và **113/113 tests ở 9 file** đạt; git diff --check đạt. Có kiểm tra whitelist hồ sơ, sửa đúng tài khoản, đổi tên đăng nhập, duplicate/version/session, multipart avatar/byte ảnh/thay ảnh/idempotent replay, rollback với ảnh sai hoặc quá lớn, cập nhật menu và giữ draft qua đối chiếu/dirty confirmation. HTTP response vẫn được kiểm tra đủ danh sách field, không lộ avatarId/byte ảnh. Tổng catalog là 81 route (80 service và 1 image resource). Browser QA và lưu ảnh bền vững vẫn thuộc các giới hạn bên dưới.

Cập nhật điều hướng còn sót: ProjectShell/TaskShell chuyển sang SectionSelect chung với AnalyticsFrame; xóa Tabs và CSS cũ. Trạng thái nằm cạnh tiêu đề, phần mô tả chỉ giữ tên đơn vị/dự án. Dropdown chọn đúng route con/edit/history, giữ phân quyền và xác nhận draft trước khi chuyển. Typecheck, lint, build và **115/115 tests ở 9 file** đạt; git diff --check đạt. Hai ca bổ sung kiểm tra lịch sử dự án từ query, mục phân quyền theo viewer và hủy/chấp nhận rời form qua dropdown; ca chi tiết lần nộp chuyển sang kiểm tra mục đang chọn. Browser QA vẫn chưa thực hiện được theo giới hạn bên dưới.

Lượt avatar/mật khẩu, bảng lịch sử và tổng quan cá nhân: đã đọc cách bố trí account-page/account-sidebar/avatar-preview và schema/service của vietcd. DATN dùng cột avatar/mục hồ sơ bên trái, nội dung thông tin/ảnh/đổi mật khẩu riêng bên phải; giữ email/đơn vị/vai trò chỉ đọc, dirty/conflict và toast. PATCH hồ sơ chỉ cần trường đang sửa, upload ảnh không gửi lại tên; PUT /auth/me/password kiểm tra mật khẩu cũ, mới/xác nhận và không lưu credential trong cache/audit. History-table cân bốn cột cho cả dự án/công việc, gộp lý do vào sự kiện. Overview-stats tự chia đều khi có 3/4 card, lấy số việc quá hạn qua HTTP, danh sách dự án dùng bảng gọn; xóa CSS cũ không dùng.

Kiểm tra lượt này: typecheck, lint, build và **121/121 tests ở 9 file** đạt; git diff --check đạt. Ca mới kiểm tra mật khẩu cũ sai/mới yếu/trùng/xác nhận sai, bảo toàn dữ liệu khi lỗi, mật khẩu có khoảng trắng, replay không tạo thêm audit, whitelist/phiên, credential không nằm trong MutationCache; patch hồ sơ một trường/ảnh riêng và từ chối patch rỗng; card tổng quan của nhân viên/PM đúng quyền, số quá hạn và liên kết cá nhân. Catalog có 82 route (81 service + 1 image resource). Chưa kiểm tra trực quan browser theo giới hạn bên dưới.

Lượt thống nhất thẻ bảng: cả 22 nơi dùng DataTable đã chuyển sang một cấu trúc table-card sở hữu tiêu đề/nút thao tác, mô tả, vùng cuộn/trạng thái rỗng và chân phân trang. Các màn truyền pagination/onPage thay vì tự ghép Panel và Pagination; bỏ các lớp bọc/viền/padding trùng và CSS :has đoán loại card. ReportNumbers gom thời điểm/tổng giờ/nút làm mới vào cùng thẻ. Bảng tĩnh có footer đếm dòng, bảng xem nhanh không tự tạo phân trang giả; chế độ board và danh sách đơn vị tiếp tục dùng Pagination riêng vì không phải bảng.

Kiểm tra sau lượt này: typecheck, lint, build và **121/121 tests ở 9 file** đạt; git diff --check đạt. Đã cập nhật ca kiểm tra khung chung để xác nhận tiêu đề, bảng, trạng thái rỗng và điều khiển phân trang đều thuộc cùng thẻ, nút trước/sau giữ đúng trang; màn báo cáo qua HTTP chỉ có một footer và footer thuộc thẻ bảng. API/DTO/MSW không đổi. Chưa kiểm tra trực quan browser theo giới hạn bên dưới.

Lượt sửa câu chữ phân tích: mô tả K01–K16, các snapshot mẫu và lời phân tích sinh trong mock chuyển sang giải thích ý nghĩa thay vì đọc công thức. UI dùng “Ý nghĩa chỉ số”, “ước lượng ban đầu/hiện tại”, “thời gian có thể làm việc”, “mức độ bận”; dashboard tách rõ chênh lệch với từng mốc ước lượng. Ngày/giờ và thời lượng trong diễn giải dùng formatter hiện có. Không thay đổi phép tính, giá trị KPI, điều kiện lọc, đơn vị API hoặc DTO; K07 vẫn so với ước lượng hiện tại, chênh lệch ban đầu vẫn lấy deltaOriginalMinutes.

Kiểm tra lượt này: typecheck, lint, build và **121/121 tests ở 9 file** đạt; JSON hợp lệ/định dạng Prettier và git diff --check đạt. Chỉ cập nhật các kỳ vọng câu chữ trong test hiện có, không thêm test chỉ đối chiếu câu mới. Giới hạn browser QA vẫn như bên dưới.

Lượt danh sách đơn vị/nhóm trước chi tiết: /admin/organization và /admin/teams dùng DataTable chung, phân trang theo URL và cột Hành động/Chi tiết; không chọn bản ghi đầu hoặc tải detail/users khi vào danh sách. Thêm /admin/organization/[unitId], /admin/teams/[teamId], /admin/teams/new; UnitEditorPage/TeamEditorPage ghép detail và lookup, giữ form đóng đến khi bấm thao tác. Sau tạo chuyển vào chi tiết mới. TeamRow trả unit (id/name) thay unitId để hiển thị tên đơn vị ngay từ list response; model/DTO chi tiết/payload giữ unitId. Xóa bố cục hai khung và CSS/state chọn dòng cũ. Tổng 24 bảng dùng DataTable; không thêm HTTP endpoint.

Kiểm tra lượt này: typecheck, lint, build và **124/124 tests ở 9 file** đạt; git diff --check đạt. Các ca mới kiểm tra danh sách chỉ gọi collection, có cột hành động/link đúng, không có nút sửa/members/deactivate hoặc form; tạo nhóm qua HTTP chuyển đến chi tiết. Ca chi tiết đơn vị/nhóm tiếp tục kiểm tra mở form sau nút, giữ draft khi hủy bỏ thay đổi, lưu đúng version và chọn thành viên qua popup tìm kiếm. Raw HTTP test kiểm tra đúng field TeamRow mới. Build xác nhận đủ ba route mới; giới hạn browser QA vẫn như dưới.

Lượt hồ sơ công khai nội bộ: đã tham khảo public-profile-page/service/types của vietcd, chuyển nội dung sang công việc/dự án. Thêm /users/[userId] trong workspace cho thành viên đã đăng nhập; GET /users/:userId/profile qua users service → HTTP/MSW → DB. DTO chỉ có thông tin nhận diện, ba bộ đếm và dự án phân trang; không trả email/username/version hoặc tạo model/seed tính sẵn. Dự án giới hạn theo quyền viewer, số công việc tiếp tục lọc quyền xem task; hồ sơ khóa/không có trả 404. Có liên kết từ menu avatar, tên người dùng và thành viên dự án. Hồ sơ cá nhân đổi thành header nhận diện dùng chung và một card cài đặt, dropdown chọn thông tin/ảnh/mật khẩu; form thông tin mở sau nút, các ô mật khẩu chia chiều ngang. Giữ cập nhật phiên, dirty/conflict và kiểm tra ảnh/mật khẩu. Tổng 25 bảng dùng DataTable; catalog 83 route (82 service + 1 image resource).

Kiểm tra lượt này: typecheck, lint, build và **130/130 tests ở 9 file** đạt; git diff --check đạt. Ca mới kiểm tra whitelist DTO/raw HTTP, nhân viên xem hồ sơ không cần quyền quản trị, lọc dự án/công việc theo viewer, phân trang và query sai, hồ sơ khóa/không có/thiếu phiên; màn hồ sơ không hiện trường riêng tư hoặc nút quản lý của người khác, link hồ sơ/menu đúng và select giữ mục khi hủy bỏ draft. Build có route /users/[userId]. Chưa kiểm tra bố cục trực tiếp trên trình duyệt theo giới hạn bên dưới.

Lượt điều chỉnh theo xác nhận tiếp theo: hồ sơ công khai chỉ giữ ProfileHeader và email liên hệ. ProfileDto rút thành object phẳng id/displayName/avatarUrl/unit dạng tên/systemRole/email; xóa thống kê/dự án, query pagination, type ProfileQuery, logic tính ở DB và CSS profile-stats. Vẫn yêu cầu đăng nhập, không cấp quyền truy cập dự án. Hồ sơ cá nhân thay dropdown bằng tab ngang có icon, màu/gạch chân mục đang chọn, hỗ trợ bàn phím và giữ confirmDiscard khi có draft. Chi tiết công việc hiển thị createdAt/firstStartedAt từ dữ liệu đã lưu, chưa bắt đầu hiện Chưa bắt đầu; không thêm field model trùng, không nhận mốc từ form, không đổi giờ công. Số bảng về 24; catalog vẫn 83 route.

Kiểm tra lượt này: typecheck, lint, build và **132/132 tests ở 9 file** đạt; git diff --check đạt. HTTP test kiểm tra đúng whitelist hồ sơ/email, truy cập hồ sơ liên hệ khác đơn vị nhưng không mở quyền dự án, từ chối query cũ và giữ auth/404. UI test kiểm tra không còn số liệu/bảng, tab bàn phím và hủy/chấp nhận bỏ draft. Task test kiểm tra hiển thị hai mốc, mốc tạo/bắt đầu giữ qua tạm dừng, bắt đầu lại và bàn giao; TaskRow vẫn rút gọn và giờ công không suy ra từ khoảng thời gian. Chưa kiểm tra bố cục trực tiếp trên trình duyệt theo giới hạn bên dưới.

Lượt đồng nhất khung quản lý/view và bố trí hồ sơ theo vietcd: đã đọc account-page/account-layout-shell, AdminShell/AdminDetailFrame và màn quản lý của publisher. WorkspaceShell dùng một div.page-surface chung cho mọi trang, có viền/bo góc/nền trắng/padding và phân cách dưới tiêu đề; không thêm wrapper ở từng màn. /profile bỏ hero/card cài đặt rời, đặt tiêu đề/email, tab ngang và nội dung gọn trong khung chung; avatar ở giữa mục ảnh, giữ form mở sau nút và dirty/conflict. Hồ sơ công khai vẫn chỉ gồm nhận diện/email.

Rà hardcode dữ liệu: UI/service không chứa fixture nghiệp vụ; giữ nhãn/enum/validation/cấu hình giao diện. DB bỏ helper time() và các ngày cố định của snapshot/trend/kỳ cảnh báo, dùng now() và policy retentionDays trong data.json; đổi đồng hồ cập nhật revision. Snapshot mới có hạn tương đối thay mốc cố định; trend rỗng hiển thị đúng trạng thái trống. Nội dung diễn giải mô phỏng lấy giá trị metric của snapshot. Xóa helper subjectKey chỉ gọi JSON.stringify, hook useLogoutMutation không có nơi dùng và file use-auth-queries.ts; tải phiên/đăng xuất vẫn qua SessionProvider. Seed và snapshot lịch sử vẫn ở data.json; API catalog giữ 83 route, không đổi DTO.

Kiểm tra lượt này: typecheck, lint, kiểm tra noUnusedLocals/noUnusedParameters, build và **133/133 tests ở 9 file** đạt; git diff --check đạt. Ca mới kiểm tra đổi tháng/năm không phụ thuộc ngày mẫu, metadata/scope cảnh báo và snapshot theo đồng hồ, không tạo điểm trend khi không có hoạt động; đổi đồng hồ làm snapshot cũ OUTDATED và có bản mới. Diễn giải mô phỏng được đối chiếu với nhãn/giá trị metric. Các ca hồ sơ/avatar/mật khẩu/draft/quyền và HTTP/MSW hiện có tiếp tục đạt. Chưa kiểm tra bố cục trực tiếp trên trình duyệt theo giới hạn bên dưới.

Lượt danh sách/chi tiết/lịch sử công việc, loading và URL API: TaskRow trả thêm firstStartedAt cho cột Ngày bắt đầu, null hiện Chưa bắt đầu. Chi tiết thiết kế lại thành metadata, nội dung/tiêu chí, giờ công và bảng hoạt động gần đây; giữ thao tác cập nhật còn lại sau nút, version/dirty/conflict. HistoryTable dùng DataTable/AuditChanges cho lịch sử đầy đủ và xem nhanh của task/project, bỏ timeline và CSS lịch sử cố định khác các bảng còn lại. Bảng đầy đủ phân trang theo HTTP/URL, xem nhanh có liên kết mở đầy đủ.

Thêm loading.tsx trong workspace và module loading.tsx dùng chung PageSkeleton/Skeleton/Spinner; thay Loading dạng chữ trong 41 component, áp dụng dạng bảng/form/chi tiết/cards. Nút lưu/ActionButton/đăng nhập/tải tệp/AI và topbar refetch có spinner; skeleton trang trí và trạng thái tải có aria-hidden/status/busy, hỗ trợ reduced motion. MSW mockHandler trì hoãn response sau xử lý cho cả success/error/binary, mặc định development 400 ms và test 0, cấu hình NEXT_PUBLIC_MSW_DELAY; slow 1500 ms. API client, 83 handler, avatarUrl, catalog và test chuyển sang tiền tố /api, bỏ đường dẫn có thành phần phiên bản. Quyền/state machine/idempotency/version giữ nguyên.

Kiểm tra lượt này: typecheck, lint, noUnusedLocals/noUnusedParameters, build và **135/135 tests ở 9 file** đạt; git diff --check đạt. Kiểm thử HTTP xác nhận baseURL mới, độ trễ cả success/error và whitelist TaskRow có firstStartedAt; kiểm thử UI thấy skeleton/spinner trước response, ngày bắt đầu/null đúng nguồn và form chờ bị vô hiệu hóa. Các ca lịch sử mở đối chiếu trường, hồ sơ/avatar/auth, phân trang, quyền và luồng công việc tiếp tục đạt. Kiểm tra mã nguồn/tài liệu không còn tiền tố API có phiên bản cũ. Chưa kiểm tra bố cục trực tiếp trên trình duyệt theo giới hạn bên dưới.

Lượt bố trí chi tiết hồ sơ theo vietcd: đã đối chiếu InfoTab/AvatarTab/SecurityTab và avatar-preview. /profile hiển thị form ngay, email readonly nằm trên họ tên/tên đăng nhập một cột, rộng tối đa 576px, field cao 44px và nút lưu ở dưới bên trái; mật khẩu cùng bố cục dọc. Avatar tròn 160px trong panel giữa, placeholder biểu tượng người, picker riêng và preview/tên tệp sau chọn; object URL được dọn khi thay ảnh/đổi mục. Giữ màu xanh–trắng, không sao chép nghiệp vụ đọc truyện hoặc chính sách khóa tên đăng nhập của vietcd. Form file thêm callback UI onFileChange để tạo preview, không đổi payload/validation. Lưu hồ sơ cập nhật snapshot version từ response, giữ dirty/conflict khi chuyển mục.

Kiểm tra lượt này: typecheck, lint, build và **135/135 tests ở 9 file** đạt; git diff --check đạt. Các ca màn hình được cập nhật cho form mở sẵn, email readonly, tên tệp và chuyển tab; kiểm tra lưu liên tiếp hai lần không bị stale version, avatar HTTP cập nhật menu, giữ file/draft khi lỗi hoặc hủy bỏ thay đổi và đổi mật khẩu không giữ credential trong cache. Không đổi API/DTO/model. Chưa kiểm tra bố cục trực tiếp trên trình duyệt theo giới hạn bên dưới.

Đã thêm responsive dùng chung cho các thẻ: container theo vùng nội dung/card/form, lưới KPI và skeleton tự chia cột, các vùng chi tiết/tài khoản/đối chiếu/phân tích xếp dọc khi hẹp. Tiêu đề/nút/đính kèm và footer bảng có thể xuống hàng; giảm padding thẻ nhỏ, sửa min-width của fieldset/control và giữ cuộn ngang bên trong bảng/tab. Chỉ thay CSS, không đổi API/DTO/nghiệp vụ. Typecheck, lint, build, git diff --check và **135/135 tests ở 9 file** đạt. Kiểm tra trực quan browser vẫn chờ nghiệm thu do giới hạn công cụ đã ghi nhận.

Đã đối chiếu luồng avatar với account-page/avatar-crop-dialog của vietcd: chọn tệp mở Radix dialog cắt ảnh bằng react-easy-crop, kéo/chạm/phím và zoom 1–3, xác nhận tạo ảnh 512×512 rồi upload qua HTTP/MSW. Hủy/Escape/đóng không hỏi bỏ lưu; cùng tệp có thể chọn lại, URL tạm được thu hồi. Giữ crop khi xử lý ảnh/upload lỗi và đối chiếu version khi 412; thành công vẫn ở mục ảnh và cập nhật menu. Loại bỏ SchemaForm/callback/ảnh preview cũ riêng ở mục avatar; form thông tin/mật khẩu giữ dirty guard. Không đổi API/DTO/model.

Typecheck, lint, build, git diff --check và **138/138 tests ở 9 file** đạt. Kiểm thử dùng cropper thật với giả lập geometry/canvas của JSDOM, xác nhận kéo/zoom thay đổi pixel gửi vào Canvas và chỉ byte ảnh đã cắt được upload/download qua HTTP. Bao phủ hủy/Escape, chọn lại cùng tệp, giới hạn ảnh, lỗi mã hóa và đối chiếu 412 giữ vùng cắt; các luồng thông tin/mật khẩu tiếp tục đạt. Chưa kiểm tra trực quan thao tác cắt trên trình duyệt do giới hạn công cụ bên dưới.

Theo yêu cầu dùng response trực tiếp như vietcd, đã bỏ lớp bọc data/meta và error/meta: success là DTO, collection giữ items/pagination, lỗi là code/message/fieldErrors?/details?. Xóa metaSchema/requestId/serverTime, đổi errorResponseSchema phẳng và parseResponse kiểm tra trực tiếp response.data. MSW và idempotency replay trả cùng JSON DTO/status/header; không thêm tương thích định dạng cũ. Các service giữ schema nghiệp vụ và luồng Axios → MSW → DB; download/avatar binary, auth/refresh, quyền/version/idempotency và độ trễ giữ nguyên. Cập nhật các ca đọc JSON gốc và kiểm tra response/lỗi sai định dạng, cùng tài liệu API/DTO/rule.

Typecheck, lint, build, git diff --check và **139/139 tests ở 9 file** đạt. Các kiểm thử đọc body trước client parse xác nhận collection chỉ có items/pagination, profile/detail không bọc data, lỗi 401/422 phẳng và fieldErrors giữ path. Response DTO hoặc lỗi sai hình dạng bị từ chối; các ca replay/version, refresh, upload/download binary và luồng UI tiếp tục đạt. Kiểm thử qua HTTP/MSW, chưa nối backend thật.

Đã chuyển 82 hàm của 12 service sang cách viết async/await như vietcd: const response = await apiClient.<method><DTO>(...), return response.data. Dùng DTO/List/Result có sẵn, thêm LoginResponse suy từ schema cho token response của auth; không sao chép interface hoặc tạo registry. Service khai báo schema trong config; interceptor kiểm tra JSON/binary và trả dữ liệu đã parse, bỏ parseResponse/parseFile cùng chuỗi .then ở service. Import nội bộ feature dùng đường dẫn tương đối, khoảng cách method thống nhất. Giữ luồng HTTP/MSW, token ngoài Query cache, refresh/cancellation/version/idempotency và định dạng DTO đã thống nhất.

Typecheck, lint, build, git diff --check và **139/139 tests ở 9 file** đạt. Kiểm thử HTTP xác nhận response sai vẫn bị từ chối, trường ngoài DTO được loại trước khi trả service, download kiểm tra header và lỗi JSON trong Blob, refresh một lần cho 401 đồng thời và cancellation không thành lỗi retry. Rà source không còn <unknown>/chuỗi .then hoặc helper parseResponse/parseFile trong service. Không đổi giao diện/API contract hoặc thêm kiểm thử chỉ để khớp cách viết hàm.

## Refactor toàn bộ theo vietcd — 25/10/2026

Đã lần 12 feature và 82 hàm service đến nơi gọi trong ứng dụng; HTTP catalog vẫn đủ 83 route, gồm tài nguyên avatar. [REFACTOR_REVIEW.md](REFACTOR_REVIEW.md) ghi đầy đủ từng hàm, URL, hook/nơi điều phối và các điểm giữ theo nghiệp vụ.

Form chuyển sang useForm có kiểu, zodResolver và JSX field trực tiếp. Bỏ SchemaForm/VersionedSchemaForm, resolver metadata và kiểu Record cho giá trị biểu mẫu; Form dùng chung chỉ quản lý hiển thị/pending/lỗi/dirty/conflict, ReasonForm dùng lại biểu mẫu một lý do. Chọn schema và default riêng cho tạo/sửa, không giữ mã dự án/đơn vị/mật khẩu khởi tạo/thành viên trong nhánh không dùng. Schema patch tái dùng whitelist và constraint của create; changedFields giữ kiểu nên bỏ parse patch lặp. Minh chứng cùng state của form nộp kết quả; bỏ giới hạn links khai báo lặp và parse lại payload đã kiểm tra.

Query giữ một bước chuẩn hóa trước key và HTTP, không dùng query sai để tắt tải vô thời hạn; lỗi vẫn đi qua API. Bỏ 26 options chưa có nơi truyền. Mutation dùng useIdempotentRequest cho 43 thao tác cần khóa; giữ khóa khi lỗi và kết thúc sau thành công, không lặp retry:false. Giữ cache riêng theo viewer, invalidation, xử lý mất quyền, ticket cho credential/file, version/412 và polling AI. Service viết trực tiếp với kiểu DTO, bỏ 12 file interface *.contract.ts lặp chữ ký; HTTP vẫn chỉ có api-client.ts và http-error.ts. Import nội bộ feature dùng đường dẫn tương đối. MSW tiếp tục chặn HTTP và gọi DB tạm, không thêm đường gọi mock trực tiếp.

Kiểm tra cuối: **typecheck, lint, build, git diff --check và 145/145 tests ở 9 file đạt**. Các ca mới bao phủ lỗi filter qua HTTP, giao việc không có lý do thừa, bắt đầu/tạm dừng, tạo/sửa/VOID giờ công với đúng nguồn version, đánh dấu cảnh báo đã đọc, retry giữ/đổi khóa, patch dự án không gửi hoặc kiểm tra trường bất biến, lỗi form tiếng Việt và lỗi phần tử liên kết. Giữ các ca quyền/cache/412/upload/avatar/nghiệm thu/báo cáo/AI trước đó. Chưa kiểm tra bố cục trực tiếp trên trình duyệt hoặc nối backend thật.

## Điều hướng theo role, bỏ hasPermission — 25/10/2026

Đã xóa hasPermission và PermissionGate khỏi FE. Sidebar và WorkspaceShell dùng cùng canVisit trong lib/auth/access.ts; role quyết định trang/menu và bị chặn trước khi mount query khi nhập URL trực tiếp. Bỏ kiểm tra quyền view trong enabled của các hook. Phần canAct của lượt này đã được thay bằng canManage theo role/phạm vi ở lượt 26/10; không tự cấp quyền ghi cho Admin. Dọn 9 component chỉ chuyển tiếp sau khi bỏ gate. Session DTO chỉ còn user/projectAccess, bỏ systemPermissions không còn consumer; backend vẫn kiểm tra role/phạm vi/thao tác độc lập.

403/410 xóa dữ liệu cũ nhưng giữ query lỗi để observer không tự tạo request lặp sau khi bỏ chặn quyền trong hook. Các ca mới kiểm tra Manager thấy trang theo role khi không có quyền trang cấp lẻ, Nhân viên không được mở trang quản lý dù Session chứa quyền dự án, truy cập URL trực tiếp bị chặn trước request, phạm vi API bị từ chối và snapshot hết hạn không tải lại vô hạn.

Typecheck, lint, build, git diff --check và **152/152 tests ở 9 file đạt**. Không thay API nghiệp vụ hoặc cấp thêm quyền backend; Session response đã rút gọn và tài liệu DTO cập nhật tương ứng. Chưa QA trực quan trên browser hoặc nối BE thật.

## Phần cần nghiệm thu hoặc BE xác nhận

- Browser QA desktop/tablet/mobile, đối chiếu đầy đủ 24 PNG, bàn phím/focus/back-forward và Service Worker thật. Ngày 25/10, công cụ xem trước dừng vì chưa hỗ trợ kiểm soát URL cho Cốc Cốc trên Windows; chưa kiểm tra layout trực tiếp trong browser. Minh họa SVG đã được render và kiểm tra riêng.
- Lookup candidate cho PM chưa có trong contract. Tạo dự án dùng đơn vị/người dùng hiện tại; đổi owner chọn thành viên dự án; thêm thành viên dùng mã tài khoản nội bộ do admin cung cấp và API kiểm tra. Không tự thêm endpoint quản trị ngoài quyền.
- Lịch khả dụng, lịch yêu cầu báo cáo chưa có: capacity/utilization giữ null; dashboard không trả coverage chưa có nơi hiển thị; closure-check kết hợp báo cáo nháp và fixture requiredReports.
- LLM hiện là diễn giải mô phỏng có nhãn rõ; chưa gọi nhà cung cấp, chưa có đánh giá mô hình dự báo. Ngưỡng cảnh báo là ngưỡng thử nghiệm trong đặc tả.
- Gateway, auth/cookie/CSRF/CORS production, rate limit, quét tệp, lưu trữ bền vững, scheduler và gửi notification thật thuộc phần tích hợp BE. Mock dùng bộ nhớ và reset khi reload.

Không coi bản này là nghiệm thu toàn bộ NFR/KT hoặc giao diện chỉ vì đã có route/handler và tests thành công.
