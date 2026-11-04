import { Avatar } from "./avatar";
import { Lozenge } from "./lozenge";

export function ProfileHeader({
  name,
  avatarUrl,
  unit,
  role,
}: {
  name: string;
  avatarUrl?: string | null;
  unit: string;
  role: string;
}) {
  return (
    <section
      data-slot="panel"
      className="mb-5 flex flex-wrap items-center gap-4 rounded-lg border border-line bg-surface p-5"
    >
      <Avatar name={name} src={avatarUrl} large />
      <div className="grid min-w-0 gap-2">
        <h2 className="m-0 text-heading-md font-semibold text-fg">{name}</h2>
        <p className="m-0 text-sm text-fg-subtle">{unit}</p>
        <div>
          <Lozenge>{role}</Lozenge>
        </div>
      </div>
    </section>
  );
}
