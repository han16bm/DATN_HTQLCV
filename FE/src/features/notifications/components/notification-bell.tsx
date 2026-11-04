"use client";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Spinner } from "@/components/ui/loading";
import { Notice } from "@/components/ui/notice";
import { Pagination } from "@/components/ui/pagination";
import { cn } from "@/lib/cn";
import { dateTime } from "@/lib/format";
import { confirmDiscard } from "@/lib/forms/confirm-discard";
import * as Popover from "@radix-ui/react-popover";
import {
  Bell,
  CalendarClock,
  CircleCheck,
  FileCheck,
  MessageSquareWarning,
  TriangleAlert,
  UserRoundPlus,
  X,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  useNotifications,
  useNotificationSummary,
  useReadNotification,
} from "../hooks/use-notifications";
import type {
  NotificationDto,
  NotificationType,
} from "../types/notifications.types";

const eventIcons: Record<NotificationType, LucideIcon> = {
  TASK_ASSIGNED: UserRoundPlus,
  TASK_UPDATED: CalendarClock,
  RESULT_SUBMITTED: FileCheck,
  RESULT_APPROVED: CircleCheck,
  CHANGES_REQUESTED: MessageSquareWarning,
  ALERT_CREATED: TriangleAlert,
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const summary = useNotificationSummary();
  const list = useNotifications({ page, pageSize: 10 }, open);
  const read = useReadNotification();
  const router = useRouter();
  const count = summary.data?.unreadCount;
  const visit = async (notice: NotificationDto) => {
    if (!(await confirmDiscard())) {
      setOpen(true);
      return;
    }
    read.reset();
    try {
      if (!notice.readAt) await read.mutateAsync(notice.id);
      setOpen(false);
      router.push(notice.href);
    } catch {
      setOpen(true);
    }
  };
  return (
    <Popover.Root
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (value) {
          setPage(1);
          read.reset();
          void summary.refetch();
        }
      }}
    >
      <Popover.Trigger asChild>
        <IconButton
          label={
            count === undefined ? "Thông báo" : `Thông báo, ${count} chưa đọc`
          }
          className="relative"
        >
          <Bell className="size-[18px]" aria-hidden="true" />
          {count !== undefined && count > 0 && (
            <span
              aria-hidden="true"
              className="absolute -top-0.5 -right-0.5 min-w-4.5 rounded-full bg-danger-bold px-1 text-center text-xs leading-4 font-semibold text-white"
            >
              {count > 99 ? "99+" : count}
            </span>
          )}
        </IconButton>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          collisionPadding={8}
          aria-label="Thông báo"
          className="z-60 w-[min(400px,calc(100vw-16px))] overflow-hidden rounded-xl border border-line bg-surface shadow-overlay outline-none"
        >
          <header className="flex items-center justify-between border-b border-line px-3 py-2">
            <h2 className="m-0 text-heading-sm font-semibold text-fg">
              Thông báo
            </h2>
            <Popover.Close asChild>
              <IconButton label="Đóng thông báo">
                <X className="size-4" aria-hidden="true" />
              </IconButton>
            </Popover.Close>
          </header>
          <div className="max-h-[min(480px,65dvh)] overflow-y-auto overscroll-contain">
            {read.error && (
              <div className="p-3">
                <Notice tone="danger">{read.error.message}</Notice>
              </div>
            )}
            {summary.isError && (
              <div className="p-3">
                <Notice
                  tone="danger"
                  actions={
                    <Button onClick={() => summary.refetch()}>
                      Thử lại số chưa đọc
                    </Button>
                  }
                >
                  Chưa tải được số thông báo chưa đọc.
                </Notice>
              </div>
            )}
            {list.isError ? (
              <div className="p-3">
                <Notice
                  tone="danger"
                  actions={
                    <Button onClick={() => list.refetch()}>Thử tải lại</Button>
                  }
                >
                  {list.error.message}
                </Notice>
              </div>
            ) : !list.data ? (
              <p
                className="flex items-center gap-2 p-4 text-sm text-fg-subtle"
                role="status"
              >
                <Spinner />
                Đang tải thông báo…
              </p>
            ) : list.data.items.length ? (
              <ul className="m-0 list-none p-0">
                {list.data.items.map((notice) => {
                  const EventIcon = eventIcons[notice.type];
                  return (
                    <li
                      key={notice.id}
                      className="border-b border-line last:border-0"
                    >
                      <button
                        data-ui
                        type="button"
                        disabled={read.isPending}
                        onClick={() => visit(notice)}
                        aria-label={`Mở thông báo: ${notice.title}${notice.readAt ? "" : " (chưa đọc)"}`}
                        className={cn(
                          "flex w-full items-start gap-2.5 px-3 py-3 text-left text-sm hover:bg-hover disabled:opacity-60",
                          !notice.readAt && "bg-selected-bg/50",
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            "mt-1.5 size-1.5 shrink-0 rounded-full",
                            !notice.readAt ? "bg-action" : "bg-transparent",
                          )}
                        />
                        <EventIcon
                          className="mt-0.5 size-4 shrink-0 text-fg-subtle"
                          aria-hidden="true"
                        />
                        <span className="grid min-w-0 gap-1">
                          <span
                            className={cn(
                              "text-fg",
                              !notice.readAt && "font-medium",
                            )}
                          >
                            {notice.title}
                          </span>
                          <time
                            dateTime={notice.createdAt}
                            className="text-xs text-fg-subtle"
                          >
                            {dateTime(notice.createdAt)}
                          </time>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="grid gap-1 px-4 py-8 text-center">
                <p className="m-0 text-sm font-medium text-fg">
                  Chưa có thông báo
                </p>
                <p className="m-0 text-xs text-fg-subtle">
                  Thông báo về công việc và kết quả xử lý sẽ xuất hiện tại đây.
                </p>
              </div>
            )}
          </div>
          {list.data && (
            <Pagination {...list.data.pagination} onPage={setPage} />
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
