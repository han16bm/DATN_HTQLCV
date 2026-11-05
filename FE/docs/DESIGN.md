# Thiết kế hiện tại

Nguồn: [Skill FE/codex](../../Skill%20FE/codex/AGENTS.md). Thay các tài liệu thiết kế/review FE cũ; kiến trúc và hợp đồng API giữ riêng.

## Mục tiêu

Người dùng nội bộ cần nhận ra việc phải xử lý trước, đọc nhanh trạng thái và thao tác đúng ngữ cảnh. Một hướng thiết kế duy nhất: gọn, rõ ràng, chuyên nghiệp; xanh biển–trắng, chữ Việt dễ đọc, khoảng cách theo bước 4px, bề mặt phẳng và chuyển động nhẹ.

## Quyết định

- Giữ điều hướng chung ở sidebar cho mọi role, chức năng quản lý bổ sung ở header. Dự án và công việc dùng một trang chi tiết, các dữ liệu phụ mở ngăn kéo khi cần; menu mobile dùng drawer.
- Bố cục có thứ tự: tên và hành động → lọc/trạng thái → dữ liệu chính → chi tiết hỗ trợ. Không thêm card hay số liệu để lấp chỗ.
- Trang Tổng quan tập trung việc của tôi và vùng cần chú ý. Chi tiết task đặt nội dung/kết quả ở trái, phân công/thời hạn/giờ công ở phải; lịch sử riêng. Dự án có mục tiêu/kế hoạch/tiến độ ở đầu, công việc và thành viên bên dưới.
- Danh sách dùng cùng toolbar, bảng và pagination. Form dùng cùng grid, field, lỗi và khu hành động; detail trước, chỉ mở form khi thao tác.
- Tái sử dụng token/components hiện có, thay bố cục cụ thể ở màn chính. Không tạo prototype tách rời hoặc thêm bảng điều chỉnh vào sản phẩm.

## Các bước

- [x] Dọn tài liệu cũ, giữ kiến trúc/API/nghiệp vụ và liên kết còn dùng.
- [x] Tái thiết kế khung, type/color/spacing, control, table, form, panel và responsive.
- [x] Tái bố cục tổng quan, dự án, task/board, nghiệm thu/kết quả, báo cáo, phân tích/cảnh báo, hồ sơ và quản trị.
- [x] Rà source của 43 route, trạng thái tương tác, loading/empty/error/conflict, bàn phím, tương phản và reduced motion; chạy kiểm tra kỹ thuật.

## Hệ thống dùng chung

Be Vietnam Pro (400/500/600/700), tự host bằng next/font, phục vụ nhãn tiếng Việt và bảng dữ liệu. H1 24px, heading khối 16px, nội dung/control 14px, metadata 12px. Xanh biển giữ từ ngữ cảnh người dùng, màu theo design system BHXH: điều hướng #0077b4 (blue-600), hành động #0074b0, nền #f6f9fb, bề mặt trắng, chữ #15222b; trạng thái dùng cặp nền/chữ của chip DS (vàng giữ chữ #7a4b00 cho đủ 4,5:1). Header 64px, sidebar 280/80px; nút và ô nhập 38px (cả thanh lọc và biểu mẫu), hàng bảng 44px (gọn 36px); vùng cảm ứng tối thiểu 44px. Chuẩn chung với các phần mềm quản trị gần đây của nhóm và quy tắc chống AI slop ở CLAUDE.md: nút, badge, segmented và liên kết nhỏ bo tròn hẳn (pill); ô nhập bo 8px; thẻ, bảng, panel vuông vức 4px; hộp thoại 8px. Header bảng tô màu điều hướng chữ trắng, hàng chẵn nền nhạt, hover tô màu chọn. Bề mặt tách bằng viền, không bóng nổi; chỉ menu/hộp thoại có một bóng ngắn. Không gradient trang trí. Dấu * bắt buộc màu đỏ. Nút có hiệu ứng nhấn thu nhỏ 3% và chuyển màu 150ms ease-out; tắt khi giảm chuyển động.

