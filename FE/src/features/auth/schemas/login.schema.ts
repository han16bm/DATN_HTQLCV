import { z } from "zod";
export const loginSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập tên đăng nhập.")
      .max(64, "Tên đăng nhập không được vượt quá 64 ký tự."),
    password: z
      .string()
      .min(1, "Vui lòng nhập mật khẩu.")
      .max(128, "Mật khẩu không được vượt quá 128 ký tự."),
  })
  .strict();
