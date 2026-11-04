# Cấu trúc FE theo feature

Áp dụng tổ chức hiện hành theo yêu cầu refactor ngày 25/10/2026 tại [ARCHITECTURE.md](../../docs/ARCHITECTURE.md) và [Kiến trúc hiện hành](../../docs/ARCHITECTURE.md). Feature dùng `api`, `schemas`, `types`, `hooks`, `components`; import nội bộ tương đối, import trực tiếp và không có barrel/registry/generator. Không tạo interface `*.contract.ts` lặp chữ ký service. Form có `useForm` + `zodResolver` và field trực tiếp; phần dùng chung chỉ giữ control, hiển thị, dirty và lỗi/xung đột. Các bố cục `shared/model/contract` trong ví dụ gốc bên dưới được thay bằng cấu trúc hiện hành này; nghiệp vụ vẫn theo catalog.

## Kiến trúc được chọn

FE là một ứng dụng Next.js App Router, chia module theo năng lực nghiệp vụ. Mọi request nghiệp vụ đi tới public API của Gateway. BE quyết định service đích; FE không chứa URL nội bộ của từng microservice. Trong development, MSW chặn cùng request đó và trả response theo cùng DTO.

Giai đoạn đầu dùng App Router cho routing/layout và React Query trong client feature cho dữ liệu có tương tác. Cách này phù hợp phương án mock được đặc tả và tránh phải mock đồng thời mọi lệnh fetch của RSC. Khi có nhu cầu SSR dữ liệu riêng tư, thiết kế server adapter và phiên server rõ ràng trước khi bổ sung.

## Thư mục đích của ứng dụng Next.js

| Vị trí | Trách nhiệm | Điều không đặt tại đây |
|---|---|---|
| `src/app/(auth)/login/page.tsx` | Ghép màn đăng nhập S01 | Schema và fetch tự viết lại |
| `src/app/(workspace)/layout.tsx` | Shell, menu theo quyền, route boundary | Mọi logic của từng phân hệ |
| `src/app/(workspace)/.../page.tsx` | Ghép public screen của feature theo route Sxx | Điều phối trạng thái nghiệp vụ trực tiếp |
| `src/features/auth` | Phiên, đăng nhập/đăng xuất, thông tin quyền hiện tại | Quyền tự suy từ tên vai trò |
| `src/features/users` | Quản lý tài khoản nội bộ | Tự đăng ký công khai |
| `src/features/organization` | Đơn vị, nhóm nhân sự | Quyền truy cập mọi dự án trong nhóm |
| `src/features/projects` | Kế hoạch, triển khai, kết thúc dự án | Sửa công việc bằng patch dự án |
| `src/features/project-members` | Thành viên và quyền dự án | Dữ liệu tài khoản gốc |
| `src/features/tasks` | Thông tin, phân công, thực hiện, lịch sử công việc | Giờ công suy từ timer/trạng thái |
| `src/features/time-logs` | Nhập/sửa/loại giờ công | Xóa dấu vết nhật ký |
| `src/features/submissions` | Nộp kết quả, hàng chờ xét, quyết định nghiệm thu | Cho nhân viên tự đặt COMPLETED |
| `src/features/reports` | Nháp và snapshot báo cáo đã gửi | Sửa snapshot theo thông tin hiện tại |
| `src/features/attachments` | Policy, upload và download minh chứng | Đường dẫn lưu trữ nội bộ |
| `src/features/analytics` | Chỉ số, phân tích, diễn giải và job AI | Tự áp dụng đề xuất AI |
| `src/features/alerts` | Xem, ghi nhận và xử lý cảnh báo | Thay nghiệp vụ công việc khi đóng cảnh báo |
| `src/shared/ui` | Component nền dùng chung, shadcn/ui | Fetch dữ liệu feature |
| `src/shared/api` | HTTP transport, lỗi chuẩn, request headers | Endpoint/domain schema cụ thể |
| `src/shared/contracts` | Scalar, thời gian, pagination, HTTP error, audit | Phụ thuộc vào feature |
| `src/contracts` | Tuỳ chọn khi dự án cần hợp nhất contract để export/check | Import vào component để tùy chọn endpoint động |
| `src/mocks` | Interception, fixture, mô phỏng mutation | Import vào luồng production |
| `src/providers` | QueryClientProvider, khởi động mock, UI providers | Quy tắc nghiệm thu/phân công |

