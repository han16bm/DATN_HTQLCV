import { type Metadata } from "next";
import {
  Be_Vietnam_Pro,
  Inter,
  Noto_Sans,
  Open_Sans,
  Roboto,
  Source_Sans_3,
} from "next/font/google";
import { type ReactNode } from "react";
import { preferencesBootScript } from "@/stores/preferences-store";
import "./globals.css";
import { Providers } from "./providers";

const beVietnam = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-be-vietnam",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
  preload: false,
});
const noto = Noto_Sans({
  subsets: ["latin", "vietnamese"],
  variable: "--font-noto",
  display: "swap",
  preload: false,
});
const roboto = Roboto({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
  display: "swap",
  preload: false,
});
const source = Source_Sans_3({
  subsets: ["latin", "vietnamese"],
  variable: "--font-source",
  display: "swap",
  preload: false,
});
const openSans = Open_Sans({
  subsets: ["latin", "vietnamese"],
  variable: "--font-open-sans",
  display: "swap",
  preload: false,
});
const fontVariables = [beVietnam, inter, noto, roboto, source, openSans]
  .map((font) => font.variable)
  .join(" ");

export const metadata: Metadata = {
  title: "Cổng công việc",
  description: "Quản lý công việc, dự án và phân tích tiến độ",
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: preferencesBootScript }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
