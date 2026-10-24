import type { ReactNode } from "react";
import type { z } from "zod";
export type FormOption = { value: string; label: string; parentValue?: string };
export type FormField = {
  name: string;
  label: string;
  type?:
    | "text"
    | "email"
    | "password"
    | "number"
    | "textarea"
    | "select"
    | "multi"
    | "date"
    | "datetime-local";
  required?: boolean;
  nullable?: boolean;
  emptyAsUndefined?: boolean;
  hint?: string;
  dependsOn?: string;
  options?: FormOption[];
};
export type FormValues = Record<string, unknown>;
export type SchemaFormProps<S extends z.ZodType<FormValues>> = {
  schema: S;
  fields: FormField[];
  defaults?: FormValues;
  onSubmit: (values: z.output<S>) => Promise<void>;
  submitLabel?: string;
  cancel?: ReactNode;
  children?: ReactNode;
  onConflictReload?: () => Promise<unknown>;
  onConflictAccept?: () => void;
  submitDisabled?: boolean;
};
