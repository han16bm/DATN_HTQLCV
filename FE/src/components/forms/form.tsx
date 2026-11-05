"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/loading";
import { cn } from "@/lib/cn";
import { useUI } from "@/stores/ui-store";
import { ApiError } from "@/types/api/error";
import { useEffect, useId, useState, type ReactNode } from "react";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { FormError } from "./form-error";
import type { CompareField } from "./form.types";

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
  submitActions?: ReactNode;
  cancel?: ReactNode;
  actions?: "end" | "start";
  compareFields?: CompareField[];
  onConflictReload?: () => Promise<Record<string, unknown>>;
  onConflictAccept?: () => void;
  readOnly?: boolean;
};

export function Form<Input extends FieldValues, Output extends FieldValues>({
  form,
  onSubmit,
  children,
  compact = false,
  submitLabel = "Lưu thông tin",
  submitDisabled = false,
  submitActions,
  cancel,
  actions = "end",
  compareFields = [],
  onConflictReload,
  onConflictAccept,
  readOnly = false,
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
    if (submitDisabled || readOnly) return;
    setError(null);
    try {
      await onSubmit(values);
      form.reset(form.getValues());
      markDirty(id, false);
    } catch (cause) {
      const failure =
        cause instanceof Error ? cause : new Error("Không lưu được dữ liệu.");
      const values = form.getValues();
      const fields = failure instanceof ApiError ? failure.fields : [];
      for (const field of fields)
        if (field.path[0] in values)
          form.setError(field.path.join(".") as Path<Input>, {
            type: "server",
            message: field.message,
          });
      const shown =
        fields.length > 0 && fields.every((field) => field.path[0] in values);
      setError(shown ? null : failure);
    }
  }

  return (
    <form
      className={cn(
        "@container/form min-w-0",
        compact ? "max-w-[760px]" : "max-w-[960px]",
      )}
      noValidate
      onSubmit={form.handleSubmit(submit)}
    >
      <fieldset
        className="m-0 grid min-w-0 grid-cols-12 items-start gap-4 border-0 p-0"
        disabled={readOnly || isSubmitting}
      >
        {submitActions && (
          <div className="col-span-12 flex flex-wrap items-center justify-end gap-2.5 border-b border-line pb-4">
            {cancel}
            {submitActions}
          </div>
        )}
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
        {!submitActions && !readOnly && (
          <div
            className={cn(
              "col-span-12 flex flex-wrap items-center gap-2.5",
              actions === "start"
                ? "justify-start pt-1"
                : "mt-1 justify-end border-t border-line pt-4",
            )}
          >
            {cancel}
            <Button
              variant="primary"
              type="submit"
              disabled={submitDisabled}
              aria-busy={isSubmitting}
            >
              {isSubmitting && <Spinner />}
              {isSubmitting ? "Đang lưu…" : submitLabel}
            </Button>
          </div>
        )}
      </fieldset>
    </form>
  );
}
