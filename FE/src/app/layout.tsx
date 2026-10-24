import { type Metadata } from "next";
import { type ReactNode } from "react";
import "./globals.css";
import { Providers } from "./providers";
export const metadata: Metadata = {
  title: "Cổng công việc",
  description: "Quản lý công việc, dự án và phân tích tiến độ",
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
