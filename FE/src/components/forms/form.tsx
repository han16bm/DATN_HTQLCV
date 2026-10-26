"use client";

import { Spinner } from "@/components/ui/loading";
import { useUI } from "@/stores/ui-store";
import { ApiError } from "@/types/api/error";
import { useEffect, useId, useState, type ReactNode } from "react";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { FormError } from "./form-error";
import type { CompareField } from "./form.types";

// Shared form chrome only. Each feature owns useForm, its schema and its fields.
export type FormProps<
  Input extends FieldValues,
  Output extends FieldValues = Input,
> = {
  form: UseFormReturn<Input, unknown, Output>;
  onSubmit: (values: Output) => Promise<unknown>;
  children?: ReactNode;
  compact?: boolean;
  submitLabel?: string;
  submitDisabled?: boolean;
  cancel?: ReactNode;
  compareFields?: CompareField[];
  onConflictReload?: () => Promise<Record<string, unknown>>;
  onConflictAccept?: () => void;
};

export function Form<Input extends FieldValues, Output extends FieldValues>({
  form,
  onSubmit,
  children,
  compact = false,
  submitLabel = "Lưu thông tin",
  submitDisabled = false,
  cancel,
  compareFields = [],
  onConflictReload,
  onConflictAccept,
}: FormProps<Input, Output>) {
  const id = useId();
  const markDirty = useUI((s) => s.markDirty);
  const [error, setError] = useState<Error | null>(null);
  const { isDirty, isSubmitting } = form.formState;

  useEffect(() => {
    markDirty(id, isDirty);
    return () => markDirty(id, false);
  }, [id, isDirty, markDirty]);

  async function submit(values: Output) {
    if (submitDisabled) return;
    setError(null);
    try {
      await onSubmit(values);
      form.reset(form.getValues());
      markDirty(id, false);
    } catch (cause) {
      const failure =
        cause instanceof Error ? cause : new Error("Không lưu được dữ liệu.");
      setError(failure);
      if (failure instanceof ApiError) {
        const values = form.getValues();
        for (const field of failure.fields) {
          if (field.path[0] in values)
            form.setError(field.path.join(".") as Path<Input>, {
              type: "server",
              message: field.message,
            });
        }
      }
    }
  }

  return (
    <form
      className={`form${compact ? " form-compact" : ""}`}
      noValidate
      onSubmit={form.handleSubmit(submit)}
    >
      <fieldset className="form-fields" disabled={isSubmitting}>
        {children}
        {error && (
          <FormError
            error={error}
            setError={setError}
            fields={compareFields}
            onConflictReload={onConflictReload}
            onConflictAccept={onConflictAccept}
          />
        )}
        <div className="form-actions wide">
          {cancel}
          <button
            className="primary pending-button"
            type="submit"
            disabled={submitDisabled}
            aria-busy={isSubmitting}
          >
            {isSubmitting && <Spinner />}
            {isSubmitting ? "Đang lưu…" : submitLabel}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
