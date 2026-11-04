# Bảng yêu cầu thay đổi — Điều hướng/Danh sách dự án & Phân quyền

> Tổng hợp từ trao đổi với Việt (02/11/2026) + ảnh tham khảo [`design/list_du_an.jpg`](../design/list_du_an.jpg) + rà lại code hiện có qua CodeGraph. File này là **file tổng, dùng chung cho người (Việt) và cho phiên Claude Code sau** — bất kỳ ai/AI session nào bắt đầu làm phần điều hướng dự án nên đọc file này trước. File **không chứa thay đổi code** — chỉ để chốt yêu cầu trước khi giao việc, kiểu task sheet. Cập nhật cột "Trạng thái" khi quyết định xong.

## ƯU TIÊN KẾ TIẾP (02/11/2026) — Tổ chức điều hướng theo dự án

**Đây là việc cần làm trước tiên**, gộp 2 mục A1 và "Gần đây" (chi tiết đầy đủ ở mục 2) thành **một chủ đề thiết kế**: tổ chức lại điều hướng xoay quanh khái niệm "dự án" làm đơn vị chính, thay vì danh sách phẳng + MRU rời rạc như hiện tại.

**Hiện trạng thật (đã verify qua code, không đoán):**
- Chọn dự án hiện chỉ có 2 đường: (a) vào `/projects` rồi lọc/tìm trong bảng đầy đủ, hoặc (b) mục "Gần đây" lồng trong nav "Dự án" ở sidebar.
- "Gần đây" (`FE/src/components/layout/sidebar-content.tsx` → `RecentList`, state ở `FE/src/stores/ui-store.ts`):
  - Lưu **chỉ trong bộ nhớ** (Zustand, không persist) → **mất sạch khi F5/đóng tab**, không giúp quay lại dự án ở phiên sau.
  - Danh sách gốc trộn chung cả "project" lẫn "task" đã mở (tối đa 8 mục), rồi mới lọc ra 5 mục có tiền tố `/projects/` để hiện dưới mục nav Dự án — không phải một danh sách "dự án gần dùng" được thiết kế riêng.
  - Chỉ hiện ở sidebar desktop khi **không thu gọn** (`!collapsed`) và chỉ ở mục nav đầu tiên (`index === 0`) khi đang ở khu `workspace` — không hiện trên mobile sidebar, không hiện khi thu gọn.
- Không có ô chọn nhanh dự án (project switcher) nào hiện diện xuyên suốt mọi trang như ảnh tham khảo `design/list_du_an.jpg`.

**Trạng thái: CHƯA thiết kế xong — chưa code.** Cần 1 phiên thiết kế riêng (brainstorming) trước khi giao việc/code, vì đây là thay đổi cấu trúc điều hướng (ảnh hưởng `sidebar-content.tsx`, `ui-store.ts`, có thể cả cách lưu "gần đây" — persist vào đâu, theo user hay theo máy).

**Câu hỏi cần chốt trước khi thiết kế chi tiết:**
1. "Gần đây" có nên tách thành danh sách riêng chỉ gồm dự án (bỏ task), và **lưu bền** (localStorage theo user, hoặc BE) thay vì mất khi reload?
2. Ô chọn nhanh dự án (project switcher) có thay thế luôn "Gần đây", hay cả hai cùng tồn tại (switcher để tìm mọi dự án, Gần đây để quay lại nhanh 3-5 dự án vừa dùng)?
3. Switcher nên đặt ở đâu — topbar (như ảnh tham khảo) hay đầu sidebar — và có cần hiện cả khi sidebar thu gọn/trên mobile không (Gần đây hiện đang KHÔNG hiện trong 2 trường hợp đó)?
4. Có áp dụng luôn cho khu quản trị (admin) hay chỉ khu làm việc (workspace) — hiện "Gần đây" chỉ chạy ở khu workspace?

➡️ Khi trả lời xong 4 câu trên, mới nên bắt đầu phiên brainstorming/thiết kế chi tiết rồi mới code.

---

## PHÂN CÔNG (02/11/2026)

