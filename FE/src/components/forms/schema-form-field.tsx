"use client";
import { Controller, type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import type { FormField, FormValues } from "./form.types";
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
  return (
    <div
      className={`form-field ${config.type === "textarea" || config.type === "multi" ? "wide" : ""}`}
    >
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
          if (config.type === "multi") {
            const selected = z.array(z.string()).catch([]).parse(field.value);
            const available = config.options?.filter(
              (o) =>
                !config.dependsOn ||
                o.parentValue === watched[config.dependsOn],
            );
            return (
              <div
                className="checkbox-grid"
                role="group"
                aria-label={config.label}
              >
                {available?.map((option) => (
                  <label key={option.value} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={selected.includes(option.value)}
                      onChange={(event) =>
                        field.onChange(
                          event.target.checked
                            ? [...selected, option.value]
                            : selected.filter((v) => v !== option.value),
                        )
                      }
                    />
                    {option.label}
                  </label>
                ))}
                {!available?.length && (
                  <span className="small muted">Chưa có lựa chọn phù hợp.</span>
                )}
              </div>
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
              <textarea
                {...props}
                rows={4}
                value={typeof field.value === "string" ? field.value : ""}
                onChange={field.onChange}
              />
            );
          return (
            <input
              {...props}
              type={config.type ?? "text"}
              autoComplete={
                config.type === "password" ? "new-password" : undefined
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
