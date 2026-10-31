# Các lỗi giao diện và quy tắc tránh lặp

## Bỏ sót khung tài liệu ở tài khoản nhân viên — 31/10/2026

Ảnh phản hồi cho thấy vùng trái còn trống vì TaskDetailPage vẫn bọc cả vùng tài liệu trong điều kiện TASKS_REVIEW/TASKS_MANAGE. Lượt trước chỉ kiểm tra khung trống bằng tài khoản quản lý, còn giữ test cũ yêu cầu ẩn với người nộp. Đã bỏ điều kiện hiển thị này: ai đọc được công việc thấy PDF đã nộp hoặc khung Chưa có báo cáo đính kèm. Backend vốn kiểm tra requireTask cho đọc lần nộp/tệp, không sửa policy/API; nghiệm thu vẫn giữ quyền riêng.

Ca hồi quy nay kiểm tra người nộp Huy, nhân viên Lan và quản lý Minh: tài liệu hiện khi có, khung hiện khi chưa có lần nộp. Người ngoài dự án bị từ chối ở công việc và không phát sinh request tài liệu/tệp. Các số liệu kiểm thử lượt trước bên dưới là kết quả ở thời điểm đó, không chứng minh đã bao phủ tài khoản nhân viên.

Kiểm tra hiện tại: **228/228 test ở 13 file đạt**, lint/typecheck/build/git diff --check đạt. Phạm vi tài liệu vẫn theo công việc được đọc: Lan không đọc được t-4 của Huy, nhưng thấy khung trống ở t-2 của mình; không mở rộng policy mock. Edge chưa kết nối nên các kết quả mới là kiểm tra source/HTTP/JSDOM.

## Giữ khung PDF trống và phản hồi thử tải lại — 31/10/2026

- Không dùng latestSubmissionId/attachmentIds.length để ẩn vùng tài liệu trong phạm vi đã được phép xem. TaskDetailPage giữ AttachmentViewer trống trước lần nộp đầu tiên; TaskReportPreview/SubmissionDetailPage giữ cùng Panel khi lần nộp không đính kèm tệp. Chưa có báo cáo đính kèm nằm trong khung nền nhẹ, không thay lỗi 403/404/response sai bằng trạng thái trống. Không fetch file hoặc lần nộp với ID trống.
- QueryErrorState trước đây gọi refetch nhưng bỏ Promise và không có trạng thái chờ; nút mặc định cũng có thể submit form cha. Tái dùng ActionButton, nhận Promise/hiện Đang tải lại…/spinner/disabled và type=button. Các màn truyền refetch trực tiếp; vẫn gửi lại HTTP thật, giữ URL/draft và lỗi nếu response tiếp tục không hợp lệ.
- Kiểm tra: 223/223 test ở 13 file đạt, gồm 100 test UI ở hai file; typecheck, lint, build và git diff --check đạt. Các ca mới bao phủ chưa có lần nộp/tệp, khung đối chiếu, thu hồi blob khi đổi sang lần không có tệp; retry sau response sai gửi HTTP lần hai và mở PDF/dữ liệu khi response phục hồi; retry trong form không submit. Edge chưa kết nối nên chưa QA trực quan lượt này.

## Thu gọn control, bảng và tài liệu — phản hồi 31/10/2026

- Control thông thường giảm 36 → 30px; filter giảm khoảng cách nhãn/ô và khoảng dưới thanh lọc. Giữ kích thước riêng cho đăng nhập/hồ sơ/vùng chạm. Focus filter bỏ viền/ring xanh, keyboard còn outline trung tính; filter chọn không có viền xanh.
- Select native đổi mũi tên bằng [:open](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:open); AvatarMenu/MultiSelect dùng aria-expanded. Không dùng focus giả trạng thái mở vì picker đóng vẫn có thể giữ focus.
- Header/footer bảng 32px, hàng chuẩn 48px/padding dọc 4px, trạng thái compact; không gạch chân nút/liên kết ở cột Hành động khi hover. Tên việc một dòng tối đa 30ch, hover hiện title đầy đủ; giữ chuỗi gốc và cân lại tỷ lệ cột. Nội dung khác dài hợp lệ không bị cắt mất dữ liệu.
- Priority thay PriorityIcon, giữ chữ và màu mức độ, không icon. Board bố trí ưu tiên/hạn hai hàng gọn để không tràn sau khi bỏ icon.
- Lịch sử dự án/công việc cùng drawer 420px, padding 16px, slide mở/đóng 180/140ms; giữ dữ liệu khi slide đóng, Escape/đóng trả focus. Bỏ nhánh split/Popover và CSS thừa. Reduced motion vẫn áp dụng.
- PdfPreview có heading Báo cáo đính kèm với actions ngoài khung; tên tệp/dung lượng một dòng gọn, picker nhiều tệp thay tên. Bỏ card bọc PDF ở TaskReportPreview/SubmissionDetailPage; giữ HTTP, thứ tự chọn lần nộp, tải tệp và vòng đời blob.
- Nội dung công việc/tiêu chí giữ bên trái, cùng card; mô tả có viền nhấn nhẹ, tiêu chí có nền nhẹ/đường chia, padding gọn. Không thêm trường hay biến nội dung thành dữ liệu mẫu.

Kiểm tra hành vi: 217/217 test ở 13 file đạt; có ca lịch sử dự án mở/đóng bằng cùng drawer và trả focus, PDF vẫn chọn được tệp khác khi tệp hiện tại lỗi/không tồn tại. Typecheck, lint, build và git diff --check đạt. Edge native pipe/browser host vẫn chưa kết nối nên chưa xác nhận trực quan kích thước, ellipsis, mũi tên native và chuyển động của bản này.

## Thiết kế lại toàn bộ FE — 31/10/2026

Quy tắc hiện hành, danh sách 43 route/12 feature, thay đổi component và bằng chứng QA nằm ở [UI_REDESIGN.md](UI_REDESIGN.md). Yêu cầu mới thay UI của các lượt cũ bên dưới: tab ngang thay dropdown SectionNav; mô tả/tiêu chí chung card và ngữ cảnh/giờ công cột bên; Chi tiết lịch sử mở drawer, không giữ panel rỗng; soạn báo cáo chia nội dung/nguồn và hai nút ở đầu form, không sticky phủ field; chỉ số phụ là danh sách hai cột khi rộng, một cột khi hẹp. Typography 24/17/15/14/12–13px, chữ trung tính, control 36px.

Giữ đường đi/dirty/back/scope, quyền, version/412, dữ liệu snapshot và nhãn thiếu/cũ/mô phỏng. Không thêm route/endpoint/action nghiệp vụ. Các ghi chép kiểm tra browser không kết nối được ở các lượt trước không đại diện cho lượt QA native Edge hiện tại.

