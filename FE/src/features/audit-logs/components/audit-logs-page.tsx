"use client";

import {
  DialogFooter,
  EntityDialog,
  RowDialogLinks,
} from "@/components/ui/entity-dialog";
import { PageSkeleton } from "@/components/ui/loading";
import { DataTable, PageHeader } from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { UserBadge } from "@/components/ui/user-badge";
import { useListUsersQuery } from "@/features/users/hooks/use-users-queries";
import { hasPermission } from "@/lib/auth/access";
import { useSession } from "@/lib/auth/session-context";
import { dateTime, entityTypeLabel } from "@/lib/format";
import { useEntityDialog } from "@/lib/forms/use-entity-dialog";
import { useUrlFilters } from "@/lib/query/use-url-filters";
import {
  useGetAuditLogQuery,
  useListAuditLogsQuery,
  useListEntityTypesQuery,
} from "../hooks/use-audit-logs-queries";
import type { AuditLogDto } from "../types/audit-logs.types";

// Ngày chọn trên form là ngày Việt Nam; API nhận mốc thời gian ISO.
const dayStart = (day: string) =>
  day ? new Date(`${day}T00:00:00+07:00`).toISOString() : undefined;
const dayEnd = (day: string) =>
  day ? new Date(`${day}T23:59:59.999+07:00`).toISOString() : undefined;

export function AuditLogsPage() {
  const filter = useUrlFilters();
  const { session } = useSession();
  const query = useListAuditLogsQuery({
    page: filter.page,
    q: filter.get("q") || undefined,
    entityType: filter.get("entityType") || undefined,
    actorId: filter.get("actorId") || undefined,
    action: filter.get("action") || undefined,
    from: dayStart(filter.get("from")),
    to: dayEnd(filter.get("to")),
  });
  const types = useListEntityTypesQuery();
  // Danh sách người thao tác cần USERS_MANAGE; thiếu quyền thì ẩn bộ lọc này.
  const users = useListUsersQuery(
    { pageSize: 100 },
    { enabled: hasPermission(session, "USERS_MANAGE") },
  );
  const dialog = useEntityDialog();
  return (
    <>
      <PageHeader title="Nhật ký hệ thống" />
      <section className="panel filters">
        <label>
          Tìm kiếm
          <input
            type="search"
            placeholder="Mã đối tượng, hành động hoặc lý do"
            value={filter.get("q")}
            onChange={(e) => filter.set("q", e.target.value)}
          />
        </label>
        <label>
          Từ ngày
          <input
            type="date"
            value={filter.get("from")}
            onChange={(e) => filter.set("from", e.target.value)}
          />
        </label>
        <label>
          Đến ngày
          <input
            type="date"
            value={filter.get("to")}
            onChange={(e) => filter.set("to", e.target.value)}
          />
        </label>
        <label>
          Loại đối tượng
          <select
            value={filter.get("entityType")}
            onChange={(e) => filter.set("entityType", e.target.value)}
          >
            <option value="">Tất cả</option>
            {types.data?.map((type) => (
              <option key={type} value={type}>
                {entityTypeLabel(type)}
              </option>
            ))}
          </select>
        </label>
        {users.data && (
          <label>
            Người thao tác
            <select
              value={filter.get("actorId")}
              onChange={(e) => filter.set("actorId", e.target.value)}
            >
              <option value="">Tất cả</option>
              <option value="SYSTEM">Hệ thống</option>
              {users.data.items.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.displayName}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          Hành động
          <input
            type="search"
            placeholder="Đúng tên hành động"
            value={filter.get("action")}
            onChange={(e) => filter.set("action", e.target.value)}
          />
        </label>
      </section>
      {query.isError ? (
        <QueryErrorState error={query.error} retry={query.refetch} />
      ) : !query.data ? (
        <PageSkeleton variant="table" />
      ) : (
        <DataTable
          actions
          widths={[16, 20, 22, 24, 8, 10]}
          headers={[
            "Thời điểm",
            "Người thao tác",
            "Đối tượng",
            "Hành động",
            "Lý do",
            "Chi tiết",
          ]}
          rows={query.data.items.map((item) => [
            dateTime(item.at),
            <UserBadge key="actor" name={item.actor.label} />,
            <span key="entity">
              {entityTypeLabel(item.entityType)}
              <span className="small muted"> · {item.entityId}</span>
            </span>,
            item.action,
            item.reason ? (
              <span key="reason" title={item.reason}>
                Có
              </span>
            ) : (
              "—"
            ),
            <RowDialogLinks
              key="detail"
              name={`chi tiết: ${item.action}`}
              view={dialog.href("view", item.id)}
            />,
          ])}
          pagination={{
            ...query.data.pagination,
            onPage: (p) => filter.set("page", String(p)),
          }}
        />
      )}
      {dialog.mode === "view" && (
        <EntityDialog
          open
          size="lg"
          title="Chi tiết nhật ký"
          onClose={dialog.close}
        >
          <AuditLogDetail auditLogId={dialog.id} />
          <DialogFooter>
            <button type="button" onClick={dialog.close}>
              Đóng
            </button>
          </DialogFooter>
        </EntityDialog>
      )}
    </>
  );
}

function AuditLogDetail({ auditLogId }: { auditLogId: string }) {
  const query = useGetAuditLogQuery(auditLogId);
  if (query.isError)
    return <QueryErrorState error={query.error} retry={query.refetch} />;
  if (!query.data) return <PageSkeleton variant="form" />;
  const item = query.data;
  return (
    <>
      <h3>{item.action}</h3>
      <div className="history-detail-meta">
        <UserBadge name={item.actor.label} />
        <time className="small muted" dateTime={item.at}>
          {dateTime(item.at)}
        </time>
      </div>
      <p className="small muted">
        {entityTypeLabel(item.entityType)} · {item.entityId}
      </p>
      {item.reason && <p className="preserve-lines small">{item.reason}</p>}
      <FieldDiff before={item.before} after={item.after} />
    </>
  );
}

type Json = AuditLogDto["before"];
const fieldsOf = (value: Json): Record<string, Json> =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};
function text(value: Json | undefined) {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

// So sánh trước/sau theo từng field; field thay đổi được tô nổi.
function FieldDiff({ before, after }: { before: Json; after: Json }) {
  const previous = fieldsOf(before);
  const next = fieldsOf(after);
  const keys = [...new Set([...Object.keys(previous), ...Object.keys(next)])];
  if (!keys.length)
    return <p className="muted small">Không có dữ liệu trước/sau.</p>;
  return (
    <div className="audit-changes">
      <dl>
        {keys.map((key) => {
          const changed =
            JSON.stringify(previous[key]) !== JSON.stringify(next[key]);
          return (
            <div key={key} className={changed ? "changed" : undefined}>
              <dt>{key}</dt>
              <dd>
                <span className="small muted">Trước</span>
                {text(previous[key])}
              </dd>
              <dd>
                <span className="small muted">Sau</span>
                {text(next[key])}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
