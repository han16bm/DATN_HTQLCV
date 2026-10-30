"use client";

import { SectionNav } from "@/components/ui/page";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/dashboard", label: "Tổng quan", scoped: true },
  { href: "/analytics/risks", label: "Nguy cơ trễ hạn", scoped: true },
  { href: "/analytics/workload", label: "Khối lượng", scoped: true },
  { href: "/analytics/bottlenecks", label: "Điểm nghẽn", scoped: true },
  { href: "/analytics/summary", label: "Tổng hợp", scoped: true },
  { href: "/alerts", label: "Cảnh báo", scoped: false },
];

// Các màn phân tích và cảnh báo dùng chung một dải tab; phạm vi lọc (suffix)
// được giữ khi chuyển giữa các tab phân tích.
export function AnalyticsTabs({ suffix = "" }: { suffix?: string }) {
  const path = usePathname();
  return (
    <SectionNav
      label="Mục phân tích"
      items={tabs.map((tab) => ({
        href: tab.scoped ? tab.href + suffix : tab.href,
        label: tab.label,
        active: path === tab.href,
      }))}
    />
  );
}
