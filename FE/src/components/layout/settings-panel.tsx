"use client";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { compactDrawerClass, overlayClass } from "@/components/ui/overlay";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/cn";
import {
  fontScales,
  fonts,
  modes,
  pages,
  themes,
  usePreferences,
  type Mode,
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
  title?: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-line py-3 first:border-t-0">
      {title && (
        <h3 className="m-0 flex items-baseline justify-between gap-2 px-4 pb-2 text-sm font-semibold text-fg">
          {title}
          {note && (
            <span className="text-xs font-normal text-fg-subtle">{note}</span>
          )}
        </h3>
      )}
      {children}
    </section>
  );
}

// Hình thu nhỏ của khung ứng dụng theo từng chế độ (thanh trên + sidebar, nền trang, các
// khối nội dung). Màu cố định theo chế độ để xem trước đúng dù đang ở chế độ nào; riêng
// chế độ Mặc định lấy màu điều hướng của bộ màu đang chọn.
const modeLook: Record<Mode, { bar: string; page: string; block: string }> = {
  default: {
    bar: "bg-(--theme-nav)",
    page: "bg-[#f6f9fb]",
    block: "bg-[#d6e0ea]",
  },
  light: { bar: "bg-white", page: "bg-[#f6f9fb]", block: "bg-[#d6e0ea]" },
  dark: { bar: "bg-[#243241]", page: "bg-[#0d141c]", block: "bg-[#2c3b4a]" },
};

function ModeThumbnail({ mode, checked }: { mode: Mode; checked: boolean }) {
  const look = modeLook[mode];
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative block h-11 w-full overflow-hidden rounded-md border-2",
        look.page,
        checked ? "border-action" : "border-line-input",
      )}
    >
      <span className={cn("absolute inset-x-0 top-0 h-2", look.bar)} />
      <span className={cn("absolute top-2 bottom-0 left-0 w-1/4", look.bar)} />
      <span className="absolute top-3.5 right-1.5 bottom-1.5 left-[34%] grid grid-cols-2 gap-1">
        <span className={cn("rounded-sm", look.block)} />
        <span className={cn("rounded-sm", look.block)} />
        <span className={cn("rounded-sm", look.block)} />
        <span className={cn("rounded-sm", look.block)} />
      </span>
      {checked && (
        <span className="absolute right-1 bottom-1 grid size-4 place-items-center rounded-full bg-action text-surface">
          <Check className="size-3" />
        </span>
      )}
    </span>
  );
}