## Tài liệu nhiều lần nộp và dữ liệu người — 31/10/2026

TaskReportPreview có chọn lần nộp, sắp xếp mới/cũ và phân trang thật 5 lần/trang. Chỉ hiện lần/thời gian, mở một tệp tại một thời điểm; lỗi tải danh sách có thử lại. Không lấy 100 bản ghi rồi ghi tổng bằng items.length. Đổi lựa chọn thu hồi blob cũ; việc nghiệm thu vẫn mở lần mới nhất theo Task. PdfPreview mở ngay tệp được chọn, không giữ prop defaultOpen dự phòng. AlertDetail dùng tên/avatar dự phòng từ handler (PersonRef), không hiển thị ID người khác hoặc thay bằng tên người đang đăng nhập.

## Điều chỉnh theo ảnh và Jira — 30/10/2026

Đây là quy tắc UI hiện hành, thay các ghi chép tab/chip/inline history cũ bên dưới. Tham khảo [điều hướng Jira](https://support.atlassian.com/jira-software-cloud/docs/what-is-the-new-navigation-in-jira/), [bảng dữ liệu Atlassian](https://atlassian.design/components/dynamic-table/) và [khoảng cách Atlassian](https://atlassian.design/foundations/spacing/); chỉ áp dụng vào các chức năng hiện có.

| Vấn đề | Điều chỉnh |
| --- | --- |
| Công tắc danh sách/bảng lệch với bộ lọc | Danh sách/Bảng trạng thái là hai button sau các filter, ở phía bên phải cùng hàng lọc; nút tạo đứng riêng ở header. Không đổi thành option; giữ URL view/filter/page và wrap khi hẹp. |
| Nhãn dropdown dính với giá trị và viền focus | Nhãn ở ngoài ô select, vẫn truy cập bằng label; ô chọn cao 32px và rộng vừa nội dung, không ẩn chữ bằng font-size:0. Bỏ câu Tất cả trong quyền/có quyền xét, dùng Tất cả dự án/đơn vị/người lập. |
| Sidebar dùng lối tắt như các trang riêng | Tất cả/Việc của tôi/Việc quá hạn là button lọc /tasks; giữ q/projectId/view và xóa page. Việc của tôi và Việc quá hạn có thể kết hợp. Mục đang mở vẫn thu gọn được. |
| Thống kê cá nhân kéo quá rộng | Mỗi thẻ tối đa 220px, flex-wrap, số/nhãn gọn cùng vùng; không phủ hết hàng. Công việc vẫn là vùng chính, dự án cột phụ; khi hẹp xếp dọc. |
| Chi tiết công việc nhiều mục/nút và thẻ mô tả dư chỗ | task-overview là lưới nền trong suốt: nội dung/tiêu chí bên trái, giờ công gọn bên phải; mỗi nhóm có tiêu đề ngoài panel-body trắng. Metadata ở cột bên, SectionNav thu gọn mục. PageHeader grid đặt tên và actions cùng hàng, nút nghiệm thu ở ngoài cùng phải. StatusField có dấu hai chấm/khoảng cách rõ. |
| Nghiệm thu khó tìm | Button ở bên phải cùng hàng tên công việc, mở ngay HashDialog #review trên URL hiện tại; không link sang lần nộp trước khi mở form. ReviewDialog tải lần mới nhất khi mở, giữ kiểm tra quyền/dự án/trạng thái/người nộp và snapshot/412. SubmissionDetailPage chỉ đối chiếu, không chứa form thứ hai. Không tạo trang hay API mới. |
| Phân tích nhiều tab và KPI cao | Dùng SectionNav, giữ scope giữa các mục; nhãn/giá trị KPI nằm trên cùng hàng, link chi tiết gọn. Giữ biểu đồ có nguồn dữ liệu và trạng thái thiếu dữ liệu. |
| Xem thay đổi lịch sử làm dịch bảng hoặc tự mở nội dung | Bảng giữ bốn cột 21/23/38/18. Khung phải luôn sẵn với lời nhắc khi chưa chọn; chỉ nút Chi tiết ở Hành động mới hiện nội dung. Không tự chọn dòng, không popup; bảng/khung giữ nguyên vị trí, dưới 900px xếp dọc. Dự án giữ Popover portal. |
| Cột thao tác thành viên quá rộng và lộ manage && ( | Sửa JSX điều kiện; một trigger dropdown cho Đổi vai trò/Bàn giao việc/Kết thúc. Giữ snapshot version, dirty guard và đối chiếu 412. |
| Breadcrumb nằm cạnh nút Quay lại | Breadcrumb ở hàng trên, Quay lại ở hàng dưới, cùng đích nội bộ giữ bộ lọc. |
| Bộ lọc quá sát chữ và mép vùng chứa | Hàng lọc chừa 8px hai bên, ô input/select chừa 12px ngang, giữ chiều cao 32px. |
| Nút tạo việc trên trang chủ thiếu ngữ cảnh | Thêm nhãn Dự án bạn quản lý cạnh nút; chỉ hiện khi có dự án ACTIVE được cấp TASKS_MANAGE, hộp chọn giữ đúng các dự án đó. Không cấp quyền theo text hoặc role hiển thị. |
| Bảng trạng thái lớn và khó quét | Cột rộng 188–216px, gap 8px; thẻ padding 8px, tên việc 13px, metadata 11px/avatar 20px. Giữ toàn bộ trạng thái, dữ liệu và phân trang; cuộn trong board. |
| Thẻ phân tích giãn rộng, label/value và hai nhóm khác cỡ chữ | MetricCard có label/value 14px. Bốn KPI ở hàng trên biểu đồ, canh phải tối đa 960px, không nằm cạnh biểu đồ. Giờ công/chỉ số giữ hai vùng, chia 3/7; chỉ số có 3 cột khi rộng, 2/1 khi hẹp, padding thẻ 8px 10px. Bỏ khung trắng lồng bên ngoài lưới chỉ số, không ép chiều cao bằng nhau. |
| Bảng dự án nhiều chữ phụ, tên bị bó hẹp và response thừa | Bỏ code/objective khỏi bảng và ProjectRow/response danh sách; giữ id cho điều hướng và quyền. Chi tiết/form còn code/objective. Dùng icon/màu theo ID, bỏ ô chữ viết tắt. Cột theo tỷ lệ 26/14/16/11/10/14/9; bỏ max-width tên và CSS mô tả cũ. |
| Nơi hiển thị người chỉ có tên, nhận diện thiếu thống nhất | Dùng UserBadge cho người nhận công việc, người ghi giờ công, người nộp/nghiệm thu, tác giả và actor lịch sử; metadata canh hàng bằng person-meta. Tận dụng PersonRef hiện có, không fetch từng người; chưa phân công giữ dạng chữ. |
| Tiêu đề Kết quả đã nộp/Báo cáo đính kèm còn nằm trong khung | Panel dùng section ngoài trong suốt, panel-heading chứa title/actions, panel-body.card mới có nền trắng/viền/padding. Áp dụng chung cho các nhóm thông tin/form; CSS giới hạn form theo wrapper mới. |
| Giờ công tách nhãn/value thành hai dòng và nhiều đường kẻ | Container chung dl > div ép flex-direction:column; border chung còn sót. task-effort đặt rõ flex-row/justify-start, label/value cách 8px, bỏ border. Thẻ công việc padding 12px 14px/chữ 13px, gap hai vùng 16px; giờ công tối thiểu 240px để nhãn và giá trị vừa hàng, wrap khi thật sự cần. |
| Hai vùng chi tiết công việc nhìn rời rạc | Thêm section-group bao quanh grid hiện có: nền nhẹ, viền, bo 8px và padding 14px. Dùng cùng kiểu cho nhóm giờ công/chỉ số, giữ nhãn ngoài nội dung trắng và không thêm nút/chức năng. |
| Nghiệm thu thiếu tìm công việc | Ô tìm cập nhật q trên URL, giữ projectId và bỏ page; DB lọc tên trước phân trang và vẫn kiểm tra phạm vi/quyền. Tái dùng query/service hiện có, không tải từng task hoặc chỉ lọc trang đang hiển thị. |

Tiêu đề bảng/Panel nằm ngoài khung trắng; dữ liệu/footer bảng vẫn cùng table-card, dữ liệu thông tin/form ở panel-body.card. Bảng ít cột có giới hạn chiều rộng, widths theo nội dung tổng 100. Mục tiêu dự án dùng detail-copy; task-overview chia nội dung/tiêu chí trái, giờ công phải, tiêu đề từng nhóm ở ngoài khung. Nút/dropdown/filter dùng token 32px/viền xám/bo 4px, giữ ngoại lệ hồ sơ/đăng nhập và vùng chạm. SectionNav trong header; HeaderActions giữ logic tại feature; PageHeader grid bảo đảm tên và thao tác ở hai mép cùng hàng. Không có Tạo toàn cục/CreateMenu.

Phạm vi rà code bao phủ 43 page.tsx hiện có (gồm / và /admin chuyển hướng): đăng nhập, workspace, hồ sơ riêng/công khai, tài khoản/đơn vị/nhóm, dự án/tạo/sửa/thành viên/danh sách/bảng/lịch sử, công việc/tạo/sửa/giờ công/lần nộp/nghiệm thu/lịch sử, báo cáo và toàn bộ phân tích/cảnh báo/job. Các pattern dùng chung còn áp cho dialog, lỗi, rỗng, loading và form.

Giới hạn nghiệm thu lượt này: đã đối chiếu ảnh người dùng và source; công cụ xem browser báo native pipe/browser host unavailable, nên chưa xác nhận trực quan bản mới trên browser hoặc thiết bị cảm ứng. Các kết quả browser ở lượt trước bên dưới không thay cho kiểm tra bố cục mới.

Kiểm tra hành vi: 208/208 tests ở 13 file, typecheck, lint, build và git diff --check đạt. Bao gồm giữ scope/filter/draft, đối chiếu 412, nghiệm thu từ header, khung lịch sử bên phải, chuyển chế độ xem từ hàng lọc, tạo việc/thêm thành viên ở đúng vị trí và tìm hàng chờ qua HTTP trước phân trang mà không lộ dữ liệu ngoài phạm vi.

## Điều chỉnh role ngày 26/10/2026

Bỏ mục Phân quyền và cột Quyền nghiệp vụ. Đổi vai trò mở dialog từ hàng thành viên, có lý do, đối chiếu phiên bản và làm mới dữ liệu sau lưu. OWNER được thay ở kế hoạch; lựa chọn người phụ trách từ các quản lý đang tham gia. Chính sách hiện hành tại [ARCHITECTURE.md](ARCHITECTURE.md#điều-chỉnh-role-ngày-26102026).

Điều hướng theo role: sidebar và route dùng cùng canVisit trong lib/auth/access.ts; WorkspaceShell chặn trước khi render trang để không chạy query của trang bị chặn. Bỏ PermissionGate/hasPermission và các điều kiện quyền view trong enabled; không tự tắt query theo quyền dự án rồi giữ skeleton mãi. Backend quyết định phạm vi dữ liệu. Thao tác quản lý dùng canManage theo role và projectId, không tự cấp quyền ghi cho Admin khi mở trang. 403/410 giữ lỗi để hiển thị, bỏ dữ liệu cache cũ và tránh tạo query mới lặp liên tục.

Sau refactor form theo vietcd ngày 25/10: giữ bố cục, compact/responsive và control dùng chung, khai báo useForm có kiểu cùng field JSX tại feature. Schema/default tạo và sửa chỉ chứa trường của thao tác; không kiểm tra lại mã dự án hoặc mật khẩu khởi tạo khi chỉnh sửa. Form chỉ reset sau lưu hoặc khi người dùng bỏ sửa rồi mở lại, giữ draft qua refetch/412. Lỗi nested array phải hiện cạnh textarea; ô chọn thiếu dùng tên trường, không in mã kỹ thuật. Spinner/disable được giữ khi submit, kể cả submit từ bàn phím trong lúc upload. Typecheck/lint/build và 145/145 tests đạt; chưa kiểm tra layout trực tiếp trong browser.

Sửa luồng avatar sau khi đọc account-page/avatar-crop-dialog bên vietcd: chọn ảnh mở dialog kéo/zoom 1–3, vùng cắt tròn 1:1; xác nhận cắt 512×512 và upload ngay, không thêm bước lưu ngoài dialog. Hủy/đóng/Escape không hỏi bỏ lưu và không đổi avatar hiện tại. File nguồn chỉ ở state tạm, không tham gia dirtyForms; form thông tin/mật khẩu vẫn giữ cảnh báo thay đổi. Chọn lại cùng tệp phải hoạt động, object URL được thu hồi khi đóng/rời mục; lỗi xử lý ảnh/HTTP/412 giữ crop/zoom để thử lại hoặc đối chiếu. Nút bị vô hiệu hóa và có spinner trong lúc xử lý/upload. Bố cục dialog dùng màu xanh–trắng, co theo viewport và không dùng scale animation. Quy tắc này thay preview/tên tệp và cảnh báo bỏ ảnh của lượt trước.

Responsive cho thẻ: page-surface và panel là container theo chiều ngang; lưới chi tiết/hồ sơ/đối chiếu/phân tích đổi về một cột khi vùng nội dung không đủ rộng, kể cả trên desktop đang mở sidebar. KPI và skeleton cards dùng auto-fit; thông tin công việc/giờ công tự chia cột theo chiều rộng tối thiểu. Card hẹp giảm padding, tiêu đề/nút/tệp đính kèm xuống hàng, thông tin nhãn–giá trị xếp dọc. Fieldset có min-width: 0 để không đẩy form tràn khung. Tab hồ sơ và bảng cuộn ngang trong vùng riêng; footer bảng được xuống hàng và vẫn thuộc cùng thẻ. Không che lỗi tràn bằng overflow-x: hidden trên toàn trang. Cần nghiệm thu trực quan ở các độ rộng 320/375/768/1024/1440px và cả hai trạng thái sidebar; kiểm thử DOM không xác nhận được kích thước CSS.

Đối chiếu “Lỗi FE.docx” và “Lỗi FE_2.docx” ngày 25/10/2026. Tài liệu này lưu lỗi, nguyên nhân và quy tắc áp dụng cho các màn cùng loại.

| Lỗi | Nguyên nhân | Cách sửa và quy tắc |
| --- | --- | --- |
| Form nghiệm thu tự mở, nằm lệch với kết quả | Form đặt ngoài lưới hai cột; select quyết định đứng riêng không có khoảng cách | Bấm “Đưa ra quyết định nghiệm thu” mới mở. Form nằm cùng cột với kết quả; select, nhận xét và footer có khoảng cách thống nhất. Chỉ người đủ quyền, khác tác giả và đúng lần nộp mới nhất được thao tác. |
| Lịch sử hiển thị JSON, mã trạng thái và ID người dùng | Render trực tiếp before/after và actorId | Dùng AuditChanges chung cho task/dự án; nhãn tiếng Việt, từng trường Trước/Sau, ngày và giờ công có định dạng. Response trả actor và tham chiếu người để hiển thị tên; DB giữ ID và snapshot gốc. Chỉ gửi các trường có mặt trong lần thay đổi, không đánh dấu các trường ngoài patch là đã bị xóa. |
| Giá trị trước khi sửa bị thiếu | Snapshot task/giờ công chỉ lưu một số field cố định | Lấy giá trị cũ cho đúng các khóa trong patch trước khi mutate; mô tả/tiêu chí/ưu tiên cũng phải có dữ liệu trước để đối chiếu. |
| Checkbox quá hạn nằm riêng và tốn hàng | Bộ lọc trạng thái và hạn được trình bày thành hai control | Trong danh sách task, “Quá hạn” là lựa chọn của bộ lọc Trạng thái. UI đổi sang overdue=true, xóa status/page cũ; chọn trạng thái xử lý thì xóa overdue. OVERDUE không phải trạng thái lưu trữ hay giá trị enum gửi API. Link overdue=true tiếp tục dùng được. |
| Bộ lọc dồn trái, phần phải bị trống | Chỉ field đầu tiên có flex-grow và bị giới hạn chiều rộng | Các field lọc đều co/giãn và chia hết hàng; ô tìm kiếm được ưu tiên rộng hơn. Bộ lọc nâng cao chiếm trọn hàng. Mobile cho xuống hàng theo chiều rộng. Không áp max-width riêng cho field đầu chỉ để căn màn khác. |
| Các mục điều hướng trông như chữ thường | Tabs chỉ là link có viền dưới, nằm sát trái | Dự án/công việc/phân tích dùng SectionSelect gọn bên trái; hồ sơ dùng tab ngang với trạng thái đang chọn và cuộn ngang khi hẹp. Các nút thao tác trong header/footer canh phải và có cùng chiều cao. |
| Nhãn và giá trị xếp lệch, dư khoảng trắng | Một số dl chứa trực tiếp dt/dd, trong khi CSS căn hàng theo dl > div | Mỗi cặp nhãn/giá trị phải bọc trong một div. Áp dụng cho lần nộp, dashboard, job AI và cảnh báo; dùng cùng bố cục với các màn chi tiết còn lại. |

Các quy tắc từ lượt sửa trước tiếp tục áp dụng: tạo đơn vị có trang riêng; form chi tiết mở sau nút; thay đổi chưa lưu dùng dialog giữa màn hình; toast ở góc trên phải; hồ sơ/đăng xuất nằm ở avatar; nhóm và thành viên chung một card với popup tìm kiếm; Admin có quyền xem phân tích toàn hệ thống, quyền ghi theo dự án.

Khi sửa màn có cùng kiểu lỗi, tìm toàn bộ nơi dùng component/CSS đó trước khi chốt. Không sửa bằng khoảng trắng, chiều cao cố định hoặc margin riêng cho từng màn. Không render JSON/response để thay nội dung dành cho người dùng. Kiểm tra bằng dữ liệu ít/nhiều, tên dài, màn hẹp và đủ/thiếu quyền. Tests component/HTTP kiểm tra hành vi và quyền; cần xem trực tiếp trên browser để xác nhận kích thước và bố cục.

Kiểm tra sau lượt sửa: typecheck, lint, build và 83/83 tests ở 8 file thành công. Các ca mới kiểm tra mở form và nghiệm thu qua HTTP; ẩn thao tác với Admin/người nộp; giữ dữ liệu khi hủy chuyển quyết định; ánh xạ bộ lọc quá hạn và bỏ page/status cũ; tab đang chọn trên route con; lịch sử có tên người, nhãn và dữ liệu cũ đúng. Chưa kiểm tra trực quan trên browser do công cụ xem trước không hỗ trợ kiểm soát URL của Cốc Cốc trong môi trường hiện tại.

## Các lỗi trong lượt rà thứ hai

| Lỗi | Nguyên nhân | Cách sửa và quy tắc |
| --- | --- | --- |
| Dòng bảng và chân phân trang quá cao | Padding lớn ở cả card, ô bảng và footer; bảng chỉ có một trang vẫn hiện đủ nút | Ô bảng dùng padding 8px theo chiều dọc, tiêu đề 9px; footer gọn và chỉ hiện nút khi có thể phân trang. Card chứa trực tiếp bảng không cộng thêm padding ngoài bảng. |
| Viền khung bảng bị cắt, phần đầu bảng tràn khỏi card | Margin âm của bảng không khớp padding card sau khi đổi kích thước | Bỏ margin âm; table-scroll xử lý cuộn trong khung có bo góc. Thanh tiêu đề có padding riêng. Card có form không áp quy tắc bỏ padding của card bảng. Không sửa tràn khung bằng cách tăng margin bù ở từng màn. |
| Tên dự án và nút chi tiết bị xếp dưới nội dung chính | Trộn nhiều dữ liệu và thao tác trong cùng cell | Dự án là cột riêng của báo cáo/task. DataTable có actions cho cột Hành động cuối căn giữa; DetailLink dùng chung, có nhãn truy cập rõ. Áp dụng cho người dùng, công việc, báo cáo, lần nộp, cảnh báo và các bảng phân tích. |
| Người dùng chiếm nhiều chiều dọc | Chỉ có chữ nhiều dòng với line-height và padding lớn | UserBadge dùng avatar chữ cái 28px, tên và thông tin phụ có khoảng cách ngắn. Avatar là trang trí, tên vẫn là văn bản truy cập được. Thao tác hồ sơ đặt ở cell cuối. |
| Khung đơn vị/nhóm nhiều đường kẻ và khoảng trống | Badge nằm riêng một dòng; record-details và footer cùng có đường phân cách | Trạng thái nằm cạnh tiêu đề; bỏ đường kẻ thừa ở record-details/record-actions; nhóm nút canh phải. entity-list có chiều cao tối đa và cuộn riêng, hàng chọn có aria-pressed. Không dùng chiều cao cố định để ép card bằng nhau. |
| Chỉ số và trang phân tích lặp lại cùng nội dung | Một chỉ số xuất hiện ở thẻ trên, phần cách tính và khung tổng hợp; mỗi KPI có dòng link riêng | KPI dùng thẻ nhỏ, liên kết Chi tiết dạng chữ có tên truy cập. Trang chi tiết chỉ hiển thị chỉ số một lần, cách tính nằm trong mục mở rộng; chỉ có khung dữ liệu liên quan khi có dữ liệu. Trạng thái thiếu dữ liệu vẫn hiển thị rõ, không đổi thành 0. |
| Mã kỹ thuật xuất hiện trong giao diện và nội dung mẫu | In calculationVersion, đơn vị TASK/MINUTE và công thức theo mã K01; mô tả mẫu nhắc phát triển FE | Metadata chỉ hiển thị thời điểm và chất lượng dữ liệu; đơn vị đi qua metricValue dùng chung. Công thức dùng mô tả nghiệp vụ trong data.json. Bỏ phần chữ lặp/giải thích cách triển khai; giữ thông tin cần để hiểu số liệu và nhãn AI mô phỏng. Form xung đột dùng lời hướng dẫn thao tác, giữ cơ chế đối chiếu. |
| Tải lại từng task chỉ để hiển thị tiêu đề hàng chờ | Row thiếu tên công việc nên component con gọi thêm query | ReviewRow trả taskTitle; bỏ component và request theo từng dòng. ReportRow trả project để hiển thị đúng dự án, không phụ thuộc tên dự án trong trang lookup đã tải. Response chỉ giữ dữ liệu màn đang dùng. |

Kiểm tra lượt hai: 87/87 tests ở 8 file, typecheck, lint và build đạt. Có kiểm tra phân trang một/nhiều trang, cột dự án và liên kết cuối hàng báo cáo, nhận diện người dùng và đường dẫn hồ sơ, hàng chờ không tải từng task, metadata rút gọn và công thức/đơn vị dễ đọc. Kiểm tra Service Worker và bố cục trực tiếp trên trình duyệt vẫn chưa thực hiện được trong môi trường hiện tại.

Điều chỉnh mới của người dùng: cột thao tác thống nhất tên “Hành động”; tiêu đề và nội dung cột cùng căn giữa. Liên kết “Chi tiết” chỉ hiển thị chữ, bỏ viền/nền/biểu tượng; giữ tên truy cập và focus bàn phím. Quy tắc này thay cách canh phải và nút biểu tượng đã dùng ở lượt trước, áp dụng cả liên kết chi tiết trên thẻ chỉ số.

Danh sách dự án chuyển từ card cao sang bảng gọn: tên/mã và mục tiêu một dòng rút gọn, đơn vị, người phụ trách, trạng thái, ngày bắt đầu, hạn hoàn thành và Hành động. Mục tiêu dài có thể xem đủ khi trỏ chuột hoặc mở chi tiết. Dùng hàng/cột để so sánh nhiều dự án; giữ phân trang trong khung bảng và cuộn ngang khi màn hẹp. Không chia thông tin ngắn thành nhiều hàng nhãn–giá trị trên từng card.

Thanh phân tích thay dãy tab bằng dropdown bên trái và nút Bộ lọc bên phải. Bộ lọc nằm trong Popover, mặc định đóng; có nhóm lọc khác, đặt lại, đóng bằng Escape và trả focus về nút mở. Dữ liệu lọc vẫn lưu trên URL; đổi mục phân tích giữ toàn bộ phạm vi/ngày đang chọn. Bỏ dòng mô tả chung dưới tiêu đề; chỉ giữ mô tả có dữ liệu cụ thể hoặc thông tin nghiệp vụ cần thiết cho thao tác.

Sau cập nhật thanh phân tích: 89/89 tests ở 8 file, typecheck, lint và build đạt. Các ca mới kiểm tra chuyển mục vẫn giữ phạm vi, bộ lọc đóng mặc định, xóa lựa chọn phụ thuộc khi đổi đơn vị, đặt lại và trả focus sau Escape.

Lỗi form phải dùng tên trường và lời nhắc thao tác, ví dụ “Vui lòng chọn đơn vị”, “Vui lòng nhập họ tên”, không hiển thị “Thiếu mã tài nguyên” hoặc lỗi Zod tiếng Anh. Resolver dùng kết quả parse và metadata field để diễn đạt lỗi, không kiểm tra lại schema; giữ thông báo nghiệp vụ riêng và các giới hạn dữ liệu. Đăng nhập dùng thông báo required/length rõ ràng trong schema riêng.

Chi tiết tài khoản Admin dùng hai cột thông tin và truy cập/mật khẩu, tự xếp dọc khi hẹp. Tên/avatar/trạng thái gom ở đầu, nút chỉnh sửa nằm cạnh tiêu đề; không in ID tài khoản hoặc đặt nút dưới một vùng trống lớn. Hướng dẫn chế độ khóa chỉ hiện khi mở thao tác.

Hồ sơ cá nhân có họ tên, tên đăng nhập và avatar có thể sửa sau nút. Email/đơn vị/vai trò chỉ hiển thị; API whitelist không nhận các trường đó. Tên và ảnh lưu cùng một lần qua HTTP, menu avatar cập nhật từ response; ảnh lỗi dùng chữ cái tên làm dự phòng. Không đưa dữ liệu ảnh vào response danh sách hoặc Query cache.

Sau cập nhật hồ sơ/validation: typecheck, lint, build và 113/113 tests ở 9 file đạt. Có kiểm tra lỗi bắt buộc theo tên trường, giới hạn email/mật khẩu/số, sửa hồ sơ qua HTTP, cập nhật menu avatar, tải ảnh, giữ nội dung qua 412 và xác nhận bỏ ảnh chưa lưu. Chưa kiểm tra trực quan bố cục trên browser do giới hạn công cụ đã nêu ở trên.

Sót sau khi thu gọn điều hướng phân tích: dự án và công việc vẫn dùng dãy tab toàn hàng, trạng thái đứng riêng làm phần đầu cao. Đã thay cả hai bằng SectionSelect chung với phân tích, xóa component/CSS Tabs cũ; dropdown rộng tối đa 240px bên trái. PageHeader.status đưa trạng thái cạnh tiêu đề, bỏ chữ mô tả chung “Kế hoạch dự án”/“Công việc” sau tên đơn vị/dự án. Mục đang xem suy ra từ route/query, gồm lịch sử dự án, route edit và chi tiết lần nộp. Chuyển dropdown có draft phải xác nhận, hủy giữ nguyên lựa chọn và nội dung. Quy tắc này thay bố cục Tabs chia đều hàng ở các lượt trước; khi đổi một pattern phải rà toàn bộ nơi dùng.

Kiểm tra sau cập nhật: typecheck, lint, build và 115/115 tests ở 9 file đạt. Tests điều hướng kiểm tra lựa chọn trên route con, lịch sử qua query, quyền của viewer, giữ scope phân tích và bảo toàn draft khi hủy chuyển mục. Giới hạn kiểm tra trực quan vẫn như trên.

Theo làm rõ mới của người dùng, lỗi “lệch trái khi mở Lịch sử” nằm ở các cột bảng. Cả lịch sử công việc/dự án dùng history-table: header và cell cùng căn giữa, tỷ lệ thời điểm/người thực hiện/sự kiện/thay đổi là 16/24/30/30. Lý do gộp dưới sự kiện để không thêm cột trống; nội dung đối chiếu mở rộng vẫn căn trái. Giữ dropdown Lịch sử hiện tại, không chuyển vị trí các nhãn trạng thái theo suy đoán.

Tổng quan cá nhân không dùng lưới KPI cố định bốn cột khi số card thay đổi theo quyền. Dùng auto-fit, card đầy đủ chiều ngang và cùng chiều cao, nhãn/thao tác bên trái, số bên phải. Card quá hạn có số liệu từ API; danh sách dự án chuyển thành bảng gọn. Bỏ CSS metric-value/project-grid không còn nơi dùng.

Hồ sơ tham khảo cụ thể field/vị trí/form của account-page bên vietcd: form một cột tối đa 576px, email readonly ở trên, họ tên/tên đăng nhập bên dưới, các ô 44px và nút lưu ở góc trái phía dưới. Riêng hồ sơ cá nhân mở form ngay như mẫu, không cần bấm Chỉnh sửa hồ sơ. Ba ô mật khẩu cùng bố cục dọc. Avatar tròn 160px nằm giữa panel ảnh, placeholder hình người, nút chọn tệp có kiểu button và input native ẩn nhưng vẫn dùng được bằng bàn phím; sau chọn có preview/tên tệp và nút lưu. Giữ tab ngang, dirty/conflict và toast; không trộn ảnh vào payload thông tin. Giữ tông xanh–trắng của DATN, không sao chép dữ liệu hoặc chính sách tài khoản của website đọc truyện.

Kiểm tra sau lượt này: typecheck, lint, build và 121/121 tests ở 9 file đạt. Luồng avatar/dirty/version cũ tiếp tục đạt; có kiểm tra đổi mật khẩu qua HTTP, xác nhận mật khẩu và giữ draft khi lỗi, không giữ credential trong mutation state; tổng quan nhân viên/PM hiển thị đúng số card/quyền và số liệu/link cá nhân. Browser QA vẫn chưa thực hiện được trong môi trường này.

Lỗi bảng rời rạc: từng màn tự bọc Panel/section, DataTable và Pagination; một số chân phân trang nằm ngoài viền, CSS :has chỉ sửa được vài cấu trúc. DataTable hiện sở hữu một table-card chung từ tiêu đề/mô tả đến table-scroll và footer. Các màn danh sách, lịch sử, phân tích và số liệu báo cáo truyền title/headerActions/description/pagination; bỏ lớp card và Pagination ghép bên ngoài. Footer luôn nằm trong đáy thẻ, trạng thái rỗng cũng giữ cùng khung. Bảng tĩnh chỉ hiện số dòng khi không có trang tiếp; không thêm nút chuyển trang giả cho bảng xem nhanh. Những panel chứa biểu đồ hoặc form vẫn là vùng nội dung riêng, không gộp chúng vào bảng chỉ để đồng nhất viền.

Sau thống nhất 22 bảng: typecheck, lint, build và 121/121 tests ở 9 file đạt. Kiểm tra khung chung bao gồm title/table/footer/empty state, chuyển trang trước/sau và màn báo cáo chỉ có một footer nằm trong thẻ bảng. Browser QA vẫn chưa thực hiện được.

Diễn giải chỉ số còn giống đọc công thức (“tổng A trừ tổng B, tính bằng phút”). Đổi mô tả K01–K16, snapshot mẫu và diễn giải được tạo trong mock thành câu giải thích ý nghĩa: “Chênh lệch giữa thời gian làm việc thực tế và thời gian ước lượng hiện tại”, “Thời gian đã chờ kể từ khi nộp kết quả để nghiệm thu”. Nhóm này gọi là Ý nghĩa chỉ số. Dùng ước lượng ban đầu/hiện tại đúng mốc tính; không đổi K07 sang ước lượng ban đầu chỉ vì ví dụ câu chữ. Dashboard hiển thị riêng hai chênh lệch và thay nhãn mơ hồ “gốc/khả dụng/tỷ lệ tải” bằng nhãn dễ hiểu. Không đưa trạng thái kỹ thuật hoặc phép đổi phút/giờ vào lời giải thích; dữ liệu và công thức tính giữ nguyên.

Sau sửa câu chữ: typecheck, lint, build và 121/121 tests ở 9 file đạt; chỉ điều chỉnh kỳ vọng câu chữ trong các test hiện có. Công thức và số liệu không đổi.

Đơn vị/nhóm trước đây tự chọn bản ghi đầu và hiển thị chi tiết bên cạnh danh sách, làm người dùng thấy thao tác sửa ngay khi mở màn. Hiện cả hai dùng DataTable có phân trang và cột Hành động/Chi tiết. Danh sách không tải users/detail hoặc tự mở form. Bấm Chi tiết mới vào route /admin/organization/[unitId] hoặc /admin/teams/[teamId], rồi bấm thao tác để sửa, chọn thành viên hay ngừng sử dụng. Tạo nhóm có /admin/teams/new như trang tạo đơn vị; sau tạo chuyển đến chi tiết. TeamRow trả sẵn unit.name để hiển thị, xóa CSS và state chọn dòng của bố cục cũ. Quy tắc này thay các hướng dẫn danh sách cuộn bên trái ở lượt trước.

Sau chuyển danh sách/chi tiết: typecheck, lint, build và 124/124 tests ở 9 file đạt. Kiểm tra list không fetch detail/users, liên kết chi tiết/tạo đúng route và footer nằm trong thẻ; detail chỉ mở sửa/thành viên sau thao tác, giữ draft/version; tạo nhóm chuyển đúng detail. Chưa kiểm tra trực quan browser.

Trang hồ sơ thành viên /users/[userId] dành cho người đã đăng nhập. Theo yêu cầu đã điều chỉnh, chỉ giữ card đầu (avatar/tên/đơn vị/vai trò) và thông tin liên hệ email có liên kết mailto. Bỏ các card số liệu, bảng dự án và phần dữ liệu liên quan trong DTO/DB/query. Menu avatar có Hồ sơ công khai; tên thành viên trong bảng có link riêng, giữ Chi tiết quản trị ở cột Hành động. Chỉ chủ hồ sơ thấy link Quản lý hồ sơ, mọi cập nhật vẫn ở /profile. Không đưa tên đăng nhập hoặc thao tác quản trị vào hồ sơ thành viên.

Sau lượt hồ sơ: typecheck, lint, build và 130/130 tests ở 9 file đạt. Kiểm thử HTTP/UI bao phủ phạm vi dữ liệu, liên kết, trường hiển thị và giữ draft khi đổi mục; không thay thế kiểm tra bố cục trực tiếp trên trình duyệt, hiện vẫn chưa thực hiện được.

Điều chỉnh kế tiếp: hồ sơ công khai chỉ hiển thị card nhận diện và email; bỏ thống kê/bảng dự án và dữ liệu không dùng từ API. Hồ sơ cá nhân đổi sang tab ngang như vietcd, vẫn giữ draft khi hủy xác nhận; hỗ trợ mũi tên/Home/End để đổi focus và Enter/Space để mở mục. Chi tiết công việc có Ngày tạo và Bắt đầu thực hiện, hiển thị Chưa bắt đầu nếu chưa có mốc. Sau điều chỉnh: typecheck, lint, build và 132/132 tests ở 9 file đạt; browser QA vẫn chưa thực hiện được.

Thống nhất toàn bộ khung theo vietcd: đặt page-surface tại WorkspaceShell, không lặp ở từng màn quản lý/view. Cùng nền trắng, viền, bo góc, padding và phân cách tiêu đề; DataTable vẫn giữ thẻ/phân trang riêng. Hồ sơ cá nhân dùng tiêu đề/email, tab và nội dung trong cùng khung, không tạo hero/card rời; avatar chỉ xuất hiện trong mục ảnh và menu tài khoản. Giữ nhãn/enum/cấu hình UI, dữ liệu nghiệp vụ lấy từ API; không chèn điểm biểu đồ hoặc ngày mẫu để lấp vùng trống. Rà CSS xóa class profile-page/profile-settings.panel và selector không còn dùng. Typecheck/lint/noUnused/build và 133/133 tests ở 9 file đạt; chưa kiểm tra trực quan browser.

Lượt danh sách/chi tiết công việc và tải dữ liệu: danh sách có Ngày bắt đầu từ firstStartedAt; chưa bắt đầu hiển thị rõ, không dùng ngày tạo thay thế. Chi tiết dùng metadata ba cột, hai vùng nội dung/tiêu chí và giờ công, lịch sử gần đây là bảng dưới cùng. Giờ thực tế/ước lượng ban đầu/hiện tại/còn lại hiển thị riêng; không dùng thanh giờ công như phần trăm hoàn thành. HistoryTable dùng lại DataTable cho đầy đủ/xem nhanh của cả dự án/công việc, cột Hành động căn giữa; xóa timeline và CSS history-table cố định riêng. AuditChanges là thao tác chữ cùng kiểu link của bảng.

Loading dùng PageSkeleton/Skeleton/Spinner chung: bảng/chi tiết/form/cards có khung tải, App Router có loading.tsx, các nút và tiến trình/tải tệp/refetch có spinner. Có aria-busy/status, skeleton trang trí aria-hidden và reduced motion. MSW trì hoãn phản hồi 400 ms trong development để thấy trạng thái tải; test có thể cấu hình độ trễ riêng. Typecheck/lint/noUnused/build và 135/135 tests ở 9 file đạt; kiểm tra trực quan browser vẫn chưa thực hiện được.

## Lượt quét UI và luồng ngày 26/10/2026

| Lỗi | Nguyên nhân | Quy tắc |
| --- | --- | --- |
| Khóa/mở khóa/cấp mật khẩu, ngừng sử dụng và kết thúc thành viên không xử lý được 412 | Dùng version props đang thay đổi hoặc không có reload/accept | Chốt snapshot khi mở; giữ draft và version khi refetch; tải bản mới từ cha và chỉ đổi version sau đối chiếu. |
| Đổi dự án vẫn lọc người của dự án cũ | Chỉ đổi projectId và page, bỏ quên authorId | Reset người lập/người nhận phụ thuộc dự án; giữ các bộ lọc độc lập. Lookup ẩn không tạo request. |
| Phụ trách dự án biến mất khi chọn nhóm | Truyền teamId chung cho mọi lookup PERSON | ownerId thuộc dự án; chỉ lookup assigneeId phụ thuộc teamId. |
| Dropdown đơn vị mất lựa chọn khi kết quả dự án rỗng | Dựng option từ dữ liệu trang đang lọc | Nguồn lựa chọn tách khỏi search/page hiện tại; lỗi lookup phải hiển thị và cho thử lại. |
| Thiếu tên bị hiển thị thành dữ liệu trống | Lookup chỉ có tài khoản hoạt động/một trang | Có ID thì không kết luận chưa phân công; nhóm vẫn đếm từ memberIds và số tên thực sự hiển thị. |

Typecheck, lint, build, git diff --check và 167/167 tests đạt. Kết quả quét cả 12 feature, nguồn version và tham số cùng giới hạn lookup được ghi tại [REFACTOR_REVIEW.md](REFACTOR_REVIEW.md#rà-lại-ui-luồng-và-tham-số--26102026). Chưa nghiệm thu trực quan CSS trên trình duyệt.

## Điều hướng và bố cục — 30/10/2026

| Lỗi | Nguyên nhân | Quy tắc |
| --- | --- | --- |
| Trang con thiếu vị trí và đường về | Mỗi màn tự đặt nút Danh sách hoặc không có | `PageNav` hiển thị breadcrumb và Quay lại cho mọi trang con; không thêm nút Danh sách… ở PageHeader. Mục hiện tại không có liên kết. |
| Quay lại ra ngoài ứng dụng hoặc mất bộ lọc | Dùng lịch sử trình duyệt | Đích là trang cha hoặc danh sách vừa rời kèm bộ lọc/chế độ xem/trang; mở bằng URL trực tiếp vẫn có đích. |
| Breadcrumb in ID | Chỉ có ID trên URL | Trang đã tải thực thể đăng ký tên bằng `useCrumbLabel`; chưa có thì hiện dấu … . |
| Quản trị lẫn trong menu làm việc | Cùng một sidebar | Khu quản trị có AdminShell và menu riêng; điểm vào ở menu avatar theo `canAdminister`. |
| Mục điều hướng dạng dropdown khó thấy | Dự án/công việc/phân tích ẩn mục sau select | Dùng `TabNav`; tab là liên kết nên vẫn hỏi khi có dữ liệu chưa lưu. |
| Nút trong PageHeader xếp dọc | Quy tắc `width: 100%` áp cho cả button | Chỉ input/select/textarea có width 100%; button theo nội dung. |
| Khoảng trống và khối thẻ thừa | Thẻ bao ngoài mỗi trang, bo góc lớn, bóng đổ | Trang không bọc thẻ; bo góc 4–6px, không bóng đổ trừ menu nổi; bộ lọc là thanh gọn, không đóng khung. |
| Bảng trạng thái và danh sách khó nhận biết mục | Thẻ chữ thuần, tên không phải liên kết | Board dạng cột có số đếm, thẻ có độ ưu tiên (`PriorityIcon`), hạn và người thực hiện; tên công việc/dự án/nghiệm thu là liên kết (`issue-link`) bên cạnh cột Hành động. |
| Điều hướng không giống mô hình quen thuộc của Jira | Chỉ có sidebar phẳng, không có tìm kiếm/Tạo trên thanh trên | Thanh trên có tìm kiếm và Tạo; sidebar có Gần đây, Dự án và Bộ lọc mở rộng; dự án có tiêu đề + tab Danh sách/Bảng/Thành viên/Lịch sử + menu •••. |
| Chữ ẩn cho trình đọc làm rộng cả trang | Phần tử `sr-only` định vị tuyệt đối nằm trong vùng cuộn (board) không bị cắt | Bao ngoài bằng phần tử `position: relative` (ví dụ `.priority`) để vùng cuộn cắt được. |
| Bộ lọc chiếm nhiều hàng, ô rộng bằng nhau dù nội dung ngắn | Mỗi bộ lọc là một cột nhãn trên + ô kéo giãn | Bộ lọc là hàng chip (nhãn và lựa chọn cùng hàng, rộng vừa đủ, tối đa 190px); ô tìm kiếm co giãn 160–280px; nút phụ như "Việc của tôi" và hành động chính nằm cuối hàng. Trên điện thoại hai chip một hàng. |
| Trang đơn điệu, khó phân biệt dự án và người | Mọi ô nhận diện cùng một màu | Nền trang xám nhạt để thẻ trắng nổi lên; `ProjectTile` và `Avatar` có 8 tông màu cố định theo mã/tên; thẻ số liệu có vạch màu; cột bảng trạng thái có vạch màu theo trạng thái. |
| Tiêu đề lặp tên tab trong dự án | Danh sách/Thành viên có thêm tiêu đề riêng | Trong khung dự án, tên tab đã là tiêu đề; nút Tạo công việc/Thêm thành viên nằm cuối hàng lọc để tiết kiệm một hàng. |
| Trang chủ lệch đỉnh, thừa khoảng trống; nút phụ chìm vào nền xám | Hai cột có chiều cao khác nhau; nút mặc định nền xám trên nền trang xám | Số liệu cần xử lý là một hàng thẻ gọn ngay dưới tiêu đề, thẻ dự án căn trái rộng 280–340px; nút mặc định nền trắng có viền để luôn nhìn thấy trên nền xám. |
| Thanh trên chật vì ô tìm kiếm và lối tắt trùng | Tìm công việc và Lập báo cáo đặt ở thanh trên dù đã có ở trang riêng | Thanh trên chỉ giữ logo, Tạo (theo quyền) và tài khoản. |
| Quản lý phải tải tệp mới xem được báo cáo | Chỉ có nút Tải ở chi tiết lần nộp | Khung xem trước PDF (`PdfPreview`) ở chi tiết công việc và màn đối chiếu; chỉ tải nội dung khi mở khung, thu hồi địa chỉ blob khi thu gọn. |
| Khoảng trống dưới khối nội dung ở chi tiết công việc, đối chiếu, cảnh báo | Cột phải chỉ có một khối ngắn, form xử lý nằm riêng một hàng | Dùng bố cục `issue-layout`: nội dung và báo cáo bên trái, thông tin/giờ công/tiêu chí/quyết định bên phải. |
| Nộp nhiều lần phải cuộn xuống cuối mới thấy báo cáo; khung báo cáo hiện cả người nộp | Mỗi tệp một khung xếp chồng, có tên người | Một khung duy nhất: dropdown "Lần nộp" ghi "Lần N · thời gian (mới nhất)" và dropdown "Tệp báo cáo" khi có nhiều tệp (`AttachmentViewer`); không hiển thị người nộp. |
| Breadcrumb sát thanh trên, nút Quay lại sát breadcrumb | Khoảng cách 4px | `.page-nav` cách thanh trên 10px và các hàng cách nhau 10px. |
| Giờ công và chỉ số khác xếp một cột dọc | Từng dòng nhãn: giá trị, lưới 3 cột cố định | Giờ công thành các ô nhãn/giá trị xếp lưới tự co; chỉ số khác là lưới tự co từ 220px; hai khối nằm cạnh nhau khi vùng nội dung từ 900px. |
