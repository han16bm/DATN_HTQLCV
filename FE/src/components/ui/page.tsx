"use client";
import { label } from "@/lib/format";
import Link from "next/link";
import { type ReactNode } from "react";
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
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
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel card ${className}`}>
      {title && <h2>{title}</h2>}
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
export function Loading() {
  return (
    <div className="panel skeleton" role="status">
      Đang tải dữ liệu…
    </div>
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
}: {
  headers: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <Empty />}
    </div>
  );
}
export function Tabs({
  items,
  active,
}: {
  items: { href: string; label: string; key?: string }[];
  active: string;
}) {
  return (
    <nav className="tabs">
      {items.map((i) => (
        <Link
          key={i.key ?? i.href}
          className={(i.key ?? i.href) === active ? "active" : ""}
          href={i.href}
        >
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
export function Pagination({
  page,
  pageSize,
  total,
  onPage,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
}) {
  return (
    <div className="table-footer">
      <span className="small muted">{total} kết quả</span>
      <div className="actions">
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
      </div>
    </div>
  );
}
