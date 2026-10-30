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
      className={`project-tile tone-${tone}${small ? " small-tile" : ""}`}
      aria-hidden="true"
    >
      <Icon size={small ? 16 : 22} strokeWidth={1.8} />
    </span>
  );
}
