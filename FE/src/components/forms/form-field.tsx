"use client";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/cn";
import { CircleAlert } from "lucide-react";
import {
  useId,
  useLayoutEffect,
  useRef,
  type ComponentPropsWithRef,
  type ReactNode,
} from "react";
import type { FieldError } from "react-hook-form";
import type { FormOption } from "./form.types";
import { MultiSelect } from "./multi-select";

type FieldProps = {
  label: string;
  error?: Pick<FieldError, "message">;
  hint?: string;
  width?: "short" | "medium" | "long" | "full";
};

// Số cột (trên lưới 12 cột của Form) theo bề rộng của chính biểu mẫu, không theo
// màn hình: hộp thoại hẹp cũng tự xếp một cột.
const columns = {
  short:
    "col-span-12 @min-[420px]/form:col-span-6 @min-[600px]/form:col-span-4",
  medium: "col-span-12 @min-[420px]/form:col-span-6",
  long: "col-span-12 @min-[600px]/form:col-span-8",
  full: "col-span-12",
};

// Nhãn thật ở trên ô; lỗi ngay dưới ô và thay chỗ của gợi ý, kèm biểu tượng để
// không chỉ dựa vào màu.
export function Field({
  label,
  error,
  hint,
  width = "medium",
  required,
  select,
  className,
  children,
}: FieldProps & {
  required?: boolean;
  select?: boolean;
  className?: string;
  children: (props: {
    id: string;
    "aria-invalid": boolean;
    "aria-describedby"?: string;
  }) => ReactNode;
}) {
  const id = useId();
  let message = errorMessage(error);
  if (message && /Vui lòng (nhập|cung cấp) thông tin bắt buộc/.test(message))
    message = `Vui lòng ${select ? "chọn" : "nhập"} ${label.toLocaleLowerCase("vi")}.`;
  else if (message?.startsWith("Cần nhập ít nhất "))
    message = `${label} phải có ít nhất ${message.slice(17)}`;
  else if (message?.startsWith("Giá trị phải "))
    message = `${label} phải ${message.slice(13)}`;
  else if (message?.startsWith("Phải là "))
    message = `${label} phải là ${message.slice(8)}`;
  return (
    <div className={cn("min-w-0", columns[width], className)}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-fg">
        {label}
        {required && (
          <>
            {" "}
            <span className="text-danger-fg">*</span>
          </>
        )}
      </label>
      {children({
        id,
        "aria-invalid": Boolean(error),
        "aria-describedby": error
          ? `${id}-error`
          : hint
            ? `${id}-hint`
            : undefined,
      })}
      {message ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-1.5 mb-0 flex items-start gap-1.5 text-sm text-danger-fg"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {message}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-1.5 mb-0 text-xs text-fg-subtle">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

function errorMessage(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return;
  if ("message" in error && typeof error.message === "string")
    return error.message;
  // Zod can attach an array item's error to links[0] or attachments[0].
  for (const [key, value] of Object.entries(error)) {
    if (key !== "root" && !/^\d+$/.test(key)) continue;
    const message = errorMessage(value);
    if (message) return message;
  }
}

export function FormInput({
  label,
  error,
  hint,
  width,
  ...props
}: FieldProps & ComponentPropsWithRef<"input">) {
  return (
    <Field
      label={label}
      error={error}
      hint={hint}
      width={
        width ??
        (["number", "date", "datetime-local"].includes(props.type ?? "")
          ? "short"
          : "medium")
      }
      required={props.required}
      select={props.type === "date" || props.type === "datetime-local"}
    >
      {(a11y) => (
        <Input
          {...props}
          {...a11y}
          size="form"
          className={cn(
            props.type === "number" && "tabular-nums",
            props.className,
          )}
        />
      )}
    </Field>
  );
}

export function FormSelect({
  label,
  error,
  hint,
  width,
  options,
  ...props
}: FieldProps &
  Omit<ComponentPropsWithRef<"select">, "children"> & {
    options: FormOption[];
  }) {
  return (
    <Field
      label={label}
      error={error}
      hint={hint}
      width={width}
      required={props.required}
      select
    >
      {(a11y) => (
        <Select {...props} {...a11y} size="form">
          <option value="">Chọn {label.toLocaleLowerCase("vi")}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      )}
    </Field>
  );
}

export function FormTextarea({
  label,
  error,
  hint,
  width = "full",
  ref: fieldRef,
  onChange,
  ...props
}: FieldProps & ComponentPropsWithRef<"textarea">) {
  const ref = useRef<HTMLTextAreaElement>(null);
  function resize() {
    const element = ref.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  }
  useLayoutEffect(() => {
    resize();
    const element = ref.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    let width = element.clientWidth;
    const observer = new ResizeObserver(() => {
      if (element.clientWidth !== width) {
        width = element.clientWidth;
        resize();
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [props.value, props.defaultValue]);
  return (
    <Field
      label={label}
      error={error}
      hint={hint}
      width={width}
      required={props.required}
    >
      {(a11y) => (
        <Textarea
          {...props}
          {...a11y}
          rows={2}
          onChange={(event) => {
            onChange?.(event);
            resize();
          }}
          ref={(element) => {
            ref.current = element;
            if (typeof fieldRef === "function") fieldRef(element);
            else if (fieldRef) fieldRef.current = element;
          }}
        />
      )}
    </Field>
  );
}

export function FormMultiSelect({
  label,
  error,
  hint,
  width = "full",
  ...props
}: FieldProps & Omit<ComponentPropsWithRef<typeof MultiSelect>, "label">) {
  return (
    <Field label={label} error={error} hint={hint} width={width}>
      {(a11y) => <MultiSelect {...props} {...a11y} label={label} />}
    </Field>
  );
}
