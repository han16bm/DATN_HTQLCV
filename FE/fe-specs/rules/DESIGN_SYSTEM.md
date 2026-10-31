# Quy tắc thiết kế giao diện doanh nghiệp

## Thiết kế hiện hành — 31/10/2026

Theo yêu cầu thiết kế lại toàn bộ FE, quy tắc dưới đây và `../../docs/UI_REDESIGN.md` thay thông số UI ngày 30/10/cũ hơn.

Khung tài liệu ở chi tiết công việc luôn có mặt sau khi công việc tải thành công, kể cả tài khoản nhân viên/người nộp; không ẩn khung bằng quyền quản lý/nghiệm thu. Có tệp thì xem trước, chưa có thì trạng thái trống. API vẫn kiểm tra quyền đọc công việc/tệp; nghiệm thu giữ quyền riêng.

| Vùng | Quy tắc |
| --- | --- |
| Chữ | Segoe UI/Arial, H1 24/600, H2 17/600, H3 15/600; body/table/control/tab/field label 14; metadata/status 12–13. Đánh giá ở zoom 100% |
| Màu | Nền #f7f8fa, trắng cho nội dung, chữ #252b37/phụ #667085, viền #e3e6eb, primary #0c66e4. Bình thường dùng trung tính |
| Khung | Topbar 56, sidebar 232/56; Admin tách qua avatar; main padding 24–28 và tối đa 1680; card bo 8/padding 20, control thông thường 30/bo 6; auth và vùng chạm có kích thước riêng |
| Điều hướng | SectionNav tab ngang với link/aria-current và cuộn khi hẹp; giữ route/scope/dirty/back; hai nút Danh sách/Bảng trạng thái vẫn trong hàng lọc |
| Công việc | Mô tả/tiêu chí chung card, phân bằng viền nhấn/nền nhẹ/padding gọn; kết quả bên dưới, metadata/giờ công cột phụ, nghiệm thu ở header. Tên trong bảng một dòng/30ch + title đầy đủ; ưu tiên chữ màu, không icon |
| Filter/dropdown | Focus trung tính, không viền/ring xanh. Mũi tên native select đổi bằng :open, menu/box chọn theo aria-expanded; giữ nhận diện filter đang chọn bằng nền/chữ. Khoảng cách nhãn 4, gap hàng lọc 8–12 |
| Bảng/lịch sử | Header/footer tối thiểu 32px, hàng chuẩn 48px/padding dọc 4; dữ liệu dài hợp lệ còn xuống dòng. Hành động không gạch chân khi hover. Dự án/công việc cùng drawer 420px, padding 16, slide 180/140ms, reduced motion, đóng trả focus đúng hàng; không split/Popover riêng |
| PDF | Heading Báo cáo đính kèm + nút Thu gọn/Xem trước, Mở tab mới, Tải xuống ngoài khung dữ liệu. Chưa có lần nộp/tệp vẫn giữ khung với Chưa có báo cáo đính kèm, không fetch ID rỗng; quyền xem giữ nguyên. Tên/dung lượng gọn một dòng; nhiều tệp dùng picker thay tên. Picker vẫn dùng được nếu metadata tệp được chọn lỗi. Giữ HTTP/blob/đổi lần nộp và không thêm card lồng |
| Báo cáo | Form viết + cột kỳ/người lập/dự án/nguồn; Lưu nháp/Gửi báo cáo đầu form, không sticky che field; bảng nguồn mở bằng details. Đã gửi dùng bố cục đọc và snapshot |
| Phân tích | Nhóm 4 KPI chính, value 26 nổi hơn label 14; biểu đồ/bảng dưới. Giờ công và danh sách chỉ số phụ hai vùng; danh sách phụ 2 cột khi đủ rộng, 1 khi hẹp, không nhiều card nhỏ. Căn cứ và lời AI cạnh nhau |
| Responsive/state | Container page/card/form; bảng/board cuộn riêng, vùng chính/phụ xếp dọc; giữ skeleton/spinner/error/empty/disabled/pending/dirty/412 và trạng thái AI thực tế. Thử tải lại nhận Promise request, hiện Đang tải lại…/spinner/disable trong lúc chờ, type=button để không submit form cha |

