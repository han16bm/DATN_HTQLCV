import { z } from "zod";

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "Vui lòng nhập mật khẩu hiện tại.")
      .max(128),
    newPassword: z
      .string()
      .min(8, "Mật khẩu mới phải có ít nhất 8 ký tự.")
      .max(128),
  })
  .strict()
  .refine((data) => data.currentPassword !== data.newPassword, {
    path: ["newPassword"],
    message: "Mật khẩu mới phải khác mật khẩu hiện tại.",
  });
export const passwordFormSchema = changePasswordSchema
  .safeExtend({
    confirmPassword: z
      .string()
      .min(1, "Vui lòng nhập lại mật khẩu mới.")
      .max(128),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Mật khẩu nhập lại không khớp.",
  });
export const passwordResultSchema = z.object({ ok: z.literal(true) });