| Thành phần | Vai trò trong bản mới |
|---|---|
| PageHeader / Panel | Tên và hành động chính trước; heading khối ở ngoài bề mặt dữ liệu; `compact` cho cột phụ/ngăn kéo với heading 14px và đệm 12px |
| FilterBar / SegmentedControl | Thanh tìm/lọc cách 8px; ô tìm kiếm co giãn, tối đa 16rem; hai icon List/Columns3 bên phải cao bằng control, có tooltip/tên truy cập và trạng thái aria-pressed; không ép nhóm công cụ chiếm cả hàng |
| DataTable / Pagination | Header, hàng, actions và footer đồng nhất; bảng rộng cuộn trong vùng riêng; refetch tại bảng |
| SplitLayout / KeyValue | Luồng chính trước, cột phụ 300px; xuống một cột theo chiều rộng nội dung; nhãn và giá trị rõ ràng |
| Form / Field / Input | Nhóm nội dung trước kế hoạch; lưới theo chiều rộng form, lỗi cạnh field; giữ draft/dirty/412 |
| MetricStrip / Metric | Một dải dữ liệu gọn thay nhiều thẻ rời; không tính thêm chỉ số để trang trí |
| HistoryTable / PDF | Lịch sử chọn sự kiện mở drawer; bảng các lần nộp mở nội dung/tài liệu trong drawer, có chọn tệp và khung rỗng |
| ProfileHeader / hồ sơ | Nhận diện và thông tin cá nhân chung một thẻ; đổi ảnh/mật khẩu ở cột phải, email chỉ đọc; công khai chỉ nhận diện và email |

## Phạm vi route

Đối chiếu 43 page.tsx, trong đó 4 route chuyển hướng (điểm vào và hai đường dẫn dự án cũ). Các màn danh sách/detail giữ component và nghiệp vụ hiện có, nhận bố cục/điều khiển chung mới; các màn chính có thay đổi composition riêng như dưới đây. Không tuyên bố đã xem 43 màn trên browser.

| Nhóm | Route | Bố cục/đối chiếu |
|---|---|---|
| Điểm vào | `/`, `/admin` | Chuyển hướng giữ phiên/quyền |
| Đăng nhập | `/login` | Form độc lập bên trái, hình minh họa đã có bên phải; một h1, lỗi gắn field |
| Tổng quan | `/workspace` | Nhóm đếm là nút lọc ưu tiên, việc của tôi là chính, hàng chờ/nháp/dự án là phụ |
| Hồ sơ | `/profile`, `/users/[userId]` | Thẻ hồ sơ gồm nhận diện, cơ bản và liên hệ; đổi ảnh/mật khẩu và công việc ở cột phải; công khai chỉ giới thiệu và email |
| Dự án | `/projects`, `/projects/new`, `/projects/[projectId]`, `/projects/[projectId]/edit`, `/projects/[projectId]/members`, `/projects/[projectId]/tasks`, `/projects/[projectId]/tasks/new` | Một trang chi tiết chứa mục tiêu/kế hoạch/tiến độ, công việc và thành viên; lịch sử trong ngăn kéo; `/members` và `/tasks` cũ chuyển về trang này, giữ bộ lọc |
| Công việc | `/tasks`, `/tasks/[taskId]`, `/tasks/[taskId]/edit`, `/tasks/[taskId]/time-logs`, `/tasks/[taskId]/history`, `/tasks/[taskId]/submissions`, `/tasks/[taskId]/submissions/[submissionId]` | Table/board; trạng thái gọn dưới tên; mô tả/tiêu chí phía trên bảng lần nộp; thông tin phụ bên phải; nội dung/tài liệu mở theo hàng trong drawer |
| Nghiệm thu | `/reviews` | Tìm/lọc trong toolbar, bảng hàng chờ; quyết định vẫn mở ngay từ tên task |
| Báo cáo | `/reports`, `/reports/new`, `/reports/[reportId]`, `/reports/[reportId]/edit` | Danh sách chung; vùng viết/đọc chính + kỳ/số liệu nguồn phụ; snapshot giữ nguyên |
| Phân tích | `/dashboard`, `/analytics/risks`, `/analytics/workload`, `/analytics/bottlenecks`, `/analytics/summary`, `/analytics/details/[analysisId]`, `/analytics/jobs/[jobId]` | KPI thành một dải; chart 2/3, căn cứ và nhận định cạnh nhau; bảng và thiếu/lỗi/quality theo response |
| Cảnh báo | `/alerts`, `/alerts/[alertId]` | Bảng; bằng chứng ở chính, lịch sử/hướng xử lý ở phụ |
| Quản trị | `/admin/users`, `/admin/users/new`, `/admin/users/[userId]`, `/admin/organization`, `/admin/organization/new`, `/admin/organization/[unitId]`, `/admin/teams`, `/admin/teams/new`, `/admin/teams/[teamId]`, `/admin/permission-groups`, `/admin/project-roles`, `/admin/features`, `/admin/audit-logs`, `/admin/jobs`, `/admin/settings`, `/admin/ip-whitelist` | Danh sách → chi tiết → mở form; control/form/khối dữ liệu thống nhất, không tự mở chỉnh sửa |

