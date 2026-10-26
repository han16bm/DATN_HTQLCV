"use client";

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

function Field({
  label,
  error,
  hint,
  width = "medium",
  required,
  select,
  children,
}: FieldProps & {
  required?: boolean;
  select?: boolean;
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
    <div className={`form-field field-${width}`}>
      <label htmlFor={id}>
        {label}
        {required && " *"}
      </label>
      {children({
        id,
        "aria-invalid": Boolean(error),
        "aria-describedby": error ? `${id}-error` : undefined,
      })}
      {hint && <p className="small muted">{hint}</p>}
      {message && (
        <span id={`${id}-error`} className="field-error" role="alert">
          {message}
        </span>
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
      {(a11y) => <input {...props} {...a11y} />}
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
        <select {...props} {...a11y}>
          <option value="">Chọn {label.toLocaleLowerCase("vi")}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
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
        <textarea
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
