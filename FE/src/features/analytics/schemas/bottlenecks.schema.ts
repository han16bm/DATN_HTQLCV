import {
  analysisRefSchema,
  personRefSchema,
} from "@/lib/validation/common.schema";
import { idSchema } from "@/lib/validation/request.schema";
import { z } from "zod";
import { analysisMetaSchema } from "./analysis-meta.schema";
export const bottlenecksSchema = z.object({
  metadata: analysisMetaSchema,
  items: z.array(
    z.object({
      taskId: idSchema,
      stage: z.enum(["TODO", "IN_PROGRESS", "PENDING_REVIEW"]),
      elapsedMinutes: z.number().finite().min(0),
      revisionCount: z.number().int().safe().min(0),
      calendarBasis: z.enum(["CONTINUOUS", "WORKING_CALENDAR"]),
      evidence: z.array(z.string()),
      taskTitle: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(255),
      assignee: personRefSchema.nullable(),
      analysisRef: analysisRefSchema,
    }),
  ),
});
