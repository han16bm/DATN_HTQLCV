"use client";
import { canVisit } from "@/lib/auth/access";

import { PageSkeleton, Skeleton } from "@/components/ui/loading";
import {
  Badge,
  ButtonLink,
  DataTable,
  DetailLink,
  PageHeader,
} from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { useListReportsQuery } from "@/features/reports/hooks/use-reports-queries";
import { useListReviewQueueQuery } from "@/features/submissions/hooks/use-submissions-queries";
import { useListTasksQuery } from "@/features/tasks/hooks/use-tasks-queries";
import { useSession } from "@/lib/auth/session-context";
import { dateTime } from "@/lib/format";
import Link from "next/link";
import { useListProjectsQuery } from "../hooks/use-projects-queries";

export function WorkspaceOverview() {
  const { session } = useSession();
  const userId = session?.user.id ?? "";
  const canReview = canVisit(session?.user.systemRole, "/reviews");
  const projects = useListProjectsQuery({ pageSize: 4 });
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
    { title: "Dự án", query: projects, href: "/projects", action: "Xem dự án" },
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
        title={`Chào ${session?.user.displayName.split(" ").at(-1) ?? "bạn"},`}
        actions={
          <>
            {canVisit(session?.user.systemRole, "/dashboard") && (
              <ButtonLink href="/dashboard" primary>
                Mở bảng tổng quan
              </ButtonLink>
            )}
            <ButtonLink href="/reports/new">Lập báo cáo</ButtonLink>
          </>
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
      {projects.isError ? (
        <QueryErrorState error={projects.error} />
      ) : !projects.data ? (
        <PageSkeleton variant="cards" />
      ) : (
        <DataTable
          title="Dự án đang theo dõi"
          headerActions={<ButtonLink href="/projects">Tất cả dự án</ButtonLink>}
          actions
          headers={[
            "Dự án",
            "Người phụ trách",
            "Trạng thái",
            "Hạn hoàn thành",
            "Hành động",
          ]}
          rows={projects.data.items.map((p) => [
            p.name,
            p.owner.displayName,
            <Badge key="status" value={p.status} />,
            dateTime(p.dueAt),
            <DetailLink
              key="detail"
              href={`/projects/${p.id}`}
              label={`Xem dự án ${p.name}`}
            />,
          ])}
        />
      )}
    </>
  );
}
