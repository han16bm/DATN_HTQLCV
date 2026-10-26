# MSW, dữ liệu mock và nối Gateway

## Cách mock hoạt động

Theo yêu cầu ngày 25/10/2026, MSW trả JSON DTO trực tiếp như backend: success là ResponseDTO, collection là {items, pagination}, lỗi là ErrorDTO phẳng code/message/fieldErrors?/details?. Bỏ data/meta, error/meta và metadata requestId/serverTime. Giữ kiểm tra response, HTTP status/header, độ trễ, binary và idempotency replay với cùng body ban đầu.

Điều chỉnh hiện hành: API dùng tiền tố /api cho client, handler và tài nguyên ảnh. mockHandler chung thêm độ trễ sau khi xử lý response, áp dụng success/error/binary. NEXT_PUBLIC_MSW_DELAY là số ms, mặc định development 400 và test 0; scenario slow là 1500. Có thể đặt 0 để tắt độ trễ, không thêm delay vào service/component. Handler chỉ parse HTTP và gọi mocks/db.ts theo cấu trúc hiện hành tại docs/ARCHITECTURE.md.

Component vẫn gọi API feature qua fetch wrapper. MSW khớp method/path, parse request theo contract, kiểm tra quyền/trạng thái/version rồi thực hiện mutation trên database trong bộ nhớ. Response được kiểm tra đúng schema trước khi trả. Lỗi request và lỗi response có mã khác nhau; không trả một JSON thành công cố định cho mọi thao tác.

Codex sẽ đặt state trong `src/mocks/database.ts` theo `mock/MOCK_MODELS.txt`. Mỗi lần reload/reset về bộ dữ liệu của scenario đang chọn. Trong browser, state sống cùng môi trường trang đang chạy; các tab và Next server không tự chia sẻ cùng database. Vì vậy, một luồng mock có mutation nên được chạy trong một môi trường nhất quán; nếu muốn browser và SSR dùng chung state, chạy một mock API server riêng. Không dùng localStorage để làm database nghiệp vụ thay cho MSW.

## Dữ liệu và tài khoản mẫu

Clock mặc định: `2026-10-23T10:05:00.000Z`, tương đương 17:05 tại Việt Nam. Các snapshot LLM mẫu chốt dữ liệu lúc 17:00 và tạo lời lúc 17:01. Codex cần cung cấp thao tác đặt mock clock trong test để kiểm tra đúng biên giờ/ngày; không lấy ngẫu nhiên thời gian hiện tại cho các fixture quan trọng.

| Username | Vai trò/tư cách | Token mock | Mục đích |
|---|---|---|---|
| admin | ADMIN, không là thành viên p-main | mock-u-admin | Quản trị tài khoản/tổ chức; chứng minh không tự có quyền công việc |
| minh | MANAGER, OWNER p-main | mock-u-pm | Quản lý dự án, giao việc, nghiệm thu và AI |
| lan | EMPLOYEE, MEMBER p-main | mock-u-lan | Thực hiện, ghi giờ, nộp và báo cáo |
| huy | EMPLOYEE, MEMBER p-main | mock-u-huy | Người nộp kết quả chờ nghiệm thu |
| other | Thành viên p-other | mock-u-other | Kiểm tra dữ liệu ngoài phạm vi |
| locked | Tài khoản khóa | Không có phiên hoạt động | Kiểm tra bị từ chối đăng nhập |

Mật khẩu mẫu: `Mock@12345`. Chỉ dùng trong development/test. Mock token là chuỗi giả, không phải triển khai JWT, refresh rotation hoặc cơ chế bảo mật của BE.

## Browser và Next.js

Theo điều chỉnh ngày 26/10/2026, dùng `.env` như vietcd: `NEXT_PUBLIC_API_MODE=mock|http`, không kèm điều kiện NODE_ENV và không dùng `.env.development`. Dynamic import browser mock trong Client Provider, await worker.start trước request đầu tiên, sau đó render phần cần Query. Khi nối backend, đặt chế độ http và `NEXT_PUBLIC_API_BASE_URL` bằng URL API đầy đủ có /api. Với MSW, URL này là /api; service chỉ chứa path resource và không nối prefix thêm lần nữa. `.env.example` là mẫu, cần sao chép sang `.env` khi cài dự án.

Browser worker chỉ chặn request phát sinh ở browser. Fetch trong Server Component/SSR cần `setupServer` được khởi động ở Node runtime hoặc một mock API server. Không import `msw/browser` vào instrumentation/server bundle. Không khởi tạo lại setupServer theo từng request; quản lý lifecycle development/test một lần và reset fixture có kiểm soát.

Khi triển khai, login mock cần mô phỏng cookie mẫu bằng Set-Cookie `mock_refresh=<userId>` để MSW mô phỏng cookie trong browser; logout xóa cookie mẫu. Trong test Node có thể gửi Cookie này rõ ràng. Cookie mẫu không có HttpOnly và không đại diện refresh cookie production; không coi việc mock chạy được là đã nghiệm thu cơ chế phiên thật. Khi BE xác nhận D02, thay auth adapter/cookie policy đồng bộ và kiểm tra refresh rotation, cookie attributes, CSRF và thu hồi phiên trên BE.

