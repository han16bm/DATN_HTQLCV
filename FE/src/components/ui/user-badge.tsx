import Link from "next/link";
import { Avatar } from "./avatar";

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
      <span className="grid min-w-0 leading-snug">
        <span className="break-words group-hover:text-selected-fg group-hover:underline">
          {name}
        </span>
        {detail && <span className="text-xs text-fg-subtle">{detail}</span>}
      </span>
    </>
  );
  return href ? (
    <Link
      href={href}
      className="group inline-flex min-w-0 items-center gap-2"
      aria-label={`Xem hồ sơ công khai của ${name}`}
    >
      {content}
    </Link>
  ) : (
    <span className="inline-flex min-w-0 items-center gap-2">{content}</span>
  );
}