> Theo dõi giao task/trạng thái người làm ở Google Sheet (nguồn chính, dễ cập nhật tay, có dropdown Người phụ trách/Trạng thái + cột Deadline): [DATN - Giao task (chuẩn)](https://docs.google.com/spreadsheets/d/1LFcXU1cBWtHVhkpvqZlG8snbZ2mKPTigiaEDMddobUQ/edit). Bảng dưới chỉ ghi lại quyết định đã chốt để không lệch với các mục 2 bên dưới.

| # | Task | Người phụ trách | Trạng thái |
|---|---|---|---|
| T1 | Tổ chức điều hướng theo dự án (= A1, xem mục ƯU TIÊN KẾ TIẾP ở trên) | Chưa phân công | Chờ quyết định |
| T2 | Khu quản trị hiện song song trong sidebar (= A2) | — | **Đã chốt: giữ nguyên tách riêng như hiện tại, không sửa** |
| T3 | Rà soát UX tổng thể, đánh dấu bảng kiểm kê nút bấm (= A3) | Việt | Đang làm |
| T4 | Quyết định mô hình phân quyền trong dự án (= B1+B2) | Chưa phân công | Chờ quyết định |
| T5 | Dự án "maintain" dài hạn (= B3) | — | **Đã hủy: bỏ khỏi phạm vi, không làm** |
| T6 | Fix BE: trả quyền theo dự án trong session + thêm `TASKS_REVIEW` (= B4) | Người dùng (chủ repo) | Đang làm — phụ thuộc T4 |

---

## 0. Bối cảnh góp ý gốc (tóm tắt, không diễn giải thêm)

- Web hiện "không thân thiện lắm, khó dùng".
- Việt đề nghị: ghi lại cụ thể từng nút chức năng đang có — vị trí, bấm vào thì thấy gì — để Việt sửa thiết kế dựa trên đó, không đoán.
- Ảnh tham khảo là dashboard của một tool khác (quản lý test automation nhiều dự án), dùng làm ví dụ cho cách tổ chức: dropdown chọn nhanh dự án (tìm theo tên/mã) ở góc trên-trái + khu riêng **SUPER ADMIN** ở cuối sidebar.
- Song song có tranh luận về mô hình phân quyền: nên để cứng như hiện tại hay thêm nhiều cấp (Admin quản Leader → 1 Leader giữ nhiều dự án → mỗi dự án có DevLead → DevLead chia tiếp), và dự án "maintain" (chạy nhiều năm) tính sao.

---

## 1. Kiểm kê giao diện hiện tại — trang Danh sách dự án (`/projects`) và vùng liên quan

*Lấy đúng từ code hiện có (`projects-page.tsx`, `workspace-overview.tsx`, `sidebar-content.tsx`, `app-shell.tsx`, `project-shell.tsx`), không suy đoán.*

| Vùng | Nút/Thành phần | Vị trí | Bấm vào thì thấy gì | Điều kiện hiển thị |
|---|---|---|---|---|
| Trang chủ (`/workspace`) | Thẻ dự án (tối đa 6) | Khối "Dự án của tôi" | Vào thẳng `/projects/:id` (tổng quan dự án) | Luôn hiện nếu có dự án đang tham gia |
| Trang chủ | Link "Xem tất cả dự án" | Cạnh tiêu đề khối | Sang `/projects` (danh sách đầy đủ) | Luôn hiện |
| Trang chủ | Nút "Mở bảng phân tích" | Header trang chủ | Sang `/dashboard` | Chỉ hiện nếu có quyền xem Analytics |
| `/projects` | Nút "Tạo dự án" | Góc phải header | Sang `/projects/new` (form tạo) | Chỉ hiện nếu có quyền `PROJECT_CREATE` |
| `/projects` | Ô tìm kiếm | Hàng filter | Lọc theo tên/mã dự án (gõ là lọc, có debounce qua URL) | Luôn hiện |
| `/projects` | Dropdown Trạng thái | Hàng filter | Lọc theo trạng thái dự án | Luôn hiện |
| `/projects` | Dropdown Đơn vị | Hàng filter | Lọc theo đơn vị (chỉ liệt kê đơn vị đang có trong trang hiện tại, không phải toàn hệ thống) | Luôn hiện |
| `/projects` | Tên dự án trong bảng | Cột "Dự án" | Vào `/projects/:id` | Luôn hiện |
| `/projects` | Nút "Xem dự án" | Cột "Hành động" | Vào `/projects/:id` (trùng hành động với click tên) | Luôn hiện |
| `/projects` | Phân trang | Chân bảng | Đổi trang, giữ nguyên bộ lọc trên URL | Khi > 1 trang |
| Trong 1 dự án (`/projects/:id`) | Tab "Tổng quan / Công việc / Thành viên / Lịch sử" | Header dự án | Chuyển view trong cùng dự án | Luôn hiện |
| Trong 1 dự án | Nút "Triển khai dự án" | Header dự án | Chuyển trạng thái Planned→Active | Chỉ hiện nếu có quyền quản lý dự án này + dự án đang ở trạng thái sửa được |
| Trong 1 dự án | Menu "⋯" (Chỉnh sửa kế hoạch / Kết thúc-hủy dự án) | Header dự án | Mở form sửa hoặc dialog kết thúc/hủy | Như trên |
| Sidebar (khu làm việc) | Mục nav chính | Cột trái | Điều hướng theo quyền từng mục (ẩn hẳn nếu không có quyền, không hiện mờ) | Theo quyền |
| Sidebar | "Gần đây" dưới mục Dự án | Trong mục nav Dự án | Tối đa 5 dự án/task vừa mở gần nhất | Chỉ khi đã từng mở |
| Sidebar | Khu Quản trị hệ thống | Route riêng `(admin)`, vào qua menu avatar | Đổi hẳn sang bộ menu khác (Quản lý người dùng, tổ chức...) có nút "Về không gian làm việc" để quay lại | Chỉ hiện mục vào nếu có quyền quản trị |

**Nhận xét khách quan (không phải đề xuất):** hệ thống **đã có** một dạng tách khu quản trị riêng (giống tinh thần "SUPER ADMIN" trong ảnh), nhưng phải **chuyển hẳn khu vực** qua menu avatar mới thấy, không nhìn thấy song song như ảnh tham khảo. Hệ thống **chưa có** ô chọn nhanh dự án (project switcher) hiện diện ở mọi trang — muốn vào 1 dự án cụ thể phải qua `/projects` rồi lọc/tìm, hoặc đã từng mở gần đây mới có trong "Gần đây".

---

## 2. Bảng yêu cầu thay đổi

| Mã | Hạng mục | Nội dung yêu cầu | Góp ý gốc | Đề xuất phương án | Ưu tiên | Phạm vi ảnh hưởng | Trạng thái |
|---|---|---|---|---|---|---|---|
| A1 | Điều hướng | Thêm ô chọn nhanh dự án (tìm theo tên/mã) hiển thị ở mọi trang trong khu làm việc, không chỉ ở `/projects` | "chia list dự án" + ảnh tham khảo | Thêm 1 dropdown nhỏ trong sidebar/topbar, tái dùng API `GET /projects` đã có (không cần endpoint mới), chỉ cần UI mới | Trung bình | Chỉ FE | Chờ quyết định |
| A2 | Điều hướng | Khu quản trị hiện song song (không phải chuyển hẳn khu vực) như ảnh tham khảo | Ảnh tham khảo (khu SUPER ADMIN) | Cân nhắc: giữ tách khu như hiện tại (đơn giản, đỡ rối) **hoặc** đẩy các mục quản trị hay dùng nhất xuống cuối sidebar chính | Thấp | Chỉ FE | ✅ **Đã chốt (02/11/2026): giữ nguyên tách riêng như hiện tại, không sửa** |
| A3 | UX tổng quát | "Không thân thiện, khó dùng" — nhưng chưa có phản hồi cụ thể là **màn nào, bước nào** gây khó | Việt nói chung chung, user cũng tự nhận "chưa đi làm, chưa biết design sao" | Dùng chính bảng mục 1 ở trên làm căn cứ: gửi cho Việt, để Việt đánh dấu trực tiếp nút nào nên bỏ/gộp/đổi vị trí thay vì đoán | Cao (chặn mọi việc sửa UI khác) | — | **Cần Việt phản hồi trước** |
| B1 | Phân quyền | Quyết định có thêm cấp vai trò mới trong dự án (kiểu "DevLead") hay không | "mỗi dự án lại có 1 devlead, devlead chia nhỏ chia nhỏ ra" vs "dự án thì 1 team thôi chứ" | **Phương án đề xuất:** không thêm cấp vai trò mới trong `ProjectRole`. Giữ `OWNER/MANAGER/MEMBER` (phẳng), vì: 1 người đã có thể giữ vai trò MANAGER ở **nhiều dự án cùng lúc** (đã đúng ý "1 leader cầm nhiều dự án", không cần vai trò hệ thống riêng); việc "chia nhỏ trong 1 dự án" nên dùng **Team** (đã có sẵn ở Tổ chức) gán vào từng Task, không cần thêm 1 tầng quyền mới. Phương án thay thế nếu vẫn muốn tường minh hơn: đổi tên `MANAGER`→`LEAD` trong `ProjectRole` cho đúng ngữ nghĩa, không đổi số lượng cấp | Cao (ảnh hưởng data model) | FE + BE (migration nếu đổi tên) | **Cần chốt trước khi code** |
| B2 | Phân quyền | Mô hình phân cấp nhiều tầng tự do kiểu cây tổ chức (Admin→Leader→DevLead→...) | Ý ban đầu của Việt | **Khuyến nghị: không làm** — tốn công BE (tính quyền đệ quy, thêm migration, thêm UI gán "ai báo cáo cho ai"), tăng diện test trong khi hệ thống đang chạy ổn với mô hình phẳng đã verify kỹ. Không có yêu cầu nghiệp vụ cụ thể nào bắt buộc phải phân cấp sâu như vậy | Thấp (không làm trừ khi có lý do nghiệp vụ rõ) | — | Đề xuất **từ chối**, chờ phản hồi |
| B3 | Phân quyền | Xử lý dự án "maintain" chạy nhiều năm | "có những dự án vài năm nma công việc là maintain" | Đây là vấn đề **vòng đời dự án**, không phải phân quyền | Trung bình | — | ❌ **Đã hủy (02/11/2026): bỏ khỏi phạm vi, không làm** |
| B4 | Phân quyền | Đã phát hiện trong phiên làm việc trước (không phải từ đoạn chat này): BE chưa trả quyền theo từng dự án trong session (`projectAccess[].permissions` luôn rỗng), thiếu mã quyền `TASKS_REVIEW` | — (ghi nhận kỹ thuật, liên quan trực tiếp tới B1) | Nên gộp xử lý cùng lúc với B1 vì cùng chạm vào `ProjectAccessDto`/model quyền theo dự án — tránh sửa 2 lần | Cao | BE chủ yếu | Đã ghi ở `docs/PROJECT_MAP.md` gap #21 |

---

## 3. Câu hỏi cần chốt trước khi giao việc code

1. **A3** — Việt có thể đánh dấu trực tiếp lên bảng mục 1 (nút nào bỏ/gộp/đổi chỗ) không, hay cần demo trực tiếp trên web đang chạy (`http://localhost:3000`) trước?
2. **A1** — có thật sự cần ô chọn nhanh dự án, hay 6 thẻ ở trang chủ + "Gần đây" trong sidebar đã đủ dùng?
3. **B1/B2** — chốt: giữ phẳng (đề xuất) hay vẫn muốn thêm cấp? Nếu giữ phẳng, có cần đổi tên `MANAGER`→`LEAD` hay giữ nguyên tên cũ cho đỡ phải sửa?
4. **B3** — dự án maintain có cần hiển thị khác dự án thường trong danh sách không (ví dụ 1 badge "Dài hạn"), hay chỉ cần nới hạn chót?
