import { z } from "zod";

export const errorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1),
    fieldErrors: z
      .array(z.object({ path: z.array(z.string()), message: z.string() }))
      .optional(),
    details: z.json().optional(),
  }),
  meta: z.object({
    requestId: z.string().min(1),
    serverTime: z.iso.datetime(),
  }),
});
export type FieldError = NonNullable<
  z.output<typeof errorEnvelopeSchema>["error"]["fieldErrors"]
>[number];
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields: FieldError[] = [],
    public details?: z.output<typeof errorEnvelopeSchema>["error"]["details"],
  ) {
    super(message);
    this.name = "ApiError";
  }
}
export class ContractError extends Error {
  constructor(
    message = "Dữ liệu API không đúng đặc tả. Vui lòng tải lại để đối chiếu.",
  ) {
    super(message);
    this.name = "ContractError";
  }
}
