import { z } from "zod";

export const errorResponseSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  fieldErrors: z
    .array(z.object({ path: z.array(z.string()), message: z.string() }))
    .optional(),
  details: z.json().optional(),
});
export type FieldError = NonNullable<
  z.output<typeof errorResponseSchema>["fieldErrors"]
>[number];
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields: FieldError[] = [],
    public details?: z.output<typeof errorResponseSchema>["details"],
  ) {
    super(message);
    this.name = "ApiError";
  }
}
export class ContractError extends Error {
  constructor(message = "Chưa thể xử lý dữ liệu lúc này. Vui lòng thử lại.") {
    super(message);
    this.name = "ContractError";
  }
}
