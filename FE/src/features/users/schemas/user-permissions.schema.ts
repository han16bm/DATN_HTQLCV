import { featureCodeSchema } from "@/features/permissions/schemas/feature.schema";
import { reasonSchema, refSchema } from "@/lib/validation/common.schema";
import { idSchema } from "@/lib/validation/request.schema";
import { z } from "zod";

export const userPermissionsSchema = z.object({
  userId: idSchema,
  version: z.number().int().safe().positive(),
  isSysAdmin: z.boolean(),
  groups: z.array(refSchema),
  grantedFeatures: z.array(featureCodeSchema),
  revokedFeatures: z.array(featureCodeSchema),
  effective: z.array(featureCodeSchema),
});
export const updateUserPermissionsSchema = z
  .object({
    isSysAdmin: z.boolean(),
    grantedFeatures: z.array(featureCodeSchema),
    revokedFeatures: z.array(featureCodeSchema),
    groupIds: z.array(idSchema),
    reason: reasonSchema.shape.reason,
  })
  .strict();
