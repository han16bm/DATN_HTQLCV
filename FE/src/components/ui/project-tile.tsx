import { cn } from "@/lib/cn";
import {
  Blocks,
  BriefcaseBusiness,
  FolderKanban,
  Layers3,
  PanelsTopLeft,
  SquareChartGantt,
  Target,
  Workflow,
} from "lucide-react";

const icons = [
  FolderKanban,
  Layers3,
  Workflow,
  Blocks,
  Target,
  PanelsTopLeft,
  BriefcaseBusiness,
  SquareChartGantt,
];
const fills = [
  "bg-[#3a58c8]",
  "bg-[#6b4fc7]",
  "bg-[#1f7a52]",
  "bg-[#c25100]",
  "bg-[#b3322a]",
  "bg-[#1f6f86]",
  "bg-[#8a6700]",
  "bg-[#5e4db2]",
];
export function toneOf(text: string) {
  let hash = 0;
  for (const char of text) hash = (hash * 31 + char.charCodeAt(0)) % 997;
  return hash % icons.length;
}
export function ProjectTile({
  id,
  small = false,
}: {
  id: string;
  small?: boolean;
}) {
  // Biểu tượng trang trí ổn định theo ID, không cần thêm trường vào response.
  const tone = toneOf(id);
  const Icon = icons[tone];
  return (
    <span
      className={cn(
        "inline-grid shrink-0 place-items-center text-white",
        small ? "size-7 rounded" : "size-9 rounded-md",
        fills[tone],
      )}
      aria-hidden="true"
    >
      <Icon size={small ? 15 : 20} strokeWidth={1.8} />
    </span>
  );
}
