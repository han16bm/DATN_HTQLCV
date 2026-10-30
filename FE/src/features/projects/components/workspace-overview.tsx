"use client";
import { canVisit } from "@/lib/auth/access";

import { PageSkeleton, Skeleton } from "@/components/ui/loading";
import { Badge, ButtonLink, PageHeader } from "@/components/ui/page";
import { ProjectTile } from "@/components/ui/project-tile";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { useListReportsQuery } from "@/features/reports/hooks/use-reports-queries";
import { useListReviewQueueQuery } from "@/features/submissions/hooks/use-submissions-queries";
import { useListTasksQuery } from "@/features/tasks/hooks/use-tasks-queries";
import { useSession } from "@/lib/auth/session-context";
import { dateTime } from "@/lib/format";
import Link from "next/link";
import type { ReactNode } from "react";
import { useListProjectsQuery } from "../hooks/use-projects-queries";

export function WorkspaceOverview({ children }: { children?: ReactNode }) {
  const { session } = useSession();
  const userId = session?.user.id ?? "";
  const canReview = canVisit(session, "/reviews");
  const projects = useListProjectsQuery({ pageSize: 6 });
  const drafts = useListReportsQuery({
    authorId: userId,
    status: "DRAFT",
    pageSize: 1,
  });
  const reviews = useListReviewQueueQuery(
    { pageSize: 1 },
    { enabled: canReview },
  );
  const overdue = useListTasksQuery({
    assigneeId: userId,
    overdue: true,
    pageSize: 1,
  });
  const cards = [
    {
      title: "Báo cáo nháp",
      query: drafts,
      href: `/reports?status=DRAFT&authorId=${userId}`,
      action: "Tiếp tục báo cáo",
    },
    ...(canReview
      ? [
          {
            title: "Chờ nghiệm thu",
            query: reviews,
            href: "/reviews",
            action: "Mở hàng chờ",
          },
        ]
      : []),
    {
      title: "Công việc quá hạn",
      query: overdue,
      href: `/tasks?overdue=true&assigneeId=${userId}`,
      action: "Xem công việc",
    },
  ];
  return (
    <>
      <PageHeader
        title="Công việc của tôi"
        description={`Xin chào, ${session?.user.displayName ?? "bạn"}`}
        actions={
          canVisit(session, "/dashboard") && (
            <ButtonLink href="/dashboard">Mở bảng phân tích</ButtonLink>
          )
        }
      />
      <section className="overview-stats" aria-label="Số liệu cá nhân">
        {cards.map(({ title, query, href, action }) => (
          <Link
            className="overview-stat"
            href={href}
            key={title}
            aria-busy={query.isPending}
          >
            <span>{title}</span>
            <strong>
              {query.isPending ? (
                <Skeleton className="skeleton-count" />
              ) : (
                (query.data?.pagination.total ?? "—")
              )}
            </strong>
            <span
              className={`small ${query.isError ? "field-error" : "muted"}`}
            >
              {query.isError ? "Không tải được số liệu" : action}
            </span>
          </Link>
        ))}
      </section>
      <div className={children ? "workspace-grid" : undefined}>
        {children && <section className="workspace-tasks">{children}</section>}
        <aside className="workspace-projects" aria-label="Dự án của tôi">
          {projects.isError ? (
            <QueryErrorState error={projects.error} />
          ) : !projects.data ? (
            <PageSkeleton variant="cards" />
          ) : (
            <section
              className="recent-projects"
              aria-labelledby="recent-projects"
            >
              <div className="section-title">
                <h2 id="recent-projects">Dự án của tôi</h2>
                <Link className="text-link" href="/projects">
                  Xem tất cả dự án
                </Link>
              </div>
              {projects.data.items.length ? (
                <ul className="project-cards">
                  {projects.data.items.map((p) => (
                    <li key={p.id}>
                      <Link className="project-card" href={`/projects/${p.id}`}>
                        <ProjectTile id={p.id} />
                        <span className="project-card-info">
                          <strong>{p.name}</strong>
                          <span className="small muted">{p.unit.name}</span>
                          <span className="small muted">
                            Hạn {dateTime(p.dueAt)}
                          </span>
                        </span>
                        <Badge value={p.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">Bạn chưa tham gia dự án nào.</p>
              )}
            </section>
          )}
        </aside>
      </div>
    </>
  );
}
