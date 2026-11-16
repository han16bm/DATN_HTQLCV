import Link from "next/link";
import { buttonClass } from "./button";

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
    <section className="mx-auto mt-[10vh] max-w-xl rounded-xl border border-line bg-surface p-6">
      <p className="m-0 text-xs font-semibold tracking-wide text-fg-subtlest">
        {code}
      </p>
      <h1 className="mt-1 mb-0 text-heading-lg font-semibold text-fg">
        {title}
      </h1>
      <p className="mt-1.5 mb-0 text-sm text-fg-subtle">{description}</p>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Link className={buttonClass("primary")} href="/workspace">
          Về không gian làm việc
        </Link>
        {children}
      </div>
    </section>
  );
}
