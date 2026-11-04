import { z } from "zod";
import { userSchema } from "./user.schema";

export const profileSchema = z
  .object(userSchema.shape)
  .pick({
    id: true,
    displayName: true,
    avatarUrl: true,
    email: true,
  })
  .extend({
    unit: userSchema.shape.unit.shape.name,
    // Tên các nhóm quyền đang hoạt động.
    groups: z.array(z.string()),
  });
