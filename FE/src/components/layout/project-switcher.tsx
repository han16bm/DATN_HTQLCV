"use client";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/loading";
import { useInfiniteProjectsQuery } from "@/features/projects/hooks/use-projects-queries";
import { cn } from "@/lib/cn";
import { confirmDiscard } from "@/lib/forms/confirm-discard";
import { currentProjectId } from "@/lib/navigation";
import { useDebounced } from "@/lib/use-debounced";
import { useUI } from "@/stores/ui-store";
import * as Popover from "@radix-ui/react-popover";
import { Check, ChevronDown, FolderKanban, Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type UIEvent,
} from "react";

type Option = { id: string; name: string; hint?: string };

// Bộ chọn dự án thay logo ở góc trái header: hiện dự án đang xem, mở ra có tìm
// kiếm và danh sách tải dần theo trang. Chọn dự án chỉ đi tới tổng quan dự án
// đó; không ghi lựa chọn vào bộ lọc của các trang tổng hợp.
export function ProjectSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const labels = useUI((s) => s.labels);
  const recent = useUI((s) => s.recent);
  const currentId = currentProjectId(
    pathname,
    (kind, id) => labels[`${kind}:${id}`],
  );
  const currentName = currentId
    ? labels[`project:${currentId}`]?.label
    : undefined;
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const q = useDebounced(text.trim());
  const shown = currentId ? (currentName ?? "Đang tải…") : "Chọn dự án";
  const listId = useId();
  const input = useRef<HTMLInputElement>(null);
  const query = useInfiniteProjectsQuery(
    { q: q || undefined, pageSize: 20 },
    { enabled: open },
  );

  // Alt+P mở bộ chọn từ bất kỳ đâu; nếu đang mở thì đưa con trỏ về ô tìm kiếm.
  useEffect(() => {
    const shortcut = (event: globalThis.KeyboardEvent) => {
      if (
        event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.shiftKey &&
        event.code === "KeyP"
      ) {
        event.preventDefault();
        setOpen(true);
        input.current?.focus();
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);

  const recents: Option[] = q
    ? []
    : recent.flatMap((key) => {
        const [kind, ...rest] = key.split(":");
        const entry = labels[key];
        return kind === "project" && entry
          ? [{ id: rest.join(":"), name: entry.label }]
          : [];
      });
  const recentIds = new Set(recents.map((option) => option.id));
  const loaded = query.data?.pages.flatMap((page) => page.items) ?? [];
  const projects: Option[] = loaded
    .filter((project) => !recentIds.has(project.id))
    .map((project) => ({
      id: project.id,
      name: project.name,
      hint: project.unit.name,
    }));
  const options = [...recents, ...projects];
  const total = query.data?.pages[0]?.pagination.total ?? 0;
  const activeIndex = Math.max(
    0,
    options.findIndex((option) => option.id === activeId),
  );
  const optionId = (id: string) => `${listId}-${id}`;

  useEffect(() => {
    const active = options[activeIndex];
    if (open && active)
      document.getElementById(optionId(active.id))?.scrollIntoView?.({
        block: "nearest",
      });
  });

  const choose = async (id: string) => {
    setOpen(false);
    setText("");
    if (id === currentId) return;
    if (!(await confirmDiscard())) return;
    router.push(`/projects/${encodeURIComponent(id)}`);
  };
  const more = () => {
    if (query.hasNextPage && !query.isFetchingNextPage)
      void query.fetchNextPage();
  };
  const move = (step: number) => {
    const next =
      options[Math.min(options.length - 1, Math.max(0, activeIndex + step))];
    if (next) setActiveId(next.id);
    if (step > 0 && activeIndex === options.length - 1) more();
  };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") move(1);
    else if (event.key === "ArrowUp") move(-1);
    else if (event.key === "Enter" && options[activeIndex])
      void choose(options[activeIndex].id);
    else return;
    event.preventDefault();
  };
  const onScroll = (event: UIEvent<HTMLDivElement>) => {
    const el = event.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 48) more();
  };

  const group = (key: string, title: string, items: Option[]) =>
    items.length > 0 && (
      <div role="group" aria-labelledby={`${listId}-${key}`}>
        <div
          id={`${listId}-${key}`}
          className="px-2 pt-2 pb-1 text-xs font-semibold text-fg-subtlest"
        >
          {title}
        </div>
        {items.map((option) => (
          <div
            key={option.id}
            id={optionId(option.id)}
            role="option"
            aria-selected={option.id === currentId}
            data-active={option.id === options[activeIndex]?.id || undefined}
            onClick={() => void choose(option.id)}
            onMouseMove={() => setActiveId(option.id)}
            className="flex cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm data-active:bg-hover pointer-coarse:min-h-11"
          >
            <span className="min-w-0">
              <span
                className={cn(
                  "block truncate",
                  option.id === currentId && "font-semibold",
                )}
                title={option.name}
              >
                {option.name}
              </span>
              {option.hint && (
                <span className="block truncate text-xs text-fg-subtlest">
                  {option.hint}
                </span>
              )}
            </span>
            {option.id === currentId && (
              <Check
                className="size-4 shrink-0 text-selected-fg"
                aria-hidden="true"
              />
            )}
          </div>
        ))}
      </div>
    );

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setText("");
      }}
    >
      <Popover.Trigger asChild>
        <button
          data-ui
          type="button"
          title="Chuyển dự án (Alt+P)"
          aria-label={`Dự án: ${shown}`}
          className={cn(
            "inline-flex h-(--control-h) max-w-[min(320px,100%)] min-w-0 items-center gap-2 rounded-md bg-transparent px-2.5 transition-colors motion-reduce:transition-none",
            "text-sm font-medium text-fg hover:bg-hover active:bg-pressed aria-expanded:bg-selected-bg aria-expanded:text-selected-fg",
            "pointer-coarse:min-h-11",
          )}
        >
          <FolderKanban className="size-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{shown}</span>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 transition-transform",
              open && "rotate-180",
            )}
            aria-hidden="true"
          />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          collisionPadding={12}
          aria-label="Chọn dự án"
          className="z-70 w-[min(288px,calc(100vw-24px))] rounded-lg border border-line bg-surface shadow-overlay"
        >
          <div className="border-b border-line p-2">
            <label htmlFor={`${listId}-search`} className="sr-only">
              Tìm dự án
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-fg-subtlest"
                aria-hidden="true"
              />
              <input
                data-ui
                ref={input}
                id={`${listId}-search`}
                type="text"
                role="combobox"
                aria-expanded="true"
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={
                  options[activeIndex]
                    ? optionId(options[activeIndex].id)
                    : undefined
                }
                autoComplete="off"
                placeholder="Nhập tên dự án…"
                value={text}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={onKeyDown}
                className="h-(--control-h) w-full rounded-md border border-line-input bg-surface pr-2.5 pl-8 text-sm text-fg placeholder:text-fg-subtlest"
              />
            </div>
          </div>
          <div
            id={listId}
            role="listbox"
            aria-label="Dự án"
            onScroll={onScroll}
            className="max-h-80 overflow-y-auto overscroll-contain p-1"
          >
            {group("recent", "Gần đây", recents)}
            {group("all", recents.length ? "Tất cả dự án" : "Dự án", projects)}
          </div>
          {query.isPending && (
            <div
              role="status"
              className="flex items-center gap-2 p-3 text-sm text-fg-subtle"
            >
              <Spinner /> Đang tải dự án…
            </div>
          )}
          {query.isError && (
            <div
              role="alert"
              className="grid justify-items-start gap-2 p-3 text-sm"
            >
              <span className="text-danger-fg">
                Không tải được danh sách dự án.
              </span>
              <Button onClick={() => void query.refetch()}>Thử lại</Button>
            </div>
          )}
          {!query.isPending && !query.isError && options.length === 0 && (
            <p className="m-0 p-3 text-sm text-fg-subtle">
              {q
                ? `Không có dự án nào khớp “${q}”.`
                : "Bạn chưa tham gia dự án nào."}
            </p>
          )}
          <div
            aria-live="polite"
            className="flex items-center justify-between gap-2 border-t border-line px-3 py-2 text-xs text-fg-subtlest"
          >
            {query.isFetchingNextPage ? (
              <span>Đang tải thêm…</span>
            ) : query.hasNextPage ? (
              <Button variant="subtle" className="h-7 px-2" onClick={more}>
                Tải thêm dự án ({loaded.length}/{total})
              </Button>
            ) : (
              <span>{total > 0 ? `${total} dự án` : " "}</span>
            )}
            <Link
              href="/projects"
              onClick={() => setOpen(false)}
              className="font-medium text-selected-fg hover:underline"
            >
              Xem tất cả dự án
            </Link>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
