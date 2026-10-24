import { HttpResponse } from "msw";
import { z } from "zod";
import { ApiError } from "@/types/api/error";
import { now } from "../db/database";

export class MockReply {
  constructor(
    public data: unknown,
    public status = 200,
    public headers?: HeadersInit,
  ) {}
}
export const meta = () => ({
  requestId: crypto.randomUUID(),
  serverTime: now(),
});
export function toMockErrorResponse(error: unknown) {
  if (error instanceof z.ZodError) {
    return HttpResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Thông tin gửi lên không hợp lệ.",
          fieldErrors: error.issues.map((i) => ({
            path: i.path.map(String),
            message: i.message,
          })),
        },
        meta: meta(),
      },
      { status: 422 },
    );
  }
  if (error instanceof ApiError)
    return HttpResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error.fields.length ? { fieldErrors: error.fields } : {}),
          ...(error.details ? { details: error.details } : {}),
        },
        meta: meta(),
      },
      { status: error.status },
    );
  console.error("MSW handler failed", error);
  return HttpResponse.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "Không thể xử lý yêu cầu mock.",
      },
      meta: meta(),
    },
    { status: 500 },
  );
}
