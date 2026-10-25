import { createUserSchema } from "@/features/users/schemas/user-form.schema";
import { z } from "zod";

export const avatarSchema = z
  .custom<Blob>(
    (file) =>
      file instanceof Blob ||
      Object.prototype.toString.call(file) === "[object File]",
    "Vui lòng chọn ảnh hợp lệ.",
  )
  .refine((file) => file.size > 0, "Ảnh đã chọn không có nội dung.")
  .refine((file) => file.size <= 2 * 1024 ** 2, "Ảnh không được vượt quá 2 MB.")
  .refine(
    (file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type),
    "Vui lòng chọn ảnh JPG, PNG hoặc WebP.",
  );

export const profileInfoSchema = createUserSchema.pick({
  username: true,
  displayName: true,
});
export const updateProfileSchema = profileInfoSchema
  .partial()
  .extend({ avatar: avatarSchema.optional() })
  .refine(
    (data) => Object.values(data).some((value) => value !== undefined),
    "Chưa có thông tin thay đổi.",
  );
