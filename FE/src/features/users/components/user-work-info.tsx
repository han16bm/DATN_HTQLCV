import { Lozenge } from "@/components/ui/lozenge";
import { KeyValue, KeyValueList } from "@/components/patterns/key-value";
import { linkClass } from "@/components/ui/page";
import { label } from "@/lib/format";
import Link from "next/link";
import type { UserDto } from "../types/users.types";

export function UserWorkInfo({
  unit,
  systemRole,
  teams,
  projects,
}: { unit: string } & Pick<UserDto, "systemRole" | "teams" | "projects">) {
  return (
    <div className="grid min-w-0 gap-4">
      <KeyValueList compact>
        <KeyValue label="Bộ phận">{unit}</KeyValue>
        <KeyValue label="Vị trí">{label(systemRole)}</KeyValue>
      </KeyValueList>
      <section aria-label="Nhóm nhân sự">
        <h3 className="m-0 mb-2 text-sm font-medium text-fg">Nhóm nhân sự</h3>
        {teams.length ? (
          <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
            {teams.map((team) => (
              <li key={team.id}><Lozenge>{team.name}</Lozenge></li>
            ))}
          </ul>
        ) : (
          <p className="m-0 text-sm text-fg-subtle">Chưa tham gia nhóm nào.</p>
        )}
      </section>
      <section aria-label="Dự án đang tham gia">
        <h3 className="m-0 mb-2 text-sm font-medium text-fg">Dự án đang tham gia</h3>
        {projects.length ? (
          <ul className="m-0 grid list-none gap-2 p-0">
            {projects.map((project) => (
              <li key={project.id} className="min-w-0 text-sm break-words">
                <Link href={`/projects/${encodeURIComponent(project.id)}`} className={linkClass}>
                  {project.name}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="m-0 text-sm text-fg-subtle">Chưa tham gia dự án nào.</p>
        )}
      </section>
    </div>
  );
}
