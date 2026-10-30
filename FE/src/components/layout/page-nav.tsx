"use client";
import { trailFor } from "@/lib/navigation";
import { useUI } from "@/stores/ui-store";
import { ArrowLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Fragment } from "react";

// Breadcrumb và nút Quay lại dùng chung cho mọi trang con, tính từ URL hiện tại.
export function PageNav() {
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
    <nav className="page-nav" aria-label="Vị trí hiện tại">
      <ol className="breadcrumb">
        {trail.crumbs.map((crumb, index) => {
          const last = index === trail.crumbs.length - 1;
          return (
            <Fragment key={index}>
              <li className={last ? "current" : undefined}>
                {crumb.href && !last ? (
                  <Link href={crumb.href}>{crumb.label}</Link>
                ) : (
                  <span aria-current={last ? "page" : undefined}>
                    {crumb.label}
                  </span>
                )}
              </li>
              {!last && (
                <li className="crumb-separator" aria-hidden="true">
                  <ChevronRight size={13} />
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
      <Link className="back-link" href={trail.back}>
        <ArrowLeft size={15} aria-hidden="true" />
        Quay lại
      </Link>
    </nav>
  );
}
