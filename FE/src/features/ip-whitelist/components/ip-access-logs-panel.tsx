"use client";
import { DataTable } from "@/components/patterns/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lozenge } from "@/components/ui/lozenge";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { dateTime } from "@/lib/format";
import { useState } from "react";
import { toast } from "sonner";
import {
  useAllowIpAccessLogMutation,
  useDismissIpAccessLogMutation,
} from "../hooks/use-ip-whitelist-mutations";
import { useListIpAccessLogsQuery } from "../hooks/use-ip-whitelist-queries";
import type { IpAccessLogDto } from "../types/ip-whitelist.types";

const statusText = {
  PENDING: "Chờ xử lý",
  ALLOWED: "Đã cho phép",
  DISMISSED: "Đã bỏ qua",
} as const;
const scopeText = { ADMIN: "Khu quản trị", SYSTEM: "Toàn hệ thống" } as const;

export function IpAccessLogsPanel() {
  const [status, setStatus] = useState<IpAccessLogDto["status"] | "">(
    "PENDING",
  );
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<{ id: string; mode: "allow" | "dismiss" }>();
  const query = useListIpAccessLogsQuery({
    status: status || undefined,
    page,
    pageSize: 20,
  });
  const rows = query.data?.items ?? [];
  const pagination = query.data?.pagination;
  return (
    <DataTable
      title="Nhật ký IP bị chặn"
      description={
        <div className="flex flex-wrap items-center gap-2">
          <span>
            Truy cập bị chặn bởi danh sách IP. Cho phép sẽ thêm IP/dải vào danh
            sách; bỏ qua chỉ đánh dấu đã xem.
          </span>
          <label className="inline-flex items-center gap-2 text-sm">
            Trạng thái
            <Select
              fit
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as IpAccessLogDto["status"] | "");
                setPage(1);
              }}
            >
              <option value="">Tất cả</option>
              {Object.entries(statusText).map(([value, text]) => (
                <option key={value} value={value}>
                  {text}
                </option>
              ))}
            </Select>
          </label>
        </div>
      }
      loading={query.isPending}
      error={query.error}
      onRetry={query.refetch}
      actions
      widths={[18, 14, 26, 14, 12, 16]}
      headers={[
        "IP",
        "Phạm vi",
        "Lần gần nhất",
        "Số lần chặn",
        "Trạng thái",
        "Hành động",
      ]}
      rows={rows.map((log) => [
        <span key="ip" className="font-mono">
          {log.ip}
        </span>,
        scopeText[log.scope],
        <span key="last" className="grid gap-0.5">
          <span>{dateTime(log.lastSeenAt)}</span>
          <span className="text-xs text-fg-subtle">
            {log.lastUsername ?? log.lastUser?.label ?? "Chưa đăng nhập"} ·{" "}
            {log.lastPath}
          </span>
          {open?.id === log.id && (
            <ResolveForm
              log={log}
              mode={open.mode}
              onDone={() => setOpen(undefined)}
            />
          )}
        </span>,
        `${log.blockedCount}/${log.hitCount}`,
        <Lozenge
          key="status"
          tone={
            log.status === "PENDING"
              ? "warning"
              : log.status === "ALLOWED"
                ? "success"
                : "neutral"
          }
        >
          {statusText[log.status]}
        </Lozenge>,
        log.status === "PENDING" ? (
          <span key="actions" className="actions inline-flex gap-1">
            <Button onClick={() => setOpen({ id: log.id, mode: "allow" })}>
              Cho phép
            </Button>
            <Button onClick={() => setOpen({ id: log.id, mode: "dismiss" })}>
              Bỏ qua
            </Button>
          </span>
        ) : (
          <span key="actions" className="text-xs text-fg-subtle">
            {log.resolvedBy?.label ?? ""}
          </span>
        ),
      ])}
      pagination={
        pagination
          ? {
              page,
              pageSize: pagination.pageSize,
              total: pagination.total,
              onPage: setPage,
            }
          : undefined
      }
    />
  );
}

function ResolveForm({
  log,
  mode,
  onDone,
}: {
  log: IpAccessLogDto;
  mode: "allow" | "dismiss";
  onDone: () => void;
}) {
  const [cidr, setCidr] = useState(log.ip);
  const [reason, setReason] = useState("");
  const allow = useAllowIpAccessLogMutation();
  const dismiss = useDismissIpAccessLogMutation();
  const pending = allow.isPending || dismiss.isPending;
  return (
    <form
      className="mt-2 grid gap-2"
      onSubmit={async (event) => {
        event.preventDefault();
        if (mode === "allow") {
          await allow.mutateAsync({
            logId: log.id,
            version: log.version,
            payload: { cidr: cidr.trim() || undefined, reason: reason.trim() },
          });
          toast.success(`Đã thêm ${cidr || log.ip} vào danh sách IP.`);
        } else {
          await dismiss.mutateAsync({
            logId: log.id,
            version: log.version,
            payload: { reason: reason.trim() },
          });
          toast.success("Đã bỏ qua nhật ký IP.");
        }
        onDone();
      }}
    >
      {mode === "allow" && (
        <label className="grid gap-1 text-sm">
          IP hoặc dải CIDR được phép
          <Input value={cidr} onChange={(e) => setCidr(e.target.value)} />
        </label>
      )}
      <label className="grid gap-1 text-sm">
        Lý do
        <Textarea
          rows={2}
          required
          maxLength={2000}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </label>
      <div className="flex gap-2">
        <Button
          type="submit"
          variant="primary"
          disabled={!reason.trim() || pending}
        >
          {mode === "allow" ? "Cho phép" : "Bỏ qua"}
        </Button>
        <Button type="button" onClick={onDone}>
          Hủy
        </Button>
      </div>
    </form>
  );
}
