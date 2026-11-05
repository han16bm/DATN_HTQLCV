import { permissionSchema } from "@/lib/validation/common.schema";
import { z } from "zod";

export const userProjectSchema = z.object({
  membershipId: z.string(),
  project: z.object({ id: z.string(), name: z.string() }),
  projectVersion: z.number().int().safe().positive(),
  projectStatus: z.enum(["PLANNED", "ACTIVE", "COMPLETED", "CANCELLED"]),
  projectRole: z.enum(["OWNER", "MANAGER", "MEMBER"]),
  isOwner: z.boolean(),
  permissions: z.array(permissionSchema),
  startedAt: z.iso.datetime(),
  endedAt: z.iso.datetime().nullable(),
});
export const userProjectListSchema = z.array(userProjectSchema);
