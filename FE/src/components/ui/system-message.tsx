import Link from "next/link";
export function SystemMessage({
  code,
  title,
  description,
  children,
}: {
  code: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="system-message">
      <p className="eyebrow">{code}</p>
      <h1>{title}</h1>
      <p className="muted">{description}</p>
      <div className="actions section-gap">
        <Link className="button primary" href="/workspace">
          Về không gian làm việc
        </Link>
        {children}
      </div>
    </section>
  );
}
