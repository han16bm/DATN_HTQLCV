import { utcDateTime } from "@/lib/format";
import type { FieldError, Resolver } from "react-hook-form";
import type { z } from "zod";
import type { FormField, FormValues } from "./form.types";

function message(
  issue: z.ZodIssue,
  field: FormField | undefined,
  value: unknown,
) {
  if (issue.code === "custom") return issue.message;
  if (!field) return "Vui lòng kiểm tra lại thông tin.";
  const name = field.label.toLocaleLowerCase("vi");
  const select = ["select", "multi", "date", "datetime-local"].includes(
    field.type ?? "",
  );
  if (
    value === null ||
    value === undefined ||
    (typeof value === "string" && !value.trim()) ||
    (Array.isArray(value) && !value.length)
  )
    return `Vui lòng ${select ? "chọn" : "nhập"} ${name}.`;
  if (
    select &&
    !(issue.code === "too_small" && issue.origin === "array") &&
    !(issue.code === "too_big" && issue.origin === "array")
  )
    return `Vui lòng chọn ${name} hợp lệ.`;
  if (issue.code === "invalid_format") {
    if (issue.format === "email") return "Vui lòng nhập email hợp lệ.";
    if (issue.format === "url")
      return "Vui lòng nhập liên kết đầy đủ, ví dụ https://example.com.";
  }
  if (issue.code === "invalid_type" && field.type === "number")
    return `${field.label} phải là ${issue.expected === "int" ? "số nguyên" : "số hợp lệ"}.`;
  if (issue.code === "too_small") {
    if (issue.origin === "string")
      return `${field.label} phải có ít nhất ${issue.minimum} ký tự.`;
    if (issue.origin === "array")
      return `Vui lòng chọn ít nhất ${issue.minimum} mục trong ${name}.`;
    if (issue.origin === "number")
      return `${field.label} phải lớn hơn ${issue.inclusive ? "hoặc bằng " : ""}${issue.minimum}.`;
  }
  if (issue.code === "too_big") {
    if (issue.origin === "string")
      return `${field.label} không được vượt quá ${issue.maximum} ký tự.`;
    if (issue.origin === "array")
      return `${field.label} chỉ được chọn tối đa ${issue.maximum} mục.`;
    if (issue.origin === "number")
      return `${field.label} phải nhỏ hơn ${issue.inclusive ? "hoặc bằng " : ""}${issue.maximum}.`;
  }
  return `Vui lòng kiểm tra lại ${name}.`;
}
export function createSchemaResolver<S extends z.ZodType<FormValues>>(
  schema: S,
  fields: FormField[],
): Resolver<FormValues, unknown, z.output<S>> {
  return async (values) => {
    const prepared = { ...values };
    for (const field of fields) {
      const value = prepared[field.name];
      if (field.type === "number")
        prepared[field.name] =
          value === "" || value === undefined ? undefined : Number(value);
      if (field.type === "datetime-local" && typeof value === "string" && value)
        prepared[field.name] = utcDateTime(value);
      if (field.nullable && value === "") prepared[field.name] = null;
      if (field.emptyAsUndefined && value === "")
        prepared[field.name] = undefined;
    }
    const result = schema.safeParse(prepared);
    if (result.success)
      return {
        values: result.data,
        errors: {},
      };
    const errors: Record<string, FieldError> = {};
    for (const issue of result.error.issues) {
      const key = String(issue.path[0] ?? "root");
      if (errors[key]) continue;
      errors[key] = {
        type: "validation",
        message: message(
          issue,
          fields.find((field) => field.name === key),
          prepared[key],
        ),
      };
    }
    return { values: {}, errors };
  };
}
