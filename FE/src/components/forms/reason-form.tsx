"use client";

import { validationMessage } from "@/lib/forms/validation-message";
import { reasonSchema } from "@/lib/validation/common.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Form, type FormProps } from "./form";
import { FormTextarea } from "./form-field";

type Values = z.input<typeof reasonSchema>;
export function ReasonForm({
  label = "Lý do",
  ...props
}: Omit<FormProps<Values>, "form" | "children"> & { label?: string }) {
  const form = useForm<Values>({
    resolver: zodResolver(reasonSchema, { error: validationMessage }),
    defaultValues: { reason: "" },
  });
  return (
    <Form compact form={form} {...props}>
      <FormTextarea
        label={label}
        required
        {...form.register("reason")}
        error={form.formState.errors.reason}
      />
    </Form>
  );
}
