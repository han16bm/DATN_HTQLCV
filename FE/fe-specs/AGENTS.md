# Quy tắc bắt buộc khi triển khai frontend

Đường dẫn tài liệu trong tệp này tính từ thư mục `fe-specs/`. Các đường dẫn `src/...` mô tả cấu trúc đích tại gốc ứng dụng khi Codex được giao triển khai.

Đây là bộ đặc tả để triển khai hệ thống quản lý dự án và công việc tích hợp AI. Trước khi code, đọc README.md, 00_SCOPE_AND_DECISIONS.md, screens/SCREEN_SPECIFICATIONS.md, screens/UI_STATES.txt, mock/MOCK_MODELS.txt, các rule và toàn bộ API/DTO liên quan. Phạm vi là 27 Use Case, không xây ERD hoặc thiết kế dữ liệu tổng thể.

Điều chỉnh theo yêu cầu người dùng đến ngày 26/10/2026: cấu trúc, HTTP/Axios, form, role và DTO hiện hành theo `../AGENTS.md`, `../docs/ARCHITECTURE.md` và `../docs/REFACTOR_REVIEW.md`. Không tạo lại shared/model, barrel công khai, registry, generator, file contract lặp service hoặc quyền cấp lẻ từ ví dụ gốc bên dưới. Quy tắc UI/luồng/tham số được cập nhật tại `../docs/UI_REVIEW.md`; route và whitelist hiện hành ở API_CATALOG.md. Giữ các ràng buộc nghiệp vụ, version/idempotency, validation tại biên server và phạm vi dữ liệu không trái với điều chỉnh mới.

## Thứ tự thực hiện

1. Dùng 24 ảnh màn chính và screens/MAIN_SCREENS.md; triển khai đủ đặc tả S01–S43, điều hướng/state theo các TXT trong screens/. Hoàn thiện shell, routing, permission states và các trạng thái tải/rỗng/lỗi trước.
2. Giữ nguyên contract v0.3.0 khi triển khai với mock. Nếu BE cung cấp contract khác, ghi bảng khác biệt rồi cập nhật schema, DTO, MSW, tài liệu và kiểm thử cùng một thay đổi. Không tự đoán đường dẫn hoặc trường mới để làm giao diện chạy.
3. Làm lần lượt: tài khoản/tổ chức → dự án/thành viên → công việc/giờ công → kết quả/nghiệm thu → báo cáo → tổng quan/AI. Chỉ dùng chức năng ngoài phạm vi khi người dùng bổ sung yêu cầu.
4. Kiểm tra một luồng nghiệp vụ hoàn chỉnh sau mỗi phân hệ. Sau khi tạo ứng dụng Next.js, thiết lập lệnh lint/typecheck/build phù hợp rồi chạy trên code đã viết. Kiểm tra luồng tích hợp bằng MSW và các điều kiện nghiệp vụ có ý nghĩa; không tuyên bố tài liệu này có sẵn chương trình hoặc bộ test ứng dụng.

## Cấu trúc và công nghệ

- Next.js App Router; TypeScript strict; Tailwind CSS; shadcn/ui; React Hook Form; Zod; TanStack Query; fetch wrapper thống nhất. Chỉ thêm Axios riêng khi cần tiến trình upload thực tế và đã ghi rõ lý do.
- Tổ chức theo `src/features/<feature>/{api,model,components,hooks}`. `app/` chỉ ghép màn hình, layout và route boundary; nghiệp vụ nằm trong feature.
- `shared/` không import feature, app hoặc mocks. Feature không import sâu vào `api/`, `components/`, `hooks/` của feature khác. Quan hệ phụ thuộc được phép đi qua public `index.ts` và được ghi ở tài liệu kiến trúc.
- `src/contracts/registry.ts` và `src/mocks/` là lớp tích hợp. Không import chúng vào component sản phẩm; gọi API qua public API của feature.
- Không gọi `fetch`/Axios trong component hoặc Zustand store. Không đọc fixture trực tiếp để hiển thị sản phẩm. MSW phải chặn chính request mà API client gửi.
- Không dùng `any`, `@ts-ignore`, `@ts-nocheck` hoặc ép kiểu kép để bỏ qua lỗi DTO. Type assertion sau một bước Zod đã xác minh cùng schema được phép dùng ở adapter có giải thích.

## Dữ liệu và kiểm tra

