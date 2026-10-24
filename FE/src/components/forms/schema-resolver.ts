import { utcDateTime } from "@/lib/format";
import type { FieldError, Resolver } from "react-hook-form";
import type { z } from "zod";
import type { FormField, FormValues } from "./form.types";
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
      errors[key] = { type: "validation", message: issue.message };
    }
    return { values: {}, errors };
  };
}
