import { z } from "zod";
export const idSchema = z
  .string({ error: "Thông tin không hợp lệ." })
  .trim()
  .min(1, "Vui lòng cung cấp thông tin bắt buộc.")
  .max(100, "Thông tin không hợp lệ. Vui lòng chọn lại.");
export const emptySchema = z.object({}).strict();
