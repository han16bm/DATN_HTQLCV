"use client";
import { label } from "@/lib/format";
import Link from "next/link";
import { type ComponentProps, type ReactNode } from "react";
export function PageHeader({
  title,
  description,
  actions,
  status,
  navigation,
  level = 1,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  status?: ReactNode;
  navigation?: ReactNode;
  // Phần con trong trang (ví dụ công việc cá nhân ở trang chủ) dùng h2.
  level?: 1 | 2;
}) {
  const Heading = level === 1 ? "h1" : "h2";
  return (
    <header className={level === 1 ? "page-heading" : "page-heading section"}>
      <div className="page-title">
        <Heading>{title}</Heading>
      </div>
      {actions && <div className="actions">{actions}</div>}
      {status && <div className="page-status">{status}</div>}
      {description && <p className="muted">{description}</p>}
      {navigation && <div className="page-header-nav">{navigation}</div>}
    </header>
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
    <section className={`panel ${className}`}>
      {(title || actions) && (
        <div className="panel-heading">
          {title && <h2>{title}</h2>}
          {actions}
        </div>
      )}
      <div className="panel-body card">{children}</div>
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
  message = "Chưa tìm thấy kết quả. Hãy thử điều chỉnh bộ lọc.",
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
export function StatusField({
  label = "Trạng thái",
  value,
}: {
  label?: string;
  value: string;
}) {
  return (
    <span className="status-field">
      <span>{label}:</span>
      <Badge value={value} />
    </span>
  );
}
export function DataTable({
  headers,
  rows,
  actions = false,
  title,
  headerActions,
  description,
  pagination,
  widths,
}: {
  headers: string[];
  rows: ReactNode[][];
  actions?: boolean;
  title?: string;
  headerActions?: ReactNode;
  description?: ReactNode;
  pagination?: ComponentProps<typeof Pagination>;
  widths?: number[];
}) {
  return (
    <section className="data-table" data-columns={headers.length}>
      {(title || headerActions) && (
        <div className="table-heading">
          {title && <h2>{title}</h2>}
          {headerActions && <div className="actions">{headerActions}</div>}
        </div>
      )}
      <div className="table-card">
        {description && <div className="table-note">{description}</div>}
        <div
          className="table-scroll"
          tabIndex={0}
          role="region"
          aria-label={title ?? "Bảng dữ liệu"}
        >
          <table aria-label={title} data-columns={headers.length}>
            {widths && (
              <colgroup>
                {widths.map((width, index) => (
                  <col key={index} style={{ width: `${width}%` }} />
                ))}
              </colgroup>
            )}
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
      </div>
    </section>
  );
}
type NavProps = {
  label: string;
  items: { href: string; label: string; active: boolean }[];
};
export function SectionNav({ label, items }: NavProps) {
  return (
    <nav className="section-nav" aria-label={label}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={item.active ? "page" : undefined}
        >
          {item.label}
        </Link>
      ))}
    </nav>
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
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="table-footer">
      <span className="small muted">{total} kết quả</span>
      {onPage && (total > pageSize || page > 1) && (
        <nav className="actions" aria-label="Phân trang">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPage(page - 1)}
          >
            Trước
          </button>
          <span className="small" aria-live="polite">
            Trang {page} / {pages}
          </span>
          <button
            type="button"
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
