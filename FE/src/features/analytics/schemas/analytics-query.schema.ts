import {
  prioritySchema,
  taskStatusSchema,
} from "@/features/tasks/schemas/task.schema";
import { listQuerySchema } from "@/lib/validation/common.schema";
import { idSchema } from "@/lib/validation/request.schema";
import { z } from "zod";
export const analyticsQuerySchema = z
  .object({
    unitId: idSchema.optional(),
    projectId: idSchema.optional(),
    ownerId: idSchema.optional(),
    assigneeId: idSchema.optional(),
    status: taskStatusSchema.optional(),
    priority: prioritySchema.optional(),
    from: z.iso.date(),
    to: z.iso.date(),
    teamId: idSchema.optional(),
  })
  .strict();
export const filterOptionsQuerySchema = z
  .object({
    ...listQuerySchema.shape,
    kind: z.enum(["UNIT", "PROJECT", "TEAM", "PERSON"]),
    unitId: idSchema.optional(),
    projectId: idSchema.optional(),
    teamId: idSchema.optional(),
  })
  .strict();
