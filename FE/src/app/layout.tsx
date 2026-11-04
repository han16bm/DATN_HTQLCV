import { type Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { type ReactNode } from "react";
import "./globals.css";
import { Providers } from "./providers";

// Font tiếng Việt cho nhãn, bảng và nội dung dài; tự host cùng ứng dụng.
const font = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-app",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cổng công việc",
  description: "Quản lý công việc, dự án và phân tích tiến độ",
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" className={font.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