## Bố cục chi tiết dự án

- Header nhận diện dự án, trạng thái, Tạo công việc, Lịch sử dự án và menu chỉnh sửa/kết thúc theo quyền. Không còn thanh mục con Tổng quan/Công việc/Thành viên/Lịch sử.
- Đầu trang là một vùng nền nhạt: mục tiêu cùng người phụ trách/ngày bắt đầu/hạn ở trái, biểu đồ tiến độ và trạng thái ở phải. Nguồn tiến độ giữ độc lập với bộ lọc danh sách, có nhắc phạm vi khi dữ liệu vượt 100 mục như trước.
- Phần Công việc dùng TaskListPage: lọc, danh sách/bảng trạng thái, phân trang và mở task thật qua HTTP. Từ 1100px chiều rộng nội dung, công việc ở cột trái co giãn, thành viên ở cột phải 240px, cách nhau 20px và dóng đầu vùng; màn hẹp xếp dọc. Bảng công việc giảm đệm ngang từ 12 xuống 8px, bỏ bề rộng tối thiểu 1080px, chia cột theo nội dung; tên dài cắt gọn và có tooltip. Dưới 42rem chiều rộng bảng, từng hàng xếp thành nhóm hai cột có nhãn để đọc đủ dữ liệu mà không cuộn ngang. Bảng trạng thái giữ hành vi cuộn các cột hiện có.
- Thành viên bên ngoài chỉ hiện tối đa 5 avatar/tên, không có bộ lọc, vai trò hay menu quản lý. Dùng chung query/cache 100 mục vốn phục vụ bộ lọc người thực hiện. Nút Chi tiết mở ngăn kéo `#members` rộng tối đa 480px, bảng đầy đủ mới tải khi mở. Trong ngăn kéo vẫn có tìm kiếm, phân trang và thêm/sửa vai trò/bàn giao/kết thúc theo quyền; bảng chỉ có hai cột người và vai trò kèm tình trạng tham gia, menu nằm trong ô tên. Form mở trên ngăn kéo; đóng hoặc lưu form trở về `#members`, Escape đóng ngăn kéo và trả focus về Chi tiết.
- Công việc dùng q/page/view và các bộ lọc hiện có; thành viên dùng members.q/members.page; lịch sử dùng history.page. Đổi lọc hoặc trang ở một phần giữ nguyên phần còn lại. Lịch sử chỉ tải khi mở ngăn kéo và vẫn giữ khi mở/đóng chi tiết thay đổi bên trong.
- Liên kết cũ đến `/projects/:id/tasks`, `/projects/:id/members`, `?tab=history` chuyển đến đúng vùng trong một trang. Quay lại từ task giữ bộ lọc dự án và cuộn tới #tasks. Form tạo/chỉnh sửa còn ở route riêng; không đổi endpoint, DTO, quyền hoặc nghiệp vụ.
- Đã gỡ SectionNav, slot/context liên quan và hook media-query không còn consumer. Khi dự án đã xác định, nút tạo và bảng công việc không tải danh sách dự án thừa.

## Hồ sơ cá nhân và chi tiết tài khoản

