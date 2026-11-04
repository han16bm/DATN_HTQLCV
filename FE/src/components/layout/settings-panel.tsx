"use client";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { drawerClass, overlayClass } from "@/components/ui/overlay";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/cn";
import {
  fontScales,
  pages,
  themes,
  usePreferences,
} from "@/stores/preferences-store";
import { useUI } from "@/stores/ui-store";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, Settings, X } from "lucide-react";
import type { ReactNode } from "react";

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-line py-2.5">
      <h3 className="m-0 flex items-baseline justify-between gap-3 px-4 pb-1 text-xs font-semibold text-fg-subtle">
        {title}
        {note && <span className="font-normal">{note}</span>}
      </h3>
      {children}
    </section>
  );
}

// Hình thu nhỏ của khung ứng dụng (thanh trên, sidebar, nút) theo bộ màu, để thấy
// trước kết quả thay vì đọc tên màu.
function Thumbnail({
  color,
  accent,
  checked,
}: {
  color: string;
  accent: string;
  checked: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative block h-9 w-11 overflow-hidden rounded-md border-2 bg-page",
        checked ? "border-action" : "border-line",
      )}
    >
      <span
        className="absolute inset-x-0 top-0 h-2"
        style={{ backgroundColor: color }}
      />
      <span
        className="absolute top-2 bottom-0 left-0 w-3"
        style={{ backgroundColor: color }}
      />
      <span
        className="absolute top-4 left-5 h-2 w-4 rounded-sm"
        style={{ backgroundColor: accent }}
      />
      {checked && (
        <span className="absolute right-0.5 bottom-0.5 grid size-3.5 place-items-center rounded-full bg-action text-white">
          <Check className="size-2.5" />
        </span>
      )}
    </span>
  );
}

// Cài đặt giao diện của trình duyệt này, mở thành ngăn kéo hẹp bên phải theo bố cục
// bảng cài đặt quen thuộc: tiêu đề màu ở trên, hàng công tắc, chọn màu chủ đạo và nền
// trang có hình xem trước, chân bảng có nút đặt lại. Mọi lựa chọn áp ngay và lưu ở
// localStorage; công tắc thu gọn dùng chung trạng thái với nút ở header.
export function SettingsPanel() {
  const { theme, page, fontScale, density, hideSidebar, set, reset } =
    usePreferences();
  const collapsed = useUI((s) => s.sidebarCollapsed);
  const toggleSidebar = useUI((s) => s.toggleSidebar);
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <IconButton label="Cài đặt giao diện">
          <Settings className="size-[18px]" aria-hidden="true" />
        </IconButton>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className={overlayClass("dialog", true)} />
        <Dialog.Content
          className={cn(drawerClass, "flex w-[min(320px,100vw)] flex-col p-0")}
          aria-describedby="settings-hint"
        >
          <header className="nav-surface relative bg-linear-to-br from-nav to-nav-hover px-10 py-3 text-center">
            <Dialog.Title className="m-0 text-heading-sm font-semibold">
              Cài đặt giao diện
            </Dialog.Title>
            <Dialog.Description
              id="settings-hint"
              className="m-0 text-xs text-fg-subtlest"
            >
              Lưu trên trình duyệt này
            </Dialog.Description>
            <Dialog.Close asChild>
              <IconButton
                label="Đóng cài đặt giao diện"
                className="absolute top-1.5 right-1.5"
              >
                <X className="size-[18px]" aria-hidden="true" />
              </IconButton>
            </Dialog.Close>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <Section title="Bố cục">
              <Switch
                label="Thu gọn thanh bên"
                hint="Chỉ hiện biểu tượng"
                checked={collapsed}
                onChange={toggleSidebar}
              />
              <Switch
                label="Ẩn thanh bên"
                hint="Nội dung rộng hết màn"
                checked={hideSidebar}
                onChange={(checked) => set({ hideSidebar: checked })}
              />
              <Switch
                label="Bảng gọn"
                hint="Hàng thấp, thấy nhiều dòng"
                checked={density === "compact"}
                onChange={(checked) =>
                  set({ density: checked ? "compact" : "comfortable" })
                }
              />
              <div className="flex items-center justify-between gap-3 px-4 py-2">
                <span className="text-sm font-medium text-fg">Cỡ chữ</span>
                <SegmentedControl
                  label="Cỡ chữ"
                  value={fontScale}
                  options={fontScales.map(({ value, label }) => ({
                    value,
                    label,
                  }))}
                  onChange={(value) =>
                    set({ fontScale: value as typeof fontScale })
                  }
                />
              </div>
            </Section>
            <Section
              title="Màu chủ đạo"
              note={themes.find((item) => item.value === theme)?.label}
            >
              <div
                role="radiogroup"
                aria-label="Màu chủ đạo"
                className="flex gap-2 px-4 pt-1"
              >
                {themes.map((item) => (
                  <button
                    key={item.value}
                    data-ui
                    type="button"
                    role="radio"
                    aria-checked={item.value === theme}
                    aria-label={item.label}
                    title={item.label}
                    onClick={() => set({ theme: item.value })}
                    className="rounded-lg pointer-coarse:p-1"
                  >
                    <Thumbnail
                      color={item.color}
                      accent={item.accent}
                      checked={item.value === theme}
                    />
                  </button>
                ))}
              </div>
            </Section>
            <Section
              title="Nền trang"
              note={pages.find((item) => item.value === page)?.label}
            >
              <div
                role="radiogroup"
                aria-label="Nền trang"
                className="flex gap-3 px-4 pt-1"
              >
                {pages.map((item) => (
                  <button
                    key={item.value}
                    data-ui
                    type="button"
                    role="radio"
                    aria-checked={item.value === page}
                    aria-label={item.label}
                    title={item.label}
                    onClick={() => set({ page: item.value })}
                    className={cn(
                      "grid size-8 place-items-center rounded-full border-2 text-action pointer-coarse:size-11",
                      item.value === page
                        ? "border-action"
                        : "border-line-input",
                    )}
                    style={{ backgroundColor: item.color }}
                  >
                    {item.value === page && (
                      <Check className="size-4" aria-hidden="true" />
                    )}
                  </button>
                ))}
              </div>
            </Section>
          </div>
          <footer className="border-t border-line bg-sunken px-4 py-2.5">
            <Button
              className="w-full"
              onClick={() => {
                reset();
                if (collapsed) toggleSidebar();
              }}
            >
              Đặt lại mặc định
            </Button>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
