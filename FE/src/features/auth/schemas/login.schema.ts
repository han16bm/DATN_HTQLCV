import { z } from "zod";
export const loginSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(64),
    password: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(128),
  })
  .strict();
