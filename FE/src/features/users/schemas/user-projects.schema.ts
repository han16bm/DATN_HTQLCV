import { permissionSchema } from "@/lib/validation/common.schema";
import { z } from "zod";

// Tư cách của một người trong từng dự án (GET /users/:userId/projects, ADMIN_MODULES §11.7).
export const userProjectSchema = z.object({
  membershipId: z.string(),
  project: z.object({ id: z.string(), name: z.string() }),
  // Version của dự án, để bàn giao thay chủ dự án (If-Match) ngay từ hộp thoại khóa tài khoản.
  projectVersion: z.number().int().safe().positive(),
  projectStatus: z.enum(["PLANNED", "ACTIVE", "COMPLETED", "CANCELLED"]),
  projectRole: z.enum(["OWNER", "MANAGER", "MEMBER"]),
  isOwner: z.boolean(),
  // Quyền hiệu lực lúc này; tư cách đã kết thúc không còn quyền.
  permissions: z.array(permissionSchema),
  startedAt: z.iso.datetime(),
  endedAt: z.iso.datetime().nullable(),
});
export const userProjectListSchema = z.array(userProjectSchema);
