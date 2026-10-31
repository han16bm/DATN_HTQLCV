# Thiết kế lại giao diện — 31/10/2026

Phạm vi lấy từ 43 `src/app/**/page.tsx`, 12 feature và component dùng chung. Yêu cầu mới thay bố cục dropdown SectionNav, panel lịch sử rỗng và lưới chỉ số nhỏ của các lượt trước. Giữ nguyên route, API, DTO, dữ liệu, quyền và quy tắc nghiệp vụ; không gộp/xóa route. Các mục trong trang được trình bày bằng tab ngang nhưng vẫn có deep link.

Tinh chỉnh theo phản hồi tiếp theo ngày 31/10: control 30px, bảng gọn, focus filter trung tính/mũi tên theo trạng thái mở, tên việc ellipsis/title, ưu tiên chữ màu, lịch sử dùng chung drawer 420px có slide, PDF actions ở heading và mô tả/tiêu chí phân nền/viền nhẹ. Bộ 38 ảnh bên dưới thuộc lượt QA trước các tinh chỉnh này; Edge hiện chưa kết nối nên chưa có ảnh mới của phiên bản compact.

Tham khảo nguồn chính thức: [bố cục chi tiết Jira](https://support.atlassian.com/jira-cloud-administration/docs/configure-issue-layout/), [typography Atlassian](https://atlassian.design/foundations/typography/), [bảng và backlog](https://support.atlassian.com/jira-software-cloud/docs/customize-your-view-of-the-board-and-backlog/). Áp dụng cách chia nội dung/ngữ cảnh và thứ bậc, không sao chép chức năng ngoài phạm vi.

## Danh sách màn theo code

“Đồng bộ” nghĩa là giữ cấu trúc chức năng, nhận font/khoảng cách/màu/bảng/form/state từ component và CSS chung. Việc rà source không đồng nghĩa đã chụp mọi case trình duyệt. Bằng chứng trực quan nằm riêng ở mục kiểm tra.

| Route | Màn / điều chỉnh |
| --- | --- |
| `/` | Giữ chuyển hướng theo phiên |
| `/login` | Đồng bộ chữ, màu, field; giữ hình minh họa và luồng đăng nhập |
| `/workspace` | Thống kê gọn, danh sách chính/dự án phụ; hành động quản lý có ngữ cảnh |
| `/profile` | Đồng bộ card/tab ngang/form một cột, avatar crop và mật khẩu |
| `/users/[userId]` | Giữ card nhận diện và email, không thêm chỉ số cá nhân |
| `/projects` | Đồng bộ bảng, filter; giữ icon/tên và tỷ lệ cột hiện hành |
| `/projects/new` | Đồng bộ form tạo, nhóm field theo độ dài |
| `/projects/[projectId]` | Tab ngang Tổng quan/Lịch sử; mục tiêu trong card, kế hoạch cột phụ; bảng gần đây |
| `/projects/[projectId]/edit` | Đồng bộ form kế hoạch, giữ snapshot/412 |
| `/projects/[projectId]/tasks` | Tab công việc dự án; filter + hai nút Danh sách/Bảng trạng thái; board dễ đọc |
| `/projects/[projectId]/tasks/new` | Đồng bộ form tạo công việc trong dự án |
| `/projects/[projectId]/members` | Bảng/avatar/menu hành động gọn; nút thêm ở header |
| `/tasks` | Bảng/board dùng cùng cấu trúc với công việc dự án; bộ lọc cá nhân giữ URL |
| `/tasks/[taskId]` | Mô tả + tiêu chí một vùng; kết quả bên dưới; metadata/giờ công ở cột bên; header nghiệm thu |
| `/tasks/[taskId]/edit` | Tab Điều chỉnh khi có quyền; form giữ dirty/version |
| `/tasks/[taskId]/time-logs` | Tab Giờ công; đồng bộ bảng và avatar; giữ sửa/loại nhật ký |
| `/tasks/[taskId]/submissions` | Tab Kết quả; đồng bộ bảng nhiều lần nộp, sort/phân trang thật |
| `/tasks/[taskId]/submissions/[submissionId]` | Nội dung/tài liệu/nghiệm thu trái, tiêu chí/snapshot bên phải; vẫn thuộc tab Kết quả |
| `/tasks/[taskId]/history` | Bảng chung, Chi tiết mở drawer; bỏ panel rỗng |
| `/reviews` | Tìm công việc + lọc dự án; bảng/avatar/ngày giờ, vào đối chiếu cùng TaskShell |
| `/reports` | Đồng bộ bảng/filter/status nháp/đã gửi |
| `/reports/new` | Giữ bước chọn dự án/kỳ; đồng bộ form, lỗi và disabled |
| `/reports/[reportId]` | Đã gửi: bố cục đọc + ngữ cảnh + bảng snapshot; nháp giữ liên kết sửa |
| `/reports/[reportId]/edit` | Vùng viết + tóm tắt nguồn, hai nút Lưu nháp/Gửi báo cáo ở đầu form; bảng nguồn thu gọn |
| `/dashboard` | KPI chính, biểu đồ, bảng so sánh; giờ công và danh sách chỉ số phụ |
| `/analytics/risks` | Tab ngang, bộ lọc chung; đồng bộ bảng dự án/công việc cần đối chiếu |
| `/analytics/workload` | Tab ngang, bảng nhân sự/avatar/số liệu/chi tiết; không chấm điểm mới |
| `/analytics/bottlenecks` | Tab ngang, bảng điểm nghẽn và căn cứ; giữ phản hồi hiện có |
| `/analytics/summary` | Tab ngang; văn bản tổng hợp và bảng chú ý, giữ nguồn dữ liệu |
| `/analytics/details/[analysisId]` | Căn cứ/chỉ số bên trái, văn bản AI bên phải; trạng thái AI ở heading; giữ phản hồi/citation/job |
| `/analytics/jobs/[jobId]` | Đồng bộ card tiến trình, trạng thái/thử lại; không thêm kiểu polling |
| `/alerts` | Tab cùng phân tích; đồng bộ bộ lọc/bảng/mức độ/trạng thái |
| `/alerts/[alertId]` | Bằng chứng bên trái, thông tin và form xử lý bên phải; metadata dùng record-details |
| `/admin` | Giữ chuyển đến mục quản trị đầu tiên được phép |
| `/admin/users` | Đồng bộ bảng/filter/tạo tài khoản trong AdminShell |
| `/admin/users/new` | Đồng bộ form cấp tài khoản và validation |
| `/admin/users/[userId]` | Thông tin tài khoản vùng chính, truy cập/mật khẩu vùng bên; sửa theo nút |
| `/admin/organization` | Giữ danh sách trước, Chi tiết tại cột Hành động; bảng chung |
| `/admin/organization/new` | Form tạo riêng, field gọn và footer chung |
| `/admin/organization/[unitId]` | Thông tin trước, sửa/ngừng theo nút; đồng bộ card/form |
| `/admin/teams` | Giữ danh sách nhóm; bảng chung và Chi tiết |
| `/admin/teams/new` | Form tạo riêng; đồng bộ field và bộ chọn có tìm kiếm |
| `/admin/teams/[teamId]` | Thông tin/sửa/thành viên/ngừng theo nút; cùng card và footer |

## Component, trạng thái và hành vi

- AppShell: topbar 56px, sidebar 232px/56px, nội dung tối đa 1680px; admin tách biệt. Breadcrumb/Quay lại dùng cây route và nguồn danh sách như trước.
- Chữ ở zoom 100%: H1 24/600, H2 17/600, H3 15/600; bảng/field/button/tab 14; status/metadata 12–13. Segoe UI/Arial hỗ trợ tiếng Việt. Chữ #252b37/phụ #667085; xanh #0c66e4 cho chọn/liên kết/action.
- Control thông thường 30px/bo 6, card bo 8/padding 20; auth và vùng chạm có kích thước riêng. Table heading ngoài, dữ liệu/footer cùng thẻ; header/footer tối thiểu 32, hàng chuẩn 48/padding dọc 4. Hành động không underline khi hover. Board 224–256px/cột, thẻ 12px, tên 14; ưu tiên/hạn bố trí gọn hai hàng, cuộn nội bộ.
- SectionNav là nav liên kết ngang, dùng aria-current, cuộn riêng khi hẹp. Không tạo role tab giả cho các liên kết chuyển route.
- HistoryTable dự án và công việc cùng mở Radix Dialog dạng drawer 420px/padding 16, slide 180/140ms, overlay nhẹ, khóa focus, Escape, đóng; giữ nội dung khi slide đóng. Bỏ split/Popover, không dựng khung chưa có nội dung. AuditChanges chỉ hiển thị trước/sau.
- Drawer khôi phục focus về đúng nút Chi tiết đã mở nó, kể cả đóng bằng Escape. Các căn cứ AI gom trong details; tên mô hình (gồm AI mô phỏng khi response trả như vậy) nằm cạnh trạng thái ở heading.
- Form dùng RHF/Zod và snapshot/version như trước; slot submitActions đặt hai thao tác báo cáo ở đầu form. Bỏ footer sticky sau khi QA thấy phủ phần dưới textarea; nút vẫn ở một vị trí, không nhân đôi. Lưu nháp không bắt nội dung gửi; gửi vẫn yêu cầu kết quả/kế hoạch/lý do 0 giờ. Loading, disabled và lỗi giữ bản nháp. Không autosave.
- Nộp kết quả/ghi giờ/giao việc/đổi trạng thái/ước tính còn lại/nghiệm thu; dự án kích hoạt/kết thúc/đổi vai trò/thêm-kết thúc thành viên; đơn vị/nhóm/tài khoản/đổi ảnh/mật khẩu: giữ form và HashDialog hiện có, nhận chung font/spacing/button/scroll. Không thêm bước nghiệp vụ.
- PageSkeleton/Spinner, Empty, QueryErrorState/FormError, confirm bỏ lưu giữa màn và toast góc phải trên giữ semantics. Phân tích cũ/thiếu/mô phỏng/lỗi và polling vẫn lấy từ response.
- PDF có actions ở heading ngoài card, tên/dung lượng gọn; picker nhiều tệp thay tên và vẫn hiển thị khi metadata tệp lỗi để chọn tệp khác. Bỏ card lồng ở các màn gọi, giữ phiên chọn/sort/phân trang và thu hồi blob. Tên việc trong bảng chỉ ellipsis bằng CSS/title, không cắt chuỗi response; ưu tiên giữ chữ/màu, không icon. Focus filter trung tính và select/menu đổi mũi tên theo trạng thái mở thực tế.
- Vùng tài liệu hiện với mọi người được đọc công việc, gồm nhân viên/người nộp; không bọc khung bằng quyền quản lý/nghiệm thu. Giữ Panel/khung Chưa có báo cáo đính kèm khi chưa có lần nộp hoặc tệp, không fetch ID rỗng. Backend giữ quyền đọc công việc/tệp; nghiệm thu có quyền riêng. QueryErrorState chờ Promise refetch bằng ActionButton với spinner/disable/Đang tải lại…; không reload toàn trang, gửi form cha hoặc giả phục hồi nếu response vẫn lỗi.
- Responsive theo container page/card/form; issue/report/analysis/account xếp dọc, form 12 cột về một cột, filter xuống hàng, table/board cuộn riêng. Drawer tối đa 420px/100vw, dialog giới hạn viewport. Sticky header công việc tắt khi nội dung dưới 820px.

## Kiểm tra

Đã đối chiếu danh sách **43 route/43 page.tsx**, các nhóm màn của 12 feature và các biểu mẫu/state dùng chung. Không thêm/xóa route hoặc endpoint trong lượt thiết kế lại.

- `npm test`: **228/228 test, 13 file đạt** sau lượt thu gọn/giữ khung trống/thử lại và sửa điều kiện ẩn khung với nhân viên. Lịch sử công việc/dự án dùng chung drawer, đóng bằng nút hoặc Escape trả focus đúng hàng; picker tài liệu vẫn cho đổi tệp sau lỗi metadata 404. Khung tài liệu hiện cho quản lý và nhân viên được đọc công việc, trước lần nộp đầu tiên hoặc khi không có tệp; người không được đọc công việc không gửi request tài liệu. Thử lại gửi HTTP lần hai, giữ pending và không submit form cha. Các ca tích hợp tiếp tục xác nhận quyền, snapshot/412, giữ draft, phân trang/sort tài liệu, scope/filter/back, nghiệm thu và phản hồi AI. Ca gửi báo cáo thiếu nội dung báo lỗi nhưng vẫn lưu nháp được sau đó tiếp tục đạt.
- `npm run typecheck`, `npm run lint`, `npm run build`, `git diff --check`: đạt. Formatter kiểm tra các file UI đã sửa; không thêm dependency thiết kế hay generator vào FE.
- QA native ở lượt thiết kế trước khi thu gọn, trên **Edge đang mở**, zoom 100%, desktop và viewport 375px qua DevTools: workspace rỗng của quản lý, dự án/bảng/board, chi tiết công việc và PDF, lịch sử/drawer, báo cáo gửi/nháp/validation, dashboard/chỉ số/AI, hồ sơ/tab mật khẩu, Admin tài khoản/form/đơn vị/nhóm/bộ chọn thành viên, cảnh báo và chi tiết. Đã xem sidebar mobile và dialog nghiệm thu mobile; đã thử confirm chưa lưu, Ở lại giữ nguyên nội dung. Chưa QA trực quan phiên bản control/bảng compact và PDF/drawer mới ở lượt sau.
- Lỗi bố cục tìm được qua QA đã sửa: footer báo cáo sticky che textarea → hai nút đầu form; filter mobile tính sai gap → hai cột; danh sách chỉ số phụ quá dài → hai cột desktop; khung rỗng thao tác tài khoản → ẩn panel-body rỗng; bỏ email lặp và khung lồng vùng avatar.

Ảnh: [gallery QA](../../artifacts/ui-redesign-2026-10-31/index.html), [manifest](../../artifacts/ui-redesign-2026-10-31/manifest.json). Có **38 ảnh viewport**, gồm 28 ảnh rà soát và 10 ảnh trước tinh chỉnh được đánh dấu riêng. Ảnh có khung trình duyệt; ảnh mobile có DevTools. Không phải bộ ảnh toàn trang hoặc tất cả case.

Giới hạn còn lại: khi tiếp tục phiên, cả native pipe và browser host của Computer Use đều mất kết nối. Theo yêu cầu chỉ thao tác trên Edge, không dùng Playwright/CDP thay thế. Chưa xem trực tiếp từng route phụ/tổ hợp dữ liệu và mọi kích thước; chưa chụp lại các thay đổi cuối về căn cứ/nhãn AI, avatar, màu tên hồ sơ, typography đăng nhập, chỉ số phụ và focus drawer. Các phần này đã rà source/test. Trong lúc QA dev từng có `Failed to fetch` ở request điều hướng qua MSW; màn vẫn mở được sau đó, chưa xác nhận lại console sau khi mất kết nối. Chưa tích hợp hoặc kiểm tra với BE thật.

Các phần cần một lượt QA trực quan tiếp khi Edge kết nối lại:

- Form tạo/sửa dự án/công việc, tab thành viên/lịch sử dự án; trang giờ công, danh sách/chi tiết lần nộp và hàng chờ nghiệm thu. Chúng đã nhận style chung và được rà/test, chưa được chụp trực tiếp trong bộ ảnh này.
- Các bảng nguy cơ/khối lượng/điểm nghẽn/tổng hợp và trang tiến trình AI; bộ lọc nâng cao mở rộng, nội dung dài, nhiều trang dữ liệu. Dashboard/chi tiết AI/cảnh báo đã có ảnh nhưng chưa đủ mọi biến thể.
- Tạo tài khoản, chi tiết đơn vị, tạo nhóm, crop avatar; màn 320/768/1024px và trạng thái sidebar thu nhỏ. Đã xem Admin danh sách/form sửa, form tạo đơn vị và box thành viên trên desktop; mobile đã xem ở 375px.
- Các trạng thái loading/pending, 403/404/412/429/5xx và mạng lỗi cần đối chiếu trực quan. Test hành vi có bao phủ lỗi/giữ draft/quyền, nhưng không chứng minh khoảng cách hoặc cuộn của mọi trường hợp.
