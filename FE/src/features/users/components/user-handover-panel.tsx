"use client";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useTransferProjectOwnerMutation } from "@/features/projects/hooks/use-projects-mutations";
import { useState } from "react";
import { toast } from "sonner";
import {
  useListUserProjectsQuery,
  useListUsersQuery,
} from "../hooks/use-users-queries";
import type { UserDto, UserProjectDto } from "../types/users.types";

export function UserHandoverPanel({ user }: { user: UserDto }) {
  const projects = useListUserProjectsQuery(user.id);
  const owned = (projects.data ?? []).filter(
    (p) =>
      p.isOwner &&
      !p.endedAt &&
      (p.projectStatus === "PLANNED" || p.projectStatus === "ACTIVE"),
  );
  if (!owned.length) return null;
  return (
    <Notice tone="warning" title="Cần bàn giao dự án trước khi khóa thường">
      <p className="m-0">
        Tài khoản đang là chủ {owned.length} dự án. Chọn Leader/PM cùng đơn vị
        nhận bàn giao; chủ cũ ở lại dự án với vai trò quản lý. Khóa khẩn cấp
        không cần bàn giao.
      </p>
      <ul className="m-0 mt-2 grid list-none gap-3 p-0">
        {owned.map((project) => (
          <HandoverRow key={project.project.id} user={user} project={project} />
        ))}
      </ul>
    </Notice>
  );
}

function HandoverRow({
  user,
  project,
}: {
  user: UserDto;
  project: UserProjectDto;
}) {
  const [open, setOpen] = useState(false);
  const [ownerId, setOwnerId] = useState("");
  const [reason, setReason] = useState("");
  const candidates = useListUsersQuery(
    { unitId: user.unitId, status: "ACTIVE", pageSize: 100 },
    { enabled: open },
  );
  const transfer = useTransferProjectOwnerMutation();
  const options = (candidates.data?.items ?? []).filter(
    (u) => u.id !== user.id,
  );
  return (
    <li className="grid gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium">{project.project.name}</span>
        <Button onClick={() => setOpen(!open)}>
          {open ? "Đóng" : "Bàn giao"}
        </Button>
      </div>
      {open && (
        <form
          className="grid gap-2"
          onSubmit={async (event) => {
            event.preventDefault();
            await transfer.mutateAsync({
              projectId: project.project.id,
              version: project.projectVersion,
              payload: { newOwnerId: ownerId, reason: reason.trim() },
            });
            toast.success(`Đã bàn giao dự án ${project.project.name}.`);
            setOpen(false);
          }}
        >
          <label className="grid gap-1 text-sm">
            Người nhận bàn giao
            <Select
              value={ownerId}
              required
              onChange={(event) => setOwnerId(event.target.value)}
            >
              <option value="">Chọn người trong đơn vị</option>
              {options.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.displayName} ({u.username})
                </option>
              ))}
            </Select>
          </label>
          <label className="grid gap-1 text-sm">
            Lý do
            <Textarea
              rows={2}
              required
              maxLength={2000}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </label>
          <p className="m-0 text-xs text-fg-subtle">
            Người nhận phải có quyền Leader/PM (PROJECT_CREATE); hệ thống sẽ báo
            nếu không đủ điều kiện.
          </p>
          <div>
            <Button
              type="submit"
              variant="primary"

              disabled={!ownerId || !reason.trim() || transfer.isPending}
            >
              Xác nhận bàn giao
            </Button>
          </div>
        </form>
      )}
    </li>
  );
}
