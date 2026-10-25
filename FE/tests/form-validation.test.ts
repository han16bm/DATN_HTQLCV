import type { FormField, FormValues } from "@/components/forms/form.types";
import { createSchemaResolver } from "@/components/forms/schema-resolver";
import { createUnitSchema } from "@/features/organization/schemas/unit.schema";
import { createUserSchema } from "@/features/users/schemas/user-form.schema";
import { expect, it } from "vitest";
import { z } from "zod";

const options = { fields: {}, shouldUseNativeValidation: false };
const user: FormValues = {
  username: "new.member",
  displayName: "Thành viên mới",
  email: "member@example.test",
  unitId: "unit-product",
  systemRole: "EMPLOYEE",
  initialPassword: "Start@12345",
};
const fields: FormField[] = [
  { name: "unitId", label: "Đơn vị", type: "select", required: true },
  { name: "email", label: "Email", type: "email", required: true },
  {
    name: "initialPassword",
    label: "Mật khẩu khởi tạo",
    type: "password",
    required: true,
  },
];
it.each(["", "   ", undefined])(
  "asks for a unit instead of a resource ID when the selection is %s",
  async (unitId) => {
    const result = await createSchemaResolver(createUserSchema, fields)(
      { ...user, unitId },
      undefined,
      options,
    );
    expect(result.errors).toMatchObject({
      unitId: { message: "Vui lòng chọn đơn vị." },
    });
    expect(result.values).toEqual({});
  },
);
it("describes malformed email and short passwords without generic or English errors", async () => {
  const result = await createSchemaResolver(createUserSchema, fields)(
    { ...user, email: "not-email", initialPassword: "abc" },
    undefined,
    options,
  );
  expect(result.errors).toMatchObject({
    email: { message: "Vui lòng nhập email hợp lệ." },
    initialPassword: { message: "Mật khẩu khởi tạo phải có ít nhất 8 ký tự." },
  });
});
it.each([
  ["", "Vui lòng nhập số phút."],
  ["abc", "Số phút phải là số hợp lệ."],
  ["0", "Số phút phải lớn hơn 0."],
  ["1.5", "Số phút phải là số nguyên."],
  ["1441", "Số phút phải nhỏ hơn hoặc bằng 1440."],
])(
  "explains invalid minutes %s without relaxing their constraints",
  async (minutes, expected) => {
    const schema = z.object({ minutes: z.number().int().positive().max(1440) });
    const result = await createSchemaResolver(schema, [
      { name: "minutes", label: "Số phút", type: "number" },
    ])({ minutes }, undefined, options);
    expect(result.errors).toMatchObject({ minutes: { message: expected } });
    expect(result.values).toEqual({});
  },
);
it("preserves a business explanation when a conditional field is empty", async () => {
  const schema = z.object({ reason: z.string() }).superRefine((value, ctx) => {
    if (!value.reason)
      ctx.addIssue({
        code: "custom",
        path: ["reason"],
        message: "Vui lòng nêu lý do khi thay đổi vai trò.",
      });
  });
  const result = await createSchemaResolver(schema, [
    { name: "reason", label: "Lý do", type: "textarea" },
  ])({ reason: "" }, undefined, options);
  expect(result.errors).toMatchObject({
    reason: { message: "Vui lòng nêu lý do khi thay đổi vai trò." },
  });
});
it("keeps nullable selections optional and parses successful form data once", async () => {
  let parses = 0;
  const schema = createUnitSchema.transform((value) => {
    parses++;
    return value;
  });
  const result = await createSchemaResolver(schema, [
    { name: "name", label: "Tên đơn vị" },
    {
      name: "parentId",
      label: "Đơn vị cấp trên",
      type: "select",
      nullable: true,
    },
    {
      name: "managerId",
      label: "Người quản lý",
      type: "select",
      nullable: true,
    },
  ])({ name: " Phòng mới ", parentId: "", managerId: "" }, undefined, options);
  expect(result.errors).toEqual({});
  expect(result.values).toEqual({
    name: "Phòng mới",
    parentId: null,
    managerId: null,
  });
  expect(parses).toBe(1);
});
