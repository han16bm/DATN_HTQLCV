"use client";
import { useUI } from "@/stores/ui-store";
import { ApiError } from "@/types/api/error";
import { useEffect, useId, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { z } from "zod";
import { FormError } from "./form-error";
import type { FormValues, SchemaFormProps } from "./form.types";
import { SchemaFormField } from "./schema-form-field";
import { createSchemaResolver } from "./schema-resolver";
export function SchemaForm<S extends z.ZodType<FormValues>>({
  schema,
  fields,
  defaults = {},
  onSubmit,
  submitLabel = "Lưu thông tin",
  cancel,
  children,
  onConflictReload,
  onConflictAccept,
  submitDisabled = false,
}: SchemaFormProps<S>) {
  const id = useId();
  const markDirty = useUI((s) => s.markDirty);
  const [error, setError] = useState<Error | null>(null);
  const resolver = createSchemaResolver(schema, fields);
  const form = useForm<FormValues, unknown, z.output<S>>({
    defaultValues: defaults,
    resolver,
  });
  const watched = useWatch({ control: form.control });
  const { isDirty, isSubmitting, errors } = form.formState;
  useEffect(() => {
    markDirty(id, isDirty);
    return () => markDirty(id, false);
  }, [id, isDirty, markDirty]);
  return (
    <form
      noValidate
      onSubmit={form.handleSubmit(async (values) => {
        setError(null);
        try {
          await onSubmit(values);
          form.reset(form.getValues());
          markDirty(id, false);
        } catch (caught) {
          const failure =
            caught instanceof Error
              ? caught
              : new Error("Không lưu được dữ liệu.");
          setError(failure);
          if (failure instanceof ApiError)
            for (const field of failure.fields) {
              const key = field.path[0];
              if (fields.some((f) => f.name === key))
                form.setError(key, { message: field.message });
            }
        }
      })}
    >
      <fieldset className="form-fields" disabled={isSubmitting}>
        {fields.map((config) => (
          <SchemaFormField
            key={config.name}
            config={config}
            id={id}
            fields={fields}
            form={form}
            watched={watched}
          />
        ))}
        {children}
        {error && (
          <FormError
            error={error}
            setError={setError}
            fields={fields}
            onConflictReload={onConflictReload}
            onConflictAccept={onConflictAccept}
          />
        )}
        {errors.root && (
          <p className="field-error wide" role="alert">
            {String(errors.root.message)}
          </p>
        )}
        <div className="form-actions wide">
          {cancel}
          <button className="primary" type="submit" disabled={submitDisabled}>
            {isSubmitting ? "Đang lưu…" : submitLabel}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
