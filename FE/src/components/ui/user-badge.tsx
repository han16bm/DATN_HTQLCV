import { Avatar } from "./avatar";
import Link from "next/link";
export function UserBadge({
  name,
  detail,
  avatarUrl,
  href,
}: {
  name: string;
  detail?: string;
  avatarUrl?: string | null;
  href?: string;
}) {
  const content = (
    <>
      <Avatar name={name} src={avatarUrl} />
      <span className="user-badge-info">
        <span>{name}</span>
        {detail && <span className="small muted">{detail}</span>}
      </span>
    </>
  );
  return href ? (
    <Link
      href={href}
      className="user-badge user-badge-link"
      aria-label={`Xem hồ sơ công khai của ${name}`}
    >
      {content}
    </Link>
  ) : (
    <span className="user-badge">{content}</span>
  );
}
