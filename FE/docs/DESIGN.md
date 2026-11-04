# Thiết kế hiện tại

Nguồn: [Skill FE/codex](../../Skill%20FE/codex/AGENTS.md). Thay các tài liệu thiết kế/review FE cũ; kiến trúc và hợp đồng API giữ riêng.

## Mục tiêu

Người dùng nội bộ cần nhận ra việc phải xử lý trước, đọc nhanh trạng thái và thao tác đúng ngữ cảnh. Một hướng thiết kế duy nhất: gọn, rõ ràng, chuyên nghiệp; xanh biển–trắng, chữ Việt dễ đọc, khoảng cách theo bước 4px, bề mặt phẳng và chuyển động nhẹ.

## Quyết định

- Giữ điều hướng chung ở sidebar cho mọi role, chức năng quản lý bổ sung ở header. Context dự án/task là nhóm riêng; mobile dùng drawer.
- Bố cục có thứ tự: tên và hành động → lọc/trạng thái → dữ liệu chính → chi tiết hỗ trợ. Không thêm card hay số liệu để lấp chỗ.
- Trang Tổng quan tập trung việc của tôi và vùng cần chú ý. Chi tiết task đặt nội dung/kết quả ở trái, phân công/thời hạn/giờ công ở phải; lịch sử riêng. Dự án tập trung sức khỏe và việc cần theo dõi; kế hoạch là thông tin phụ.
- Danh sách dùng cùng toolbar, bảng và pagination. Form dùng cùng grid, field, lỗi và khu hành động; detail trước, chỉ mở form khi thao tác.
- Tái sử dụng token/components hiện có, thay bố cục cụ thể ở màn chính. Không tạo prototype tách rời hoặc thêm bảng điều chỉnh vào sản phẩm.

## Các bước

- [x] Dọn tài liệu cũ, giữ kiến trúc/API/nghiệp vụ và liên kết còn dùng.
- [x] Tái thiết kế khung, type/color/spacing, control, table, form, panel và responsive.
- [x] Tái bố cục tổng quan, dự án, task/board, nghiệm thu/kết quả, báo cáo, phân tích/cảnh báo, hồ sơ và quản trị.
- [x] Rà source của 43 route, trạng thái tương tác, loading/empty/error/conflict, bàn phím, tương phản và reduced motion; chạy kiểm tra kỹ thuật.

## Hệ thống dùng chung

Be Vietnam Pro (400/500/600/700), tự host bằng next/font, phục vụ nhãn tiếng Việt và bảng dữ liệu. H1 24px, heading khối 16px, nội dung/control 14px, metadata 12px. Xanh biển giữ từ ngữ cảnh người dùng, màu hành động #096e9d thay xanh chàm cũ; nền xám xanh #f3f7fa, chữ #213547. Header 52px, sidebar 224/64px; control 32px, form 36px, bảng 44px; vùng cảm ứng tối thiểu 44px. Bo 6px cho control, 8px cho nội dung; lớp nổi có bóng riêng. Chuyển trạng thái 150–200ms và tôn trọng reduced motion.

| Thành phần | Vai trò trong bản mới |
|---|---|
| PageHeader / Panel | Tên và hành động chính trước; heading khối ở ngoài bề mặt dữ liệu, không lồng thẻ trắng |
| FilterBar / SegmentedControl | Một thanh tìm/lọc, chế độ xem là hai nút bên phải; trạng thái chọn bằng nền và chữ |
| DataTable / Pagination | Header, hàng, actions và footer đồng nhất; bảng rộng cuộn trong vùng riêng; refetch tại bảng |
| SplitLayout / KeyValue | Luồng chính trước, cột phụ 300px; xuống một cột theo chiều rộng nội dung; nhãn và giá trị rõ ràng |
| Form / Field / Input | Nhóm nội dung trước kế hoạch; lưới theo chiều rộng form, lỗi cạnh field; giữ draft/dirty/412 |
| MetricStrip / Metric | Một dải dữ liệu gọn thay nhiều thẻ rời; không tính thêm chỉ số để trang trí |
| HistoryTable / PDF | Lịch sử chọn sự kiện mở drawer; tài liệu chọn lần/tệp, khung rỗng vẫn còn |
| ProfileHeader / tab hồ sơ | Avatar/nhận diện ở đầu, tab ngang, email chỉ đọc; không thêm thống kê công khai |

## Phạm vi route

