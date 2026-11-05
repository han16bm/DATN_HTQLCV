import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

// Mọi bộ màu chủ đạo trong tokens.css chỉ khai hai màu gốc (nav, action); các màu hover,
// chọn... suy ra bằng color-mix. Test này tính lại đúng các phép trộn đó để chắc chữ
// vẫn đạt WCAG AA ở cả ba chế độ khi thêm hoặc chỉnh một bộ màu.
const css = readFileSync("src/styles/tokens.css", "utf8");

type Rgb = [number, number, number];
const rgb = (hex: string): Rgb => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];
const mix = (a: Rgb, share: number, b: Rgb): Rgb =>
  a.map((v, i) => v * share + b[i] * (1 - share)) as Rgb;
const channel = (v: number) => {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const luminance = ([r, g, b]: Rgb) =>
  0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
const contrast = (a: Rgb, b: Rgb) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const WHITE = rgb("#ffffff");
const BLACK = rgb("#000000");
const SURFACE = rgb("#ffffff");
const PAGES = ["#f6f9fb", "#f2f3f5", "#ffffff", "#f6f4f0"].map(rgb);
const DARK_SURFACE = rgb("#16202b");
const DARK_PAGE = rgb("#0d141c");

const themes = [
  ...css.matchAll(
    /\[data-theme="(\w+)"\]\s*\{\s*--theme-nav:\s*(#\w{6});\s*--theme-action:\s*(#\w{6});/g,
  ),
].map(([, name, nav, action]) => ({
  name,
  nav: rgb(nav),
  action: rgb(action),
}));

it("declares every theme the settings panel offers", () => {
  expect(themes.map((theme) => theme.name)).toEqual([
    "ocean",
    "navy",
    "teal",
    "indigo",
    "slate",
    "purple",
    "orchid",
    "pink",
    "crimson",
    "orange",
    "amber",
    "olive",
    "green",
    "cyan",
    "brown",
  ]);
});

it.each(themes)(
  "$name keeps text readable in default, light and dark modes",
  ({ nav, action }) => {
    // Mặc định: chữ trắng trên thanh điều hướng; nút (chữ nền sáng) và liên kết trên trang.
    expect(contrast(WHITE, nav)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(SURFACE, action)).toBeGreaterThanOrEqual(4.5);
    for (const page of PAGES)
      expect(contrast(page, action)).toBeGreaterThanOrEqual(4.5);
    const selectedBg = mix(action, 0.1, WHITE);
    const selectedFg = mix(action, 0.9, BLACK);
    expect(contrast(selectedFg, selectedBg)).toBeGreaterThanOrEqual(4.5);
    // Tối: màu hành động sáng lên làm chữ/liên kết, chữ nút là bề mặt tối.
    const states = [0.5, 0.42, 0.6].map((share) => mix(action, share, WHITE));
    for (const state of states)
      expect(contrast(DARK_SURFACE, state)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(states[0], DARK_PAGE)).toBeGreaterThanOrEqual(4.5);
    const darkSelectedBg = mix(action, 0.28, DARK_SURFACE);
    const darkSelectedFg = mix(action, 0.38, WHITE);
    expect(contrast(darkSelectedFg, darkSelectedBg)).toBeGreaterThanOrEqual(
      4.5,
    );
  },
);