- Trang hồ sơ tận dụng chiều rộng sẵn có của trang, bỏ thanh tab ngang. Avatar/tên/bộ phận/vị trí và thông tin cơ bản/liên hệ nằm chung một thẻ chính, ngăn phần nhận diện bằng đường kẻ nhẹ. Nút Chỉnh sửa ở góc phải đầu thẻ; mặc định chỉ xem. Khi nội dung rộng từ 1000px, cột phụ 320px nằm bên phải, cách thẻ chính 20px; màn hẹp xếp dọc, các cặp thông tin tự chuyển một cột theo chiều rộng thực tế.
- Cột phải bắt đầu bằng một hàng hai nút Chọn ảnh/Đổi mật khẩu vừa nội dung, không bọc mỗi nút trong thẻ trắng hay thêm tiêu đề riêng. Định dạng/dung lượng ảnh nằm ở tooltip và mô tả truy cập, lỗi ảnh hiển thị ngay dưới nút. Avatar chỉ xuất hiện ở đầu thẻ chính; chọn ảnh mở hộp kéo/zoom/cắt hiện có, hủy không lưu và không phát sinh cảnh báo bỏ bản nháp. Chỉ sau khi bấm Đổi mật khẩu mới dựng khung form bên dưới hàng thao tác, lưu/hủy gỡ cả khung. Thông tin công việc nằm tiếp bên dưới. Thông tin cá nhân vẫn hiển thị khi thao tác ảnh hoặc mật khẩu, không phải chuyển tab.
- Thông tin cơ bản gồm họ tên, tên đăng nhập, giới tính và ngày sinh. Liên hệ gồm email, điện thoại và hai địa chỉ. Dùng UserPersonalInfo chung với Admin, hiển thị nhãn nhỏ/giá trị thành hai cột khi đủ chỗ; chưa có dữ liệu thì ghi Chưa cập nhật. Nút Chỉnh sửa mới dựng form với field theo chiều rộng phù hợp, địa chỉ dùng textarea tự tăng chiều cao. Lưu/hủy trở lại chế độ xem; hủy draft cần xác nhận, lỗi/412 giữ form. Công việc dùng UserWorkInfo chung với Admin; bộ phận, vị trí, nhóm và dự án luôn chỉ đọc trong hồ sơ cá nhân. Dự án có liên kết đến chi tiết.
- GET /auth/me/profile lấy dữ liệu riêng khi mở trang hồ sơ qua HTTP/MSW. Nhóm lấy từ các nhóm ACTIVE chứa user; dự án từ tư cách thành viên chưa kết thúc và trạng thái PLANNED/ACTIVE. Hai danh sách chỉ đọc, không được gửi cùng bản cập nhật hồ sơ. Dữ liệu mẫu nằm ở mocks/data.json; UI không có số liệu/tên/địa chỉ viết cứng.
- Hai form hồ sơ/mật khẩu có bản nháp độc lập: hủy chỉ xét thay đổi của chính form đó; đóng một form không xóa bản nháp còn lại. Chọn ảnh lấy version phiên hiện tại tại lúc chọn, nên sau khi lưu thông tin có thể cập nhật ảnh tiếp ngay; xung đột từ phiên khác vẫn giữ ảnh cắt/bản nháp và yêu cầu đối chiếu 412.
- Tên đăng nhập chỉ đọc cả khi mở form sửa hồ sơ, không nằm trong dữ liệu RHF hay payload PATCH. Chỉ lúc tạo tài khoản mới được khai báo tên đăng nhập; API tự sửa và quản trị đều từ chối đổi username.
- Chi tiết tài khoản Admin hiển thị đầy đủ thông tin của chính user đang xem, chia thông tin cá nhân/liên hệ và công việc; cột phụ có nhóm/dự án và quản lý truy cập. Form mở qua Chỉnh sửa thông tin, sử dụng validation chung với hồ sơ cá nhân, chỉ PATCH các trường đã đổi và giữ form khi 412.
- Vị trí hiển thị theo systemRole: Nhân viên chính thức → Leader → Admin. Không lưu/trả position độc lập, không có ô sửa vị trí; thay đổi role chỉ qua chức năng quản trị và quyền hiện có. Ngày sinh hợp lệ, không ở tương lai; điện thoại 7–15 chữ số, chấp nhận mã quốc gia và dấu phân cách. Năm trường cá nhân tùy chọn chưa có/đã xóa lưu null; không đưa vào session, bảng danh sách hoặc hồ sơ công khai.