Đối chiếu 43 page.tsx, trong đó 2 route chuyển hướng. Các màn danh sách/detail giữ component và nghiệp vụ hiện có, nhận bố cục/điều khiển chung mới; các màn chính có thay đổi composition riêng như dưới đây. Không tuyên bố đã xem 43 màn trên browser.

| Nhóm | Route | Bố cục/đối chiếu |
|---|---|---|
| Điểm vào | `/`, `/admin` | Chuyển hướng giữ phiên/quyền |
| Đăng nhập | `/login` | Form độc lập bên trái, hình minh họa đã có bên phải; một h1, lỗi gắn field |
| Tổng quan | `/workspace` | Nhóm đếm là nút lọc ưu tiên, việc của tôi là chính, hàng chờ/nháp/dự án là phụ |
| Hồ sơ | `/profile`, `/users/[userId]` | Nhận diện + tab/form; công khai chỉ giới thiệu và email |
| Dự án | `/projects`, `/projects/new`, `/projects/[projectId]`, `/projects/[projectId]/edit`, `/projects/[projectId]/members`, `/projects/[projectId]/tasks`, `/projects/[projectId]/tasks/new` | Tiến độ toàn hàng trước dữ liệu, việc cần theo dõi bên trái/kế hoạch bên phải; form mục tiêu trước phân công/thời hạn |
| Công việc | `/tasks`, `/tasks/[taskId]`, `/tasks/[taskId]/edit`, `/tasks/[taskId]/time-logs`, `/tasks/[taskId]/history`, `/tasks/[taskId]/submissions`, `/tasks/[taskId]/submissions/[submissionId]` | Table/board, tiến trình tách khỏi tên/thao tác, nội dung/kết quả chính + inspector phụ; lịch sử/PDF chung |
| Nghiệm thu | `/reviews` | Tìm/lọc trong toolbar, bảng hàng chờ; quyết định vẫn mở ngay từ tên task |
| Báo cáo | `/reports`, `/reports/new`, `/reports/[reportId]`, `/reports/[reportId]/edit` | Danh sách chung; vùng viết/đọc chính + kỳ/số liệu nguồn phụ; snapshot giữ nguyên |
| Phân tích | `/dashboard`, `/analytics/risks`, `/analytics/workload`, `/analytics/bottlenecks`, `/analytics/summary`, `/analytics/details/[analysisId]`, `/analytics/jobs/[jobId]` | KPI thành một dải; chart 2/3, căn cứ và nhận định cạnh nhau; bảng và thiếu/lỗi/quality theo response |
| Cảnh báo | `/alerts`, `/alerts/[alertId]` | Bảng; bằng chứng ở chính, lịch sử/hướng xử lý ở phụ |
| Quản trị | `/admin/users`, `/admin/users/new`, `/admin/users/[userId]`, `/admin/organization`, `/admin/organization/new`, `/admin/organization/[unitId]`, `/admin/teams`, `/admin/teams/new`, `/admin/teams/[teamId]` | Danh sách → chi tiết → mở form; control/form/khối dữ liệu thống nhất, không tự mở chỉnh sửa |

## Phạm vi QA

Không thay endpoint/DTO/policy/seed để phục vụ trình bày. Dùng test HTTP và luồng màn hình hiện có. Kiểm tra trực quan chỉ qua Edge đang mở; kết nối điều khiển hiện chưa hoạt động. Kết quả cuối được ghi ở đây, không tạo lại các tài liệu lịch sử riêng.

Kết quả kiểm tra: 286/286 test ở 19 file đạt; typecheck và lint sạch. Production build đã đạt với font Be Vietnam Pro. Kiểm tra 19 Markdown hiện còn dùng: không có liên kết nội bộ hỏng; git diff --check sạch. Tương phản: chữ chính 12,48:1; nhãn 5,94:1; metadata 4,77:1; primary 5,63:1; điều hướng 4,95:1; trạng thái chọn 6,28:1; viền input 3,41:1. Skill polish được rà theo accessibility → thừa/trùng/trang trí → hierarchy/rhythm → interaction states; sửa h1/field error, màu biểu đồ, nhóm chỉ số responsive, breadcrumb và vùng bấm cảm ứng.

Giới hạn: cả kết nối native lẫn browser host không khả dụng, nên chưa xác nhận pixel/layout trực tiếp bằng Edge, mức zoom hoặc viewport thực. Các kiểm tra source, DOM/luồng HTTP và build không thay cho bước này. Không chụp bộ ảnh, không chạy Playwright/CDP, không commit/push.
