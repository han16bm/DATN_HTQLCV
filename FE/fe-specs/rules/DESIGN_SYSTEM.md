# Quy tắc thiết kế giao diện doanh nghiệp

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
