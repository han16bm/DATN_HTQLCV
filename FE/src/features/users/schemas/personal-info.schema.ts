import { entityLabelSchema } from "@/lib/validation/common.schema";
import { z } from "zod";

const optional = <T extends z.ZodType>(schema: T) =>
  schema
    .or(z.literal(""))
    .nullable()
    .transform((value) => (value === "" ? null : value));

export const genderSchema = z.enum(["MALE", "FEMALE", "OTHER"]);
export const genders = [
  { value: "MALE", label: "Nam" },
  { value: "FEMALE", label: "Nữ" },
  { value: "OTHER", label: "Khác" },
];

export const personalInfoSchema = z.object({
  gender: optional(genderSchema),
  birthDate: optional(
    z.iso
      .date()
      .refine(
        (value) => new Date(`${value}T00:00:00`).getTime() <= Date.now(),
        "Ngày sinh không được ở tương lai.",
      ),
  ),
  phone: optional(
    z
      .string()
      .trim()
      .max(32)
      .refine((value) => {
        const digits = value.replace(/\D/g, "");
        return (
          /^\+?[\d\s().-]+$/.test(value) &&
          digits.length >= 7 &&
          digits.length <= 15
        );
      }, "Vui lòng nhập số điện thoại hợp lệ (7–15 chữ số)."),
  ),
  permanentAddress: optional(z.string().trim().max(500)),
  temporaryAddress: optional(z.string().trim().max(500)),
});

export const affiliationsSchema = z.object({
  teams: z.array(entityLabelSchema),
  projects: z.array(entityLabelSchema),
});