Kiểm tra tên đăng nhập chỉ đọc (04/11/2026): 140 test HTTP/luồng màn hình đạt; typecheck, lint và production build đạt. Form không register/gửi username khi lưu; API từ chối sửa username và tên đăng nhập cũ tiếp tục hoạt động. Cấp tài khoản mới vẫn khai báo và kiểm tra username duy nhất.

## Bố cục chi tiết công việc

- Tên và hành động chính ở đầu; nhãn Trạng thái, Ưu tiên và Tiến độ cùng một hàng khi đủ rộng, có dấu hai chấm. Bỏ thanh tiến trình chiếm riêng một khối.
- Nội dung công việc và tiêu chí nghiệm thu dùng chung một nền nhạt, chia bằng đường phân cách. Khi cột chính rộng từ 600px, hai phần nằm cạnh nhau và cùng chạm đáy nhờ grid stretch theo nội dung dài hơn; màn hẹp xếp dọc. Mỗi phần đệm 16px, tiêu đề 14px, không đặt chiều cao cố định hay cắt nội dung.
- Bảng Các lần nộp kết quả nằm ngay dưới, gồm lần nộp, thời điểm, kết quả xét và Chi tiết. Dùng chung DataTable/pagination, 5 hàng mỗi trang, mặc định mới nhất trước. Bấm tiêu đề Lần nộp đổi thứ tự và về trang đầu; cả thứ tự và trang được giữ trong URL.
- Chi tiết từng hàng mở ngăn kéo từ phải, rộng tối đa 800px và vừa màn hình hẹp. Trong đó có nội dung đã nộp, liên kết, tài liệu xem trước/chọn tệp/tải xuống, kết quả nghiệm thu và thông tin tại lúc nộp. Chỉ tải chi tiết và tệp sau khi mở; đóng thu hồi URL blob và trả focus về hàng đã chọn. Lần nộp thiếu tài liệu vẫn có khung báo cáo rỗng; chưa nộp lần nào thì bảng hiện trạng thái rỗng.
- Cột phụ chia ba nhóm riêng, cách nhau 20px: phân công/thời hạn, giờ công, hoạt động gần đây. Tiêu đề ở ngoài; nội dung dùng `Panel compact` và `KeyValueList compact`, thống nhất dòng nhãn–giá trị, khoảng đệm 12px và cách hàng 8px. Nhật ký/lịch sử mở ngăn kéo riêng; nút quyết định nghiệm thu giữ bên phải tên công việc và mở biểu mẫu trực tiếp.
- Ngăn kéo nhật ký/lịch sử/lần nộp/thay đổi dùng chung `SlidePanel`: header gọn cố định, khoảng đệm nhất quán 16px, một vùng cuộn ở thân. Thay đổi dùng cỡ 420px; bảng/PDF giữ 800px để đủ chỗ đọc. Các khối trong ngăn kéo dùng Panel compact; khung PDF rỗng gọn hơn và vẫn hiển thị. Đóng ngăn kéo thay đổi lồng trong lịch sử giữ lại lịch sử và trả focus đúng hàng.
- Ngăn kéo cài đặt giữ cỡ 256px, header/footer cố định; bảng màu trên thiết bị cảm ứng dùng 4 cột với vùng bấm 44px để vừa chiều rộng. Menu điều hướng di động giữ vùng cuộn riêng đã có.

## Phạm vi QA

Không thay endpoint/DTO/policy/seed để phục vụ trình bày. Dùng test HTTP và luồng màn hình hiện có. Kiểm tra trực quan chỉ qua Edge đang mở; kết nối điều khiển hiện chưa hoạt động. Kết quả cuối được ghi ở đây, không tạo lại các tài liệu lịch sử riêng.

