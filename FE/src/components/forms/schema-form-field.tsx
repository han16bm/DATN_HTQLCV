"use client";
import { useLayoutEffect, useRef, type ComponentPropsWithRef } from "react";
import { Controller, type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import type { FormField, FormValues } from "./form.types";
import { MultiSelect } from "./multi-select";

function Textarea({
  ref: fieldRef,
  value,
  ...props
}: ComponentPropsWithRef<"textarea">) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const resize = () => {
      element.style.height = "auto";
      element.style.height = `${element.scrollHeight}px`;
    };
    resize();
    if (typeof ResizeObserver === "undefined") return;
    let width = element.clientWidth;
    const observer = new ResizeObserver(() => {
      if (element.clientWidth !== width) {
        width = element.clientWidth;
        resize();
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [value]);
  return (
    <textarea
      {...props}
      value={value}
      rows={2}
      ref={(element) => {
        ref.current = element;
        if (typeof fieldRef === "function") fieldRef(element);
        else if (fieldRef) fieldRef.current = element;
      }}
    />
  );
}
export function SchemaFormField<T extends FormValues>({
  config,
  id,
  fields,
  form,
  watched,
}: {
  config: FormField;
  id: string;
  fields: FormField[];
  form: UseFormReturn<FormValues, unknown, T>;
  watched: Partial<FormValues>;
}) {
  const { errors } = form.formState;
  const width =
    config.width ??
    (config.type === "textarea" || config.type === "multi"
      ? "full"
      : ["number", "date", "datetime-local"].includes(config.type ?? "")
        ? "short"
        : "medium");
  return (
    <div className={`form-field field-${width}`}>
      <label htmlFor={`${id}-${config.name}`}>
        {config.label}
        {config.required && " *"}
      </label>
      <Controller
        name={config.name}
        control={form.control}
        render={({ field }) => {
          const props = {
            id: `${id}-${config.name}`,
            name: field.name,
            onBlur: field.onBlur,
            ref: field.ref,
            "aria-invalid": Boolean(errors[config.name]),
            "aria-describedby": errors[config.name]
              ? `${id}-${config.name}-error`
              : undefined,
          };
          if (config.type === "file")
            return (
              <input
                {...props}
                type="file"
                accept={config.accept}
                onChange={(event) => field.onChange(event.target.files?.[0])}
              />
            );
          if (config.type === "multi") {
            const selected = z.array(z.string()).catch([]).parse(field.value);
            const available = config.options?.filter(
              (o) =>
                !config.dependsOn ||
                o.parentValue === watched[config.dependsOn],
            );
            return (
              <MultiSelect
                {...props}
                label={config.label}
                options={available ?? []}
                value={selected}
                onChange={field.onChange}
              />
            );
          }
          if (config.type === "select")
            return (
              <select
                {...props}
                value={typeof field.value === "string" ? field.value : ""}
                onChange={(event) => {
                  field.onChange(event);
                  for (const dependent of fields.filter(
                    (f) => f.dependsOn === config.name,
                  ))
                    form.setValue(
                      dependent.name,
                      dependent.type === "multi" ? [] : "",
                      { shouldDirty: true },
                    );
                }}
              >
                <option value="">Chọn {config.label.toLowerCase()}</option>
                {config.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            );
          if (config.type === "textarea")
            return (
              <Textarea
                {...props}
                value={typeof field.value === "string" ? field.value : ""}
                onChange={field.onChange}
              />
            );
          return (
            <input
              {...props}
              type={config.type ?? "text"}
              autoComplete={
                config.autoComplete ??
                (config.type === "password" ? "new-password" : undefined)
              }
              value={
                typeof field.value === "string" ||
                typeof field.value === "number"
                  ? field.value
                  : ""
              }
              onChange={field.onChange}
            />
          );
        }}
      />
      {config.hint && <p className="small muted">{config.hint}</p>}
      {errors[config.name] && (
        <span
          id={`${id}-${config.name}-error`}
          className="field-error"
          role="alert"
        >
          {String(errors[config.name]?.message ?? "Thông tin không hợp lệ.")}
        </span>
      )}
    </div>
  );
}
