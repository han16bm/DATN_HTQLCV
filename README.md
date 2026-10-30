# DATN

**Hệ thống quản lý công việc và dự án tích hợp AI trong phân tích tiến độ và hỗ trợ quản trị hiệu suất nhân sự.**

Frontend đặt tại [`FE/`](FE/), sử dụng Next.js App Router, TypeScript strict, Tailwind CSS, React Hook Form, Zod, Zustand và TanStack Query. API được gọi qua HTTP; MSW chặn request trong development/test để làm việc với dữ liệu giả lập.

## Chạy frontend

```bash
cd FE
npm install
npm run dev
```

Mở `http://localhost:3000`. Hướng dẫn tài khoản development, cấu hình API và kiểm tra tại [FE/README.md](FE/README.md).

## Tài liệu

- [Bản đồ dự án (FE + BE, trạng thái, lỗi đã biết, kế hoạch)](docs/PROJECT_MAP.md)
- [Database (PostgreSQL): cấu trúc bảng, dựng bằng Docker, áp migration](docs/DATABASE.md)
- [Đặc tả frontend](FE/fe-specs/README.md)
- [Kiến trúc frontend](FE/docs/ARCHITECTURE.md)
- [Rà soát đặc tả](FE/docs/SPEC_REVIEW.md)
- [Trạng thái triển khai và phần còn lại](FE/docs/IMPLEMENTATION_STATUS.md)

Đã triển khai các luồng chính S01–S43 và 79 API mock qua HTTP/MSW. AI hiện là diễn giải mô phỏng; browser QA và tích hợp BE thật được theo dõi trong tài liệu trạng thái.