Trong mỗi feature, `api/dto.ts` giữ schema/DTO; `api/contracts.ts` định nghĩa endpoint; `api/query-keys.ts` giữ key; `api/queries.ts` và `api/mutations.ts` xây query options; `model/` giữ mapper, enum label và policy UI; `components/` giữ phần giao diện; `hooks/` giữ phối hợp tương tác. Chỉ tạo thư mục khi có nội dung, không sinh hàng loạt tệp rỗng.

Các màn workspace và system là màn ghép/route boundary ở app; không cần tạo service hoặc API mới chỉ vì có một mã màn hình. Khi sửa bố cục, cập nhật ảnh Sxx cùng đặc tả màn và ma trận trạng thái trước khi sửa code.

## Quy tắc phụ thuộc

`app` ghép public feature; feature dùng shared; shared không dùng feature. `index.ts` chỉ export contract/model thuần. Nếu có hooks/component dùng `use client`, tạo public `client.ts`; nếu có xử lý server, tạo `server.ts`. Không gom cả hai vào cùng một barrel.

Các phụ thuộc đọc model hiện có: auth đọc UserDTO của users; reports đọc enum trạng thái công việc của tasks; time-logs/submissions dùng TaskDTO trong response tổng hợp. Chỉ đi qua public `index.ts`. DTO dùng chung như Audit và ReasonRequest nằm ở shared. Nếu phát sinh vòng phụ thuộc, đưa value object dùng chung về shared hoặc ghép ở app; không dùng dynamic import để giấu vòng.

## Phân chia state

| Dữ liệu | Nơi giữ | Ví dụ |
|---|---|---|
| Dữ liệu server | React Query | Công việc, thành viên, báo cáo, quyền trả từ phiên |
| UI state dùng chung trong client | Zustand | Drawer đang mở, chế độ list/board, vùng giao diện đang chọn |
| Filter có thể chia sẻ | URL search params | projectId, trạng thái, nhân viên, trang và từ khóa |
| Biểu mẫu | React Hook Form + Zod | Input thô, dirty fields, lỗi từng ô |
| Biến chỉ dùng một component | React state | Mở/đóng một menu cục bộ |
| Token truy cập | Bộ nhớ của auth adapter theo phiên | Không persist localStorage và không đưa vào Query cache |

Không sao chép task list từ Query vào Zustand. Không lưu cùng filter đồng thời ở URL và store. Dữ liệu biểu mẫu lấy bản đọc tại lúc mở; background refetch không tự reset form đang dirty. 412 giữ bản đang soạn để đối chiếu.

## Cách dùng API

Component gọi query/mutation của feature. API function dùng contract cố định của chính feature và fetch wrapper. Wrapper validate params/query/body, gửi request, parse response rồi trả DTO. Mapper chuyển DTO thành view model khi có nhu cầu hiển thị. Lỗi được render theo mã chuẩn; không trả `[]` hoặc object rỗng để che lỗi.

Với `getTask`, API function nhận taskId và AbortSignal. Với `updateTask`, mapper chỉ tạo các dirty fields trong whitelist, thêm version qua If-Match và khóa gửi lặp qua Idempotency-Key. Tên hàm/hook và khóa cache cho mọi endpoint nằm trong ma trận API.

Chỉ gửi field thực sự thay đổi thuộc whitelist. Lý do là thông tin của thao tác, không được lưu như thuộc tính tùy ý trên TaskDTO. Các command start/pause/assign/submit/approve dùng endpoint riêng, không patch status.

## Query key và làm mới dữ liệu

Key chuẩn có dạng `[feature, viewerId, resourceKind, resourceIdOrFilters]`; tên key chi tiết theo từng endpoint được quy định trong `api/ZOD_REACT_QUERY_MATRIX.md`. Filters được parse để bổ sung mặc định, bỏ undefined và thống nhất kiểu. Dữ liệu theo dự án/kỳ phải có phạm vi đó trong key.

| Nhóm invalidate trong contract | Prefix/đích cần làm mới |
|---|---|
| tasks | task list/board, detail của công việc, lịch sử liên quan |
| time-logs | nhật ký của công việc và tổng giờ trả trong TaskDTO |
| submissions, reviews | các lần nộp, lần nộp mới nhất, hàng chờ nghiệm thu |
| reports | danh sách/chi tiết nháp; GET lại bản đã gửi vẫn giữ snapshot cũ |
| report-preview | preview của tác giả, dự án và kỳ đang soạn |
| projects | danh sách, chi tiết và closure checks |
| project-members | thành viên, quyền và lookup phân công trong dự án |
| auth | thông tin phiên và quyền đang có; nếu mất quyền thì đóng vùng nội dung liên quan |
| analytics, alerts | kết quả của phạm vi dự án/đơn vị và kỳ liên quan |
| analytics-jobs | job đang theo dõi; khi SUCCEEDED mới invalidate kết quả phân tích/cảnh báo |
| users, organization, attachments | danh sách/chi tiết và lookup liên quan |
| all-session-cache | hủy request cũ, xóa toàn bộ cache khi đổi phiên |

