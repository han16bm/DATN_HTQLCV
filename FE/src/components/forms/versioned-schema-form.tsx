"use client";
import { useEditSnapshot } from "@/lib/forms/use-edit-snapshot";
import type { z } from "zod";
import type { FormValues, SchemaFormProps } from "./form.types";
import { SchemaForm } from "./schema-form";
export function VersionedSchemaForm<T, S extends z.ZodType<FormValues>>({
  initial,
  reload,
  onSubmit,
  ...props
}: Omit<
  SchemaFormProps<S>,
  "onSubmit" | "onConflictReload" | "onConflictAccept"
> & {
  initial: T;
  reload: () => Promise<{ data?: T }>;
  onSubmit: (values: z.output<S>, base: T) => Promise<void | T>;
}) {
  const snapshot = useEditSnapshot(initial);
  return (
    <SchemaForm
      {...props}
      onConflictReload={() => snapshot.load(reload)}
      onConflictAccept={snapshot.accept}
      onSubmit={async (values) => {
        const result = await onSubmit(values, snapshot.base);
        if (result !== undefined) snapshot.saved(result);
      }}
    />
  );
}
