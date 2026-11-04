"use client";

import { Form } from "@/components/forms/form";
import {
  Field,
  FormInput,
  FormSelect,
  FormTextarea,
} from "@/components/forms/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { genders } from "@/features/users/schemas/personal-info.schema";
import { changedFields } from "@/lib/format";
import { useEditSnapshot } from "@/lib/forms/use-edit-snapshot";
import { confirmDiscard } from "@/lib/forms/confirm-discard";
import { validationMessage } from "@/lib/forms/validation-message";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { useUpdateProfileMutation } from "../hooks/use-auth-mutations";
import { profileInfoSchema } from "../schemas/profile.schema";
import type { PersonalProfileDto } from "../types/auth.types";

export function ProfileInfoForm({ profile, reload, onDone }: {
  profile: PersonalProfileDto;
  reload: () => Promise<{ data?: PersonalProfileDto }>;
  onDone: () => void;
}) {
  const update = useUpdateProfileMutation();
  const snapshot = useEditSnapshot(profile);
  const form = useForm<
    z.input<typeof profileInfoSchema>,
    unknown,
    z.output<typeof profileInfoSchema>
  >({
    resolver: zodResolver(profileInfoSchema, { error: validationMessage }),
    defaultValues: {
      displayName: profile.displayName,
      gender: profile.gender ?? "",
      birthDate: profile.birthDate ?? "",
      phone: profile.phone ?? "",
      permanentAddress: profile.permanentAddress ?? "",
      temporaryAddress: profile.temporaryAddress ?? "",
    },
  });
  const { errors } = form.formState;
  return (
    <Form
      form={form}
      submitLabel="Lưu hồ sơ"
      cancel={
        <Button
          onClick={async () => {
            if (!form.formState.isDirty || await confirmDiscard("Bỏ thay đổi hồ sơ chưa lưu?"))
              onDone();
          }}
        >
          Hủy
        </Button>
      }
      onConflictReload={() => snapshot.load(reload)}
      onConflictAccept={snapshot.accept}
      compareFields={[
        { name: "displayName", label: "Họ tên" },
        { name: "gender", label: "Giới tính", options: genders },
        { name: "birthDate", label: "Ngày sinh" },
        { name: "phone", label: "Số điện thoại" },
        { name: "permanentAddress", label: "Địa chỉ thường trú" },
        { name: "temporaryAddress", label: "Địa chỉ tạm trú" },
      ]}
      onSubmit={async (values) => {
        const payload = changedFields(snapshot.base, values, [
          "displayName", "gender", "birthDate", "phone",
          "permanentAddress", "temporaryAddress",
        ]);
        if (!Object.keys(payload).length) {
          onDone();
          return;
        }
        await update.mutateAsync({
          payload,
          version: snapshot.base.version,
        });
        toast.success("Đã cập nhật hồ sơ cá nhân.");
        onDone();
      }}
    >
      <div className="col-span-12 grid min-w-0 gap-5">
          <section aria-label="Thông tin cơ bản" className="grid grid-cols-12 gap-4">
            <h3 className="col-span-12 m-0 text-sm font-semibold text-fg">
              Thông tin cơ bản
            </h3>
            <FormInput
              label="Họ tên"
              required
              autoComplete="name"
              {...form.register("displayName")}
              error={errors.displayName}
            />
            <Field label="Tên đăng nhập">
              {(a11y) => (
                <Input {...a11y} size="form" value={profile.username} readOnly autoComplete="username" />
              )}
            </Field>
            <FormSelect
              label="Giới tính"
              options={genders}
              {...form.register("gender")}
              error={errors.gender}
            />
            <FormInput
              label="Ngày sinh"
              type="date"
              width="medium"
              autoComplete="bday"
              {...form.register("birthDate")}
              error={errors.birthDate}
            />
          </section>
          <section aria-label="Thông tin liên hệ" className="grid grid-cols-12 gap-4 border-t border-line pt-4">
            <h3 className="col-span-12 m-0 text-sm font-semibold text-fg">
              Thông tin liên hệ
            </h3>
            <Field label="Email">
              {(a11y) => (
                <Input {...a11y} size="form" type="email" value={profile.email} readOnly autoComplete="email" />
              )}
            </Field>
            <FormInput
              label="Số điện thoại"
              type="tel"
              autoComplete="tel"
              {...form.register("phone")}
              error={errors.phone}
            />
            <FormTextarea
              label="Địa chỉ thường trú"
              width="medium"
              {...form.register("permanentAddress")}
              error={errors.permanentAddress}
            />
            <FormTextarea
              label="Địa chỉ tạm trú"
              width="medium"
              {...form.register("temporaryAddress")}
              error={errors.temporaryAddress}
            />
          </section>
      </div>
    </Form>
  );
}