`invalidates` là nhóm nghiệp vụ để agent ánh xạ sang query key, không phải chuỗi truyền trực tiếp cho invalidateQueries. Mutation response tổng hợp cho phép cập nhật task/timeLog/submission từ cùng một kết quả đã validate; vẫn invalidate danh sách và chỉ số phụ thuộc. Không dùng optimistic update cho các giao dịch này.

## Next.js, phiên và production

Không tạo thêm Route Handler làm proxy cho mọi API nếu chưa có nhu cầu BFF. Nếu chọn BFF để quản lý cookie/token, cập nhật auth adapter, route map và mock tương ứng. Server Component có thể gọi Gateway trực tiếp qua server adapter; không vòng qua chính Next Route Handler chỉ để lấy dữ liệu của mình.

Phương án access token chỉ trong bộ nhớ client không tự cung cấp token cho RSC. Khi muốn SSR dữ liệu đã đăng nhập, cần phiên server/BFF được chốt với BE; không lấy token từ localStorage trên server. Không serialize token hoặc dữ liệu ngoài quyền vào props/hydration. QueryClient và auth context trên server phải được tạo theo request, dữ liệu cá nhân dùng chính sách cache phù hợp và không chia sẻ giữa người dùng.

Client Query invalidation không tự làm mới RSC cache. Nếu một tài nguyên xuất hiện ở hai lớp, tài liệu feature phải chỉ rõ refresh/invalidation ở cả hai. Bước đầu chỉ fetch feature data qua client Query để giữ một nơi quản lý dữ liệu.

## Quy tắc đặt tên và nghiệm thu cấu trúc

- Feature đặt tên theo nghiệp vụ: auth, users, organization, projects, project-members, tasks, time-logs, submissions, reports, attachments, analytics, alerts. Không tạo features theo tên microservice nội bộ.
- Component dùng PascalCase; hook bắt đầu bằng use; API operation và DTO dùng đúng tên được đặc tả. Một query key factory cho một feature, không viết key rời rạc trong component.
- Không gom toàn bộ dự án vào một file page.tsx hoặc một thư mục services chung. Tách phần tái sử dụng theo trách nhiệm, không tách chỉ để đủ thư mục.
- Bắt buộc kiểm tra dependency, TypeScript strict, lint và build trên dự án thật sau khi Codex triển khai.

## Phần phân tích LLM và UI mới

Feature analytics bổ sung model snapshot/explanation/job; API function cho getAnalysisDetail và hooks theo ma trận 0.3.0. Các DTO tham chiếu PersonRef/EntityLabel nằm ở shared/contracts; không import analytics vào tasks/users chỉ để lấy nhãn. AnalysisRef/DomainAction cũng là value contract dùng chung thuần dữ liệu để alerts có thể dùng mà không tạo vòng phụ thuộc.

Trong analytics, tách giao diện Overview/AnalysisList/AnalysisDetail/MetricPanel/EvidencePanel/AiExplanationPanel/AnalysisJobStatus. Skeleton/lỗi của AI nằm trong AiExplanationPanel; không quản lý server state bằng Zustand hoặc một useEffect fetch riêng. Formatter thời gian/phần trăm/giờ và label trạng thái là pure function ở shared/model; màu/spacing theo ../../docs/DESIGN.md.

Không đưa LLM SDK/key/provider call vào FE. Recommendation đi qua route mapper enum và permission policy, không tự gọi mutation nghiệp vụ. Đặt các lời fixture trong mocks, không hard-code narrative vào component.


## Bổ sung 0.4

Feature analytics bổ sung API/hook cho listAnalyticsFilterOptions và createAnalysisFeedback; model schema feedback, mapper strict verdict/comment và policy canSubmit. Lookup server state nằm trong React Query, feedback form trong React Hook Form. Lời tổng hợp theo mẫu và feedback.latest là dữ liệu BE, không giữ bản sao trong Zustand. State/site TXT là đặc tả, không tạo file route tương ứng cho mỗi dòng state.
