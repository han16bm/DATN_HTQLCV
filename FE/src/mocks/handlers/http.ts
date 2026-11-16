import { fingerprint } from "@/lib/crypto/fingerprint";
import { ApiError } from "@/types/api/error";
import type { Permission } from "@/types/common";
import {
  HttpResponse,
  delay,
  type HttpResponseResolver,
  type JsonBodyType,
} from "msw";
import { z } from "zod";
import {
  authorizeReplay,
  sessionUser,
  withMockTransaction,
  type User,
} from "../db";

function toMockErrorResponse(error: unknown) {
  if (error instanceof z.ZodError) {
    return HttpResponse.json(
      {
        code: "VALIDATION_ERROR",
        message: "Thông tin gửi lên không hợp lệ.",
        fieldErrors: error.issues.map((i) => ({
          path: i.path.map(String),
          message: i.message,
        })),
      },
      { status: 422 },
    );
  }
  if (error instanceof ApiError)
    return HttpResponse.json(
      {
        code: error.code,
        message: error.message,
        ...(error.fields.length ? { fieldErrors: error.fields } : {}),
        ...(error.details ? { details: error.details } : {}),
      },
      { status: error.status },
    );
  console.error("MSW handler failed", error);
  return HttpResponse.json(
    {
      code: "INTERNAL_ERROR",
      message: "Chưa thể xử lý yêu cầu. Vui lòng thử lại.",
    },
    { status: 500 },
  );
}

type Receipt = {
  fingerprint: string;
  data: JsonBodyType;
  status: number;
  headers: Headers;
};
const receipts = new Map<string, Receipt>();
const responseData = new WeakMap<Response, JsonBodyType>();
export function resetReceipts() {
  receipts.clear();
}
export function authenticatedUser(request: Request) {
  return sessionUser(
    request.headers.get("Authorization")?.replace(/^Bearer /, ""),
  );
}
export function parseQuery<S extends z.ZodType>(
  request: Request,
  schema: S,
): z.output<S> {
  const query: Record<string, unknown> = Object.fromEntries(
    new URL(request.url).searchParams,
  );
  for (const name of ["page", "pageSize"])
    if (typeof query[name] === "string" && /^\d+$/.test(query[name]))
      query[name] = Number(query[name]);
  for (const name of ["overdue", "isSysAdmin"])
    if (query[name] === "true") query[name] = true;
    else if (query[name] === "false") query[name] = false;
  return schema.parse(query);
}
export function mockHandler(
  resolve: HttpResponseResolver,
): HttpResponseResolver {
  return async (context) => {
    const scenario = context.request.headers.get("X-Mock-Scenario");
    try {
      if (scenario === "server-error")
        throw new ApiError(
          503,
          "SERVICE_UNAVAILABLE",
          "Máy chủ tạm thời chưa sẵn sàng.",
        );
      if (scenario === "rate-limit")
        throw new ApiError(
          429,
          "RATE_LIMITED",
          "Vui lòng chờ trước khi thử lại.",
        );
      return await resolve(context);
    } catch (error) {
      return toMockErrorResponse(error);
    } finally {
      const ms =
        scenario === "slow"
          ? 1500
          : Number(
              process.env.NEXT_PUBLIC_MSW_DELAY ??
                (process.env.NODE_ENV === "test" ? 0 : 400),
            );
      if (ms > 0) await delay(ms);
    }
  };
}
export function mockJson<S extends z.ZodType<JsonBodyType>>(
  request: Request,
  data: unknown,
  schema: S,
  status = 200,
  headers?: HeadersInit,
) {
  const parsed = schema.safeParse(data);
  if (!parsed.success)
    throw new Error(`Invalid mock response: ${parsed.error.message}`);
  let result: JsonBodyType = parsed.data;
  const scenario = request.headers.get("X-Mock-Scenario");
  if (scenario === "invalid-response") result = { invalid: true };
  else if (
    scenario === "empty" &&
    typeof result === "object" &&
    result !== null &&
    "pagination" in result
  )
    result = {
      ...result,
      items: [],
      pagination: { page: 1, pageSize: 20, total: 0 },
    };
  const response = HttpResponse.json(result, { status, headers });
  responseData.set(response, parsed.data);
  return response;
}
type MockCommand = {
  operation: string;
  feature: string;
  viewer: User;
  action: Permission | null;
  params: Record<string, string>;
  payload: Record<string, unknown>;
};
export async function mockCommand(
  request: Request,
  command: MockCommand,
  execute: () => Response | Promise<Response>,
) {
  return withMockTransaction(
    async (commit) => {
      const key = request.headers.get("Idempotency-Key");
      if (!key)
        throw new ApiError(
          422,
          "IDEMPOTENCY_REQUIRED",
          "Thiếu Idempotency-Key.",
        );
      const signature = await fingerprint([
        command.operation,
        command.params,
        command.payload,
      ]);
      const receiptKey = `${command.viewer.id}|${command.operation}|${key}`;
      const previous = receipts.get(receiptKey);
      if (previous) {
        authorizeReplay(
          command.operation,
          command.action,
          command.viewer,
          command.params,
          command.payload,
        );
        if (previous.fingerprint !== signature)
          throw new ApiError(
            409,
            "IDEMPOTENCY_CONFLICT",
            "Khóa gửi lặp đã dùng cho nội dung khác.",
          );
        return HttpResponse.json(previous.data, {
          status: previous.status,
          headers: previous.headers,
        });
      }
      const response = await execute();
      const data = responseData.get(response);
      receipts.set(receiptKey, {
        fingerprint: signature,
        data: JSON.parse(JSON.stringify(data)),
        status: response.status,
        headers: new Headers(response.headers),
      });
      commit();
      return response;
    },
    {
      feature: command.feature,
      scenario: request.headers.get("X-Mock-Scenario"),
      actor: command.viewer.id,
    },
  );
}