## Kịch bản phản hồi

Trong môi trường mock có thể gửi header `X-Mock-Scenario` tại test/dev adapter, không đưa selector này vào sản phẩm:

| Giá trị | Kết quả |
|---|---|
| slow | Chậm khoảng 1,5 giây để xem loading/pending |
| empty | Với response có items/pagination: danh sách rỗng, total=0 |
| server-error | 503 theo ErrorSchema |
| rate-limit | 429 theo ErrorSchema |
| invalid-response | Đúng HTTP status nhưng payload JSON sai DTO để kiểm tra ContractError |

401/403/404/409/412/422 được tạo bằng dữ liệu/phiên/thao tác không hợp lệ, không cần giả thành công. Version stale phải là 412; gửi lại cùng idempotency key/payload trả kết quả trước; cùng key khác payload trả 409. Khóa gửi lặp trong mock không có TTL; BE cần chốt thời gian lưu.

## Giới hạn của bộ giả lập

MSW đủ kiểm tra tương tác FE và các quy tắc trọng yếu đã mô phỏng; không thay thế test giao dịch phân tán, cơ chế khóa CSDL, kiểm soát JWT/cookie thật, MIME scanning, object storage, đồng bộ nhiều tab hoặc hiệu năng BE. Việc rollback trong mock là snapshot bộ nhớ, không chứng minh tính nguyên tử của microservice thực tế.

Job LLM trong mock tiến triển theo scheduler/clock điều khiển, không theo số lần poll; dùng văn bản fixture để mô phỏng, không gọi provider thật. Workload trả null khi thiếu lịch khả dụng. Bộ mock chưa có giao diện cấu hình lịch làm việc; số báo cáo bắt buộc trước khi đóng dự án là fixture kiểm soát, cần BE chốt nguồn dữ liệu thực.

Bộ tài liệu này chưa phải ứng dụng để chạy kiểm thử API. Sau khi triển khai, Codex phải tự kiểm tra các endpoint đã làm và các invariant của từng luồng; báo cáo rõ phần dùng MSW và phần đã nối Gateway thật.

## Trình tự nối BE

1. Lấy OpenAPI của Gateway và đối chiếu operation, method, path, DTO, enum, lỗi, pagination, auth, upload và header concurrency/idempotency.
2. Ghi khác biệt ở một bảng có cột contract hiện tại, BE trả, thay đổi cần làm, màn chịu tác động và test tương ứng.
3. Cập nhật schema/DTO, API adapter hoặc mapper, mock và tài liệu cùng nhau; không thêm điều kiện `if mock` trong component.
4. Tắt MSW, đổi public origin và cơ chế phiên đã thống nhất. Kiểm tra preflight/CORS cho Authorization, If-Match, Idempotency-Key và credential mode cần dùng.
5. Kiểm tra tích hợp đầy đủ: tạo → giao → bắt đầu → ghi giờ → nộp → yêu cầu sửa → nộp lại → nghiệm thu → báo cáo → chỉ số/cảnh báo. Thử thêm hết phiên, mất quyền giữa thao tác, stale version và mạng chậm/gửi lặp.
6. Kiểm tra production build không chạy worker, không dùng token/password fixture, không lẫn mock node handler vào bundle client.

## Bộ dữ liệu cho từng màn

Không để các màn báo cáo, lịch sử, tệp và job luôn rỗng vì thiếu seed. Scenario full trong MOCK_MODELS.txt phải có dữ liệu đại diện đủ S01–S43. Scenario empty được chọn riêng để kiểm tra giao diện rỗng. Giá trị mock không nhập trực tiếp vào component.

## Luồng mock LLM theo contract 0.3.0

Triển khai các store/scenario ở MOCK_MODELS.txt. GET overview/detail/job chỉ đọc; createAnalysisJob mới khởi tạo/reuse lượt sinh lời. Handler tạo read projection nhãn từ các model ID. Reset phải dọn scheduler/timer/active job/idempotency của scenario trước.

Mock LLM chạy deterministic và độc lập mạng; không yêu cầu API key. Khi nối BE thật, adapter phía BE thay phần mô phỏng provider; API public và component giữ contract đã đối chiếu. Kiểm tra reuse/coalesce, output invalid, late result, scope revocation, stale/expired snapshot và regenerate lỗi giữ lastSuccess.


## Scenario bổ sung để khép kín nguồn

Thêm lookup theo quyền (không có admin permission vẫn lấy đúng nhãn), filter cha/nhóm ngoài scope, phản hồi điểm nghẽn đủ/thiếu comment/mất quyền/snapshot cũ/replay. Giữ systemSummary/summaryText khi LLM lỗi. Tính nguy cơ dự án từ cùng cohort, không dùng tỷ lệ cảnh báo làm xác suất. Mock notification outbox chỉ chạy sau commit; gửi lỗi và retry không lặp mutation. Chi tiết store/scenario ở MOCK_MODELS mục 19.