## Thiết kế ngày 30/10/2026 — lịch sử

Theo ảnh phản hồi, tham khảo [điều hướng Jira](https://support.atlassian.com/jira-software-cloud/docs/what-is-the-new-navigation-in-jira/) và [khoảng cách Atlassian](https://atlassian.design/foundations/spacing/). Phần này và docs/UI_REVIEW.md thay các quy tắc trình bày gốc phía dưới khi khác nhau.

| Vùng | Quy tắc hiện hành |
| --- | --- |
| Chữ | Segoe UI/Arial, body 14px, bảng/control 13px, nhãn phụ 12px. Một H1 22px, H2 15–16px cho mục con |
| Màu | Trang #F4F5F7, thẻ trắng, vùng phụ #F7F8F9, chữ #172B4D/phụ #626F86, viền #DCDFE4, primary #0C66E4/hover #0055CC/nền chọn #E9F2FF |
| Khung | Topbar 48px với logo/avatar, bỏ Tạo toàn cục; sidebar 240px/56px, drawer dưới 768px. Admin có menu riêng |
| Điều hướng | Breadcrumb trên Quay lại; dự án/công việc/phân tích dùng SectionNav trong header, giữ dirty guard/scope. Danh sách/Bảng trạng thái là hai button phía bên phải các filter cùng hàng lọc, tách khỏi nút tạo ở header, không thành option |
| Lọc | Nhãn ngoài select/input; control/nút/dropdown dùng token 32px, viền xám, bo 4px. Hàng lọc chừa 8px hai bên, ô nhập/chọn padding ngang 12px. Trigger/select vừa text với max-width chống tên dài; điều kiện canh phải, tìm kiếm bên trái, xuống hàng khi hẹp |
| Sidebar công việc | Button Tất cả/Việc của tôi/Việc quá hạn lọc cùng /tasks, giữ q/projectId/view, bỏ page. Có thể kết hợp việc của tôi và quá hạn |
| Trang chủ | Thống kê cá nhân tối đa 220px/thẻ, wrap, không kéo giãn cả hàng; danh sách là vùng chính, dự án cột phụ. Dưới 1100px xếp dọc. Bảng cá nhân không lặp người thực hiện. Nút Tạo công việc có ngữ cảnh Dự án bạn quản lý và chỉ hiện theo quyền TASKS_MANAGE trong dự án ACTIVE |
| Board | Cột 188–216px, gap 8px, thẻ padding 8px/chữ 13px, metadata 11px/avatar 20px; tiêu đề trạng thái viết thường tự nhiên, giữ màu nhận diện. Cuộn riêng khi hẹp |
| Chi tiết | Panel có tiêu đề/actions ở ngoài div.panel-body.card trắng. task-overview chia nội dung/tiêu chí bên trái, giờ công bên phải, mỗi nhóm có tiêu đề ngoài khung. Metadata theo issue-layout. StatusField có Nhãn: và Badge nền, các cặp cách nhau 20px |
| Nghiệm thu | Button bên phải cùng hàng tên công việc, mở HashDialog #review tại URL hiện tại; không dẫn sang lần nộp để mở form. Chỉ một ReviewForm qua TaskShell/ReviewDialog; giữ quyền/trạng thái/không tự nghiệm thu, dirty/412 và PDF |
| Thống kê | KPI dùng chung thẻ, label/value 14px. Bốn KPI ở trên biểu đồ và canh phải, hàng tối đa 960px. Giờ công/chỉ số hai vùng 3/7, nhóm chỉ số 3/2/1 cột theo chiều rộng, padding thẻ 8px 10px; không khung trắng lồng thừa. Chưa đủ dữ liệu không đổi thành 0; biểu đồ chỉ dùng response có nguồn |
| Nhóm hai vùng | section-group bao quanh hai vùng bằng nền nhẹ/viền/bo 8px/padding 14px, áp dụng cho chi tiết công việc và giờ công/chỉ số; tiêu đề từng vùng vẫn ở ngoài khung dữ liệu, không ép chiều cao |
| Bảng | DataTable giữ một section chung; tiêu đề/headerActions ở ngoài thẻ trắng, dữ liệu/footer bên trong. Giới hạn chiều rộng 560/760/960/1120px theo 1–2/3/4/5 cột, widths theo nội dung tổng 100. Header/hover nhẹ, Hành động giữa, Chi tiết là chữ |
| Danh sách dự án | Biểu tượng Lucide/màu ổn định theo ID và tên; không hiển thị mã/mô tả. Tỷ lệ cột 26/14/16/11/10/14/9, tên dùng hết ô và xuống dòng khi dài; giữ đủ chỗ cho ngày/hạn và Hành động. Không trả code/objective trong ProjectRow |
| Lịch sử | Bảng bốn cột 21/23/38/18. Công việc luôn có khung phải, chưa chọn thì hiện lời nhắc; chỉ bấm Chi tiết trong Hành động mới hiện Trước/Sau. Không tự chọn dòng hoặc bấm sự kiện. Bảng/khung giữ tỷ lệ 3/5–2/5, dưới 900px xếp dọc; tiêu đề ngoài vùng dữ liệu trắng. Dự án giữ Popover portal |
| Giờ công trong chi tiết | Nhãn/value cùng hàng, gap 8px, canh trái, không đường kẻ từng dòng và không space-between. Khối giờ công tối thiểu 240px; dữ liệu padding 12px 14px, chữ 13px; quy tắc container chung không ép xếp dọc |
| Người thực hiện | UserBadge có avatar 28px và tên, dùng cả bảng lẫn metadata người nhận/người ghi/người nộp/tác giả/actor. Có URL thì dùng ảnh, chưa có thì chữ cái; chưa phân công giữ text. Không thêm request từng người |
| Form/hồ sơ | Giữ RHF/Zod, draft và đối chiếu 412; form hồ sơ một cột, avatar kéo/zoom/cắt/upload ngay; hủy ảnh không dirty guard |

Responsive theo container page/card/form; issue-layout xếp dọc dưới 900px nội dung. Bảng/board có vùng cuộn riêng; không che tràn ở body. Giữ Skeleton/Spinner, refetch không xóa dữ liệu, focus/Escape/khôi phục focus và reduced motion. Toast thành công góc phải trên, confirm ở giữa. Kiểm thử DOM/HTTP không chứng minh kích thước CSS; cần nghiệm thu trực quan 320/375/768/1024/1440px và hai trạng thái sidebar. Chỉ gom các thao tác hiện có, không thêm nút/trang ngoài phạm vi.

## Thiết kế gốc — tham chiếu lịch sử

Tài liệu 0.4 · 24/10/2026. Giữ font hiện tại, làm chữ dịu và giảm yếu tố trang trí; các ảnh màn chính là mẫu bố cục.

## Chữ và phân cấp

| Thành phần | Quy tắc |
|---|---|
| Font | DejaVu Sans; body 14 px, line-height 1.6; nội dung dài 14–15 px khi triển khai |
| Độ đậm | 400 cho nội dung/control; 500 cho tiêu đề và dữ liệu cần nhấn. Không dùng 700 đại trà |
| Tiêu đề | H1 24–26 px; H2 16–18 px; H3 14–15 px; phân cấp bằng kích thước/khoảng cách |
| Màu chữ | Chính #3B4656; tiêu đề #344154; phụ #657084; metadata ít ưu tiên #7A8493 trên nền sáng, không dùng cho thông tin thiết yếu cỡ nhỏ |
| Hiệu ứng | Không text-shadow, stroke chữ, bóng thẻ/nút hoặc gradient trang trí; không tạo cảm giác chữ nổi |

## Màu, góc và đường phân chia

| Thành phần | Quy tắc |
|---|---|
| Nền | Trang #F6F7F9, thẻ trắng, đường phân chia #E0E5EB |
| Primary | Xanh trầm #365B85; nút chính chữ trắng; mỗi vùng có một hành động chính |
| Trạng thái | Xanh lục/amber/đỏ dịu có nhãn chữ; dùng nền nhạt, không dùng màu để thay nội dung |
| Bo góc | Card/shell 6 px; button/input/chip 3–4 px; dialog 6–8 px. Avatar/progress circle có thể tròn khi đúng chức năng |
| Icon | Chỉ icon có ích cho tìm kiếm, dropdown, mở menu, đóng dialog, upload và tín hiệu cần thiết. Sidebar/nút đã có chữ/KPI/card/citation không lặp icon trang trí |
| Avatar | Màu trung tính, chỉ hỗ trợ nhận diện người; không thêm một màu nổi cho mỗi hàng |
| Biểu đồ | Màu trầm nhất quán, trục/đơn vị/chú giải rõ; mọi đường/cột có dữ liệu, không dùng đường cong filler |

## Bố cục và tương tác

Sidebar desktop 224 px, topbar khoảng 66 px, main padding 24–28 px. Thẻ padding 20–22 px, khoảng giữa vùng 20–24 px. Active menu có nền nhạt/đường chỉ báo nhỏ. Dùng thẻ cho nhóm nội dung, không chia mọi câu thành thẻ riêng.

Bộ lọc đứng trước kết quả; tìm kiếm và lựa chọn chính thấy ngay, filter nâng cao có nhóm. Nhãn filter lấy từ API có quyền phù hợp. Bảng ưu tiên tên/ngữ cảnh/trạng thái/người/hạn; thông tin phụ xuống dòng, hạn chế cột và icon lặp. Hành động hàng dùng chữ rõ.

Form có label luôn thấy, nhóm trường hợp lý; control cao 40–44 px. Field dài chiếm hàng; lỗi cạnh trường, focus rõ và aria-live phù hợp. Không reset input khi refetch/412. Rời form hoặc logout có dirty data phải nhắc lưu/bỏ.

Trang chi tiết chia nội dung và bối cảnh theo tác vụ. S43 đặt metric đầu trang, số liệu/công thức/nguồn và lời AI thành hai cột desktop; “Tổng hợp theo số liệu” không bị gắn nhãn AI. Lời dài xuống trang tự nhiên, không cố định chiều cao. Recommendation chỉ dẫn tới nghiệp vụ hợp lệ.

Dashboard có đủ 16 KPI, phân bố trạng thái, xu hướng có dữ liệu và so sánh dự án. Kết quả không có mẫu số hiển thị chưa có dữ liệu. Trang nhiều dự án luôn ghi scope/quality; không so sánh phần trăm thiếu quy mô.

## Responsive và state

Ở 768 px, sidebar thành menu có thể mở, giảm cột theo độ rộng. 390/375 px: KPI hai cột; form/detail một cột; bảng rộng cuộn trong vùng hoặc chuyển row card. S43 có điều hướng phần, thấy các thông số chính trước vùng AI. Primary action không bị che.

State được mô tả ở UI_STATES.txt, BUSINESS_STATES.txt và ANALYSIS_FLOW.txt; không tạo thêm ảnh hoặc route cho từng state. Skeleton đúng vùng, background refetch giữ dữ liệu; AI chậm/lỗi chỉ ảnh hưởng phần AI. Dialog trap focus, đóng trả focus; kiểm tra bàn phím và tương phản trên code thật, không coi việc giảm độ đậm là lý do giảm khả năng đọc.