Kiểm tra sau khi gom chi tiết dự án (04/11/2026): 316/316 test ở 22 file đạt; typecheck, lint và production build đạt. Các test xác nhận nội dung dự án trên cùng trang, lọc/phân trang của từng vùng độc lập, chuyển URL cũ và quay lại giữ ngữ cảnh, lịch sử chỉ tải khi mở, nút tạo không tải danh sách dự án thừa, cùng các luồng quyền/HTTP/form/412/PDF/ngăn kéo hiện có. git diff --check sạch. Không thay endpoint, DTO hay dữ liệu mock cho bố cục mới.

Điều chỉnh phần thành viên và độ rộng bảng công việc (04/11/2026): 112 test thuộc 4 file luồng màn hình/bảng/ngăn kéo/bố cục đạt; kiểm tra lại 97 test luồng màn hình sau khi bổ sung ca thêm thành viên trong ngăn kéo cũng đạt. Xác nhận preview tối đa 5 người, dùng chung query với bộ lọc, bảng đầy đủ tải khi mở, không có cột Hành động riêng, lọc thành viên không ảnh hưởng công việc, đóng/lưu form trở về ngăn kéo, thêm thành viên cập nhật cả preview và bảng. Typecheck, lint và production build đạt; git diff --check sạch. Không thay endpoint, DTO hay dữ liệu mock cho điều chỉnh này.

Thu gọn thanh lọc và đổi nút chuyển chế độ sang icon (04/11/2026): 100 test thanh lọc/luồng màn hình đạt; typecheck, lint và production build đạt. Nút giữ tên truy cập, tooltip và trạng thái chọn; đổi chế độ vẫn giữ bộ lọc, phân trang và hash. Dùng chung cho danh sách công việc toàn hệ thống và trong dự án; các liên kết Danh sách khác giữ nguyên ý nghĩa.

Điều chỉnh hồ sơ và chi tiết người dùng Admin (04/11/2026): toàn bộ 338/338 test ở 22 file đạt; typecheck, lint và production build đạt, git diff --check sạch. Xác nhận mặc định chỉ xem, bấm Chỉnh sửa mới dựng form, lưu/hủy quay lại chế độ xem, xác nhận khi hủy draft, giữ dữ liệu khi 412, ảnh đại diện và đổi mật khẩu hoạt động như trước. Ba role hiển thị đúng vị trí Nhân viên chính thức/Leader/Admin; không có field position trong model/DTO/seed/form và API từ chối ghi position kể cả từ Admin. Nhóm/dự án theo phân công hiện tại, dữ liệu riêng không vào hồ sơ công khai/list/session. Chưa kiểm tra trực quan trên Edge.

Gom thẻ hồ sơ và chuyển thao tác sang cột phải (04/11/2026): toàn bộ 340/340 test ở 22 file đạt; typecheck, lint và production build đạt. Test xác nhận đọc/sửa thông tin trong cùng thẻ, chọn ảnh trực tiếp từ cột phụ sau khi lưu hồ sơ dùng version mới, giữ cắt/zoom và xử lý 412, đổi mật khẩu chỉ mở sau thao tác, hủy từng form không làm mất bản nháp còn lại. Kết nối Edge báo browser access host unavailable, nên chưa kiểm tra trực quan bố cục trên trình duyệt.

Thu gọn thao tác hồ sơ (04/11/2026): bỏ hai thẻ chỉ chứa nút, dùng một hàng nút vừa nội dung; chỉ form mật khẩu đang mở mới có khung. 20 test hồ sơ/ảnh/mật khẩu đạt; typecheck, lint, production build và git diff --check đạt.

Lần thiết kế nền trước đó đã kiểm tra 19 Markdown không có liên kết nội bộ hỏng; tương phản nền mặc định: chữ chính 12,48:1, nhãn 5,94:1, metadata 4,77:1, primary 5,63:1, điều hướng 4,95:1, trạng thái chọn 6,28:1, viền input 3,41:1. Các bộ màu/chế độ hiện có tiếp tục được kiểm tra trong theme-contrast.test.ts.

Giới hạn: cả kết nối native lẫn browser host không khả dụng, nên chưa xác nhận pixel/layout trực tiếp bằng Edge, mức zoom hoặc viewport thực. Các kiểm tra source, DOM/luồng HTTP và build không thay cho bước này. Không chụp bộ ảnh, không chạy Playwright/CDP, không commit/push.
