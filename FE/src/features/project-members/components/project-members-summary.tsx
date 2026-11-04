"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/loading";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { SlidePanel } from "@/components/ui/slide-panel";
import { UserBadge } from "@/components/ui/user-badge";
import { useHashDialog } from "@/lib/forms/use-hash-dialog";
import { useListProjectMembersQuery } from "../hooks/use-project-members-queries";
import { ProjectMembersPage } from "./project-members-page";

export function ProjectMembersSummary({ projectId }: { projectId: string }) {
  // Dùng chung cache với bộ lọc người thực hiện của danh sách công việc.
  const query = useListProjectMembersQuery(projectId, { pageSize: 100 });
  const dialog = useHashDialog();
  const open = ["members", "add-member", "member-role", "end-member"].includes(
    dialog.name,
  );
  return (
    <section id="members" aria-label="Thành viên dự án" className="min-w-0">
      <header className="mb-3 flex min-h-8 items-center justify-between gap-2">
        <h2 className="m-0 text-heading-sm font-semibold text-fg">
          Thành viên dự án
        </h2>
        <Button variant="subtle" onClick={() => dialog.open("members")}>
          Chi tiết
        </Button>
      </header>
      <div
        className="rounded-lg border border-line bg-surface p-3"
        aria-busy={query.isFetching || undefined}
      >
        {query.isError ? (
          <QueryErrorState error={query.error} retry={query.refetch} />
        ) : !query.data ? (
          <div
            role="status"
            aria-label="Đang tải thành viên"
            className="grid gap-3"
          >
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="size-7 shrink-0 rounded-full" />
                <Skeleton className="w-3/5" />
              </div>
            ))}
          </div>
        ) : query.data.items.length ? (
          <ul className="m-0 grid list-none gap-3 p-0">
            {query.data.items.slice(0, 5).map((member) => (
              <li key={member.id}>
                <UserBadge
                  name={member.user.displayName}
                  href={`/users/${encodeURIComponent(member.user.id)}`}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="m-0 text-sm text-fg-subtle">Chưa có thành viên.</p>
        )}
      </div>
      <SlidePanel
        size="md"
        open={open}
        onOpenChange={(value) => {
          if (!value) dialog.close();
        }}
        title="Thành viên dự án"
        closeLabel="Đóng danh sách thành viên"
      >
        <ProjectMembersPage projectId={projectId} inDrawer />
      </SlidePanel>
    </section>
  );
}