- Schema là nguồn của DTO qua `z.input`, `z.output` hoặc `z.infer`. Không viết một interface khác cho cùng payload. DTO request, DTO response, form input và view model có trách nhiệm riêng.
- Request body dùng strict object và danh sách trường cho từng API. Không gửi nguyên object response hoặc `{...entity,...form}` làm payload. Không tạo `UpdateDTO = Partial<EntityDTO>`.
- GET: kiểm tra path/query và response JSON. Mutation: thêm kiểm tra body; validate form trước khi submit. Header phiên bản và khóa gửi lặp kiểm tra ở adapter. Download binary chỉ validate tham số/error JSON và kiểm tra metadata/content type của tệp.
- Quyền, tính duy nhất, deadline theo dự án, trạng thái hiện tại và tổng phút/ngày phải được BE kiểm tra lại. Zod ở FE và mock không thay thế kiểm tra đó.
- `undefined` nghĩa là không thay đổi; chỉ dùng `null` với trường được khai báo nullable. Chuỗi rỗng chỉ dùng với trường cho phép xóa nội dung. Thời điểm sự kiện là ISO UTC có `Z`; ngày làm việc là `YYYY-MM-DD` theo Asia/Ho_Chi_Minh; số phút là số nguyên.
- Không trim mật khẩu. Không dùng `z.coerce.boolean()` để parse chuỗi `false`. Không đổi ô số rỗng thành 0. Không tự gán giờ cho một deadline chỉ có ngày.

## Quy tắc nghiệp vụ phải giữ

- Một người chịu trách nhiệm mỗi công việc đang mở. NEW → TODO qua phân công; TODO ↔ IN_PROGRESS qua bắt đầu/tạm dừng; nộp chỉ chuyển PENDING_REVIEW; chỉ nghiệm thu mới chuyển COMPLETED.
- Không cho sửa công việc, đổi người, ghi giờ hoặc hủy trong PENDING_REVIEW. COMPLETED/CANCELLED không mở lại. Quá hạn là cờ, không thêm trạng thái OVERDUE.
- Người xét kết quả phải có quyền trên dự án và khác người nộp, kể cả khi giữ nhiều vai trò. ADMIN không mặc định có quyền nghiệp vụ trên mọi dự án.
- Không tự tính giờ công từ thời gian chạy trạng thái. Loại nhật ký khỏi tổng bằng VOID có lý do; giữ dấu vết. Giữ hạn gốc và các lần điều chỉnh.
- Báo cáo nháp chỉ tác giả xem/sửa. Gửi báo cáo chốt snapshot từ nhật ký gốc trên server. Giao diện không cập nhật snapshot theo dữ liệu công việc hiện tại và không tạo thêm giờ công.
- Thiếu mẫu số hoặc lịch làm việc thì hiển thị chưa đủ dữ liệu; không đổi null thành 0. Kết quả AI có nguồn, phạm vi, phương pháp và thời điểm; không dùng làm lệnh tự sửa công việc.

## State, cache và lỗi

- React Query giữ server state. Zustand chỉ giữ UI state như drawer, chế độ bảng/list và lựa chọn chưa lưu. Filter có thể chia sẻ/đánh dấu dùng URL. React Hook Form giữ biểu mẫu.
- Query key phải có viewerId, tài nguyên, ID và bộ lọc đã chuẩn hóa. Không dùng một key cho nhiều bộ lọc. Mutation invalidate đúng nhóm trong contract và đúng phạm vi người xem/dự án.
- Không dùng optimistic update cho nghiệm thu, phân quyền, phân công, giờ công hoặc snapshot báo cáo. Chỉ cập nhật giao diện từ response đã validate.
- Gửi `If-Match` từ version đã đọc cho API yêu cầu concurrency. 412 giữ form, báo xung đột và tải bản mới để đối chiếu; không tự ghi đè. 409 là xung đột nghiệp vụ/gửi lặp, không gộp với 412.
- Giữ một Idempotency-Key cho lần thử lại cùng payload; payload thay đổi hoặc thao tác mới dùng khóa mới. Không tự retry mutation bằng khóa mới.
- Xử lý riêng 401, 403, 404, 409, 412, 422, 429, 5xx, network error và contract error. Đổi tài khoản/đăng xuất phải hủy request cũ, bỏ Query cache và UI state theo phiên.

## Next.js và MSW

- RSC dùng server adapter tách riêng, tạo state theo request; không import browser worker hoặc Zustand singleton vào RSC. Không serialize token vào props/hydration.
- Dữ liệu riêng tư không dùng cache chung giữa các phiên. Client Query invalidation không tự làm mới cache RSC; nếu cùng tài nguyên có ở hai lớp, phải quy định cả hai đường làm mới.
- Với giai đoạn mock, ưu tiên feature data được fetch ở client qua React Query; App Router quản lý shell/layout. Khi thêm server fetching, cấu hình MSW Node riêng hoặc mock API server. Browser Service Worker không bắt fetch chạy trên Next server.
- Chỉ bật MSW trong development/test bằng cờ cấu hình. Await worker.start trước request đầu tiên. Không đưa dependency mock vào luồng production hoặc phát tán mật khẩu mẫu thành tài khoản thật.

