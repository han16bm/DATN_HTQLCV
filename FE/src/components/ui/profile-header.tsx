import { Avatar } from "./avatar";

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
    <section className="panel profile-header">
      <Avatar name={name} src={avatarUrl} large />
      <div className="profile-heading">
        <h2>{name}</h2>
        <p>{unit}</p>
        <span className="badge">{role}</span>
      </div>
    </section>
  );
}
