import { Avatar } from "./avatar";
import { Lozenge } from "./lozenge";
import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export function ProfileHeader({
  name,
  avatarUrl,
  unit,
  role,
  embedded = false,
  actions,
}: {
  name: string;
  avatarUrl?: string | null;
  unit: string;
  role: string;
  embedded?: boolean;
  actions?: ReactNode;
}) {
  const Tag = embedded ? "header" : "section";
  return (
    <Tag
      data-slot="panel"
      className={cn(
        "flex flex-wrap items-center gap-4",
        embedded ? "p-4 md:p-5" : "mb-5 rounded-lg border border-line bg-surface p-5",
      )}
    >
      <Avatar name={name} src={avatarUrl} size="lg" />
      <div className="grid min-w-0 gap-2">
        <h2 className="m-0 text-heading-md font-semibold text-fg">{name}</h2>
        <p className="m-0 text-sm text-fg-subtle">{unit}</p>
        <div>
          <Lozenge>{role}</Lozenge>
        </div>
      </div>
      {actions && <div className="ml-auto self-start">{actions}</div>}
    </Tag>
  );
}