## Điều kiện hoàn thành

Mỗi màn phải đúng bố cục Sxx, đúng quyền, đủ trạng thái và dùng đúng API/DTO. Mỗi mutation phải đúng whitelist, điều kiện nghiệp vụ, version/idempotency, cache invalidation và lỗi tương ứng. Mọi thay đổi contract phải có test ý nghĩa. Báo cáo kết quả nêu file đã đổi, kiểm tra đã chạy và phần chưa tích hợp BE; không tuyên bố đã kiểm tra với Gateway thật khi mới chạy MSW.

## Áp dụng ma trận API bắt buộc

- Tuân thủ api/ZOD_REACT_QUERY_MATRIX.md cho từng operation: query/mutation/adapter, schema, key, enabled, polling và invalidation. Không thay useQuery bằng useEffect fetch hoặc đưa server state sang Zustand.
- downloadAttachment là GET nhưng chỉ chạy khi click qua useMutation; không lưu Blob trong Query cache. refreshSession là auth adapter single-flight, không phải query polling.
- Mọi endpoint, field và DTO là đặc tả; Codex sẽ viết schema và implementation sau. Không dùng việc có một đường dẫn ví dụ trong rule để suy rằng file code đó đã tồn tại.
- Ảnh của trạng thái error/conflict giữ form là yêu cầu hành vi. Không reset input khi refetch hoặc lỗi 412.

## Bắt buộc cho bản UI + LLM (tài liệu 0.4, contract 0.3.0)

1. Đọc rules/DESIGN_SYSTEM.md, rules/LLM_ANALYSIS.md, api/API_CHANGELOG_LLM.md và ảnh mới trước khi triển khai. Giữ font; chữ 400–500, xanh trầm, bo 4–6 px, không bóng, hạn chế icon. Màn phụ dùng pattern chính và đặc tả văn bản.
2. Dùng LLM có sẵn qua adapter BE. FE chỉ gọi Gateway; không chứa SDK/key/provider request. Số liệu do BE tính; lời phân tích chỉ diễn giải snapshot, không chấm xác suất.
3. Click analysisRef mở S43, vừa có metrics/context/evidence vừa có explanation. Tách state AI khỏi state dữ liệu; không che metrics bằng spinner khi chỉ AI đang chạy.
4. createAnalysisJob body mới chỉ analysisId/generationMode/locale. Chỉ một REUSE_OR_CREATE cho lượt mở hợp lệ; GET/refocus/select không tạo LLM call. Poll job không tự đẩy state.
5. Validate ID/snapshot/citation/state và projection read-only bằng Zod. Query key có viewerId và analysisId/jobId. Job cũ không được ghi lời vào snapshot mới; nguồn đổi giữ snapshot cũ và báo OUTDATED.
6. Recommendation chỉ dẫn tới route mapper được cho phép; không gọi mutation task/phân quyền/nghiệm thu tự động. Không dùng template fixture làm nội dung sản phẩm hoặc tuyên bố đã gọi LLM thật.
7. Không dựng app/src trong lượt bàn giao đặc tả. Chỉ khi người dùng giao triển khai code ở bước sau mới tạo ứng dụng; các đường dẫn src trong rule là cấu trúc đích.


## Bám sát nguồn và phạm vi ảnh (bản 0.4)

- Đọc FUNCTION_COVERAGE.md và rules/SOURCE_QUALITY_AND_SCENARIOS.txt. Hoàn thành cả luồng chính/thay thế/ngoại lệ của 27 UC; 24 PNG không giới hạn phạm vi chức năng.
- Không tạo PNG cho state/sitemap/dialog phụ hoặc thêm app trong lượt bàn giao tài liệu. Khi được giao code, triển khai đủ 43 mã màn/biểu mẫu theo đặc tả.
- Implement createAnalysisFeedback đúng UC-D04; chỉ BOTTLENECK/canSubmit, verdict+comment strict, idempotency, giữ lịch sử; không biến phản hồi thành duyệt task hoặc xử lý alert.
- Summary template từ BE luôn sẵn sàng khi nguồn hợp lệ; summaryText/systemSummary khác LlmExplanation. Không giả template là AI READY.
- Analytics lookup dùng listAnalyticsFilterOptions, có scope/search/page, không gọi API quản trị để lấy nhãn. teamId thuộc key và scope.
- Nguy cơ dự án và projectComparisons phải có các field read-only đã đặc tả; không tự tính xác suất hoặc suy giờ từ assignee hiện tại.
- Giữ notification sau commit và alert dedupe trong mock/BE integration; không tự thêm màn inbox chưa có yêu cầu.