// Cài đặt giao diện của trình duyệt này, mở thành ngăn kéo hẹp trượt từ cạnh phải. Tiêu
// đề màu một dòng, mỗi công tắc một dòng, màu chủ đạo là các ô tròn, chế độ Mặc định/Sáng/
// Tối có hình xem trước, chân ngăn kéo có Tắt hết (chỉ phần bố cục) và Về ban đầu (mọi
// thứ). Mọi lựa chọn áp ngay và lưu ở localStorage; công tắc thu gọn là chỗ duy nhất đổi
// trạng thái thu gọn (cùng phím tắt Ctrl+[).
export function SettingsPanel() {
  const {
    theme,
    mode,
    page,
    font,
    fontScale,
    density,
    hideSidebar,
    set,
    resetLayout,
    reset,
  } = usePreferences();
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
          className={cn(compactDrawerClass, "flex flex-col")}
          aria-describedby="settings-hint"
        >
          <header className="nav-surface flex h-10 shrink-0 items-center justify-between bg-linear-to-br from-nav to-nav-hover pr-1 pl-4">
            <Dialog.Title className="m-0 text-base font-semibold">
              Cài đặt giao diện
            </Dialog.Title>
            <Dialog.Close asChild>
              <IconButton label="Đóng cài đặt giao diện">
                <X className="size-4" aria-hidden="true" />
              </IconButton>
            </Dialog.Close>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <Section title="Bố cục">
              <Switch
                label="Thu gọn thanh bên"
                hint="Chỉ hiện biểu tượng (Ctrl+[)"
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
                hint="Hàng thấp, thấy nhiều dòng hơn"
                checked={density === "compact"}
                onChange={(checked) =>
                  set({ density: checked ? "compact" : "comfortable" })
                }
              />
            </Section>
            <Section>
              <div className="grid grid-cols-[6rem_minmax(0,1fr)] gap-3 px-4">
                <div className="grid gap-1.5">
                  <label
                    htmlFor="settings-font-scale"
                    className="text-sm font-semibold text-fg"
                  >
                    Cỡ chữ
                  </label>
                  <Select
                    size="compact"
                    id="settings-font-scale"
                    value={fontScale}
                    onChange={(event) =>
                      set({ fontScale: event.target.value as typeof fontScale })
                    }
                  >
                    {fontScales.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <label
                    htmlFor="settings-font"
                    className="text-sm font-semibold text-fg"
                  >
                    Phông chữ
                  </label>
                  {/* Mỗi tùy chọn hiện bằng chính phông của nó để xem trước. */}
                  <Select
                    size="compact"
                    id="settings-font"
                    value={font}
                    onChange={(event) =>
                      set({ font: event.target.value as typeof font })
                    }
                    style={{ fontFamily: `var(--font-${font})` }}
                  >
                    {fonts.map((item) => (
                      <option
                        key={item.value}
                        value={item.value}
                        style={{ fontFamily: `var(--font-${item.value})` }}
                      >
                        {item.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </Section>
            <Section
              title="Màu chủ đạo"
              note={themes.find((item) => item.value === theme)?.label}
            >
              <div
                role="radiogroup"
                aria-label="Màu chủ đạo"
                className="grid grid-cols-6 gap-2 px-4 pointer-coarse:grid-cols-4"
              >
                {themes.map((item) => (
                  // Ô màu mang data-theme của chính nó nên lấy được --theme-nav (tokens.css).
                  <button
                    key={item.value}
                    data-ui
                    data-theme={item.value}
                    type="button"
                    role="radio"
                    aria-checked={item.value === theme}
                    aria-label={item.label}
                    title={item.label}
                    onClick={() => set({ theme: item.value })}
                    className="grid size-7 place-items-center justify-self-center rounded-full bg-(--theme-nav) text-nav-fg shadow-raised ring-action ring-offset-2 ring-offset-surface aria-checked:ring-2 pointer-coarse:size-11"
                  >
                    {item.value === theme && (
                      <Check className="size-3.5" aria-hidden="true" />
                    )}
                  </button>
                ))}
              </div>
            </Section>
            <Section title="Chế độ">
              <div
                role="radiogroup"
                aria-label="Chế độ giao diện"
                className="grid grid-cols-3 gap-2 px-4"
              >
                {modes.map((item) => (
                  <button
                    key={item.value}
                    data-ui
                    type="button"
                    role="radio"
                    aria-checked={item.value === mode}
                    aria-label={item.label}
                    onClick={() => set({ mode: item.value })}
                    className="grid gap-1 rounded-md text-xs text-fg"
                  >
                    <ModeThumbnail
                      mode={item.value}
                      checked={item.value === mode}
                    />
                    {item.label}
                  </button>
                ))}
              </div>
            </Section>
            {mode !== "dark" && (
              <Section
                title="Nền trang"
                note={pages.find((item) => item.value === page)?.label}
              >
                <div
                  role="radiogroup"
                  aria-label="Nền trang"
                  className="flex gap-4 px-4"
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
                        "grid size-8 place-items-center rounded-full border-2 text-action pointer-coarse:size-10",
                        item.value === page
                          ? "border-action"
                          : "border-line-input",
                      )}
                      style={{ backgroundColor: item.color }}
                    >
                      {item.value === page && (
                        <Check className="size-3.5" aria-hidden="true" />
                      )}
                    </button>
                  ))}
                </div>
              </Section>
            )}
          </div>
          <footer className="shrink-0 border-t border-line bg-sunken px-4 py-3">
            <Dialog.Description
              id="settings-hint"
              className="m-0 mb-2 text-xs text-fg-subtle"
            >
              Lưu trên trình duyệt này
            </Dialog.Description>
            <div className="grid grid-cols-2 gap-2">
              <Button
                title="Tắt bảng gọn, ẩn và thu gọn thanh bên; giữ nguyên màu, chế độ và chữ"
                onClick={() => {
                  resetLayout();
                  if (collapsed) toggleSidebar();
                }}
              >
                Tắt hết
              </Button>
              <Button
                variant="primary"
                title="Đưa toàn bộ cài đặt giao diện về cấu hình ban đầu"
                onClick={() => {
                  reset();
                  if (collapsed) toggleSidebar();
                }}
              >
                Về ban đầu
              </Button>
            </div>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
