# Cổng công việc — Frontend

Next.js App Router, TypeScript strict, Tailwind CSS, React Hook Form, Zod, Zustand và TanStack Query. API qua Axios HTTP; chế độ mock dùng MSW để chặn request.

```powershell
cd D:\DATN\FE
npm install
Copy-Item .env.example .env
npm run dev
```

Mở `http://localhost:3000`. Tài khoản development: `minh`, `lan`, `huy`, `admin`; mật khẩu `Mock@12345`. Dữ liệu giả lập reset khi reload. Admin quản trị tài khoản không tự có quyền công việc dự án.

Seed dùng mốc máy chủ thử nghiệm 23/10/2026 để lặp lại các ca tiến độ/deadline. Khi thử ghi giờ hoặc lập báo cáo, chọn ngày/kỳ phù hợp với mốc dữ liệu này.

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

Code được tổ chức theo feature: `api` chứa service HTTP và query key; `hooks` dùng React Query trực tiếp; `schemas` chứa validation; `types` chứa kiểu dữ liệu; `components` chia theo từng màn. Sửa trực tiếp các file này khi thay đổi API hoặc nghiệp vụ.

Luồng dữ liệu: component → hook → service → HTTP → MSW handler → DB tạm. Handler parse request và định dạng response; CRUD, quyền, trạng thái và audit nằm trong `mocks/db.ts`, seed/policy nằm trong `mocks/data.json`.

- [Kiến trúc tham khảo vietcd/frontend](docs/ARCHITECTURE.md)
- [Kết quả đọc fe-specs và các điểm cần chốt](docs/SPEC_REVIEW.md)
- [Trạng thái thực tế và phần chưa triển khai](docs/IMPLEMENTATION_STATUS.md)
- [Đặc tả FE gốc](fe-specs/README.md)

Đã nối các luồng chính S01–S43 với 83 HTTP route và 82 hàm service. Đăng nhập `minh` để quản lý dự án/nghiệm thu/phân tích; `lan`, `huy` để thực hiện công việc; `admin` để quản trị tài khoản/tổ chức.

Chỉnh `.env` để chuyển chế độ:

```dotenv
# mock: MSW chặn HTTP; http: gọi backend
NEXT_PUBLIC_API_MODE=mock
NEXT_PUBLIC_API_BASE_URL=/api
NEXT_PUBLIC_MSW_DELAY=400
```

Khi nối Gateway thật, đặt `NEXT_PUBLIC_API_MODE=http` và `NEXT_PUBLIC_API_BASE_URL` bằng URL đầy đủ, ví dụ `http://localhost:8080/api`. Không dùng `.env.development`; khởi động lại dev server sau khi sửa `.env`, hoặc build lại khi chạy production. Cả hai chế độ đều dùng cùng Axios client, không gọi trực tiếp mock DB. AI hiện dùng diễn giải mô phỏng; browser QA và các phần cần BE xác nhận được ghi trong tài liệu trạng thái.
