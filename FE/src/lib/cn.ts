// Ghép class có điều kiện; bỏ qua giá trị rỗng.
export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}
