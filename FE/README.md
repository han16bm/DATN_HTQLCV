# Cổng công việc — Frontend

Next.js App Router, TypeScript strict, Tailwind CSS, React Hook Form, Zod, Zustand và TanStack Query. API qua fetch HTTP; MSW intercept request trong development/test.

```powershell
cd D:\DATN\FE
npm install
npm run dev
```

Mở `http://localhost:3000`. Tài khoản development: `minh`, `lan`, `huy`, `admin`; mật khẩu `Mock@12345`. Dữ liệu giả lập reset khi reload. Admin quản trị tài khoản không tự có quyền công việc dự án.

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

`npm run contracts` sinh schema, contract, service, query key và hook theo đặc tả 0.3.0. File Generated được sửa qua generator/nguồn, không sửa riêng lẻ.

- [Kiến trúc tham khảo vietcd/frontend](docs/ARCHITECTURE.md)
- [Kết quả đọc fe-specs và các điểm cần chốt](docs/SPEC_REVIEW.md)
- [Trạng thái thực tế và phần chưa triển khai](docs/IMPLEMENTATION_STATUS.md)
- [Đặc tả FE gốc](fe-specs/README.md)

Đổi `NEXT_PUBLIC_API_ORIGIN` và tắt `NEXT_PUBLIC_API_MOCKING` khi nối Gateway thật. Production không bật MSW. Bản hiện tại là nền kiến trúc và một số màn/luồng đầu tiên; chưa hoàn thành toàn bộ 43 màn.
