"use client";
import { label } from "@/lib/format";
import { confirmDiscard } from "@/lib/forms/confirm-discard";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ComponentProps, type ReactNode } from "react";
export function PageHeader({
  title,
  description,
  actions,
  status,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  status?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="page-title">
          <h1>{title}</h1>
          {status}
        </div>
        {description && <p className="muted">{description}</p>}
      </div>
      {actions && <div className="actions">{actions}</div>}
    </div>
  );
}
export function Panel({
  title,
  children,
  className = "",
  actions,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}) {
  return (
    <section className={`panel card ${className}`}>
      {(title || actions) && (
        <div className="panel-heading">
          {title && <h2>{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}
export function ButtonLink({
  href,
  children,
  primary = false,
}: {
  href: string;
  children: ReactNode;
  primary?: boolean;
}) {
  return (
    <Link className={`button ${primary ? "primary" : ""}`} href={href}>
      {children}
    </Link>
  );
}
export function DetailLink({
  href,
  label = "Xem chi tiết",
}: {
  href: string;
  label?: string;
}) {
  return (
    <Link href={href} className="detail-link" aria-label={label} title={label}>
      Chi tiết
    </Link>
  );
}
export function Empty({
  message = "Chưa có dữ liệu phù hợp trong phạm vi này.",
}: {
  message?: string;
}) {
  return (
    <div className="empty-state">
      <h2>Chưa có dữ liệu</h2>
      <p className="muted">{message}</p>
    </div>
  );
}
export function Badge({ value }: { value: string }) {
  return <span className={`badge ${value.toLowerCase()}`}>{label(value)}</span>;
}
export function DataTable({
  headers,
  rows,
  actions = false,
  className,
  title,
  headerActions,
  description,
  pagination,
}: {
  headers: string[];
  rows: ReactNode[][];
  actions?: boolean;
  className?: string;
  title?: string;
  headerActions?: ReactNode;
  description?: ReactNode;
  pagination?: ComponentProps<typeof Pagination>;
}) {
  return (
    <Panel title={title} actions={headerActions} className="table-card">
      {description && <div className="table-note">{description}</div>}
      <div className="table-scroll">
        <table className={className} aria-label={title}>
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th
                  key={i}
                  scope="col"
                  className={
                    actions && i === headers.length - 1
                      ? "table-actions"
                      : undefined
                  }
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td
                    key={j}
                    className={
                      actions && j === row.length - 1
                        ? "table-actions"
                        : undefined
                    }
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <Empty />}
      </div>
      <Pagination {...(pagination ?? { total: rows.length })} />
    </Panel>
  );
}
export function SectionSelect({
  items,
  active,
  label,
  suffix = "",
}: {
  items: { href: string; label: string }[];
  active: string;
  label: string;
  suffix?: string;
}) {
  const router = useRouter();
  return (
    <select
      className="section-select"
      aria-label={label}
      value={active}
      onChange={async (event) => {
        const href = event.currentTarget.value;
        if (await confirmDiscard()) router.push(href + suffix);
      }}
    >
      {items.map((i) => (
        <option key={i.href} value={i.href}>
          {i.label}
        </option>
      ))}
    </select>
  );
}
export function Pagination({
  page = 1,
  total,
  pageSize = total || 1,
  onPage,
}: {
  page?: number;
  pageSize?: number;
  total: number;
  onPage?: (page: number) => void;
}) {
  return (
    <div className="table-footer">
      <span className="small muted">{total} kết quả</span>
      {onPage && (total > pageSize || page > 1) && (
        <nav className="actions" aria-label="Phân trang">
          <button disabled={page <= 1} onClick={() => onPage(page - 1)}>
            Trước
          </button>
          <span aria-live="polite">{page}</span>
          <button
            disabled={page * pageSize >= total}
            onClick={() => onPage(page + 1)}
          >
            Sau
          </button>
        </nav>
      )}
    </div>
  );
}
