"use client";
import { trailFor } from "@/lib/navigation";
import { useUI } from "@/stores/ui-store";
import { ArrowLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Fragment } from "react";

export function BreadcrumbTrail() {
  const pathname = usePathname();
  const search = useSearchParams();
  const labels = useUI((s) => s.labels);
  const listUrls = useUI((s) => s.listUrls);
  const previous = useUI((s) => s.previousUrl);
  const trail = trailFor({
    pathname,
    search: new URLSearchParams(search),
    entity: (kind, id) => labels[`${kind}:${id}`],
    list: (path) => listUrls[path],
    previous,
  });
  if (!trail) return null;
  return (
    <nav
      aria-label="Vị trí hiện tại"
      className="mb-4 grid min-w-0 justify-items-start gap-2 text-sm"
    >
      <ol className="m-0 flex min-w-0 flex-wrap items-center gap-1 p-0 text-fg-subtlest">
        {trail.crumbs.map((crumb, index) => {
          const last = index === trail.crumbs.length - 1;
          return (
            <Fragment key={index}>
              <li
                className={
                  last
                    ? "flex min-w-0 items-center text-fg"
                    : "hidden min-w-0 items-center md:flex"
                }
              >
                {crumb.href && !last ? (
                  <Link
                    href={crumb.href}
                    title={crumb.label}
                    className="max-w-[28ch] truncate rounded-sm hover:text-fg hover:underline"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    aria-current={last ? "page" : undefined}
                    title={crumb.label}
                    className="max-w-[36ch] truncate"
                  >
                    {crumb.label}
                  </span>
                )}
              </li>
              {!last && (
                <li aria-hidden="true" className="hidden items-center md:flex">
                  <ChevronRight className="size-3.5" />
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
      <Link
        href={trail.back}
        className="inline-flex min-h-7 items-center gap-1 rounded-md px-2 font-medium text-fg-subtle transition-colors hover:bg-hover hover:text-fg active:bg-pressed pointer-coarse:min-h-11"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Quay lại
      </Link>
    </nav>
  );
}
