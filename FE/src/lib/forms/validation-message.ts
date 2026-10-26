import type { z } from "zod";

// Used by zodResolver for built-in Zod errors; business messages stay in the schema.
export const validationMessage: z.core.$ZodErrorMap = (issue) => {
  const value = issue.input;
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    (Array.isArray(value) && !value.length)
  )
    return "Vui lòng cung cấp thông tin bắt buộc.";
  if (issue.code === "invalid_type" && issue.expected === "int")
    return "Phải là số nguyên.";
  if (issue.code === "invalid_type" && issue.expected === "number")
    return "Phải là số hợp lệ.";
  if (issue.code === "invalid_format") {
    if (issue.format === "email") return "Vui lòng nhập email hợp lệ.";
    if (issue.format === "url")
      return "Vui lòng nhập liên kết đầy đủ, ví dụ https://example.com.";
  }
  if (issue.code === "too_small") {
    if (issue.origin === "string")
      return `Cần nhập ít nhất ${issue.minimum} ký tự.`;
    if (issue.origin === "array")
      return `Cần chọn ít nhất ${issue.minimum} mục.`;
    return `Giá trị phải lớn hơn ${issue.inclusive ? "hoặc bằng " : ""}${issue.minimum}.`;
  }
  if (issue.code === "too_big") {
    if (issue.origin === "string")
      return `Không được vượt quá ${issue.maximum} ký tự.`;
    if (issue.origin === "array")
      return `Chỉ được chọn tối đa ${issue.maximum} mục.`;
    return `Giá trị phải nhỏ hơn ${issue.inclusive ? "hoặc bằng " : ""}${issue.maximum}.`;
  }
  return "Vui lòng kiểm tra lại giá trị đã nhập hoặc chọn.";
};
